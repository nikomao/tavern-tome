/* 统计加载：Cloudflare / GA4 / Umami，填哪个加载哪个 */
(function(){
  var c = window.TT_ANALYTICS || {};

  if(c.cfToken){
    var s = document.createElement("script");
    s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.setAttribute("data-cf-beacon", JSON.stringify({ token: c.cfToken }));
    document.head.appendChild(s);
  }

  if(c.ga4){
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(c.ga4);
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", c.ga4);
  }

  if(c.umami && c.umamiId){
    var u = document.createElement("script");
    u.defer = true;
    u.src = c.umami;
    u.setAttribute("data-website-id", c.umamiId);
    document.head.appendChild(u);
  }
})();
