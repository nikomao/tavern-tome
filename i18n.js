/* 轻量 i18n：?lang=en 时加载英文字典与卡牌名 */
(function(){
  var q = new URLSearchParams(location.search);
  var lang = q.get("lang") || localStorage.getItem("tt-lang") || "";
  if(lang !== "en") return;
  localStorage.setItem("tt-lang", "en");
  document.documentElement.lang = "en";
  window.__lang = "en";

  function load(src){
    return new Promise(function(res, rej){
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function apply(){
    if(!window.I18N_EN) return;
    document.querySelectorAll("[data-i18n]").forEach(function(el){
      var k = el.getAttribute("data-i18n");
      var v = (I18N_EN.nav && I18N_EN.nav[k]) || (I18N_EN.ui && I18N_EN.ui[k]);
      if(v) el.textContent = v;
    });
    var link = document.querySelector(".lang-link");
    if(link){ link.textContent = "中文"; link.href = "?lang=zh"; }
  }

  load("i18n/en.js").then(function(){ return load("i18n/cards-en.js"); }).then(apply).catch(function(){});
})();
