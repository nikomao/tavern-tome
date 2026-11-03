/* 阵容反查器：根据英雄 + 手牌推荐流派与原因 */
(function(){
  var input = document.getElementById("finderCard");
  if(!input || typeof POOL === "undefined" || typeof TRIBES === "undefined") return;

  var CN2CODE = { "野兽":"BEAST", "恶魔":"DEMON", "龙":"DRAGON", "元素":"ELEMENTAL", "机械":"MECHANICAL",
    "鱼人":"MURLOC", "纳迦":"NAGA", "海盗":"PIRATE", "野猪人":"QUILBOAR", "亡灵":"UNDEAD",
    "畸变怪":"ABERRATION", "全种族":"ALL" };
  var byName = new Map();

  function addRecord(name, official, races, text){
    if(!name) return;
    var rec = { name: name, official: official || name, races: races || [], text: text || "" };
    if(!byName.has(name)) byName.set(name, rec);
    if(rec.official && !byName.has(rec.official)) byName.set(rec.official, rec);
  }

  if(typeof CARDS !== "undefined"){
    Object.keys(CARDS).forEach(function(k){
      var c = CARDS[k];
      var races = (c.r || "").split(/\s*\/\s*/).map(function(x){ return CN2CODE[x] || x; });
      addRecord(k, c.n, races, c.x);
    });
  }
  POOL.forEach(function(c){ addRecord(c.n, c.n, (c.r || "").split("/"), c.x); });

  var dl = document.getElementById("poolNames");
  if(dl){
    var names = Array.from(new Set(Array.from(byName.keys()))).sort(function(a, b){ return a.localeCompare(b, "zh"); });
    names.forEach(function(n){ var o = document.createElement("option"); o.value = n; dl.appendChild(o); });
  }

  var heroSel = document.getElementById("finderHero");
  var heroNames = [];
  if(typeof STATS !== "undefined" && STATS.heroComps){
    var order = {};
    (STATS.heroes || []).forEach(function(h, i){ order[h.name] = i; });
    heroNames = Object.keys(STATS.heroComps).sort(function(a, b){ return (order[a] == null ? 999 : order[a]) - (order[b] == null ? 999 : order[b]); });
  }
  if(!heroNames.length && typeof HEROES !== "undefined"){ heroNames = HEROES.map(function(h){ return h.n; }); }
  heroNames.forEach(function(n){ var o = document.createElement("option"); o.value = n; o.textContent = n; heroSel.appendChild(o); });

  function pct(v){ return Math.round((Number(v) || 0) * 100) + "%"; }

  function renderHeroComps(name){
    var recs = (typeof STATS !== "undefined" && STATS.heroComps && STATS.heroComps[name]) || [];
    if(!recs.length) return false;
    var h = '<div class="fr-recs"><div class="fr-recs-head">' + name + ' 的推荐阵容</div>';
    recs.forEach(function(r, i){
      var full = (STATS.comps || []).filter(function(c){ return c.key === r.key; })[0] || {};
      h += '<a class="fr-comp" href="#meta" data-comp="' + r.key + '">' +
        '<span class="fr-comp-rank">#' + (i + 1) + '</span>' +
        '<b>' + r.name + '</b>' +
        '<span class="fr-comp-tier ' + String(r.tier).toLowerCase() + '">' + r.tier + '</span>' +
        '<span class="fr-comp-meta">均位 ' + r.avg + ' · 前四 ' + pct(full.top4) + ' · 吃鸡 ' + pct(full.win) + ' · ' + r.sample + ' 局</span>' +
        '</a>';
    });
    h += '<p class="fr-recs-tip">点任意一套，跳到周报区看 7 格卡牌与站位。</p></div>';
    result.innerHTML = h;
    return true;
  }

  heroSel.addEventListener("change", function(){
    if(!heroSel.value) return;
    if(!renderHeroComps(heroSel.value)){
      result.innerHTML = '<p class="fr-empty">这个英雄暂时没有足够样本的阵容推荐。</p>';
    }
  });

  var chipsEl = document.getElementById("finderChips");
  var result = document.getElementById("finderResult");
  var picked = [];

  function renderChips(){
    chipsEl.innerHTML = "";
    picked.forEach(function(n){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "fchip";
      b.innerHTML = n + ' <i>×</i>';
      b.addEventListener("click", function(){ picked = picked.filter(function(x){ return x !== n; }); renderChips(); });
      chipsEl.appendChild(b);
    });
  }
  function addChip(name){
    if(!name || !byName.has(name) || picked.indexOf(name) >= 0 || picked.length >= 3) return;
    picked.push(name); renderChips(); input.value = "";
  }
  input.addEventListener("change", function(){ addChip(input.value.trim()); });
  input.addEventListener("keydown", function(e){ if(e.key === "Enter"){ e.preventDefault(); addChip(input.value.trim()); } });

  var RACE2TRIBE = { BEAST:"beast", DEMON:"demon", DRAGON:"dragon", ELEMENTAL:"elemental",
    MECHANICAL:"mech", MURLOC:"murloc", NAGA:"naga", PIRATE:"pirate", QUILBOAR:"quilboar",
    UNDEAD:"undead", ABERRATION:"aberration" };
  var HERO_MAP = { "经济":["elemental","pirate"], "战力":["beast","mech"], "战吼":["murloc","dragon"],
    "刷新":["naga","elemental"], "频率":["beast","undead"], "偷牌":["pirate","demon"], "鱼人":["murloc"] };
  var KEY = { elemental:["元素","酒馆法术"], naga:["塑造"], mech:["磁力"], murloc:["鱼人","战吼","剧毒"],
    beast:["野兽","亡语"], undead:["亡灵","复生"], pirate:["海盗","铸币"], demon:["恶魔","吞噬"],
    dragon:["龙"], quilboar:["鲜血宝石"], aberration:["畸变","神明"] };

  function coreOfficial(t){
    return t.cores.map(function(x){
      var c = (typeof CARDS !== "undefined") ? CARDS[x.n] : null;
      return c ? c.n : x.n;
    });
  }

  function compute(){
    var hero = (typeof HEROES !== "undefined") ? HEROES.filter(function(h){ return h.n === heroSel.value; })[0] : null;
    if(!picked.length && !hero){ result.innerHTML = '<p class="fr-empty">至少选一个英雄或一张牌。</p>'; return; }
    if(!picked.length){
      var map = HERO_MAP[hero.tag] || [];
      if(!map.length){ result.innerHTML = '<p class="fr-empty">「' + hero.n + '」比较百搭，再输入 1–2 张手里的核心牌，就能算出方向。</p>'; return; }
      var names = map.map(function(id){ var t = TRIBES.filter(function(x){ return x.id === id; })[0]; return t ? t.name : id; });
      result.innerHTML = '<p class="fr-empty">「' + hero.n + '」适合：' + names.join("、") + '。再输入手里的牌可以算得更准。</p>';
      return;
    }

    var scores = TRIBES.map(function(t){
      var banned = (typeof window !== "undefined" && window.__bannedTribes) || [];
      if(banned.indexOf(t.name) >= 0) return { t: t, s: -999, reasons: ["该种族已被禁选"] };
      var s = 0, reasons = [];
      if(hero){
        var map = HERO_MAP[hero.tag] || [];
        if(map.indexOf(t.id) >= 0){ s += 2; reasons.push("英雄「" + hero.n + "」适合" + t.name); }
        else if(hero.tag === "复制" || hero.tag === "点金"){ s += 0.6; reasons.push("英雄「" + hero.n + "」的复制能力对任何流派都有用"); }
      }
      var cores = coreOfficial(t);
      picked.forEach(function(name){
        var rec = byName.get(name);
        if(!rec) return;
        if(cores.indexOf(rec.official) >= 0){ s += 3.5; reasons.push("「" + name + "」是" + t.name + "的核心组件"); return; }
        var hit = rec.races.some(function(r){ return RACE2TRIBE[r] === t.id; });
        if(hit){ s += 2; reasons.push("「" + name + "」是" + t.name + "种族"); return; }
        var keys = KEY[t.id] || [];
        if(keys.some(function(k){ return rec.text.indexOf(k) >= 0; })){
          s += 1; reasons.push("「" + name + "」的效果和" + t.name + "相关");
        }
      });
      return { t: t, s: s, reasons: reasons };
    }).filter(function(x){ return x.s >= 1.5; }).sort(function(a, b){ return b.s - a.s; }).slice(0, 3);

    if(!scores.length){
      result.innerHTML = '<p class="fr-empty">这几张牌暂时拼不出明确方向，再加一张核心牌试试。</p>';
      return;
    }
    var max = scores[0].s;
    result.innerHTML = scores.map(function(x, i){
      var pct = Math.round(x.s / max * 100);
      return '<div class="fr-item">' +
        '<div class="fr-top"><b>#' + (i + 1) + ' ' + x.t.name + '</b><span class="fr-score">' + pct + '%</span></div>' +
        '<div class="fr-bar"><i style="width:' + pct + '%"></i></div>' +
        '<p class="fr-tag">' + x.t.tagline + '</p>' +
        '<ul class="fr-why">' + x.reasons.slice(0, 3).map(function(r){ return '<li>' + r + '</li>'; }).join("") + '</ul>' +
        '<a class="fr-link" href="index.html?tribe=' + x.t.id + '#tribes">看图鉴 →</a></div>';
    }).join("");
  }

  var goBtn = document.getElementById("finderGo");
  if(goBtn) goBtn.addEventListener("click", compute);
  renderChips();
})();
