/* 社區熱點 */
(function(){
  var host = document.getElementById("newsList");
  if(!host) return;
  function ago(ts){
    var d = Math.max(0, Date.now() - ts);
    var h = Math.floor(d / 3600000);
    if(h < 1) return Math.max(1, Math.floor(d / 60000)) + " 分鐘前";
    if(h < 24) return h + " 小時前";
    return Math.floor(h / 24) + " 天前";
  }
  fetch("news.json?t=" + Date.now())
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(j){
      var items = (j.items || []).slice(0, 8);
      if(!items.length) throw new Error("empty");
      host.innerHTML = items.map(function(x){
        var badge = x.source === "Reddit" ? "Reddit" : (x.source || "News");
        return '<a class="news-card" href="' + x.url + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="nc-top"><span class="nc-src ' + (x.source === "Reddit" ? "reddit" : "") + '">' + badge + '</span>' +
          '<span class="nc-time">' + ago(x.ts) + '</span></span>' +
          '<b class="nc-title">' + x.title + '</b></a>';
      }).join("");
    })
    .catch(function(){
      host.innerHTML = '<div class="news-loading">暂時没有抓取到內容，稍後再看。</div>';
    });
})();
