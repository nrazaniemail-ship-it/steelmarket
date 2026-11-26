package com.fooladban.app
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import org.json.JSONArray
import org.jsoup.Jsoup
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import kotlin.math.abs

class PriceMonitorWorker(ctx: Context, params: WorkerParameters): Worker(ctx,params) {
 override fun doWork(): Result {
  val prefs=applicationContext.getSharedPreferences("fooladban",Context.MODE_PRIVATE)
  val raw=prefs.getString("state",null)?:return Result.success()
  return try {
   val state=JSONObject(raw);val settings=state.optJSONObject("settings")?:JSONObject()
   if(!settings.optBoolean("auto",true))return Result.success()
   val products=state.optJSONArray("products")?:JSONArray();val events=state.optJSONArray("events")?:JSONArray()
   var changed=false
   for(i in 0 until products.length()){
    val p=products.optJSONObject(i)?:continue
    try {
     val price=fetchPrice(p);if(price<=0)continue
     val hist=p.optJSONArray("history")?:JSONArray();val previous=if(hist.length()>0)hist.optJSONObject(hist.length()-1)?.optDouble("price",0.0)?:0.0 else 0.0
     if(previous>0 && price!=previous){
      val pct=(price-previous)/previous*100.0;val threshold=p.optDouble("threshold",0.0)
      if(abs(pct)>=threshold){val e=JSONObject().put("id",UUID.randomUUID().toString()).put("productId",p.optString("id")).put("name",p.optString("name")).put("old",previous).put("price",price).put("change",pct).put("time",System.currentTimeMillis());events.put(0,e);if(settings.optBoolean("alerts",true))notify(p.optString("name"),previous,price,pct)}
     }
     hist.put(JSONObject().put("price",price).put("time",System.currentTimeMillis()));while(hist.length()>500)hist.remove(0)
     p.put("history",hist).put("verified",true).put("checkedAt",System.currentTimeMillis()).remove("error");changed=true
    }catch(ex:Exception){p.put("error",ex.message?: "دریافت ناموفق").put("checkedAt",System.currentTimeMillis());changed=true}
   }
   if(changed){state.put("products",products).put("events",events);prefs.edit().putString("state",state.toString()).apply()}
   Result.success()
  }catch(ex:Exception){Result.retry()}
 }
 private fun fetchPrice(p:JSONObject):Double {
  val url=URL(p.getString("url"));require(url.protocol=="https"){"فقط HTTPS مجاز است"}
  val conn=url.openConnection() as HttpURLConnection;conn.connectTimeout=12000;conn.readTimeout=15000;conn.setRequestProperty("User-Agent","Mozilla/5.0 Fooladban/1.0");conn.instanceFollowRedirects=true
  val body=conn.inputStream.bufferedReader().use{it.readText()};conn.disconnect()
  val mode=p.optString("mode","auto");var raw:String?=null
  if(mode=="json"||url.path.endsWith(".json")){val obj=JSONObject(body);raw=path(obj,p.optString("jsonPath","price"))?.toString()}
  else {val doc=Jsoup.parse(body);if(mode=="selector"){val el=doc.selectFirst(p.optString("selector"))?:throw Exception("عنصر قیمت پیدا نشد");raw=el.attr("content").ifBlank{el.attr("data-price").ifBlank{el.text()}}}
   else if(mode=="regex"){val m=Regex(p.optString("regex")).find(body)?:throw Exception("Regex تطبیق نداشت");raw=m.groups.getOrNull(1)?.value?:m.value}
   else {raw=doc.selectFirst("meta[property=product:price:amount],meta[itemprop=price],meta[property=og:price:amount]")?.attr("content");if(raw.isNullOrBlank())raw=doc.selectFirst("[data-price],.price,.price-value,.last-price,[itemprop=price]")?.let{it.attr("data-price").ifBlank{it.attr("content").ifBlank{it.text()}}};if(raw.isNullOrBlank())raw=Regex("(?:قیمت|price|آخرین نرخ)[^0-9۰-۹]{0,30}([0-9۰-۹][0-9۰-۹,٬.٫]*)",RegexOption.IGNORE_CASE).find(body)?.groupValues?.get(1)}
  }
  val normalized=(raw?:throw Exception("قیمت استخراج نشد")).map{ch->when(ch){in '۰'..'۹'->('0'.code+ch.code-'۰'.code).toChar();in '٠'..'٩'->('0'.code+ch.code-'٠'.code).toChar();'٫'->'.';else->ch}}.filter{it.isDigit()||it=='.'||it=='-'||it=='+'}
  return normalized.toDoubleOrNull()?:throw Exception("عدد قیمت معتبر نیست")
 }
 private fun path(o:JSONObject,path:String):Any?{var cur:Any=o;for(k in path.split(".")){cur=(cur as? JSONObject)?.opt(k)?:return null};return cur}
 private fun notify(name:String,old:Double,price:Double,pct:Double){val title="تغییر قیمت: "+name;val body=(if(pct>0)"افزایش" else "کاهش")+" "+String.format("%.2f",pct)+"٪ | "+old+" ← "+price;val n=NotificationCompat.Builder(applicationContext,"fooladban_prices").setSmallIcon(android.R.drawable.stat_notify_more).setContentTitle(title).setContentText(body).setStyle(NotificationCompat.BigTextStyle().bigText(body)).setPriority(NotificationCompat.PRIORITY_HIGH).setAutoCancel(true).build();(applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(name.hashCode(),n)}
}