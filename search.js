/* 全局搜索（独立实现，避免初始化顺序问题） */
(function(){
  var overlay = document.getElementById("searchOverlay");
  var input = document.getElementById("searchInput");
  var list = document.getElementById("searchList");
  var btn = document.getElementById("searchOpen");
  if(!overlay || !input || !list) return;

  var idx = null, active = -1, shown = [];

  function build(){
    var items = [], seen = {};
    function add(type, name, sub, href, data){
      if(!name || seen[type + "|" + name]) return;
      seen[type + "|" + name] = 1;
      items.push({ type: type, name: name, sub: sub || "", href: href || "", data: data || {} });
    }
    var RACE = { BEAST:"野兽", DEMON:"恶魔", DRAGON:"龙", ELEMENTAL:"元素", MECHANICAL:"机械",
      MURLOC:"鱼人", NAGA:"纳迦", PIRATE:"海盗", QUILBOAR:"野猪人", UNDEAD:"亡灵", ABERRATION:"畸变怪" };
    if(typeof POOL !== "undefined"){
      POOL.forEach(function(c){
        var races = String(c.r || "").split("/").map(function(r){ return RACE[r] || r; }).filter(Boolean).join("/");
        add("卡牌", c.n, (c.t != null ? "★".repeat(c.t) + " · " : "") + races, "cards.html?card=" + c.i, { id: c.i });
      });
    }
    if(typeof STATS !== "undefined" && STATS.heroComps){
      Object.keys(STATS.heroComps).forEach(function(n){
        var top = STATS.heroComps[n][0];
        add("英雄", n, top ? "推荐 " + top.name : "", "", { hero: n });
      });
    }
    if(typeof STATS !== "undefined" && STATS.comps){
      STATS.comps.forEach(function(c){ add("阵容", c.name, "均位 " + c.avg + " · " + c.tier, "", { comp: c.key }); });
    }
    if(typeof GLOSSARY !== "undefined"){
      GLOSSARY.forEach(function(g){ add("术语", g[0], g[1], "#glossary"); });
    }
    [["start","入门"],["laws","定律"],["math","数学"],["positioning","站位"],["tribes","种族"],
     ["heroes","英雄"],["meta","周报"],["finder","反查"],["glossary","术语"]].forEach(function(s){
      add("章节", s[1], "", "#" + s[0]);
    });
    return items;
  }

  function open(){
    if(!idx) idx = build();
    overlay.hidden = false;
    input.value = "";
    render("");
    setTimeout(function(){ input.focus(); }, 30);
  }
  function close(){ overlay.hidden = true; active = -1; }

  function render(q){
    q = String(q || "").trim().toLowerCase();
    var pool = idx;
    if(q){
      pool = idx.filter(function(x){ return x.name.toLowerCase().indexOf(q) >= 0; });
      pool.sort(function(a, b){
        var as = a.name.toLowerCase().indexOf(q) === 0 ? 0 : 1;
        var bs = b.name.toLowerCase().indexOf(q) === 0 ? 0 : 1;
        return as - bs || a.name.length - b.name.length;
      });
    }
    shown = pool.slice(0, 12);
    active = shown.length ? 0 : -1;
    if(!shown.length){ list.innerHTML = '<div class="sr-empty">没找到「' + q + '」相关的内容</div>'; return; }
    list.innerHTML = shown.map(function(x, i){
      var cardAttrs = (x.type === "卡牌") ? (' data-card-id="' + (x.data.id || "") + '" data-card="' + x.name + '"') : '';
      return '<a class="sr' + (i === 0 ? " on" : "") + '" href="' + (x.href || "#") + '" data-i="' + i + '"' + cardAttrs + '>' +
        '<span class="sr-type">' + x.type + '</span><span class="sr-name">' + x.name + '</span>' +
        '<span class="sr-sub">' + x.sub + '</span></a>';
    }).join("");
  }

  function choose(i){
    var x = shown[i];
    if(!x) return;
    if(x.type === "卡牌" && window.openCardModal){
      close();
      window.openCardModal(x.data.id || x.name);
      return;
    }
    if(x.data.comp){
      close();
      var link = document.querySelector('[data-comp="' + x.data.comp + '"]');
      if(link) link.click();
      return;
    }
    if(x.data.hero){
      close();
      var sel = document.getElementById("finderHero");
      if(sel){ sel.value = x.data.hero; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      var f = document.getElementById("finder");
      if(f) f.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    close();
    if(x.href) location.href = x.href;
  }

  function setActive(i){
    if(!shown.length) return;
    active = (i + shown.length) % shown.length;
    Array.prototype.forEach.call(list.children, function(el, k){ el.classList.toggle("on", k === active); });
  }

  input.addEventListener("input", function(){ render(input.value); });
  input.addEventListener("keydown", function(e){
    if(e.key === "ArrowDown"){ e.preventDefault(); setActive(active + 1); }
    else if(e.key === "ArrowUp"){ e.preventDefault(); setActive(active - 1); }
    else if(e.key === "Enter"){ e.preventDefault(); choose(active); }
    else if(e.key === "Escape"){ close(); }
  });
  list.addEventListener("click", function(e){
    var a = e.target.closest ? e.target.closest(".sr") : null;
    if(!a) return;
    e.preventDefault(); choose(+a.getAttribute("data-i"));
  });
  overlay.addEventListener("click", function(e){ if(e.target === overlay) close(); });
  if(btn) btn.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); open(); });

  document.addEventListener("keydown", function(e){
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); open(); return; }
    if(e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && overlay.hidden){ e.preventDefault(); open(); }
    if(e.key === "Escape" && !overlay.hidden) close();
  });

  window.__openSearch = open;
})();
