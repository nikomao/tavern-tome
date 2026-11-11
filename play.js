/* 对局模式 */
(function(){
  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function tierStars(n){
    n = Number(n);
    if(!n || n < 1) return "";
    return '<i class="star"></i>'.repeat(Math.min(7, n));
  }

  var comps = (typeof STATS !== "undefined" && STATS.comps) || [];
  var sel = document.getElementById("playComp");
  var slotsEl = document.getElementById("playSlots");
  var missList = document.getElementById("missList");
  var missCount = document.getElementById("missCount");
  var hintEl = document.getElementById("playHint");
  var tierEl = document.getElementById("playTier");
  var metaEl = document.getElementById("playMeta");

  if(!comps.length){
    if(slotsEl) slotsEl.innerHTML = '<p class="play-hint">阵容数据未加载，请刷新。</p>';
    return;
  }

  var CARD_DB = {};
  if(typeof POOL !== "undefined") POOL.forEach(function(c){ CARD_DB[c.i] = c; });
  if(typeof EXTRA_CARDS !== "undefined") Object.keys(EXTRA_CARDS).forEach(function(k){ CARD_DB[k] = EXTRA_CARDS[k]; });

  // Active cards appearing across current meta comps (ranked higher in picker recommendations)
  var ACTIVE_IDS = {};
  comps.forEach(function(c){
    (c.cards || []).forEach(function(x){ ACTIVE_IDS[x.id] = true; });
  });

  // Verified tech/engine counter card IDs in POOL
  var TECH_IDS = ["BG23_318","BGS_131","BG_DAL_775","BG25_016","BG25_354","BG_LOE_077","BG26_ICC_901","BG35_883"];

  var TRIBE_DEFS = [
    { id: "ALL_FILTER", label: "全部" },
    { id: "T0_FILTER", label: "仅看 T0" },
    { id: "DRAGON", label: "龙", race: "DRAGON" },
    { id: "MURLOC", label: "鱼人", race: "MURLOC" },
    { id: "ABERRATION", label: "畸变怪", race: "ABERRATION" },
    { id: "MECHANICAL", label: "机械", race: "MECHANICAL" },
    { id: "QUILBOAR", label: "野猪人", race: "QUILBOAR" },
    { id: "NAGA", label: "纳迦", race: "NAGA" },
    { id: "PIRATE", label: "海盗", race: "PIRATE" },
    { id: "DEMON", label: "恶魔", race: "DEMON" },
    { id: "ELEMENTAL", label: "元素", race: "ELEMENTAL" },
    { id: "UNDEAD", label: "亡灵", race: "UNDEAD" },
    { id: "BEAST", label: "野兽", race: "BEAST" },
    { id: "ALL", label: "全种族", race: "ALL" }
  ];
  var TRIBE_LABEL_TO_ID = {};
  TRIBE_DEFS.forEach(function(td){ if(td.race) TRIBE_LABEL_TO_ID[td.label] = td.race; });

  function tierOf(id){ var c = CARD_DB[id]; return c && c.t != null ? c.t : null; }
  function textOf(id){ var c = CARD_DB[id]; return (c && c.x) ? c.x : ""; }
  function compTribeId(c){
    var prefix = String((c && c.name) || "").split("·")[0].trim();
    return TRIBE_LABEL_TO_ID[prefix] || "ALL";
  }
  function cardMatchesRace(card, raceId){
    if(!raceId || raceId === "ALL") return true;
    var r = String((card && card.r) || "");
    if(!r) return false;
    if(r === "ALL") return true;
    return r.split("/").indexOf(raceId) >= 0;
  }

  var params = new URLSearchParams(location.search);
  var heroParam = params.get("hero") || "";
  var heroListData = (typeof STATS !== "undefined" && STATS.heroComps) ? STATS.heroComps : {};
  var heroStatsMap = {};
  if(typeof STATS !== "undefined" && STATS.heroes){
    STATS.heroes.forEach(function(h){ heroStatsMap[h.name] = h; });
  }

  var initialHero = heroParam && heroListData[heroParam] ? heroParam : "";
  var key = params.get("comp") || (initialHero && heroListData[initialHero][0] ? heroListData[initialHero][0].key : "") || comps[0].key;
  if(!comps.some(function(c){ return c.key === key; })) key = comps[0].key;

  function current(){ return comps.filter(function(c){ return c.key === key; })[0] || comps[0]; }

  var DEFAULTS = { turn: 1, tier: 1, gold: 3, health: 30, autoGold: true, slots: [], cards: null };
  var ui = {
    hero: initialHero,
    filter: "ALL_FILTER",
    banMode: false,
    bans: {},
    stageTab: null, // null = follow turn phase
    stageTabTurnGroup: -1,
    pipMode: "full", // "full" | "mini"
    pipDetailId: null,
    viewingShare: false
  };

  function loadPrefs(){
    try {
      var raw = localStorage.getItem("tt-play-prefs");
      if(raw){
        var p = JSON.parse(raw);
        if(p && p.pipMode) ui.pipMode = p.pipMode === "mini" ? "mini" : "full";
      }
      var ses = sessionStorage.getItem("tt-play-session");
      if(ses){
        var sp = JSON.parse(ses);
        if(sp && sp.bans) ui.bans = sp.bans;
        if(sp && sp.hero && !initialHero && heroListData[sp.hero]) ui.hero = sp.hero;
      }
    } catch(e){}
  }
  function savePrefs(){
    if(ui.viewingShare) return;
    try {
      localStorage.setItem("tt-play-prefs", JSON.stringify({ pipMode: ui.pipMode }));
      sessionStorage.setItem("tt-play-session", JSON.stringify({ bans: ui.bans, hero: ui.hero }));
    } catch(e){}
  }

  function loadBoard(compKey){
    try {
      var raw = localStorage.getItem("tt-play-" + compKey);
      if(raw){
        var s = JSON.parse(raw);
        return {
          turn: s.turn || 1,
          tier: s.tier || 1,
          gold: s.gold == null ? 3 : s.gold,
          health: s.health == null ? 30 : s.health,
          autoGold: s.autoGold !== false,
          slots: Array.isArray(s.slots) ? s.slots : [],
          cards: Array.isArray(s.cards) && s.cards.length ? s.cards : null
        };
      }
    } catch(e){}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  function save(){
    if(ui.viewingShare) return;
    try { localStorage.setItem("tt-play-" + key, JSON.stringify(state)); } catch(e){}
    savePrefs();
  }

  loadPrefs();
  var state = loadBoard(key);

  // Check if URL carries a shared board snapshot
  var hasShareParams = !!(params.get("s") || params.get("c") || params.get("t"));
  if(hasShareParams){
    ui.viewingShare = true;
    if(params.get("t")) state.turn = Math.max(1, Math.min(30, +params.get("t") || 1));
    if(params.get("ti")) state.tier = Math.max(1, Math.min(7, +params.get("ti") || 1));
    if(params.get("g") != null) state.gold = Math.max(0, Math.min(99, +params.get("g") || 0));
    if(params.get("h") != null) state.health = Math.max(0, Math.min(99, +params.get("h") || 0));
    var sParam = params.get("s");
    if(sParam && /^[0-2]{1,7}$/.test(sParam)) state.slots = sParam.split("").map(Number);
    var cParam = params.get("c");
    if(cParam){
      var ids = cParam.split(",").filter(Boolean).slice(0, 7);
      if(ids.length) state.cards = ids.map(function(id){
        var card = CARD_DB[id];
        return { id: id, name: card ? card.n : id };
      });
    }
  }

  var undoStack = [];
  function snapshot(){
    return JSON.stringify({ key: key, state: state });
  }
  function pushUndo(){
    undoStack.push(snapshot());
    if(undoStack.length > 25) undoStack.shift();
  }
  function doUndo(){
    if(!undoStack.length) return;
    var snap = JSON.parse(undoStack.pop());
    if(snap.key && snap.key !== key){
      key = snap.key;
      sel.value = key;
    }
    state = snap.state;
    render();
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
  function roleCN(role){ return role === "CORE" ? "核心" : role === "CYCLE" ? "轮转" : "补强"; }

  function getDefaultMap(comp){
    var map = {};
    ordered(comp).forEach(function(x){ map[x.id] = x; });
    return map;
  }

  function roleForCard(comp, x){
    if(x.status) return String(x.status).toUpperCase();
    var orig = getDefaultMap(comp)[x.id];
    return orig && orig.status ? String(orig.status).toUpperCase() : "ADDON";
  }

  function isCompBanned(c){
    var tid = compTribeId(c);
    return !!(tid && tid !== "ALL" && ui.bans[tid]);
  }

  function isCompVisible(c){
    if(ui.filter === "T0_FILTER") return c.tier === "T0" && !isCompBanned(c);
    if(ui.filter !== "ALL_FILTER") return compTribeId(c) === ui.filter;
    return true;
  }

  function ensureSlots(){
    var n = currentCards().length;
    while(state.slots.length < n) state.slots.push(0);
    state.slots = state.slots.slice(0, n);
  }

  function slotStateWord(v){ return v === 2 ? "金" : v === 1 ? "有" : "缺"; }

  function getMissingBuckets(){
    var c = current();
    var avail = [], locked = [];
    currentCards().forEach(function(x, i){
      if((state.slots[i] || 0) !== 0) return;
      var t = tierOf(x.id);
      var role = roleForCard(c, x);
      var item = { x: x, i: i, t: t, role: role, w: roleWeight(role), text: textOf(x.id) };
      if(t != null && t > state.tier) locked.push(item);
      else avail.push(item);
    });
    avail.sort(function(a, b){ return b.w - a.w || (b.t || 0) - (a.t || 0); });
    locked.sort(function(a, b){ return (a.t || 99) - (b.t || 99) || b.w - a.w; });
    return { avail: avail, locked: locked, total: avail.length + locked.length };
  }

  function advice(){
    var b = getMissingBuckets();
    if(!b.total){
      return {
        main: "七格齐了：先调站位，再考虑追金。",
        sub: state.gold >= 10 ? "钱充裕可以 D 牌追三连或补对策（火车王/孢子），否则稳健调位。" : "把钱留到关键局补针对或升本追金。",
        nextId: null
      };
    }

    if(state.health <= 12){
      var wall = b.avail.filter(function(m){ return /嘲讽|圣盾/.test(m.text); })[0];
      if(wall){
        return {
          main: "血线危险：先找【" + esc(wall.x.name) + "】（嘲讽/圣盾稳血）",
          sub: "当前就能刷到，先保命活过这一轮再想上限。",
          nextId: wall.x.id
        };
      }
    }

    if(b.avail.length){
      var n = b.avail[0];
      var sub = state.gold >= 8 ? "本本可出，钱够可以 D 牌找它，注意别 D 空战力。"
        : state.gold <= 2 ? "金币较少，先稳住场面，等下回合补钱再找。"
        : "现阶段即可买到，边打边找，别硬刷空金币。";
      return {
        main: "现在最该找：【" + esc(n.x.name) + "】 " + (n.t != null ? tierStars(n.t) : "?") + " · " + roleCN(n.role),
        sub: sub,
        nextId: n.x.id
      };
    }

    var l = b.locked[0];
    return {
      main: "先升到 " + tierStars(l.t) + " 本，再找【" + esc(l.x.name) + "】",
      sub: "当前 " + tierStars(state.tier) + " 商店还刷不到高本核心，别在此阶段盲目 D 牌。",
      nextId: l.x.id
    };
  }

  function switchComp(nextKey, opts){
    opts = opts || {};
    if(!nextKey || nextKey === key) return;
    if(!opts.skipUndo) pushUndo();
    var oldCards = currentCards();
    var ownedById = {}, ownedByName = {};
    oldCards.forEach(function(x, i){
      var v = state.slots[i] || 0;
      if(v > 0){
        ownedById[x.id] = Math.max(ownedById[x.id] || 0, v);
        ownedByName[x.name] = Math.max(ownedByName[x.name] || 0, v);
      }
    });

    key = nextKey;
    sel.value = key;
    ui.stageTab = null;
    ui.stageTabTurnGroup = -1;
    ui.pipDetailId = null;

    var nextComp = current();
    var baseList = ordered(nextComp);
    state.cards = null;
    state.slots = baseList.map(function(x){
      return ownedById[x.id] || ownedByName[x.name] || 0;
    });
    render();
    if(!ui.viewingShare){
      var qs = ["comp=" + encodeURIComponent(key)];
      if(ui.hero) qs.push("hero=" + encodeURIComponent(ui.hero));
      history.replaceState(null, "", "?" + qs.join("&"));
    }
  }

  function autoGoldForTurn(t){ return Math.min(10, Math.max(3, t + 2)); }

  function advanceTurn(delta){
    pushUndo();
    state.turn = Math.min(30, Math.max(1, state.turn + delta));
    if(state.autoGold && delta > 0){
      state.gold = autoGoldForTurn(state.turn);
    }
    render();
  }

  function upgradeTier(delta){
    var nextTier = Math.min(7, Math.max(1, state.tier + delta));
    if(nextTier === state.tier) return;
    pushUndo();
    state.tier = nextTier;
    render();
  }

  function toggle(i, e){
    if(e) e.preventDefault();
    pushUndo();
    var v = state.slots[i] || 0;
    state.slots[i] = v === 0 ? 1 : v === 1 ? 2 : 0;
    render();
  }

  function moveSlot(from, to){
    var list = currentCards().slice();
    if(from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return;
    pushUndo();
    ensureSlots();
    var tmpC = list[from]; list[from] = list[to]; list[to] = tmpC;
    var tmpS = state.slots[from]; state.slots[from] = state.slots[to]; state.slots[to] = tmpS;
    state.cards = list;
    render();
  }

  function renderCompSelect(){
    var c = current();
    var recs = (ui.hero && heroListData[ui.hero]) ? heroListData[ui.hero] : [];
    var recMap = {};
    recs.forEach(function(r, idx){ recMap[r.key] = { avg: r.avg, idx: idx }; });

    var list = comps.filter(isCompVisible).slice();
    // Ensure currently selected comp stays in dropdown even when filtered
    if(!list.some(function(x){ return x.key === c.key; })) list.unshift(c);

    list.sort(function(a, b){
      var ab = isCompBanned(a) ? 1 : 0, bb = isCompBanned(b) ? 1 : 0;
      if(ab !== bb) return ab - bb;
      var ar = recMap[a.key] ? recMap[a.key].idx : 999;
      var br = recMap[b.key] ? recMap[b.key].idx : 999;
      if(ar !== br) return ar - br;
      return comps.indexOf(a) - comps.indexOf(b);
    });

    sel.innerHTML = "";
    list.forEach(function(item){
      var o = document.createElement("option");
      o.value = item.key;
      var tag = isCompBanned(item) ? " [已禁]" : (recMap[item.key] ? " ★" + recMap[item.key].avg : "");
      o.textContent = item.name + "（" + item.tier + "）" + tag;
      sel.appendChild(o);
    });
    sel.value = key;
  }

  function renderHeroUI(){
    var btn = document.getElementById("playHeroBtn");
    var clr = document.getElementById("playHeroClear");
    var recsBar = document.getElementById("playHeroRecs");
    if(btn){
      btn.textContent = ui.hero ? ("英雄：" + ui.hero + " ▾") : "选英雄 ▾";
      btn.classList.toggle("active", !!ui.hero);
    }
    if(clr) clr.hidden = !ui.hero;
    if(recsBar){
      var recs = (ui.hero && heroListData[ui.hero]) ? heroListData[ui.hero] : [];
      if(!recs.length){
        recsBar.hidden = true;
        recsBar.innerHTML = "";
      } else {
        recsBar.hidden = false;
        recsBar.innerHTML = '<span class="phr-label">' + esc(ui.hero) + ' 推荐：</span>' +
          recs.map(function(r){
            var full = comps.filter(function(x){ return x.key === r.key; })[0];
            var banned = full && isCompBanned(full);
            var cls = "phr-chip" + (r.key === key ? " on" : "") + (banned ? " banned" : "");
            return '<button type="button" class="' + cls + '" data-comp-pick="' + esc(r.key) + '">' +
              esc(r.name) + ' <em>' + esc(r.tier) + ' · 均位 ' + esc(r.avg) + (banned ? " · 已禁" : "") + '</em></button>';
          }).join("");
      }
    }
  }

  function renderFilterBar(){
    var chipsHost = document.getElementById("pfbTribes");
    var banBtn = document.getElementById("btnBanMode");
    var clrBtn = document.getElementById("btnClearFilters");
    if(banBtn) banBtn.classList.toggle("on", ui.banMode);
    var hasBans = Object.keys(ui.bans).some(function(k){ return ui.bans[k]; });
    if(clrBtn) clrBtn.hidden = !(ui.filter !== "ALL_FILTER" || hasBans);
    if(!chipsHost) return;

    chipsHost.innerHTML = TRIBE_DEFS.map(function(td){
      if(ui.banMode && !td.race) return "";
      if(ui.banMode && td.id === "ALL") return "";
      var isBanned = td.race && ui.bans[td.race];
      var isOn = !ui.banMode && ui.filter === td.id;
      var cls = "pfb-chip" + (isOn ? " on" : "") + (isBanned ? " banned" : "");
      return '<button type="button" class="' + cls + '" data-f="' + td.id + '"' +
        (td.race ? ' data-race="' + td.race + '"' : '') + '>' +
        (isBanned ? "🚫 " : "") + esc(td.label) + '</button>';
    }).join("");
  }

  function renderPosBar(c){
    var bar = document.getElementById("playPosBar");
    if(!bar) return;
    var note = (typeof COMP_NOTES !== "undefined" && c.key) ? COMP_NOTES[c.key] : null;
    var customized = !!(state.cards && state.cards.length);
    if((!note || !note.pos) && !customized){
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    var posHTML = (note && note.pos)
      ? '<span class="ppb-text"><b>站位思路</b>' + esc(note.pos) + '</span>'
      : '<span class="ppb-text"><b>自定义阵容</b>已手动替换或调整过槽位顺序</span>';
    var rstHTML = customized ? '<button type="button" class="ppb-reset" id="btnRestoreAll">恢复默认 7 格</button>' : '';
    bar.innerHTML = posHTML + rstHTML;
  }

  function turnPhaseIndex(t){ return t <= 3 ? 0 : t <= 7 ? 1 : 2; }

  function renderStageCard(c){
    var host = document.getElementById("playStageCard");
    if(!host) return;
    var note = (typeof COMP_NOTES !== "undefined" && c.key) ? COMP_NOTES[c.key] : null;
    if(!note || (!note.transitions && !note.mistakes)){
      host.hidden = true;
      return;
    }
    host.hidden = false;
    var tg = turnPhaseIndex(state.turn);
    if(ui.stageTabTurnGroup !== tg){
      ui.stageTabTurnGroup = tg;
      if(ui.stageTab !== "mistakes") ui.stageTab = null;
    }
    var activeTab = ui.stageTab != null ? ui.stageTab : tg;
    var trs = note.transitions || [];

    var tabsHTML = trs.map(function(tr, idx){
      var shortTitle = idx === 0 ? "前期过渡 (T1-3)" : idx === 1 ? "中期转接 (T4-7)" : "决战终局 (T8+)";
      return '<button type="button" class="psc-tab' + (activeTab === idx ? " on" : "") + '" data-stab="' + idx + '">' +
        shortTitle + (tg === idx ? " · 当前" : "") + '</button>';
    }).join("");

    if((note.mistakes && note.mistakes.length) || note.trinket){
      tabsHTML += '<button type="button" class="psc-tab' + (activeTab === "mistakes" ? " on" : "") + '" data-stab="mistakes">避坑 &amp; 饰品</button>';
    }

    var bodyHTML = "";
    if(activeTab === "mistakes"){
      var items = (note.mistakes || []).map(function(m){ return '<li>' + esc(m) + '</li>'; }).join("");
      var trk = note.trinket
        ? '<p><b>适配饰品：</b>' + esc(note.trinket.core) + '（' + esc(note.trinket.coreTier || "核心") + '）' +
          (note.trinket.alt ? ' / 备选：' + esc(note.trinket.alt) + ' — ' : '：') + esc(note.trinket.synergy || "") + '</p>'
        : "";
      bodyHTML = trk + (items ? '<ul class="psc-list">' + items + '</ul>' : "");
    } else {
      var tr = trs[activeTab] || trs[0];
      if(tr){
        var primaryLine = tr.pick ? '<b>优先拿：</b>' + esc(tr.pick)
          : tr.replace ? '<b>转接动作：</b>' + esc(tr.replace)
          : tr.drop ? '<b>决战成型：</b>' + esc(tr.drop) : '';
        var secondLine = tr.hold ? '<b>注意：</b>' + esc(tr.hold)
          : tr.trigger ? '<b>关键点：</b>' + esc(tr.trigger)
          : tr.final ? '<b>站位与防偷：</b>' + esc(tr.final) : '';
        bodyHTML = (primaryLine ? '<p>' + primaryLine + '</p>' : '') +
                   (secondLine ? '<p>' + secondLine + '</p>' : '');
      }
    }

    host.innerHTML =
      '<div class="psc-tabs">' + tabsHTML +
        '<span class="psc-tag-now">T' + state.turn + ' 阶段联动</span>' +
      '</div>' +
      '<div class="psc-body">' + bodyHTML + '</div>';

    if(window.enhanceCardMentions){
      window.enhanceCardMentions(host);
    }
  }

  function cardSlotHTML(x, i, listLen, c, isPip){
    var v = state.slots[i] || 0;
    var t = tierOf(x.id);
    var role = roleForCard(c, x);
    var roleLabel = role === "CORE" ? "核心" : role === "CYCLE" ? "轮转" : "补强";
    return '<div class="ps-slot ' + (v === 2 ? "golden" : v === 1 ? "owned" : "missing") + '" data-i="' + i + '"' +
      (isPip ? '' : ' draggable="true"') + ' title="' + esc(x.name) + ' · 点击标记 缺/有/金">' +
      '<span class="num">' + (i + 1) + '</span>' +
      (t != null ? '<span class="tier stars" title="' + t + ' 本">' + tierStars(t) + '</span>' : '') +
      '<span class="ps-img">' + (CARD_DB[x.id] && CARD_DB[x.id].m ? '<img src="pool/' + esc(x.id) + '.webp" alt="" onerror="this.style.display=\'none\'">' : '<i>' + esc(x.name.slice(0, 1)) + '</i>') + '</span>' +
      '<span class="ps-name">' + esc(x.name) + '</span>' +
      '<div class="ps-foot"><span class="state">' + slotStateWord(v) + '</span><span class="ps-role ' + role.toLowerCase() + '">' + roleLabel + '</span></div>' +
      '<div class="ps-tools">' +
        (isPip ? '' : '<button type="button" data-move="' + i + '" data-dir="-1" title="左移一格"' + (i === 0 ? ' disabled' : '') + '>←</button>') +
        '<button type="button" data-detail="' + esc(x.id) + '" title="查看卡牌效果">?</button>' +
        (isPip ? '' : '<button type="button" data-swap="' + i + '" title="替换随从">⇄</button>') +
        (isPip ? '' : '<button type="button" data-move="' + i + '" data-dir="1" title="右移一格"' + (i === listLen - 1 ? ' disabled' : '') + '>→</button>') +
      '</div>' +
    '</div>';
  }

  function renderSlots(c){
    var cards = currentCards();
    slotsEl.innerHTML = cards.map(function(x, i){
      return cardSlotHTML(x, i, cards.length, c, false);
    }).join("");
  }

  function renderMissing(adv){
    var buckets = getMissingBuckets();
    missCount.textContent = buckets.total;
    if(!buckets.total){
      missList.innerHTML = '<div class="miss">七格齐了，可按敌方阵型调站位。</div>';
      return;
    }

    function itemHTML(o, locked){
      var next = adv.nextId && o.x.id === adv.nextId;
      var cls = "miss" + (next ? " next" : "") + (locked ? " locked" : "");
      return '<div class="' + cls + '" data-card-id="' + esc(o.x.id) + '" data-card="' + esc(o.x.name) + '" role="button" tabindex="0" title="点击查看卡牌效果">' +
        '<span class="m-tier stars">' + (o.t != null ? tierStars(o.t) : '?') + '</span>' +
        '<span class="card-name-btn">' + esc(o.x.name) + '</span>' +
        (next ? '<span class="tag-next">先找</span>' : (locked ? '<span class="tag-lock">需' + o.t + '本</span>' : '')) +
      '</div>';
    }

    var h = "";
    if(buckets.avail.length){
      h += '<div class="miss-group-h avail"><span>🟢 当前 ' + state.tier + ' 本可搜到</span><span>' + buckets.avail.length + ' 张</span></div>';
      h += buckets.avail.map(function(o){ return itemHTML(o, false); }).join("");
    }
    if(buckets.locked.length){
      h += '<div class="miss-group-h"><span>🔒 高本未解锁（升本可见）</span><span>' + buckets.locked.length + ' 张</span></div>';
      h += buckets.locked.map(function(o){ return itemHTML(o, true); }).join("");
    }
    missList.innerHTML = h;
  }

  var CURVE_BENCHMARK = [
    { turn: 1, tier: 1, tip: "T1 (3币)：拿 1 个理财/高战力随从稳开局。" },
    { turn: 2, tier: 2, tip: "T2 (4币)：标准节奏升 2 本酒馆（4 铸币）。" },
    { turn: 3, tier: 2, tip: "T3 (5币)：卖 1 买 2，或拿随从 + 过渡法术。" },
    { turn: 4, tier: 3, tip: "T4 (6币)：标准节奏升 3 本酒馆（6 铸币）。" },
    { turn: 5, tier: 3, tip: "T5 (7币)：买 2 个高战力随从稳血，不急盲升。" },
    { turn: 6, tier: 3, tip: "T6 (8币)：补强场面；血量健康或三连顺位可提前跳 4 本。" },
    { turn: 7, tier: 4, tip: "T7 (9币)：升 4 本酒馆，开始搜中坚发力卡。" },
    { turn: 8, tier: 4, tip: "T8 (10币)：稳住战力，准备往 5 本核心体系过渡。" },
    { turn: 9, tier: 5, tip: "T9 (10币)：升 5 本寻找体系核心发动机（如铜须/达卡莱）。" }
  ];

  function renderCurveHud(){
    var hud = document.getElementById("playCurveHud");
    if(!hud) return;
    var turn = state.turn, tier = state.tier;
    var benchItem = CURVE_BENCHMARK.filter(function(b){ return b.turn === turn; })[0];
    var benchTier = benchItem ? benchItem.tier : (turn >= 9 ? 5 : 1);
    var tip = benchItem ? benchItem.tip : "T" + turn + "+ 终盘：搜齐核心并追金，关注对面先手/下毒/风怒调位置。";

    var diff = tier - benchTier;
    var badgeClass = "on-pace", badgeText = "标准节奏";
    if(diff > 0){
      badgeClass = "ahead"; badgeText = "领先 " + diff + " 本";
    } else if(diff < 0){
      if(state.health <= 15){
        badgeClass = "warn"; badgeText = "先稳血（不急升本）";
      } else {
        badgeClass = "behind"; badgeText = "慢于常规 " + Math.abs(diff) + " 本";
      }
    }

    var steps = CURVE_BENCHMARK.map(function(b){
      var cls = "pch-step" + (b.turn === turn ? " current" : "") + (b.turn < turn ? " done" : "");
      return '<div class="' + cls + '" data-jump-turn="' + b.turn + '" title="点击跳到第 ' + b.turn + ' 回合">' +
        '<span class="pst-turn">T' + b.turn + '</span><span class="pst-tier">' + b.tier + '本</span></div>';
    }).join("");

    hud.innerHTML =
      '<div class="pch-head"><span class="pch-title">📈 升本节奏线（点击可跳转回合）</span><span class="pch-badge ' + badgeClass + '">' + badgeText + '</span></div>' +
      '<p class="pch-tip">' + tip + '</p>' +
      '<div class="pch-timeline">' + steps + '</div>';
  }

  function hintFor(c){
    var tribeName = String(c.name || "").split("·")[0];
    var t = (typeof TRIBES !== "undefined") ? TRIBES.filter(function(x){
      return x.name === tribeName || (tribeName.indexOf(x.name) >= 0);
    })[0] : null;
    if(!t) return "T" + state.turn + "：保持战力，血量安全再开高频 D 牌。";
    var best = "";
    (t.curve || []).forEach(function(seg){
      var m = String(seg.k || "").match(/(\d+)/);
      if(m && +m[1] <= state.turn) best = seg.v;
    });
    return best ? ("第 " + state.turn + " 回合（" + tribeName + "）：" + best) : "";
  }

  function render(){
    ensureSlots();
    var c = current();
    renderCompSelect();
    renderHeroUI();
    renderFilterBar();

    var shareBanner = document.getElementById("shareBanner");
    if(shareBanner) shareBanner.hidden = !ui.viewingShare;

    tierEl.textContent = c.tier;
    metaEl.textContent = "均位 " + c.avg + " · 前四 " + Math.round((c.top4 || 0) * 100) + "% · 吃鸡 " + Math.round((c.win || 0) * 100) + "%" +
      (ui.hero ? " · 英雄：" + ui.hero : "");

    renderPosBar(c);
    renderSlots(c);
    renderStageCard(c);

    var adv = advice();
    var advMainEl = document.getElementById("adviceMain");
    var advSubEl = document.getElementById("adviceSub");
    advMainEl.removeAttribute("data-card-enhanced");
    advSubEl.removeAttribute("data-card-enhanced");
    advMainEl.innerHTML = adv.main;
    advSubEl.innerHTML = adv.sub;
    if(window.enhanceCardMentions){
      window.enhanceCardMentions(document.getElementById("playAdvice"));
    }

    renderMissing(adv);
    hintEl.textContent = hintFor(c);

    document.getElementById("stTurn").textContent = state.turn;
    document.getElementById("stTier").textContent = state.tier;
    document.getElementById("stGold").textContent = state.gold;
    document.getElementById("stHealth").textContent = state.health;

    var autoBtn = document.getElementById("btnAutoGold");
    if(autoBtn) autoBtn.classList.toggle("on", !!state.autoGold);

    var tierUpBtn = document.getElementById("btnTierUp");
    if(tierUpBtn){
      tierUpBtn.disabled = state.tier >= 7;
      tierUpBtn.innerHTML = state.tier >= 7 ? "已满 7 本" : ('升至 ' + (state.tier + 1) + ' 本 <span>↑</span>');
    }

    var undoBtn = document.getElementById("btnUndo");
    if(undoBtn) undoBtn.disabled = undoStack.length === 0;

    renderCurveHud();
    save();
    renderPip();
  }

  /* ---- Slot interaction & Drag-drop reorder ---- */
  var dragFrom = -1;
  slotsEl.addEventListener("dragstart", function(e){
    if(e.target.closest && e.target.closest(".ps-tools")){ e.preventDefault(); return; }
    var s = e.target.closest ? e.target.closest(".ps-slot") : null;
    if(!s) return;
    dragFrom = +s.getAttribute("data-i");
    s.classList.add("dragging");
    if(e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  });
  slotsEl.addEventListener("dragover", function(e){
    var s = e.target.closest ? e.target.closest(".ps-slot") : null;
    if(!s || dragFrom < 0) return;
    e.preventDefault();
    Array.prototype.forEach.call(slotsEl.querySelectorAll(".drag-over"), function(el){ el.classList.remove("drag-over"); });
    s.classList.add("drag-over");
  });
  slotsEl.addEventListener("drop", function(e){
    e.preventDefault();
    var s = e.target.closest ? e.target.closest(".ps-slot") : null;
    var to = s ? +s.getAttribute("data-i") : -1;
    Array.prototype.forEach.call(slotsEl.querySelectorAll(".drag-over,.dragging"), function(el){ el.classList.remove("drag-over","dragging"); });
    if(dragFrom >= 0 && to >= 0 && dragFrom !== to) moveSlot(dragFrom, to);
    dragFrom = -1;
  });
  slotsEl.addEventListener("dragend", function(){
    dragFrom = -1;
    Array.prototype.forEach.call(slotsEl.querySelectorAll(".drag-over,.dragging"), function(el){ el.classList.remove("drag-over","dragging"); });
  });

  slotsEl.addEventListener("click", function(e){
    var det = e.target.closest ? e.target.closest("[data-detail]") : null;
    if(det){
      e.preventDefault(); e.stopPropagation();
      var cid = det.getAttribute("data-detail");
      if(window.openCardModal && cid) window.openCardModal(cid);
      return;
    }
    var sw = e.target.closest ? e.target.closest("[data-swap]") : null;
    if(sw){ e.preventDefault(); e.stopPropagation(); openPicker(+sw.getAttribute("data-swap")); return; }
    var mv = e.target.closest ? e.target.closest("[data-move]") : null;
    if(mv){
      e.preventDefault(); e.stopPropagation();
      var idx = +mv.getAttribute("data-move"), dir = +mv.getAttribute("data-dir");
      moveSlot(idx, idx + dir);
      return;
    }
    var s = e.target.closest ? e.target.closest(".ps-slot") : null;
    if(s) toggle(+s.getAttribute("data-i"), e);
  });

  document.getElementById("playPosBar").addEventListener("click", function(e){
    if(e.target && e.target.id === "btnRestoreAll"){
      pushUndo();
      state.cards = null;
      state.slots = [];
      render();
    }
  });

  document.getElementById("playStageCard").addEventListener("click", function(e){
    var t = e.target.closest ? e.target.closest("[data-stab]") : null;
    if(!t) return;
    var val = t.getAttribute("data-stab");
    ui.stageTab = val === "mistakes" ? "mistakes" : +val;
    renderStageCard(current());
  });

  document.getElementById("playCurveHud").addEventListener("click", function(e){
    var step = e.target.closest ? e.target.closest("[data-jump-turn]") : null;
    if(!step) return;
    var nextTurn = +step.getAttribute("data-jump-turn");
    if(!nextTurn || nextTurn === state.turn) return;
    pushUndo();
    state.turn = nextTurn;
    if(state.autoGold) state.gold = autoGoldForTurn(nextTurn);
    render();
  });

  if(missList){
    missList.addEventListener("click", function(e){
      var m = e.target.closest ? e.target.closest(".miss[data-card-id]") : null;
      if(!m) return;
      var cardId = m.getAttribute("data-card-id") || m.getAttribute("data-card");
      if(window.openCardModal && cardId) window.openCardModal(cardId);
    });
  }

  /* ---- Status, Filters & Hero Controls ---- */
  document.getElementById("playStatus").addEventListener("click", function(e){
    var ag = e.target.closest ? e.target.closest("#btnAutoGold") : null;
    if(ag){
      state.autoGold = !state.autoGold;
      render();
      return;
    }
    var b = e.target.closest ? e.target.closest("button[data-k]") : null;
    if(!b) return;
    pushUndo();
    var k = b.getAttribute("data-k"), d = +b.getAttribute("data-d");
    if(k === "turn"){
      state.turn = Math.min(30, Math.max(1, state.turn + d));
      if(state.autoGold) state.gold = autoGoldForTurn(state.turn);
    }
    if(k === "tier") state.tier = Math.min(7, Math.max(1, state.tier + d));
    if(k === "gold") state.gold = Math.min(99, Math.max(0, state.gold + d));
    if(k === "health") state.health = Math.min(99, Math.max(0, state.health + d));
    render();
  });

  document.getElementById("playFilterBar").addEventListener("click", function(e){
    var bMode = e.target.closest ? e.target.closest("#btnBanMode") : null;
    if(bMode){
      ui.banMode = !ui.banMode;
      renderFilterBar();
      return;
    }
    var clr = e.target.closest ? e.target.closest("#btnClearFilters") : null;
    if(clr){
      ui.filter = "ALL_FILTER";
      ui.bans = {};
      ui.banMode = false;
      render();
      return;
    }
    var chip = e.target.closest ? e.target.closest("[data-f]") : null;
    if(!chip) return;
    var fid = chip.getAttribute("data-f"), race = chip.getAttribute("data-race");
    if(ui.banMode && race){
      ui.bans[race] = !ui.bans[race];
      render();
    } else {
      ui.filter = ui.filter === fid ? "ALL_FILTER" : fid;
      render();
    }
  });

  document.getElementById("playHeroRecs").addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("[data-comp-pick]") : null;
    if(!b) return;
    switchComp(b.getAttribute("data-comp-pick"));
  });

  // Hero Picker Popover
  (function(){
    var wrap = document.getElementById("playHeroWrap");
    var btn = document.getElementById("playHeroBtn");
    var clr = document.getElementById("playHeroClear");
    var pop = document.getElementById("playHeroPop");
    var search = document.getElementById("playHeroSearch");
    var listEl = document.getElementById("playHeroList");
    if(!wrap || !btn || !pop) return;

    function renderHeroOptions(q){
      q = String(q || "").trim().toLowerCase();
      var names = Object.keys(heroListData);
      if(typeof STATS !== "undefined" && STATS.heroes && STATS.heroes.length){
        var orderMap = {};
        STATS.heroes.forEach(function(h, idx){ orderMap[h.name] = idx; });
        names.sort(function(a, b){ return (orderMap[a] == null ? 999 : orderMap[a]) - (orderMap[b] == null ? 999 : orderMap[b]); });
      }
      var shown = names.filter(function(n){ return !q || n.toLowerCase().indexOf(q) >= 0; }).slice(0, 40);
      listEl.innerHTML = shown.length ? shown.map(function(n){
        var hs = heroStatsMap[n];
        var topComp = heroListData[n] && heroListData[n][0];
        return '<button type="button" class="ph-item" data-h="' + esc(n) + '">' +
          '<span>' + (hs ? '<span class="ph-tier">' + esc(hs.tier) + '</span>' : '') + esc(n) + '</span>' +
          '<span class="ph-meta">' + (topComp ? esc(topComp.name) + " · " + esc(topComp.avg) : "") + '</span></button>';
      }).join("") : '<p class="pick-hint">未找到匹配英雄</p>';
    }

    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var open = pop.hidden;
      pop.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if(open){
        search.value = "";
        renderHeroOptions("");
        setTimeout(function(){ search.focus(); }, 20);
      }
    });
    if(clr){
      clr.addEventListener("click", function(){
        ui.hero = "";
        render();
      });
    }
    search.addEventListener("input", function(){ renderHeroOptions(search.value); });
    listEl.addEventListener("click", function(e){
      var it = e.target.closest ? e.target.closest("[data-h]") : null;
      if(!it) return;
      ui.hero = it.getAttribute("data-h");
      pop.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      var topRec = heroListData[ui.hero] && heroListData[ui.hero].filter(function(r){
        var c = comps.filter(function(x){ return x.key === r.key; })[0];
        return c && !isCompBanned(c);
      })[0];
      if(topRec && topRec.key !== key) switchComp(topRec.key);
      else render();
    });
    document.addEventListener("click", function(e){
      if(!pop.hidden && !wrap.contains(e.target)){
        pop.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
    });
  })();

  /* ---- Actions Bar & Share Snapshot Handling ---- */
  document.getElementById("btnNext").addEventListener("click", function(){ advanceTurn(1); });
  document.getElementById("btnTierUp").addEventListener("click", function(){ upgradeTier(1); });
  document.getElementById("btnUndo").addEventListener("click", doUndo);

  document.getElementById("btnReset").addEventListener("click", function(){
    if(!confirm("重置这一局的回合、血量与卡位？")) return;
    pushUndo();
    state = JSON.parse(JSON.stringify(DEFAULTS));
    ui.stageTab = null;
    render();
  });

  var promoteBtn = document.getElementById("btnPromoteShare");
  if(promoteBtn) promoteBtn.addEventListener("click", function(){
    ui.viewingShare = false;
    save();
    var qs = ["comp=" + encodeURIComponent(key)];
    if(ui.hero) qs.push("hero=" + encodeURIComponent(ui.hero));
    history.replaceState(null, "", "?" + qs.join("&"));
    render();
  });

  var exitShareBtn = document.getElementById("btnExitShare");
  if(exitShareBtn) exitShareBtn.addEventListener("click", function(){
    ui.viewingShare = false;
    state = loadBoard(key);
    var qs = ["comp=" + encodeURIComponent(key)];
    if(ui.hero) qs.push("hero=" + encodeURIComponent(ui.hero));
    history.replaceState(null, "", "?" + qs.join("&"));
    render();
  });

  sel.addEventListener("change", function(){ switchComp(sel.value); });

  document.addEventListener("keydown", function(e){
    var overlayEl = document.getElementById("pickOverlay");
    if(overlayEl && !overlayEl.hidden){
      if(e.key === "Escape") closePicker();
      return;
    }
    var gcm = document.getElementById("globalCardModal");
    if(gcm && !gcm.hidden) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if(tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

    if(e.key >= "1" && e.key <= "7"){ toggle(+e.key - 1); }
    else if(e.code === "Space"){ e.preventDefault(); advanceTurn(1); }
    else if(e.key === "ArrowUp"){ e.preventDefault(); upgradeTier(1); }
    else if((e.key && e.key.toLowerCase() === "z") && !e.shiftKey){ e.preventDefault(); doUndo(); }
  });

  /* ---- Interactive Document PiP (Full / Mini Horizontal HUD) ---- */
  var pipWin = null;
  function renderPip(){
    if(!pipWin || pipWin.closed) return;
    var c = current();
    var doc = pipWin.document;
    doc.body.className = "play-body pip-body" + (ui.pipMode === "mini" ? " pip-mini" : "");
    var cards = currentCards();
    var buckets = getMissingBuckets();
    var advPip = advice();
    var detailCard = ui.pipDetailId ? CARD_DB[ui.pipDetailId] : null;
    var detailHTML = detailCard ? (
      '<div class="pip-detail"><div><b>' + esc(detailCard.n) + '</b>（' + (detailCard.t || "?") + '本）' +
      (detailCard.a != null ? ' · ' + detailCard.a + '/' + detailCard.h : '') + '<br>' +
      esc(detailCard.x || "无特效") + '</div><button type="button" data-pip-action="closeDetail">✕</button></div>'
    ) : "";

    var slotsHTML = cards.map(function(x, i){
      return cardSlotHTML(x, i, cards.length, c, true);
    }).join("");

    var extraHTML = "";
    if(ui.pipMode !== "mini"){
      var availHTML = buckets.avail.map(function(o){
        return '<div class="miss' + (advPip.nextId === o.x.id ? ' next' : '') + '" data-detail="' + esc(o.x.id) + '">' +
          '<span class="m-tier stars">' + (o.t != null ? tierStars(o.t) : '?') + '</span><span>' + esc(o.x.name) + '</span>' +
          (advPip.nextId === o.x.id ? '<span class="tag-next">先找</span>' : '') + '</div>';
      }).join("");
      var lockHTML = buckets.locked.map(function(o){
        return '<div class="miss locked" data-detail="' + esc(o.x.id) + '">' +
          '<span class="m-tier stars">' + tierStars(o.t) + '</span><span>' + esc(o.x.name) + '</span>' +
          '<span class="tag-lock">需' + o.t + '本</span></div>';
      }).join("");
      extraHTML = '<div class="pip-extra">' +
        '<h3>还差 ' + buckets.total + ' 张' + (buckets.avail.length ? '（绿色为当前 ' + state.tier + ' 本可出）' : '') + '</h3>' +
        (buckets.total ? (availHTML + lockHTML) : '<div class="miss">七格齐了，留意对面针对站位。</div>') +
      '</div>';
    }

    var root = doc.getElementById("pipRoot");
    if(!root) return;
    root.innerHTML =
      '<div class="pip-bar">' +
        '<span class="pip-stat"><b>T' + state.turn + '</b></span>' +
        '<span class="pip-stat"><b>' + state.tier + '本</b></span>' +
        '<span class="pip-stat">币<b>' + state.gold + '</b></span>' +
        '<span class="pip-stat">血<b>' + state.health + '</b></span>' +
        '<button type="button" class="pip-btn primary" data-pip-action="next">下回合</button>' +
        '<button type="button" class="pip-btn" data-pip-action="tierUp"' + (state.tier >= 7 ? ' disabled' : '') + '>升本</button>' +
        '<button type="button" class="pip-btn" data-pip-action="dmg5">-5血</button>' +
        '<button type="button" class="pip-btn" data-pip-action="undo"' + (!undoStack.length ? ' disabled' : '') + '>撤回</button>' +
        '<button type="button" class="pip-btn right" data-pip-action="mode">' + (ui.pipMode === "mini" ? "展开" : "横条") + '</button>' +
      '</div>' +
      '<div class="advice"><p class="advice-main">' + advPip.main + '</p>' +
        (ui.pipMode === "mini" ? '' : '<p class="advice-sub">' + advPip.sub + '</p>') +
      '</div>' +
      '<div class="play-slots">' + slotsHTML + '</div>' +
      detailHTML +
      extraHTML;
  }

  document.getElementById("btnPip").addEventListener("click", async function(){
    if(!("documentPictureInPicture" in window)){
      alert("当前浏览器不支持置顶小窗，请使用 Chrome / Edge 116+。");
      return;
    }
    if(pipWin && !pipWin.closed){ pipWin.focus(); return; }
    var w = ui.pipMode === "mini" ? 640 : 400;
    var h = ui.pipMode === "mini" ? 210 : 590;
    pipWin = await documentPictureInPicture.requestWindow({ width: w, height: h });

    var base = pipWin.document.createElement("base");
    base.href = location.href;
    pipWin.document.head.appendChild(base);

    Array.prototype.forEach.call(document.querySelectorAll('link[rel="stylesheet"]'), function(l){
      var n = pipWin.document.createElement("link");
      n.rel = "stylesheet"; n.href = l.href;
      pipWin.document.head.appendChild(n);
    });
    var root = pipWin.document.createElement("div");
    root.id = "pipRoot";
    pipWin.document.body.appendChild(root);

    pipWin.document.addEventListener("click", function(e){
      var act = e.target.closest ? e.target.closest("[data-pip-action]") : null;
      if(act){
        var name = act.getAttribute("data-pip-action");
        if(name === "next") advanceTurn(1);
        else if(name === "tierUp") upgradeTier(1);
        else if(name === "dmg5"){ pushUndo(); state.health = Math.max(0, state.health - 5); render(); }
        else if(name === "undo") doUndo();
        else if(name === "closeDetail"){ ui.pipDetailId = null; renderPip(); }
        else if(name === "mode"){
          ui.pipMode = ui.pipMode === "mini" ? "full" : "mini";
          savePrefs();
          try { pipWin.resizeTo(ui.pipMode === "mini" ? 640 : 400, ui.pipMode === "mini" ? 210 : 590); } catch(err){}
          renderPip();
        }
        return;
      }
      var det = e.target.closest ? e.target.closest("[data-detail]") : null;
      if(det){
        ui.pipDetailId = det.getAttribute("data-detail");
        renderPip();
        return;
      }
      var s = e.target.closest ? e.target.closest(".ps-slot") : null;
      if(s) toggle(+s.getAttribute("data-i"), e);
    });
    pipWin.addEventListener("pagehide", function(){ pipWin = null; });
    renderPip();
  });

  /* ---- Smart Card Picker (Race / Tier / Tech Filters + Restore) ---- */
  var overlay = document.getElementById("pickOverlay");
  var pickInput = document.getElementById("pickInput");
  var pickFilters = document.getElementById("pickFilters");
  var pickList = document.getElementById("pickList");
  var pickRestore = document.getElementById("btnPickRestore");
  var pickIndex = -1;
  var pickMode = "rec"; // "rec" | "tier" | "tech" | "all"

  function openPicker(i){
    pickIndex = i;
    pickMode = "rec";
    overlay.hidden = false;
    pickInput.value = "";
    if(pickRestore){
      var defCard = i >= 0 ? ordered(current())[i] : null;
      var curCard = i >= 0 ? currentCards()[i] : null;
      pickRestore.hidden = !(defCard && curCard && defCard.id !== curCard.id);
    }
    renderPickFilters();
    renderPicks("");
    setTimeout(function(){ pickInput.focus(); }, 25);
  }
  function closePicker(){ overlay.hidden = true; pickIndex = -1; }

  function renderPickFilters(){
    if(!pickFilters) return;
    var modes = [
      { id: "rec", label: "推荐替代" },
      { id: "tier", label: "≤" + state.tier + " 本可抓" },
      { id: "tech", label: "常用对策/引擎" },
      { id: "all", label: "全部卡池" }
    ];
    pickFilters.innerHTML = modes.map(function(m){
      return '<button type="button" class="pf-chip' + (pickMode === m.id ? " on" : "") + '" data-pf="' + m.id + '">' + m.label + '</button>';
    }).join("");
  }

  function renderPicks(q){
    q = String(q || "").trim().toLowerCase();
    if(typeof POOL === "undefined"){ pickList.innerHTML = ""; return; }
    var tribeCode = compTribeId(current());
    var list = POOL.filter(function(c){
      if(q){
        var hit = c.n.toLowerCase().indexOf(q) >= 0 || (c.x && c.x.toLowerCase().indexOf(q) >= 0);
        if(!hit) return false;
      }
      if(pickMode === "tech") return TECH_IDS.indexOf(c.i) >= 0;
      if(pickMode === "tier") return c.y === 0 && (c.t == null || c.t <= state.tier);
      if(pickMode === "rec" && !q){
        var isTech = TECH_IDS.indexOf(c.i) >= 0;
        var isActiveRace = ACTIVE_IDS[c.i] && cardMatchesRace(c, tribeCode);
        return isTech || isActiveRace;
      }
      return true;
    });

    list.sort(function(a, b){
      var aAct = ACTIVE_IDS[a.i] ? 0 : 1, bAct = ACTIVE_IDS[b.i] ? 0 : 1;
      if(aAct !== bAct) return aAct - bAct;
      var aAf = (a.t != null && a.t <= state.tier) ? 0 : 1;
      var bAf = (b.t != null && b.t <= state.tier) ? 0 : 1;
      if(aAf !== bAf) return aAf - bAf;
      if(q){
        var an = a.n.toLowerCase().indexOf(q) >= 0 ? 0 : 1;
        var bn = b.n.toLowerCase().indexOf(q) >= 0 ? 0 : 1;
        if(an !== bn) return an - bn;
      }
      return (a.t || 99) - (b.t || 99) || a.n.length - b.n.length;
    });

    var top = list.slice(0, 35);
    pickList.innerHTML = top.length ? top.map(function(c){
      return '<div class="pick-item" data-id="' + esc(c.i) + '">' +
        (c.m ? '<img src="pool/' + esc(c.i) + '.webp" alt="">' : '<span class="pt">?</span>') +
        '<div class="pi-info">' +
          '<div class="pi-name"><span>' + esc(c.n) + '</span><span class="pt">' + (c.t != null ? tierStars(c.t) : "") + '</span></div>' +
          (c.x ? '<div class="pi-desc">' + esc(c.x.replace(/\s+/g, " ")) + '</div>' : '') +
        '</div></div>';
    }).join("") : '<p class="pick-hint">没找到匹配的随从或法术</p>';
  }

  pickInput.addEventListener("input", function(){ renderPicks(pickInput.value); });
  pickInput.addEventListener("keydown", function(e){
    if(e.key === "Enter"){
      var first = pickList.querySelector(".pick-item");
      if(first) first.click();
    }
  });
  if(pickFilters){
    pickFilters.addEventListener("click", function(e){
      var b = e.target.closest ? e.target.closest("[data-pf]") : null;
      if(!b) return;
      pickMode = b.getAttribute("data-pf");
      renderPickFilters();
      renderPicks(pickInput.value);
    });
  }
  if(pickRestore){
    pickRestore.addEventListener("click", function(){
      if(pickIndex < 0) return;
      var defCard = ordered(current())[pickIndex];
      if(!defCard) return;
      pushUndo();
      var list = currentCards().slice();
      list[pickIndex] = defCard;
      state.cards = list;
      render();
      closePicker();
    });
  }
  pickList.addEventListener("click", function(e){
    var it = e.target.closest ? e.target.closest(".pick-item") : null;
    if(!it) return;
    var id = it.getAttribute("data-id");
    var card = CARD_DB[id];
    if(!card) return;
    pushUndo();
    var list = currentCards().slice();
    if(pickIndex >= 0){
      list[pickIndex] = { id: id, name: card.n };
    } else {
      if(list.length >= 7){ alert("最多 7 格，请点格子上的 ⇄ 替换。"); return; }
      list.push({ id: id, name: card.n });
    }
    state.cards = list;
    state.slots = state.slots.slice(0, list.length);
    render(); closePicker();
  });
  overlay.addEventListener("click", function(e){ if(e.target === overlay) closePicker(); });

  var addBtn = document.getElementById("btnAdd");
  if(addBtn) addBtn.addEventListener("click", function(){ openPicker(-1); });

  var shareBtn = document.getElementById("btnShare");
  if(shareBtn) shareBtn.addEventListener("click", function(){
    var q = ["comp=" + encodeURIComponent(key)];
    if(ui.hero) q.push("hero=" + encodeURIComponent(ui.hero));
    q.push("t=" + state.turn, "ti=" + state.tier, "g=" + state.gold, "h=" + state.health);
    q.push("s=" + state.slots.join(""));
    if(state.cards && state.cards.length) q.push("c=" + state.cards.map(function(x){ return x.id; }).join(","));
    var url = location.origin + location.pathname + "?" + q.join("&");
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){
        shareBtn.textContent = "已复制";
        setTimeout(function(){ shareBtn.textContent = "复制链接"; }, 1500);
      });
    } else {
      prompt("复制链接", url);
    }
  });

  render();
})();
