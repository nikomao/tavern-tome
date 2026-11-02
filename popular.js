/* 热门内容：CF 页面数据 + 站内章节计数 */
(function(){
  var host = document.getElementById("popularStrip");
  if(!host) return;
  var API = "https://abacus.jasoncameron.dev";
  var NS = "tavern-tome";
  var SECTIONS = [
    { id: "tribes", label: "种族图鉴", href: "#tribes" },
    { id: "meta", label: "本周阵容", href: "#meta" },
    { id: "heroes", label: "英雄梯度", href: "#heroes" },
    { id: "play", label: "对局模式", href: "play.html" },
    { id: "cards", label: "卡池查询", href: "cards.html" },
    { id: "news", label: "社区热点", href: "#news" },
    { id: "start", label: "新手入门", href: "#start" }
  ];

  function trackOnce(id){
    var k = "tt-sec-" + id;
    try { if(sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch(e){ return; }
    fetch(API + "/hit/" + NS + "/sec-" + id, { cache: "no-store" }).catch(function(){});
  }

  if("IntersectionObserver" in window){
    var seen = {};
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        var id = en.target.id;
        if(seen[id]) return;
        seen[id] = 1;
        if(SECTIONS.some(function(s){ return s.id === id; })) trackOnce(id);
      });
    }, { threshold: 0.15 });
    SECTIONS.forEach(function(s){
      var el = s.href.charAt(0) === "#" ? document.getElementById(s.id) : null;
      if(el) io.observe(el);
    });
    var newsEl = document.getElementById("news");
    if(newsEl) io.observe(newsEl);
  }

  function getCount(id){
    return fetch(API + "/get/" + NS + "/sec-" + id, { cache: "no-store" })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ return j && j.value != null ? j.value : 0; })
      .catch(function(){ return 0; });
  }

  Promise.all(SECTIONS.map(function(s){ return getCount(s.id); })).then(function(counts){
    var rows = SECTIONS.map(function(s, i){ return { s: s, n: counts[i] || 0 }; })
      .sort(function(a, b){ return b.n - a.n; });
    var hasData = rows.some(function(x){ return x.n > 0; });
    if(!hasData) rows = rows.slice(0, 4);
    else rows = rows.filter(function(x){ return x.n > 0; }).slice(0, 5);

    var max = rows[0].n || 1;
    host.innerHTML =
      '<div class="pop-head">🔥 ' + (hasData ? "大家都在看" : "热门入口") + ' <span>' + (hasData ? "按站内访问热度排序" : "数据积累中，先给你常用入口") + '</span></div>' +
      '<div class="pop-list">' + rows.map(function(x, i){
        var pct = Math.max(8, Math.round(x.n / max * 100));
        return '<a class="pop-item" href="' + x.s.href + '">' +
          '<span class="pop-rank">' + (i + 1) + '</span>' +
          '<b>' + x.s.label + '</b>' +
          '<span class="pop-bar"><i style="width:' + pct + '%"></i></span>' +
          (x.n ? '<span class="pop-n">' + x.n + '</span>' : '') + '</a>';
      }).join("") + '</div>';
    host.hidden = false;
  });
})();
