/* 對局模式 */
(function(){
  function tierStars(n){ n = Number(n); if(!n || n < 1) return ""; return '<i class="star"></i>'.repeat(Math.min(7, n)); }

  var comps = (typeof STATS !== "undefined" && STATS.comps) || [];
  var sel = document.getElementById("playComp");
  var slotsEl = document.getElementById("playSlots");
  var missList = document.getElementById("missList");
  var missCount = document.getElementById("missCount");
  var hintEl = document.getElementById("playHint");
  var tierEl = document.getElementById("playTier");
  var metaEl = document.getElementById("playMeta");

  if(!comps.length){
    if(slotsEl) slotsEl.innerHTML = '<p class="play-hint">陣容數據未加載，请刷新。</p>';
    return;
  }

  var CARD_DB = {};
  if(typeof POOL !== "undefined") POOL.forEach(function(c){ CARD_DB[c.i] = c; });
  if(typeof EXTRA_CARDS !== "undefined") Object.keys(EXTRA_CARDS).forEach(function(k){ CARD_DB[k] = EXTRA_CARDS[k]; });

  function tierOf(id){ var c = CARD_DB[id]; return c && c.t != null ? c.t : null; }
  function nameOf(id, fallback){ var c = CARD_DB[id]; return (c && c.n) || fallback || id; }

  var params = new URLSearchParams(location.search);
  var heroParam = params.get("hero");
  var key = params.get("comp") || (heroParam && typeof STATS !== "undefined" && STATS.heroComps && STATS.heroComps[heroParam] ? STATS.heroComps[heroParam][0].key : "") || comps[0].key;
  if(!comps.some(function(c){ return c.key === key; })) key = comps[0].key;

  comps.forEach(function(c){
    var o = document.createElement("option");
    o.value = c.key;
    o.textContent = c.name + "（" + c.tier + "）";
    sel.appendChild(o);
  });
  sel.value = key;

  function current(){ return comps.filter(function(c){ return c.key === key; })[0]; }

  var DEFAULTS = { turn: 1, tier: 1, gold: 3, health: 30, slots: [], cards: null };
  var state = load();

  // 從分享鏈接恢複局面
  (function(){
    if(params.get("t")) state.turn = Math.max(1, Math.min(30, +params.get("t") || 1));
    if(params.get("ti")) state.tier = Math.max(1, Math.min(7, +params.get("ti") || 1));
    if(params.get("g")) state.gold = Math.max(0, Math.min(99, +params.get("g") || 0));
    if(params.get("h")) state.health = Math.max(0, Math.min(99, +params.get("h") || 0));
    var s = params.get("s");
    if(s && /^[0-2]{1,7}$/.test(s)) state.slots = s.split("").map(Number);
    var c = params.get("c");
    if(c){
      var ids = c.split(",").filter(Boolean).slice(0, 7);
      if(ids.length) state.cards = ids.map(function(id){
        var card = CARD_DB[id];
        return { id: id, name: card ? card.n : id };
      });
    }
  })();

  function load(){
    try {
      var raw = localStorage.getItem("tt-play-" + key);
      if(raw){
        var s = JSON.parse(raw);
        return { turn: s.turn || 1, tier: s.tier || 1, gold: s.gold || 0, health: s.health == null ? 30 : s.health, slots: s.slots || [], cards: s.cards || null };
      }
    } catch(e){}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  function save(){
    try { localStorage.setItem("tt-play-" + key, JSON.stringify(state)); } catch(e){}
  }

  function ordered(c){
    var list = (c.cards || []).slice();
    var note = (typeof COMP_NOTES !== "undefined" && c.key) ? COMP_NOTES[c.key] : null;
    if(note && note.order){
      var idx = {};
      note.order.forEach(function(n, i){ idx[n] = i; });
      list.sort(function(a, b){
        return (idx[a.name] == null ? 99 : idx[a.name]) - (idx[b.name] == null ? 99 : idx[b.name]);
      });
    }
    return list;
  }

  function currentCards(){ return (state.cards && state.cards.length) ? state.cards : ordered(current()); }

  function roleWeight(role){ return role === "CORE" ? 3 : role === "CYCLE" ? 1 : 2; }
  function roleCN(role){ return role === "CORE" ? "核心" : role === "CYCLE" ? "輪轉" : "補強"; }

  function advice(){
    var list = currentCards();
    var missing = [];
    list.forEach(function(x, i){
      if((state.slots[i] || 0) !== 0) return;
      var role = String(x.status || "ADDON").toUpperCase();
      missing.push({ x: x, t: tierOf(x.id), role: role, w: roleWeight(role), text: (CARD_DB[x.id] && CARD_DB[x.id].x) || "" });
    });
    var affordable = missing.filter(function(m){ return m.t == null || m.t <= state.tier; })
      .sort(function(a, b){ return b.w - a.w || (b.t || 0) - (a.t || 0); });
    var locked = missing.filter(function(m){ return m.t != null && m.t > state.tier; });

    if(!missing.length){
      return { main: "七格齊了：先調站位，再考慮追金。",
        sub: state.gold >= 10 ? "钱多可以 D 一次找金，否則存钱上本。" : "別亂 D，把金幣留給下一輪。", nextId: null };
    }

    if(state.health <= 12){
      var wall = missing.filter(function(m){ return /嘲諷|聖盾術/.test(m.text); }).sort(function(a, b){ return b.w - a.w; })[0];
      if(wall){
        return { main: "血線危險：先找「" + wall.x.name + "」穩血（嘲諷/聖盾術）",
          sub: "別追貪，先活过这一輪。", nextId: wall.x.id };
      }
    }

    if(affordable.length){
      var n = affordable[0];
      var sub = state.gold >= 8 ? "钱夠，可以 D 一次找它；別 D 到 0。"
        : state.gold <= 2 ? "钱少，先存钱，下回合再找。"
        : "边打边找，優先拿它，別為了刷新把钱花光。";
      return { main: "現在最该找：" + n.x.name + " " + (n.t != null ? tierStars(n.t) : "?") + " · " + roleCN(n.role),
        sub: sub, nextId: n.x.id };
    }

    if(locked.length){
      locked.sort(function(a, b){ return (a.t || 99) - (b.t || 99) || b.w - a.w; });
      var l = locked[0];
      return { main: "先升到 " + tierStars(l.t) + " 本，再找「" + l.x.name + "」",
        sub: "當前 " + tierStars(state.tier) + "，高本卡刷不到，別浪費钱 D。", nextId: l.x.id };
    }

    return { main: "先穩血，等核心卡。", sub: "當前没有可執行的下一步。", nextId: null };
  }

  function ensureSlots(){
    var n = currentCards().length;
    while(state.slots.length < n) state.slots.push(0);
    state.slots = state.slots.slice(0, n);
  }

  function slotStateWord(v){ return v === 2 ? "金" : v === 1 ? "有" : "缺"; }

  function render(){
    ensureSlots();
    var c = current();
    tierEl.textContent = c.tier;
    metaEl.textContent = "均位 " + c.avg + " · 前四 " + Math.round((c.top4 || 0) * 100) + "% · 奪冠 " + Math.round((c.win || 0) * 100) + "%" +
      (heroParam ? " · 按英雄推薦" : "");

    slotsEl.innerHTML = "";
    currentCards().forEach(function(x, i){
      var v = state.slots[i] || 0;
      var t = tierOf(x.id);
      var d = document.createElement("div");
      d.className = "ps-slot " + (v === 2 ? "golden" : v === 1 ? "owned" : "missing");
      d.setAttribute("data-i", i);
      d.title = x.name + " · 点擊切換 缺/有/金";
      d.innerHTML = '<span class="num">' + (i + 1) + '</span>' +
        '<button class="swap" data-swap="' + i + '" title="替換">⇄</button>' +
        (t != null ? '<span class="tier stars" title="' + t + ' 本">' + tierStars(t) + '</span>' : '') +
        '<span class="ps-img">' + (CARD_DB[x.id] && CARD_DB[x.id].m ? '<img src="../pool/' + x.id + '.webp" alt="" onerror="this.style.display=\'none\'">' : '<i>' + x.name.slice(0,1) + '</i>') + '</span>' +
        '<span class="ps-name">' + x.name + '</span>' +
        '<span class="state">' + slotStateWord(v) + '</span>';
      slotsEl.appendChild(d);
    });

    var missing = currentCards().map(function(x, i){ return { x: x, i: i, v: state.slots[i] || 0 }; })
      .filter(function(o){ return o.v === 0; })
      .sort(function(a, b){ return (tierOf(a.x.id) || 99) - (tierOf(b.x.id) || 99); });

    var adv = advice();
    document.getElementById("adviceMain").innerHTML = adv.main;
    document.getElementById("adviceSub").innerHTML = adv.sub;

    missCount.textContent = missing.length;
    missList.innerHTML = missing.length ? missing.map(function(o){
      var t = tierOf(o.x.id);
      var next = adv.nextId && o.x.id === adv.nextId;
      return '<div class="miss' + (next ? ' next' : '') + '"><span class="m-tier stars">' + (t != null ? tierStars(t) : '?') + '</span><span>' + o.x.name + '</span>' +
        (next ? '<span class="tag-next">先找</span>' : '') + '</div>';
    }).join("") : '<div class="miss">七格齊了，准備收口。</div>';

    hintEl.textContent = hintFor(c);

    document.getElementById("stTurn").textContent = state.turn;
    document.getElementById("stTier").textContent = state.tier;
    document.getElementById("stGold").textContent = state.gold;
    document.getElementById("stHealth").textContent = state.health;

    renderCurveHud();
    save();
    renderPip();
  }

  var CURVE_BENCHMARK = [
    { turn: 1, tier: 1, tip: "T1 (3幣)：買 1 個过渡手下，理財手下怪優先。" },
    { turn: 2, tier: 2, tip: "T2 (4幣)：標准節奏升 2 本旅店（消耗 4 金幣）。" },
    { turn: 3, tier: 2, tip: "T3 (5幣)：賣 1 買 2，或買 1 手下 + 搜牌/旅店法術。" },
    { turn: 4, tier: 3, tip: "T4 (6幣)：標准節奏升 3 本旅店（消耗 6 金幣）。" },
    { turn: 5, tier: 3, tip: "T5 (7幣)：购買 2 個 3 本優质戰斗力手下保血量。" },
    { turn: 6, tier: 3, tip: "T6 (8幣)：補強場面；若血量健康且優勢大可直接跳 4 本。" },
    { turn: 7, tier: 4, tip: "T7 (9幣)：標准節奏升 4 本旅店，開始確立流派方向。" },
    { turn: 8, tier: 4, tip: "T8 (10幣)：寻找 4 本核心發動機，穩固戰力基础。" },
    { turn: 9, tier: 5, tip: "T9 (10幣)：升级 5 本旅店，搜寻流派終極核心手下。" }
  ];

  function renderCurveHud(){
    var hud = document.getElementById("playCurveHud");
    if(!hud) return;
    var turn = state.turn;
    var tier = state.tier;
    var benchItem = CURVE_BENCHMARK.filter(function(b){ return b.turn === turn; })[0];
    var benchTier = benchItem ? benchItem.tier : (turn >= 9 ? 5 : 1);
    var tip = benchItem ? benchItem.tip : "T" + turn + "+ 終盤：搜齊 7 格關鍵手下，追金並針对敵方站位調換（防下毒/風怒）。";

    var diff = tier - benchTier;
    var badgeClass = "on-pace", badgeText = "標准節奏";
    if(diff > 0){
      badgeClass = "ahead"; badgeText = "領先 " + diff + " 本";
    } else if(diff < 0){
      badgeClass = "behind"; badgeText = "落後 " + Math.abs(diff) + " 本";
    }

    var steps = CURVE_BENCHMARK.map(function(b){
      var isCur = b.turn === turn;
      var isDone = b.turn < turn;
      var cls = "pch-step" + (isCur ? " current" : "") + (isDone ? " done" : "");
      return '<div class="' + cls + '">' +
        '<span class="pst-turn">T' + b.turn + '</span>' +
        '<span class="pst-tier">' + b.tier + '本</span>' +
        '</div>';
    }).join("");

    hud.innerHTML =
      '<div class="pch-head">' +
        '<span class="pch-title">📈 標准升本節奏線</span>' +
        '<span class="pch-badge ' + badgeClass + '">' + badgeText + '</span>' +
      '</div>' +
      '<p class="pch-tip">' + tip + '</p>' +
      '<div class="pch-timeline">' + steps + '</div>';
  }

  function hintFor(c){
    var tribeName = String(c.name || "").split("·")[0];
    var t = (typeof TRIBES !== "undefined") ? TRIBES.filter(function(x){ return x.name === tribeName; })[0] : null;
    if(!t) return "先穩血，再決定要不要 D 牌。";
    var best = "";
    (t.curve || []).forEach(function(seg){
      var m = String(seg.k || "").match(/(\d+)/);
      if(!m) return;
      if(+m[1] <= state.turn) best = seg.v;
    });
    return best ? ("第 " + state.turn + " 回合：" + best) : "";
  }

  function toggle(i, e){
    if(e) e.preventDefault();
    var v = state.slots[i] || 0;
    state.slots[i] = v === 0 ? 1 : v === 1 ? 2 : 0;
    render();
  }

  slotsEl.addEventListener("click", function(e){
    var sw = e.target.closest ? e.target.closest(".swap") : null;
    if(sw){ e.preventDefault(); openPicker(+sw.getAttribute("data-swap")); return; }
    var s = e.target.closest ? e.target.closest(".ps-slot") : null;
    if(s) toggle(+s.getAttribute("data-i"));
  });

  document.getElementById("playStatus").addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("button[data-k]") : null;
    if(!b) return;
    var k = b.getAttribute("data-k"), d = +b.getAttribute("data-d");
    if(k === "turn") state.turn = Math.min(30, Math.max(1, state.turn + d));
    if(k === "tier") state.tier = Math.min(7, Math.max(1, state.tier + d));
    if(k === "gold") state.gold = Math.min(99, Math.max(0, state.gold + d));
    if(k === "health") state.health = Math.min(99, Math.max(0, state.health + d));
    render();
  });

  document.getElementById("btnNext").addEventListener("click", function(){
    state.turn = Math.min(30, state.turn + 1);
    render();
  });

  document.getElementById("btnReset").addEventListener("click", function(){
    if(!confirm("重置这一局的状態？")) return;
    state = JSON.parse(JSON.stringify(DEFAULTS));
    render();
  });

  sel.addEventListener("change", function(){
    key = sel.value;
    state = load();
    render();
    history.replaceState(null, "", "?comp=" + key);
  });

  document.addEventListener("keydown", function(e){
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if(tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if(e.key >= "1" && e.key <= "7"){ toggle(+e.key - 1); }
    else if(e.code === "Space"){ e.preventDefault(); state.turn = Math.min(30, state.turn + 1); render(); }
    else if(e.key.toLowerCase() === "r"){ document.getElementById("btnReset").click(); }
  });

  /* ---- 置頂小窗 ---- */
  var pipWin = null;
  function renderPip(){
    if(!pipWin) return;
    var c = current();
    var doc = pipWin.document;
    var missing = currentCards().map(function(x, i){ return { x: x, i: i, v: state.slots[i] || 0 }; })
      .filter(function(o){ return o.v === 0; })
      .sort(function(a, b){ return (tierOf(a.x.id) || 99) - (tierOf(b.x.id) || 99); });
    var advPip = advice();
    doc.getElementById("pipRoot").innerHTML =
      '<div class="advice"><p class="advice-main">' + advPip.main + '</p></div>' +
      '<div class="play-status" style="padding:0 0 6px"><div class="ps"><span>回合</span><b>' + state.turn + '</b></div>' +
      '<div class="ps"><span>本數</span><b>' + state.tier + '</b></div>' +
      '<div class="ps"><span>金幣</span><b>' + state.gold + '</b></div></div>' +
      '<div class="play-slots">' + currentCards().map(function(x, i){
        var v = state.slots[i] || 0;
        var t = tierOf(x.id);
        return '<div class="ps-slot ' + (v === 2 ? "golden" : v === 1 ? "owned" : "missing") + '" data-i="' + i + '">' +
          '<span class="num">' + (i + 1) + '</span>' + (t != null ? '<span class="tier stars">' + tierStars(t) + '</span>' : '') +
          '<span class="ps-img">' + (CARD_DB[x.id] && CARD_DB[x.id].m ? '<img src="../pool/' + x.id + '.webp" alt="">' : '<i>' + x.name.slice(0,1) + '</i>') + '</span>' +
          '<span class="ps-name">' + x.name + '</span><span class="state">' + slotStateWord(v) + '</span></div>';
      }).join("") + '</div>' +
      '<h3>还差 ' + missing.length + ' 張</h3>' +
missing.map(function(o){ return '<div class="miss"><span class="m-tier stars">' + (tierOf(o.x.id) ? tierStars(tierOf(o.x.id)) : '?') + '</span><span>' + o.x.name + '</span></div>'; }).join("");
  }

  document.getElementById("btnPip").addEventListener("click", async function(){
    if(!("documentPictureInPicture" in window)){
      alert("當前浏覽器不支持置頂小窗，请用 Chrome / Edge 116+。");
      return;
    }
    if(pipWin){ pipWin.focus(); return; }
    pipWin = await documentPictureInPicture.requestWindow({ width: 380, height: 560 });
    Array.prototype.forEach.call(document.querySelectorAll('link[rel="stylesheet"]'), function(l){
      var n = pipWin.document.createElement("link");
      n.rel = "stylesheet"; n.href = l.href;
      pipWin.document.head.appendChild(n);
    });
    pipWin.document.body.className = "play-body pip-body";
    var root = pipWin.document.createElement("div");
    root.id = "pipRoot";
    pipWin.document.body.appendChild(root);
    pipWin.document.addEventListener("click", function(e){
      var s = e.target.closest ? e.target.closest(".ps-slot") : null;
      if(s) toggle(+s.getAttribute("data-i"), e);
    });
    pipWin.addEventListener("pagehide", function(){ pipWin = null; });
    renderPip();
  });

  /* ---- 卡牌替換/添加 ---- */
  var overlay = document.getElementById("pickOverlay");
  var pickInput = document.getElementById("pickInput");
  var pickList = document.getElementById("pickList");
  var pickIndex = -1;

  function openPicker(i){
    pickIndex = i;
    overlay.hidden = false;
    pickInput.value = "";
    renderPicks("");
    setTimeout(function(){ pickInput.focus(); }, 30);
  }
  function closePicker(){ overlay.hidden = true; pickIndex = -1; }

  function renderPicks(q){
    q = String(q || "").trim().toLowerCase();
    var list = [];
    if(typeof POOL !== "undefined"){
      list = POOL.filter(function(c){ return !q || c.n.toLowerCase().indexOf(q) >= 0; })
        .sort(function(a, b){
          var as = a.n.toLowerCase().indexOf(q) === 0 ? 0 : 1;
          var bs = b.n.toLowerCase().indexOf(q) === 0 ? 0 : 1;
          return as - bs || a.n.length - b.n.length;
        })
        .slice(0, 30);
    }
    pickList.innerHTML = list.length ? list.map(function(c){
      return '<div class="pick-item" data-id="' + c.i + '">' +
        (c.m ? '<img src="../pool/' + c.i + '.webp" alt="">' : '<span class="pt">?</span>') +
        '<span>' + c.n + '</span><span class="pt">' + (c.t != null ? tierStars(c.t) : "") + '</span></div>';
    }).join("") : '<p class="pick-hint">没找到</p>';
  }

  pickInput.addEventListener("input", function(){ renderPicks(pickInput.value); });
  pickInput.addEventListener("keydown", function(e){ if(e.key === "Escape") closePicker(); });
  pickList.addEventListener("click", function(e){
    var it = e.target.closest ? e.target.closest(".pick-item") : null;
    if(!it) return;
    var id = it.getAttribute("data-id");
    var card = CARD_DB[id];
    if(!card) return;
    var list = currentCards().slice();
    if(pickIndex >= 0) list[pickIndex] = { id: id, name: card.n };
    else {
      if(list.length >= 7){ alert("最多 7 格，请用格子上的 ⇄ 替換。"); return; }
      list.push({ id: id, name: card.n });
    }
    state.cards = list;
    state.slots = state.slots.slice(0, list.length);
    save(); render(); closePicker();
  });
  overlay.addEventListener("click", function(e){ if(e.target === overlay) closePicker(); });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !overlay.hidden) closePicker(); });

  var addBtn = document.getElementById("btnAdd");
  if(addBtn) addBtn.addEventListener("click", function(){ openPicker(-1); });

  var shareBtn = document.getElementById("btnShare");
  if(shareBtn) shareBtn.addEventListener("click", function(){
    var q = ["comp=" + encodeURIComponent(key)];
    q.push("t=" + state.turn, "ti=" + state.tier, "g=" + state.gold, "h=" + state.health);
    q.push("s=" + state.slots.join(""));
    if(state.cards && state.cards.length) q.push("c=" + state.cards.map(function(x){ return x.id; }).join(","));
    var url = location.origin + location.pathname + "?" + q.join("&");
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){ shareBtn.textContent = "已複制"; setTimeout(function(){ shareBtn.textContent = "複制鏈接"; }, 1500); });
    } else {
      prompt("複制鏈接", url);
    }
  });

  render();
})();
