package com.fooladban.app

import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject
import org.jsoup.Jsoup
import java.net.HttpURLConnection
import java.net.InetAddress
import java.net.URL
import java.util.UUID
import kotlin.math.abs

class PriceMonitorWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {
 override fun doWork(): Result {
  val prefs = applicationContext.getSharedPreferences("fooladban", Context.MODE_PRIVATE)
  val raw = prefs.getString("state", null) ?: return Result.success()
  return try {
   val state = JSONObject(raw)
   val settings = state.optJSONObject("settings") ?: JSONObject()
   if (!settings.optBoolean("auto", true)) return Result.success()
   val intervalMs = settings.optLong("interval", 15).coerceAtLeast(15) * 60_000L
   val lastRun = prefs.getLong("lastRunAt", 0L)
   if (System.currentTimeMillis() - lastRun < intervalMs - 90_000L) return Result.success()
   val runStartedAt = System.currentTimeMillis()
   val products = state.optJSONArray("products") ?: JSONArray()
   val newEvents = JSONArray()
   val touched = ArrayList<JSONObject>()
   for (i in 0 until products.length()) {
    val p = products.optJSONObject(i) ?: continue
    if (isStopped) break
    // products synced from the central API have no local URL; paused products are skipped
    if (p.optBoolean("disabled", false) || p.optString("url").isBlank()) continue
    touched.add(p)
    val attemptedAt = System.currentTimeMillis()
    p.put("lastAttemptAt", attemptedAt)
    try {
     val price = fetchPrice(p)
     if (price <= 0) throw Exception("قیمت نامعتبر است")
     val observedAt = System.currentTimeMillis()
     val hist = p.optJSONArray("history") ?: JSONArray()
     val previous = if (hist.length() > 0) hist.optJSONObject(hist.length() - 1)?.optDouble("price", 0.0) ?: 0.0 else 0.0
     if (previous > 0 && price != previous) {
      val pct = (price - previous) / previous * 100.0
      val threshold = p.optDouble("threshold", 0.0)
      if (abs(pct) >= threshold) {
       val event = JSONObject().put("id", UUID.randomUUID().toString())
        .put("productId", p.optString("id")).put("name", p.optString("name"))
        .put("old", previous).put("price", price).put("change", pct).put("time", observedAt)
       newEvents.put(event)
       if (settings.optBoolean("alerts", true) && prefs.getString("lastAlert:" + p.optString("id"), "") != "$price") { prefs.edit().putString("lastAlert:" + p.optString("id"), "$price").apply(); notify(p.optString("id"), p.optString("name"), previous, price, pct) }
      }
     }
     hist.put(JSONObject().put("price", price).put("time", observedAt))
     p.put("history", hist).put("verified", true).put("checkedAt", observedAt)
      .put("lastSuccessAt", observedAt).put("consecutiveFailures", 0).remove("error")
     appendObservation(p, price, observedAt)
    } catch (ex: Exception) {
     p.put("error", ex.message ?: "دریافت ناموفق")
      .put("checkedAt", attemptedAt)
      .put("consecutiveFailures", p.optInt("consecutiveFailures", 0) + 1)
    }
   }
   // Merge into the freshest state so edits made in the WebView during this run are not lost.
   val fresh = JSONObject(prefs.getString("state", raw) ?: raw)
   val freshProducts = fresh.optJSONArray("products") ?: JSONArray()
   val keys = listOf("history", "error", "checkedAt", "lastSuccessAt", "lastAttemptAt", "consecutiveFailures", "verified")
   for (tp in touched) {
    for (j in 0 until freshProducts.length()) {
     val fp = freshProducts.optJSONObject(j) ?: continue
     if (fp.optString("id") != tp.optString("id")) continue
     for (k in keys) { if (tp.has(k)) fp.put(k, tp.get(k)) else fp.remove(k) }
     val h = fp.optJSONArray("history")
     if (h != null && h.length() > 500) { val c = JSONArray(); for (x in h.length() - 500 until h.length()) c.put(h.get(x)); fp.put("history", c) }
    }
   }
   val oldEvents = fresh.optJSONArray("events") ?: JSONArray()
   val mergedEvents = JSONArray()
   for (x in newEvents.length() - 1 downTo 0) mergedEvents.put(newEvents.get(x))
   for (x in 0 until oldEvents.length()) { if (mergedEvents.length() >= 500) break; mergedEvents.put(oldEvents.get(x)) }
   fresh.put("products", freshProducts).put("events", mergedEvents)
   prefs.edit().putString("state", fresh.toString()).putLong("lastRunAt", runStartedAt).apply()
   Result.success()
  } catch (ex: Exception) { Result.retry() }
 }

 // The native ledger is append-only: every successful observation gets a unique ID.
 private fun appendObservation(p: JSONObject, price: Double, observedAt: Long) {
  val prefs = applicationContext.getSharedPreferences("fooladban", Context.MODE_PRIVATE)
  val key = "observationLedger"
  val old = JSONArray(prefs.getString(key, "[]") ?: "[]")
  val ledger = JSONArray()
  for (x in maxOf(0, old.length() - 4999) until old.length()) ledger.put(old.get(x))
  ledger.put(JSONObject()
   .put("id", UUID.randomUUID().toString())
   .put("productId", p.optString("id"))
   .put("productKey", p.optString("productKey", p.optString("name")))
   .put("sourceKind", p.optString("sourceKind", "other"))
   .put("price", price)
   .put("currency", p.optString("currency", ""))
   .put("measureUnit", p.optString("measureUnit", ""))
   .put("unit", p.optString("unit", ""))
   .put("observedAt", observedAt)
   .put("recordedAt", System.currentTimeMillis())
   .put("sourceUrl", p.optString("url")))
  prefs.edit().putString(key, ledger.toString()).apply()
 }

 private fun fetchPrice(p: JSONObject): Double {
  var target = URL(p.getString("url"))
  require(target.protocol == "https") { "فقط HTTPS مجاز است" }
  var body: String? = null
  for (hop in 0..3) {
   validatePublicHost(target)
   val conn = target.openConnection() as HttpURLConnection
   conn.connectTimeout = 12_000
   conn.readTimeout = 15_000
   conn.instanceFollowRedirects = false
   conn.setRequestProperty("User-Agent", "Mozilla/5.0 Fooladban/1.1")
   val code = conn.responseCode
   if (code in 300..399) {
    val location = conn.getHeaderField("Location") ?: throw Exception("مسیر انتقال نامعتبر")
    conn.disconnect()
    target = URL(target, location)
    require(target.protocol == "https") { "انتقال به HTTP مجاز نیست" }
    if (hop == 3) throw Exception("تعداد انتقال‌ها بیش از حد است")
    continue
   }
   if (code !in 200..299) { conn.disconnect(); throw Exception("HTTP $code") }
   val stream = conn.inputStream
   val bytes = stream.use { s -> val out = java.io.ByteArrayOutputStream(); val buf = ByteArray(8192); var total = 0; while (true) { val n = s.read(buf); if (n < 0) break; total += n; if (total > 1_500_000) throw Exception("حجم پاسخ بیش از حد مجاز است"); out.write(buf, 0, n) }; out.toByteArray() }
   conn.disconnect()
   if (bytes.size > 1_500_000) throw Exception("حجم پاسخ بیش از حد مجاز است")
   body = bytes.toString(Charsets.UTF_8)
   break
  }
  val html = body ?: throw Exception("پاسخی از منبع دریافت نشد")
  val mode = p.optString("mode", "auto")
  var raw: String? = null
  if (mode == "json" || target.path.endsWith(".json")) {
   val obj = JSONObject(html)
   raw = path(obj, p.optString("jsonPath", "price"))?.toString()
  } else {
   val doc = Jsoup.parse(html)
   if (mode == "selector") {
    val el = doc.selectFirst(p.optString("selector")) ?: throw Exception("عنصر قیمت پیدا نشد")
    raw = el.attr("content").ifBlank { el.attr("data-price").ifBlank { el.text() } }
   } else if (mode == "regex") {
    val match = Regex(p.optString("regex")).find(html) ?: throw Exception("Regex تطبیق نداشت")
    raw = match.groups[1]?.value ?: match.value
   } else {
    raw = doc.selectFirst("meta[property=product:price:amount],meta[itemprop=price],meta[property=og:price:amount]")?.attr("content")
    if (raw.isNullOrBlank()) raw = doc.selectFirst("[data-price],.price,.price-value,.last-price,[itemprop=price]")?.let {
     it.attr("data-price").ifBlank { it.attr("content").ifBlank { it.text() } }
    }
    if (raw.isNullOrBlank()) raw = Regex("(?:قیمت|price|آخرین نرخ)[^0-9۰-۹]{0,30}([0-9۰-۹][0-9۰-۹,٬.٫]*)", RegexOption.IGNORE_CASE).find(html)?.groupValues?.get(1)
   }
  }
  val normalized = (raw ?: throw Exception("قیمت استخراج نشد")).map { ch ->
   when (ch) {
    in '۰'..'۹' -> ('0'.code + ch.code - '۰'.code).toChar()
    in '٠'..'٩' -> ('0'.code + ch.code - '٠'.code).toChar()
    '٫' -> '.'
    else -> ch
   }
  }.filter { it.isDigit() || it == '.' || it == '-' || it == '+' }.joinToString("")
  return normalized.toDoubleOrNull() ?: throw Exception("عدد قیمت معتبر نیست")
 }

 private fun validatePublicHost(url: URL) {
  val host = url.host.lowercase()
  require(host != "localhost" && !host.endsWith(".local") && !host.endsWith(".localhost")) { "میزبان محلی مجاز نیست" }
  val addresses = InetAddress.getAllByName(host)
  require(addresses.isNotEmpty() && addresses.none { it.isAnyLocalAddress || it.isLoopbackAddress || it.isLinkLocalAddress || it.isSiteLocalAddress || it.isMulticastAddress || (it.address.size == 16 && (it.address[0].toInt() and 0xfe) == 0xfc) || (it.address.size == 4 && it.address[0].toInt() == 100 && (it.address[1].toInt() and 0xc0) == 64) }) { "نشانی شبکه خصوصی مجاز نیست" }
 }

 private fun path(obj: JSONObject, path: String): Any? {
  var current: Any = obj
  for (key in path.split(".")) current = (current as? JSONObject)?.opt(key) ?: return null
  return current
 }

 private fun notify(id: String, name: String, old: Double, price: Double, pct: Double) {
  val title = "تغییر قیمت: $name"
  val body = (if (pct > 0) "افزایش" else "کاهش") + " " + String.format(java.util.Locale.US, "%.2f", pct) + "٪ | $old ← $price"
  val notification = NotificationCompat.Builder(applicationContext, "fooladban_prices")
   .setSmallIcon(applicationContext.applicationInfo.icon).setContentTitle(title)
   .setContentText(body).setStyle(NotificationCompat.BigTextStyle().bigText(body))
   .setPriority(NotificationCompat.PRIORITY_HIGH).setAutoCancel(true).setContentIntent(android.app.PendingIntent.getActivity(applicationContext, 0, android.content.Intent(applicationContext, MainActivity::class.java).addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP), android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT)).build()
  (applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
   .notify(id.hashCode(), notification)
 }
}