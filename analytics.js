/* Cloudflare Web Analytics：token 为空则不加载 */
(function(){
  var t = window.TT_ANALYTICS && window.TT_ANALYTICS.cfToken;
  if(!t) return;
  var s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: t }));
  document.head.appendChild(s);
})();
