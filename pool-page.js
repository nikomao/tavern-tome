(function(){
  "use strict";
  var RACE = { BEAST:"野兽", DEMON:"恶魔", DRAGON:"龙", ELEMENTAL:"元素", MECHANICAL:"机械",
    MURLOC:"鱼人", NAGA:"纳迦", PIRATE:"海盗", QUILBOAR:"野猪人", UNDEAD:"亡灵",
    ABERRATION:"畸变怪", ALL:"全种族" };
  var PER = 60;
  var state = { q:"", tier:"", race:"", type:"", set:"", page:0 };
  var rows = [];

  var grid = document.getElementById("poolGrid");
  var countEl = document.getElementById("poolCount");
  var moreBtn = document.getElementById("poolMore");
  var modal = document.getElementById("poolModal");
  if(!grid || typeof POOL === "undefined") return;

  function raceText(c){
    if(!c.r) return "无种族";
    return c.r.split("/").map(function(x){ return RACE[x] || x; }).join(" / ");
  }
  function metaText(c){
    var bits = [c.t + " 本"];
    if(c.y) bits.push("法术");
    else bits.push(c.a + " / " + c.h);
    bits.push(raceText(c));
    return bits.join(" · ");
  }
  function isRecent(s){ return /^BG3[1-6]$/.test(s) || s === "BGFY" || s === "BGDU"; }

  function match(c){
    if(state.tier && c.t !== +state.tier) return false;
    if(state.type === "minion" && c.y !== 0) return false;
    if(state.type === "spell" && c.y !== 1) return false;
    if(state.race && c.r.indexOf(state.race) < 0) return false;
    if(state.set === "recent" && !isRecent(c.s)) return false;
    if(state.set === "old" && isRecent(c.s)) return false;
    if(state.q){
      var q = state.q.toLowerCase();
      if((c.n + " " + c.x).toLowerCase().indexOf(q) < 0) return false;
    }
    return true;
  }

  function tile(c, idx){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pc";
    b.setAttribute("data-idx", idx);
    var img = c.m
      ? '<img loading="lazy" src="pool/' + c.i + '.webp" alt="' + c.n + '">'
      : '<span class="pc-noimg">?</span>';
    b.innerHTML = '<span class="pc-img">' + img + '</span>' +
      '<span class="pc-info"><b>' + c.n + '</b><em>' + metaText(c) + '</em></span>';
    return b;
  }

  function render(reset){
    if(reset){ grid.innerHTML = ""; state.page = 0; }
    var end = Math.min(rows.length, (state.page + 1) * PER);
    for(var i = state.page * PER; i < end; i++) grid.appendChild(tile(rows[i], i));
    state.page++;
    moreBtn.style.display = end < rows.length ? "" : "none";
    countEl.textContent = "共 " + rows.length + " 张" + (end < rows.length ? "，已显示 " + end : "");
  }

  function apply(){
    rows = POOL.filter(match);
    rows.sort(function(a,b){
      if(a.t !== b.t) return a.t - b.t;
      if(a.y !== b.y) return a.y - b.y;
      return a.n.localeCompare(b.n, "zh");
    });
    render(true);
  }

  var timer;
  function bind(){
    var search = document.getElementById("poolSearch");
    search.addEventListener("input", function(){
      clearTimeout(timer);
      timer = setTimeout(function(){ state.q = search.value.trim(); apply(); }, 140);
    });
    [["poolTier","tier"],["poolRace","race"],["poolType","type"],["poolSet","set"]].forEach(function(pair){
      var el = document.getElementById(pair[0]);
      el.addEventListener("change", function(){ state[pair[1]] = el.value; apply(); });
    });
    document.getElementById("poolReset").addEventListener("click", function(){
      state = { q:"", tier:"", race:"", type:"", set:"", page:0 };
      search.value = "";
      ["poolTier","poolRace","poolType","poolSet"].forEach(function(id){ document.getElementById(id).value = ""; });
      apply();
    });
    moreBtn.addEventListener("click", function(){ render(false); });

    grid.addEventListener("click", function(e){
      var btn = e.target.closest(".pc");
      if(!btn) return;
      var c = rows[+btn.getAttribute("data-idx")];
      if(!c) return;
      document.getElementById("pmName").textContent = c.n;
      document.getElementById("pmMeta").textContent = metaText(c);
      document.getElementById("pmText").textContent = c.x || "（无卡牌描述）";
      var img = document.getElementById("pmImg");
      if(c.m){ img.src = "pool/" + c.i + ".webp"; img.style.display = ""; }
      else { img.removeAttribute("src"); img.style.display = "none"; }
      var TRIBE_ID = { BEAST:"beast", DEMON:"demon", DRAGON:"dragon", ELEMENTAL:"elemental",
        MECHANICAL:"mech", MURLOC:"murloc", NAGA:"naga", PIRATE:"pirate", QUILBOAR:"quilboar",
        UNDEAD:"undead", ABERRATION:"aberration" };
      var host = document.getElementById("pmTribes");
      host.innerHTML = "";
      (c.r || "").split("/").forEach(function(r){
        var id = TRIBE_ID[r];
        if(!id) return;
        var a = document.createElement("a");
        a.href = "index.html?tribe=" + id + "#tribes";
        a.textContent = "看「" + (RACE[r] || r) + "」流派 →";
        host.appendChild(a);
      });
      modal.hidden = false;
    });
    document.getElementById("pmClose").addEventListener("click", function(){ modal.hidden = true; });
    modal.addEventListener("click", function(e){ if(e.target === modal) modal.hidden = true; });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") modal.hidden = true; });
  }

  document.getElementById("poolTotal").textContent = POOL.length;
  bind();
  apply();
})();
