/* 最近浏览 + 基于浏览的推荐（本地存储，不上传） */
(function(){
  var KEY = "tt-history";
  var MAX = 20;

  function read(){
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch(e){ return []; }
  }
  function write(list){
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch(e){}
  }
  function add(item){
    if(!item || !item.name) return;
    var list = read().filter(function(x){ return !(x.type === item.type && x.key === item.key); });
    list.unshift({ type: item.type, key: item.key, name: item.name, url: item.url, ts: Date.now() });
    write(list);
  }

  // 记录访问
  try {
    var params = new URLSearchParams(location.search);
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if((page === "play.html" || page === "share.html") && typeof STATS !== "undefined"){
      var ck = params.get("comp");
      var c = ck && STATS.comps ? STATS.comps.filter(function(x){ return x.key === ck; })[0] : null;
      if(c) add({ type: "comp", key: c.key, name: c.name, url: "play.html?comp=" + c.key });
    }
    if(page === "cards.html" && typeof POOL !== "undefined"){
      var id = params.get("card");
      var card = id ? POOL.filter(function(x){ return x.i === id; })[0] : null;
      if(card) add({ type: "card", key: card.i, name: card.n, url: "cards.html?card=" + card.i });
    }
    if(page === "index.html" || page === ""){
      var hero = params.get("hero");
      if(hero) add({ type: "hero", key: hero, name: hero, url: "?hero=" + encodeURIComponent(hero) });
    }
  } catch(e){}

  // 只在首页渲染
  var meta = document.getElementById("meta");
  if(!meta || document.getElementById("recentBox")) return;

  var list = read();
  if(!list.length) return;

  var box = document.createElement("div");
  box.className = "recent-box";
  box.id = "recentBox";

  var typeCN = { comp: "阵容", card: "卡牌", hero: "英雄" };
  var chips = list.slice(0, 8).map(function(x){
    var href = x.type === "card" ? x.url : (x.type === "comp" ? x.url : x.url);
    return '<a class="recent-chip" href="' + href + '"><span class="rc-type">' + (typeCN[x.type] || "") + '</span>' + x.name + '</a>';
  }).join("");

  // 推荐：最近一套阵容的同流派其他阵容
  var recs = [];
  var lastComp = list.filter(function(x){ return x.type === "comp"; })[0];
  if(lastComp && typeof STATS !== "undefined" && STATS.comps){
    var tribe = String(lastComp.name).split("·")[0];
    recs = STATS.comps.filter(function(c){
      return String(c.name).indexOf(tribe + "·") === 0 && c.name !== lastComp.name;
    }).sort(function(a, b){ return a.avg - b.avg; }).slice(0, 2);
  }
  if(!recs.length && typeof STATS !== "undefined" && STATS.comps){
    recs = STATS.comps.slice(0, 2);
  }

  var recHTML = recs.map(function(c){
    return '<a class="recent-rec" href="play.html?comp=' + c.key + '"><b>' + c.name + '</b><span>' + c.tier + ' · 均位 ' + Number(c.avg).toFixed(2) + '</span></a>';
  }).join("");

  box.innerHTML =
    '<div class="recent-head"><span>最近浏览</span><button type="button" id="recentClear">清空</button></div>' +
    '<div class="recent-chips">' + chips + '</div>' +
    (recHTML ? '<div class="recent-sub">你可能还想看</div><div class="recent-recs">' + recHTML + '</div>' : '');

  var tools = document.getElementById("compTools");
  if(tools && tools.parentNode === meta) meta.insertBefore(box, tools);
  else meta.insertBefore(box, meta.firstChild);

  var clear = document.getElementById("recentClear");
  if(clear) clear.addEventListener("click", function(){
    try { localStorage.removeItem(KEY); } catch(e){}
    box.remove();
  });
})();
