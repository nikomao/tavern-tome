/* 社区热点与官方新闻多语言渲染模块 */
(function(){
  var host = document.getElementById("newsList");
  if(!host) return;

  var isZhTw = (document.documentElement.lang === "zh-TW" || (typeof location !== "undefined" && location.pathname.indexOf("/zh-TW/") !== -1));

  var i18n = {
    all: isZhTw ? "全部" : "全部",
    patch: isZhTw ? "官方更新" : "官方补丁",
    mechanic: isZhTw ? "機制冷知識" : "机制冷知识",
    meta: isZhTw ? "天梯平衡" : "天梯平衡",
    discussion: isZhTw ? "社群熱議" : "社区热议",
    agoMin: isZhTw ? " 分鐘前" : " 分钟前",
    agoHour: isZhTw ? " 小時前" : " 小时前",
    agoDay: isZhTw ? " 天前" : " 天前",
    live: isZhTw ? "即時同步中 (每 6 小時自動更新與多語言翻譯)" : "实时同步中 (每 6 小时自动更新与多语言翻译)",
    empty: isZhTw ? "暫時沒有抓取到相關熱點，稍後再看。" : "暂时没有抓取到相关热点，稍后再看。"
  };

  function ago(ts){
    var d = Math.max(0, Date.now() - ts);
    var h = Math.floor(d / 3600000);
    if(h < 1) return Math.max(1, Math.floor(d / 60000)) + i18n.agoMin;
    if(h < 24) return h + i18n.agoHour;
    return Math.floor(h / 24) + i18n.agoDay;
  }

  var currentFilter = "all";
  var allItems = [];

  function renderNews(filter){
    currentFilter = filter || "all";
    var filtered = allItems;
    if(currentFilter !== "all"){
      filtered = allItems.filter(function(x){
        return (x.kind || "discussion") === currentFilter;
      });
    }

    if(!filtered.length){
      host.innerHTML = '<div class="news-loading">' + i18n.empty + '</div>';
      return;
    }

    host.innerHTML = filtered.map(function(x){
      var kind = x.kind || "discussion";
      var tagText = isZhTw ? (x.tagZhtw || x.tagZh || "社群熱議") : (x.tagZh || "社区热议");
      var titleText = isZhTw ? (x.titleZhtw || x.titleZh || x.title) : (x.titleZh || x.title);
      var origTitle = x.title;
      var showOrig = origTitle && (origTitle !== titleText) && /[a-zA-Z]{3,}/.test(origTitle);
      var sourceName = x.source === "Reddit" ? "Reddit" : (x.source || "资讯");

      return '<a class="news-card" href="' + x.url + '" target="_blank" rel="noopener noreferrer" data-kind="' + kind + '">' +
        '<div class="nc-top">' +
          '<span class="nc-tag tag-' + kind + '">' + tagText + '</span>' +
          '<span class="nc-src ' + (x.source === "Reddit" ? "reddit" : "") + '">' + sourceName + '</span>' +
          '<span class="nc-time">' + ago(x.ts) + '</span>' +
        '</div>' +
        '<b class="nc-title">' + titleText + '</b>' +
        (showOrig ? '<div class="nc-orig">' + origTitle + '</div>' : '') +
      '</a>';
    }).join("");
  }

  // 插入分类过滤标签栏与实时同步状态药丸
  var container = host.parentElement;
  if(container && !document.getElementById("newsFilterBar")){
    var bar = document.createElement("div");
    bar.className = "news-ctrl-bar";
    bar.id = "newsFilterBar";
    bar.innerHTML = 
      '<div class="news-tabs" role="tablist">' +
        '<button type="button" class="news-tab active" data-filter="all">' + i18n.all + '</button>' +
        '<button type="button" class="news-tab" data-filter="patch">⚡ ' + i18n.patch + '</button>' +
        '<button type="button" class="news-tab" data-filter="mechanic">💡 ' + i18n.mechanic + '</button>' +
        '<button type="button" class="news-tab" data-filter="meta">📈 ' + i18n.meta + '</button>' +
        '<button type="button" class="news-tab" data-filter="discussion">💬 ' + i18n.discussion + '</button>' +
      '</div>' +
      '<span class="news-live-pill"><i class="pulse-dot"></i> ' + i18n.live + '</span>';

    container.insertBefore(bar, host);

    bar.addEventListener("click", function(e){
      var btn = e.target.closest(".news-tab");
      if(!btn) return;
      var f = btn.getAttribute("data-filter");
      bar.querySelectorAll(".news-tab").forEach(function(b){ b.classList.remove("active"); });
      btn.classList.add("active");
      renderNews(f);
    });
  }

  var newsUrl = isZhTw ? "../news.json" : "news.json";
  fetch(newsUrl + "?t=" + Date.now())
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(j){
      allItems = (j.items || []).slice(0, 16);
      if(!allItems.length) throw new Error("empty");
      renderNews("all");
    })
    .catch(function(){
      host.innerHTML = '<div class="news-loading">' + i18n.empty + '</div>';
    });
})();
