package com.fooladban.app;
import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.*;
import android.webkit.*;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.work.*;
import java.util.concurrent.TimeUnit;

public class MainActivity extends AppCompatActivity {
 // The app is served from https://appassets.androidplatform.net/assets/ so that CORS, service workers and
 // localStorage behave like the hosted PWA. Add this origin to APP_ORIGIN of the Cloudflare Worker.
 private static final String HOST = "appassets.androidplatform.net";
 private static final String HOME = "https://" + HOST + "/assets/index.html";
 private WebView web;
 @Override public void onCreate(Bundle b){
  super.onCreate(b);
  getWindow().setStatusBarColor(android.graphics.Color.rgb(9,21,34));
  getWindow().setNavigationBarColor(android.graphics.Color.rgb(9,21,34));
  createChannel();
  if(Build.VERSION.SDK_INT>=33&&ContextCompat.checkSelfPermission(this,Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)
   ActivityCompat.requestPermissions(this,new String[]{Manifest.permission.POST_NOTIFICATIONS},8);
  final WebViewAssetLoader loader=new WebViewAssetLoader.Builder().setDomain(HOST).addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web=new WebView(this);
  web.setBackgroundColor(android.graphics.Color.rgb(9,21,34));
  WebSettings s=web.getSettings();
  s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);
  web.addJavascriptInterface(new Bridge(this),"FooladbanNative");
  web.setWebChromeClient(new WebChromeClient());
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return loader.shouldInterceptRequest(r.getUrl());}
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
    Uri u=r.getUrl();
    if(HOST.equals(u.getHost()))return false;
    // external links open in the system browser; the native bridge is never exposed to them
    try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(ActivityNotFoundException ignored){}
    return true;
   }
   @Override public void onPageFinished(WebView view,String url){if(url!=null&&url.startsWith("https://"+HOST))view.evaluateJavascript("window.__loadNativeState && window.__loadNativeState()",null);}
  });
  // Edge-to-edge is enforced on Android 15: pad the WebView by the system bar insets.
  ViewCompat.setOnApplyWindowInsetsListener(web,(v,insets)->{Insets bars=insets.getInsets(WindowInsetsCompat.Type.systemBars()|WindowInsetsCompat.Type.displayCutout());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);return WindowInsetsCompat.CONSUMED;});
  setContentView(web);
  getOnBackPressedDispatcher().addCallback(this,new OnBackPressedCallback(true){@Override public void handleOnBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else{setEnabled(false);getOnBackPressedDispatcher().onBackPressed();}}});
  if(b==null)web.loadUrl(HOME);else web.restoreState(b);
  schedule();
 }
 @Override protected void onSaveInstanceState(Bundle out){super.onSaveInstanceState(out);if(web!=null)web.saveState(out);}
 private void createChannel(){if(Build.VERSION.SDK_INT>=26){NotificationChannel c=new NotificationChannel("fooladban_prices","هشدار قیمت فولادبان",NotificationManager.IMPORTANCE_HIGH);c.setDescription("تغییر قیمت محصولات تحت پایش");getSystemService(NotificationManager.class).createNotificationChannel(c);}}
 private void schedule(){Constraints constraints=new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();PeriodicWorkRequest req=new PeriodicWorkRequest.Builder(PriceMonitorWorker.class,15,TimeUnit.MINUTES).setConstraints(constraints).build();WorkManager.getInstance(this).enqueueUniquePeriodicWork("fooladban-price-monitor",ExistingPeriodicWorkPolicy.UPDATE,req);}
 public static class Bridge {private final Context c;Bridge(Context c){this.c=c.getApplicationContext();}@JavascriptInterface public void sync(String json){if(json!=null&&json.length()<4_000_000)c.getSharedPreferences("fooladban",0).edit().putString("state",json).apply();}@JavascriptInterface public String latest(){return c.getSharedPreferences("fooladban",0).getString("state","");}}
}
