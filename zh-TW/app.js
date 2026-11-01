/* 渲染與互動 */
(function(){
  function tierName(t){ return t === "T0" ? "T0：最強一檔" : t === "T1" ? "T1：強勢" : t === "T2" ? "T2：可用，需要條件" : "T3：弱勢或冷門"; }
  function tierStars(n){ n = Number(n); if(!n || n < 1) return ""; return '<i class="star"></i>'.repeat(Math.min(7, n)); }

  "use strict";

  function hexA(hex, a){
    var h = hex.replace("#","");
    if(h.length === 3){ h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; }
    var r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return "rgba("+r+","+g+","+b+","+a+")";
  }

  function fmt(n){
    if(!isFinite(n)) return "∞";
    if(n < 1000) return String(Math.round(n));
    if(n < 10000) return Math.round(n).toLocaleString("en-US");
    if(n < 1e8) return (n/1e4).toFixed(n < 1e5 ? 1 : 0) + "萬";
    if(n < 1e12) return (n/1e8).toFixed(n < 1e9 ? 2 : 1) + "億";
    return n.toExponential(2).replace("e+","×10^");
  }

  /* ---------- tier strip ---------- */
  var strip = document.getElementById("tierStrip");
  if(strip){
    var html = "";
    TIERS.forEach(function(t){
      var count = TRIBES.filter(function(x){ return x.tier === t.id; }).length;
      html += '<span class="tier-pill"><i style="background:'+t.color+'"></i>'+t.label+
              '<span style="color:#4d5461">· '+count+'</span></span>';
    });
    strip.innerHTML = html;
  }

  /* ---------- tabs ---------- */
  var tabWrap = document.getElementById("tribeTabs");
  var panelWrap = document.getElementById("tribePanels");

  function cardOf(name){
    return (typeof CARDS !== "undefined" && CARDS[name]) ? CARDS[name] : null;
  }

  function isNoArt(name){
    return typeof NO_ART !== "undefined" && NO_ART.indexOf(name) >= 0;
  }

  function thumbHTML(name){
    var c = cardOf(name);
    if(c && c.img){
      return '<span class="ci-thumb"><img src="'+c.img+'" alt="'+name+'"></span>';
    }
    var tip = isNoArt(name) ? '卡圖暫未收錄（37.0 新卡）' : '暫無卡圖';
    return '<span class="ci-thumb noimg" title="'+tip+'"><i>'+name.slice(0,1)+'</i></span>';
  }


  function tierByName(nm){
    var c = (typeof cardOf === "function") ? cardOf(nm) : null;
    if(c && c.t != null) return c.t;
    if(typeof POOL !== "undefined"){
      for(var i=0;i<POOL.length;i++){ if(POOL[i].n === nm && POOL[i].t != null) return POOL[i].t; }
    }
    if(typeof EXTRA_CARDS !== "undefined"){
      var keys = Object.keys(EXTRA_CARDS);
      for(var k=0;k<keys.length;k++){ if(EXTRA_CARDS[keys[k]].n === nm) return EXTRA_CARDS[keys[k]].t; }
    }
    return null;
  }

  function planSlot(nm){
    var c = cardOf(nm);
    if(c && c.img){
      var st = (typeof tierStars === "function") ? tierStars(tierByName(nm)) : "";
      return '<button type="button" class="fc" data-card="'+nm+'">' +
        (st ? '<span class="fc-tier"><span class="stars">'+st+'</span></span>' : '') +
        '<span class="fc-img"><img src="'+c.img+'" alt="'+nm+'"></span><span class="fc-name">'+nm+'</span></button>';
    }
    if(isNoArt(nm)){
      return '<span class="fc" title="卡圖暫未收錄"><span class="fc-img noimg"><i>'+nm.slice(0,1)+'</i></span><span class="fc-name">'+nm+'</span></span>';
    }
    return '<span class="fc generic"><span class="fc-img"><i>+</i></span><span class="fc-name">'+nm+'</span></span>';
  }

  function planBlock(t){
    var plans = (typeof PLANS !== "undefined" && PLANS[t.id]) ? PLANS[t.id] : null;
    if(!plans){
      var fin = (typeof FINALS !== "undefined" && FINALS[t.id]) || [];
      plans = [{ k: "標準", when: "按這個順序擺。", slots: fin }];
    }
    var h = '<div class="plans" data-plans="'+t.id+'">';
    h += '<div class="plan-tabs"><span class="plan-label">終盤方案</span>';
    plans.forEach(function(p, i){
      h += '<button type="button" class="plan-tab'+(i===0?" on":"")+'" data-plan="'+i+'">'+p.k+'</button>';
    });
    h += '</div>';
    h += '<div class="plan-when">'+plans[0].when+'</div>';
    h += '<div class="plan-line fl-cards">'+plans[0].slots.map(planSlot).join("")+'</div>';
    h += '</div>';
    return h;
  }


  var CARD_DB = {};
  if(typeof POOL !== "undefined"){ POOL.forEach(function(c){ CARD_DB[c.i] = c; }); }
  if(typeof EXTRA_CARDS !== "undefined"){ Object.keys(EXTRA_CARDS).forEach(function(k){ CARD_DB[k] = EXTRA_CARDS[k]; }); }

  function cardTier(id){ var c = CARD_DB[id]; return c && c.t != null ? c.t : null; }

  var TRIBE_RACE = { aberration:"ABERRATION", elemental:"ELEMENTAL", demon:"DEMON", naga:"NAGA",
    pirate:"PIRATE", beast:"BEAST", dragon:"DRAGON", mech:"MECHANICAL", murloc:"MURLOC",
    undead:"UNDEAD", quilboar:"QUILBOAR" };

  function tribeAllCards(t){
    var race = TRIBE_RACE[t.id];
    if(!race || typeof POOL === "undefined") return "";
    var list = POOL.filter(function(c){ return (c.r || "").split("/").indexOf(race) >= 0; });
    if(!list.length) return "";
    var h = '<details class="tribe-all"><summary>該種族全部卡牌 <b>' + list.length + '</b> 張 <span>含歷史卡 · 點開檢視</span></summary>';
    h += '<div class="tribe-grid">';
    list.forEach(function(c){
      h += '<a class="tc" href="cards.html?card=' + c.i + '" title="' + c.n + '">' +
        '<span class="tc-img">' + (c.m ? '<img loading="lazy" src="../pool/' + c.i + '.webp" alt="">' : '<i>?</i>') + '</span>' +
        '<span class="tc-name">' + c.n + '</span>' +
        '<span class="tc-meta stars">' + tierStars(c.t) + '</span></a>';
    });
    h += '</div>';
    h += '<a class="tribe-more" href="cards.html?race=' + race + '">在卡池頁篩選「' + t.name + '」→</a>';
    h += '</details>';
    return h;
  }

  function bestCompFor(t){
    if(typeof STATS === "undefined" || !STATS.comps) return null;
    var list = STATS.comps.filter(function(c){ return String(c.name).indexOf(t.name + "·") === 0; });
    if(!list.length) return null;
    list.sort(function(a, b){ return a.avg - b.avg; });
    return list[0];
  }

  function bestCompHTML(t){
    var c = bestCompFor(t);
    if(!c) return "";
    var list = (c.cards || []).slice();
    var note = (typeof COMP_NOTES !== "undefined" && COMP_NOTES[c.key]) ? COMP_NOTES[c.key] : null;
    if(note && note.order){
      var idx = {};
      note.order.forEach(function(n, k){ idx[n] = k; });
      list.sort(function(a, b){
        return (idx[a.name] == null ? 99 : idx[a.name]) - (idx[b.name] == null ? 99 : idx[b.name]);
      });
    }
    var cards = list.map(function(x, i){
      var tier = (typeof CARD_DB !== "undefined" && CARD_DB[x.id]) ? CARD_DB[x.id].t : null;
      var stars = (typeof tierStars === "function") ? tierStars(tier) : "";
      return '<a class="tb-card" href="cards.html?card=' + x.id + '" data-card-id="' + x.id + '" title="' + x.name + '">' +
        '<span class="tb-no">' + (i + 1) + '</span>' +
        '<span class="tb-img"><img loading="lazy" src="../pool/' + x.id + '.webp" alt=""></span>' +
        '<span class="tb-name">' + x.name + '</span>' +
        '<em class="stars">' + stars + '</em></a>';
    }).join("");
    return '<div class="tribe-best"><div class="tb-head"><span class="tb-label">本週最佳</span><b>' + c.name + '</b>' +
      '<span class="cc-tier ' + String(c.tier).toLowerCase() + '" title="' + tierName(c.tier) + '">' + c.tier + '</span>' +
      '<span class="tb-meta">均位 ' + Number(c.avg).toFixed(2) + ' · 前四 ' + Math.round((c.top4 || 0) * 100) +
      '% · 吃雞 ' + Math.round((c.win || 0) * 100) + '%</span>' +
      '<a class="tb-play" href="play.html?comp=' + c.key + '">對局模式</a></div>' +
      '<div class="tb-cards">' + cards + '</div></div>';
  }

  function panelHTML(t, idx){
    var c = t.color;
    var soft = hexA(c, .17);
    var tierClass = t.tier.toLowerCase();
    var h = "";
    h += '<article class="panel'+(idx===0?" active":"")+'" id="p-'+t.id+'" role="tabpanel" aria-labelledby="tab-'+t.id+'">';
    h +=   '<div class="tp" style="--tc:'+c+';--tc-soft:'+soft+'">';
    h +=     '<header class="tp-head">';
    h +=       '<div class="tp-glyph">'+t.glyph+'</div>';
    h +=       '<div class="tp-title"><h3>'+t.name+'<span class="en">'+t.en+'</span></h3><p>'+t.tagline+'</p></div>';
    h +=       '<div class="tp-tier '+tierClass+'">'+t.tier+'</div>';
    h +=     '</header>';
    h +=     bestCompHTML(t);
    h +=     '<div class="tp-body">';
    h +=       '<div class="core-wrap"><h4>核心元件<span class="h4-hint">懸停 / 點選卡圖，檢視完整卡牌效果</span></h4><ul class="core-list">';
    t.cores.forEach(function(x){
      var c = cardOf(x.n);
      var sub = "";
      if(c){
        var bits = [];
        if(c.n && c.n !== x.n) bits.push(c.n);
        if(c.k === "spell") bits.push("酒館法術");
        else if(tierByName(x.n) != null) bits.push((typeof tierStars === "function" ? tierStars(tierByName(x.n)) : ""));
        sub = bits.join(" · ");
      }
      h += '<li class="core-item" data-card="'+x.n+'">' +
             thumbHTML(x.n) +
             '<span class="ci-main">' +
               '<span class="ci-head"><b>'+x.n+'</b><span class="cr">'+x.r+'</span></span>' +
               (sub ? '<span class="ci-sub">'+sub+'</span>' : '') +
               '<span class="cd">'+x.d+'</span>' +
             '</span>' +
           '</li>';
    });
    h +=       '</ul></div>';
    h +=       '<div class="pos-wrap"><h4>標準站位</h4><div class="posbar">';
    t.position.forEach(function(p,i){
      h += '<div class="pb '+p.k+'"><span class="n">'+(i+1)+'</span><span class="r">'+p.r+'</span><span class="m">'+p.m+'</span></div>';
    });
    h +=       '</div><p class="pos-hint">'+t.posHint+'</p>';
    h +=       planBlock(t) + '</div>';
    h +=     '</div>';
    h +=     '<div class="tp-grid">';
    h +=       '<div class="tp-cell"><h4>運營節奏</h4><div class="curve">';
    t.curve.forEach(function(cv){
      h += '<div><span>'+cv.k+'</span><b>'+cv.v+'</b></div>';
    });
    h +=       '</div></div>';
    h +=       '<div class="tp-cell"><h4>為什麼強</h4><ul>';
    t.why.forEach(function(w){ h += '<li>'+w+'</li>'; });
    h +=       '</ul></div>';
    h +=       '<div class="tp-cell"><h4>天敵與弱點</h4><ul>';
    t.weak.forEach(function(w){ h += '<li>'+w+'</li>'; });
    h +=       '</ul></div>';
    h +=       '<div class="tp-cell"><h4>常見錯誤</h4><ul>';
    t.mistakes.forEach(function(w){ h += '<li>'+w+'</li>'; });
    h +=       '</ul></div>';
    h +=     '</div>';
    h +=     tribeAllCards(t);
    h +=   '</div>';
    h += '</article>';
    return h;
  }

  if(tabWrap && panelWrap){
    var tabsHtml = "", panelsHtml = "";
    TRIBES.forEach(function(t, i){
      tabsHtml += '<button class="tab'+(i===0?" active":"")+'" id="tab-'+t.id+'" role="tab" aria-selected="'+(i===0)+'" aria-controls="p-'+t.id+'" style="--tc:'+t.color+'">'+
                  '<span class="tg">'+t.glyph+'</span>'+t.name+'</button>';
      panelsHtml += panelHTML(t, i);
    });
    tabWrap.innerHTML = tabsHtml;
    panelWrap.innerHTML = panelsHtml;

    tabWrap.addEventListener("click", function(e){
      var btn = e.target.closest(".tab");
      if(!btn) return;
      var id = btn.id.replace("tab-","");
      Array.prototype.forEach.call(tabWrap.querySelectorAll(".tab"), function(b){
        var on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", String(on));
      });
      Array.prototype.forEach.call(panelWrap.querySelectorAll(".panel"), function(p){
        p.classList.toggle("active", p.id === "p-"+id);
      });
    });
  }

  /* ---------- lineup plan tabs ---------- */
  (function(){
    var wrap = document.getElementById("tribePanels");
    if(!wrap) return;
    wrap.addEventListener("click", function(e){
      var tab = e.target.closest ? e.target.closest(".plan-tab") : null;
      if(!tab) return;
      var box = tab.closest(".plans");
      var id = box.getAttribute("data-plans");
      var plans = (typeof PLANS !== "undefined") ? PLANS[id] : null;
      if(!plans) return;
      var i = +tab.getAttribute("data-plan");
      Array.prototype.forEach.call(box.querySelectorAll(".plan-tab"), function(b){ b.classList.toggle("on", b === tab); });
      box.querySelector(".plan-when").textContent = plans[i].when;
      box.querySelector(".plan-line").innerHTML = plans[i].slots.map(planSlot).join("");
    });
  })();

  /* ---------- deep link: ?tribe=xxx ---------- */
  (function(){
    try{
      var tr = new URLSearchParams(location.search).get("tribe");
      if(!tr) return;
      var tab = document.getElementById("tab-" + tr);
      if(!tab) return;
      tab.click();
      setTimeout(function(){
        var sec = document.getElementById("tribes");
        if(sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }catch(e){}
  })();

  /* ---------- summary table ---------- */
  var sBody = document.querySelector("#summaryTable tbody");
  if(sBody){
    var rows = "";
    TRIBES.forEach(function(t){
      rows += '<tr>'+
        '<td>'+t.name+'</td>'+
        '<td>'+t.tagline+'</td>'+
        '<td>'+t.summary.core+'</td>'+
        '<td>'+t.summary.turn+'</td>'+
        '<td>'+t.summary.ceiling+'</td>'+
        '<td>'+t.summary.diff+'</td>'+
      '</tr>';
    });
    sBody.innerHTML = rows;
  }

  /* ---------- glossary ---------- */
  var g = document.getElementById("glossaryList");
  if(g && typeof GLOSSARY !== "undefined"){
    var gh = "";
    GLOSSARY.forEach(function(item){
      gh += '<div><dt>'+item[0]+'</dt><dd>'+item[1]+'</dd></div>';
    });
    g.innerHTML = gh;
  }

  /* ---------- position board tooltip ---------- */
  var board = document.getElementById("posBoard");
  var note = document.getElementById("posNote");
  if(board && note){
    var def = note.textContent;
    Array.prototype.forEach.call(board.querySelectorAll(".pos-slot"), function(s){
      s.addEventListener("mouseenter", function(){ note.textContent = s.getAttribute("data-tip"); });
      s.addEventListener("mouseleave", function(){ note.textContent = def; });
      s.addEventListener("focus", function(){ note.textContent = s.getAttribute("data-tip"); });
    });
  }

  /* ---------- scroll spy ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll("#nav a"));
  var secs = links.map(function(a){ return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if("IntersectionObserver" in window && secs.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          links.forEach(function(a){
            a.classList.toggle("active", a.getAttribute("href") === "#"+en.target.id);
          });
        }
      });
    }, { rootMargin:"-40% 0px -55% 0px", threshold:0 });
    secs.forEach(function(s){ io.observe(s); });
  }

  /* ---------- back to top ---------- */
  var toTop = document.getElementById("toTop");
  if(toTop){
    window.addEventListener("scroll", function(){
      toTop.classList.toggle("show", window.scrollY > 800);
    }, { passive: true });
    toTop.addEventListener("click", function(){
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- card popover ---------- */
  var pop = document.getElementById("cardPop");
  if(pop && typeof CARDS !== "undefined"){
    var popImg = pop.querySelector(".cp-img img");
    var popName = pop.querySelector(".cp-name");
    var popMeta = pop.querySelector(".cp-meta");
    var popText = pop.querySelector(".cp-text");

    function fillCard(name){
      var c = CARDS[name];
      if(!c) return false;
      if(c.img){
        popImg.src = c.img;
        popImg.style.display = "";
      } else {
        popImg.removeAttribute("src");
        popImg.style.display = "none";
      }
      var alias = (c.n && c.n !== name) ? '<span>'+c.n+'</span>' : '';
      popName.innerHTML = '<b>'+name+'</b>'+alias;
      var meta = [];
      if(c.k === "spell") meta.push("酒館法術");
      else {
        if(c.t != null) meta.push(tierStars(c.t));
        if(c.a != null) meta.push(c.a + " / " + c.h);
      }
      if(c.r) meta.push(c.r);
      popMeta.innerHTML = meta.join(" · ");
      popText.textContent = c.x || "暫未收錄卡牌描述";
      return true;
    }

    var POOL_BY_ID = {};
    if(typeof POOL !== "undefined"){ POOL.forEach(function(x){ POOL_BY_ID[x.i] = x; }); }
    if(typeof EXTRA_CARDS !== "undefined"){ Object.keys(EXTRA_CARDS).forEach(function(k){ POOL_BY_ID[k] = EXTRA_CARDS[k]; }); }
    var RACE_CN = { BEAST:"野獸", DEMON:"惡魔", DRAGON:"龍", ELEMENTAL:"元素", MECHANICAL:"機械",
      MURLOC:"魚人", NAGA:"納迦", PIRATE:"海盜", QUILBOAR:"野豬人", UNDEAD:"亡靈", ABERRATION:"畸變怪" };

    function fillById(id){
      var c = POOL_BY_ID[id];
      if(!c) return false;
      if(c.m){
        popImg.src = "../pool/" + (c.i || id) + ".webp";
        popImg.style.display = "";
      } else {
        popImg.removeAttribute("src");
        popImg.style.display = "none";
      }
      popName.innerHTML = "<b>" + c.n + "</b>";
      var meta = [];
      if(c.t != null) meta.push(tierStars(c.t));
      if(c.a != null) meta.push(c.a + " / " + c.h);
      var races = String(c.r || "").split("/").map(function(r){ return RACE_CN[r] || r; }).filter(Boolean);
      if(races.length) meta.push(races.join(" / "));
      popMeta.innerHTML = meta.join(" · ");
      popText.textContent = c.x || "暫無卡牌描述";
      return true;
    }

    document.addEventListener("mouseover", function(e){
      var el = e.target.closest ? e.target.closest("[data-card-id]") : null;
      if(!el) return;
      if(!fillById(el.getAttribute("data-card-id"))) return;
      pop.hidden = false;
      placePop(e.clientX, e.clientY);
    });

    document.addEventListener("mouseout", function(e){
      var el = e.target.closest ? e.target.closest("[data-card-id]") : null;
      if(el && !el.contains(e.relatedTarget)) pop.hidden = true;
    });

    function placePop(x, y){
      var w = pop.offsetWidth, h = pop.offsetHeight;
      var left = x + 18, top = y + 18;
      if(left + w > window.innerWidth - 12) left = x - w - 18;
      if(top + h > window.innerHeight - 12) top = window.innerHeight - h - 12;
      pop.style.left = Math.max(12, left) + "px";
      pop.style.top = Math.max(12, top) + "px";
    }

    document.addEventListener("mouseover", function(e){
      var el = e.target.closest ? e.target.closest("[data-card]") : null;
      if(!el) return;
      if(!fillCard(el.getAttribute("data-card"))) return;
      pop.hidden = false;
      placePop(e.clientX, e.clientY);
    });

    document.addEventListener("mousemove", function(e){
      if(!pop.hidden) placePop(e.clientX, e.clientY);
    });

    document.addEventListener("mouseout", function(e){
      var el = e.target.closest ? e.target.closest("[data-card]") : null;
      if(el && !el.contains(e.relatedTarget)) pop.hidden = true;
    });

    document.addEventListener("click", function(e){
      var el = e.target.closest ? e.target.closest("[data-card]") : null;
      if(!el){ pop.hidden = true; return; }
      var r = el.getBoundingClientRect();
      if(fillCard(el.getAttribute("data-card"))){
        pop.hidden = false;
        placePop(r.left + r.width / 2, r.bottom - 10);
      }
    });

    window.addEventListener("scroll", function(){ pop.hidden = true; }, { passive: true });
  }

  /* ---------- simulator ---------- */
  var $ = function(id){ return document.getElementById(id); };
  var base=$("base"), add=$("add"), mult=$("mult"), turns=$("turns");
  var canvas = $("chart");
  if(base && canvas){
    var ctx = canvas.getContext("2d");
    var W = 760, H = 340, scaleMode = "linear";
    var toggle = document.getElementById("scaleToggle");

    function fitCanvas(){
      var rect = canvas.getBoundingClientRect();
      W = Math.max(360, Math.round(rect.width || 760));
      H = 340;
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = "100%";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    function niceMax(v){
      if(v <= 10) return 10;
      var p = Math.pow(10, Math.floor(Math.log10(v)));
      var n = v / p;
      var m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
      return m * p;
    }

    function draw(){
      var b = +base.value, a = +add.value, m = +mult.value, N = +turns.value;
      $("o-base").textContent = b;
      $("o-add").textContent = a;
      $("o-mult").textContent = m;
      $("o-turns").textContent = N;

      var lin = b + a * N;
      var com = b * Math.pow(2, m * N);
      $("r-linear").textContent = fmt(lin);
      $("r-compound").textContent = fmt(com);
      var ratio = com / Math.max(lin, 0.0001);
      $("r-ratio").textContent = (ratio < 10 ? ratio.toFixed(1) : fmt(ratio)) + "×";

      var maxV = Math.max(lin, com, 10);
      var L = 76, R = 26, T = 24, B = 40;
      var pw = W - L - R, ph = H - T - B;
      var top, ticks = [], i, e;

      if(scaleMode === "log"){
        top = Math.max(1, Math.ceil(Math.log10(maxV * 1.6)));
        for(e = 0; e <= top; e++) ticks.push(Math.pow(10, e));
      } else {
        top = niceMax(maxV * 1.08);
        for(i = 0; i <= 5; i++) ticks.push(top * i / 5);
      }

      ctx.clearRect(0,0,W,H);

      function py(v){
        if(scaleMode === "log"){
          var lv = Math.log10(Math.max(v, 1));
          return T + ph - (lv / top) * ph;
        }
        return T + ph - (v / top) * ph;
      }

      // grid + y labels
      ctx.font = "11px ui-monospace, Menlo, Consolas, monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ticks.forEach(function(tv){
        var y = py(tv);
        ctx.strokeStyle = tv === 0 ? "rgba(255,215,160,.28)" : "rgba(255,215,160,.10)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W-R, y); ctx.stroke();
        ctx.fillStyle = "#8d7357";
        ctx.fillText(fmt(tv), L - 10, y);
      });

      // x labels
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#8d7357";
      for(var k = 0; k <= 4; k++){
        var t = Math.round(N * k / 4);
        var x = L + (t / N) * pw;
        ctx.fillText("R" + t, x, H - B + 12);
      }

      function px(t){ return L + (t / N) * pw; }

      // compound fill
      var grad = ctx.createLinearGradient(0, T, 0, T+ph);
      grad.addColorStop(0, "rgba(240,201,121,.22)");
      grad.addColorStop(1, "rgba(240,201,121,0)");
      ctx.beginPath();
      ctx.moveTo(px(0), py(b));
      for(var i2 = 1; i2 <= N; i2++){ ctx.lineTo(px(i2), py(b * Math.pow(2, m*i2))); }
      ctx.lineTo(px(N), T+ph); ctx.lineTo(px(0), T+ph); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();

      // linear
      ctx.beginPath();
      ctx.moveTo(px(0), py(b));
      for(var j = 1; j <= N; j++){ ctx.lineTo(px(j), py(b + a*j)); }
      ctx.strokeStyle = "#8d6f4f"; ctx.lineWidth = 2; ctx.stroke();

      // compound
      ctx.beginPath();
      ctx.moveTo(px(0), py(b));
      for(var q = 1; q <= N; q++){ ctx.lineTo(px(q), py(b * Math.pow(2, m*q))); }
      ctx.strokeStyle = "#f0c979"; ctx.lineWidth = 2.6;
      ctx.shadowColor = "rgba(240,201,121,.55)"; ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // endpoint dot + value
      var ex = px(N), ey = py(com);
      ctx.beginPath();
      ctx.arc(ex, ey, 4.5, 0, Math.PI*2);
      ctx.fillStyle = "#ffe6b0"; ctx.fill();
      if(N > 0){
        ctx.font = "600 12px ui-monospace, Menlo, Consolas, monospace";
        ctx.fillStyle = "#f2dfae";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(fmt(com), Math.min(ex - 8, W - 4), Math.max(ey - 8, 14));
      }
    }

    fitCanvas(); draw();
    [base, add, mult, turns].forEach(function(el){
      el.addEventListener("input", draw);
    });
    if(toggle){
      toggle.addEventListener("click", function(ev){
        var btn = ev.target.closest("button");
        if(!btn) return;
        scaleMode = btn.getAttribute("data-scale");
        Array.prototype.forEach.call(toggle.querySelectorAll("button"), function(x){
          x.classList.toggle("on", x === btn);
        });
        draw();
      });
    }
    var rt;
    window.addEventListener("resize", function(){
      clearTimeout(rt);
      rt = setTimeout(function(){ fitCanvas(); draw(); }, 120);
    });
  }

  /* ---------- lesson demos (01 / 02) ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onceVisible(el, cb){
    if(!el) return;
    if(reduceMotion || !("IntersectionObserver" in window)){ cb(); return; }
    var done = false;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting && !done){ done = true; io.disconnect(); cb(); }
      });
    }, { threshold: 0.3 });
    io.observe(el);
  }

  /* 定律一：加法 vs 乘法 */
  (function(){
    var root = document.querySelector('[data-demo="race"]');
    if(!root) return;
    var addEl = root.querySelector("[data-race-add]");
    var mulEl = root.querySelector("[data-race-mul]");
    var roundEl = root.querySelector("[data-race-round]");
    var barAdd = root.querySelector("[data-bar-add]");
    var barMul = root.querySelector("[data-bar-mul]");
    var note = root.querySelector("[data-race-note]");
    var btn = root.querySelector("[data-race-play]");
    var a = 4, m = 4, r = 0, timer = null, token = 0;
    var MAX = 10, LOGMAX = Math.log10(8192);

    function barW(v){ return Math.max(2, Math.min(100, Math.log10(Math.max(v, 1)) / LOGMAX * 100)); }
    function render(){
      addEl.textContent = a;
      mulEl.textContent = m.toLocaleString("en-US");
      roundEl.textContent = r;
      barAdd.style.width = barW(a) + "%";
      barMul.style.width = barW(m) + "%";
    }
    function reset(){
      clearTimeout(timer); token++; a = 4; m = 4; r = 0;
      note.textContent = "同樣的 4/4 起手，第 5 回合只差 4 倍，第 10 回合差 64 倍。";
      btn.textContent = "▶ 播放 10 回合";
      render();
    }
    function step(my){
      if(my !== token) return;
      if(r >= MAX){
        note.innerHTML = "10 回合後：<b>64</b> vs <b>4,096</b>，相差 64 倍。";
        btn.textContent = "↻ 再播一次";
        return;
      }
      r++; a += 6; m *= 2; render();
      timer = setTimeout(function(){ step(my); }, 420);
    }
    function play(){
      reset();
      var my = token;
      btn.disabled = true;
      timer = setTimeout(function(){ btn.disabled = false; step(my); }, 180);
    }
    btn.addEventListener("click", play);
    reset();
    onceVisible(root, play);
  })();

  /* 定律二：鑄幣 = 觸發次數 */
  (function(){
    var root = document.querySelector('[data-demo="trigger"]');
    if(!root) return;
    var dotsA = root.querySelector("[data-dots-a]");
    var dotsB = root.querySelector("[data-dots-b]");
    var valA = root.querySelector("[data-val-a]");
    var valB = root.querySelector("[data-val-b]");
    var note = root.querySelector("[data-tg-note]");
    var btn = root.querySelector("[data-tg-play]");
    var timers = [];

    function build(host, n){
      host.innerHTML = "";
      for(var i = 0; i < n; i++){
        var d = document.createElement("span");
        d.className = "tg-dot";
        host.appendChild(d);
      }
    }
    build(dotsA, 10); build(dotsB, 30);

    function reset(){
      timers.forEach(clearTimeout); timers = [];
      Array.prototype.forEach.call(root.querySelectorAll(".tg-dot"), function(d){ d.classList.remove("on"); });
      valA.textContent = "4/4"; valB.textContent = "4/4";
      note.textContent = "同樣一次 +3/+3：10 次是 +30，30 次是 +90。";
      btn.disabled = false;
    }
    function play(){
      reset();
      btn.disabled = true;
      var da = dotsA.children, db = dotsB.children;
      for(var i = 0; i < 10; i++){
        (function(i){
          timers.push(setTimeout(function(){
            da[i].classList.add("on");
            valA.textContent = (4 + (i + 1) * 3) + "/" + (4 + (i + 1) * 3);
          }, 120 + i * 110));
        })(i);
      }
      for(var j = 0; j < 30; j++){
        (function(j){
          timers.push(setTimeout(function(){
            db[j].classList.add("on");
            valB.textContent = (4 + (j + 1) * 3) + "/" + (4 + (j + 1) * 3);
            if(j === 29){
              btn.disabled = false;
              note.innerHTML = "10 次：<b>34/34</b>；30 次：<b>94/94</b>。如果每次是 ×2，10 次是 1024，30 次是 10.7 億。";
            }
          }, 160 + j * 42));
        })(j);
      }
    }
    btn.addEventListener("click", play);
    reset();
    onceVisible(root, function(){ if(!reduceMotion) play(); });
  })();

  /* 定律三：站位 */
  (function(){
    var root = document.querySelector('[data-demo="board"]');
    if(!root) return;
    var bad = root.querySelector('[data-board="bad"]');
    var good = root.querySelector('[data-board="good"]');
    var note = root.querySelector("[data-bd-note]");
    var btn = root.querySelector("[data-bd-play]");
    var timers = [];

    function reset(){
      timers.forEach(clearTimeout); timers = [];
      Array.prototype.forEach.call(root.querySelectorAll(".bslot"), function(s){
        s.classList.remove("hit", "dead");
      });
      note.textContent = "對手從左邊開始，連續打三次。";
      btn.disabled = false;
    }
    function play(){
      reset();
      btn.disabled = true;
      for(var i = 0; i < 3; i++){
        (function(i){
          timers.push(setTimeout(function(){
            var b = bad.children[i], g = good.children[i];
            b.classList.add("hit"); g.classList.add("hit");
            timers.push(setTimeout(function(){
              b.classList.add("dead"); g.classList.add("dead");
            }, 380));
          }, 220 + i * 900));
        })(i);
      }
      timers.push(setTimeout(function(){
        note.innerHTML = "壞站位：<b>大哥、銅須、巴琳達</b>全沒了；好站位：只死了三個小怪，<b>大哥和銅須還活著</b>。";
        btn.disabled = false;
      }, 220 + 3 * 900));
    }
    btn.addEventListener("click", play);
    reset();
    onceVisible(root, function(){ if(!reduceMotion) play(); });
  })();

  /* 02：翻倍積木 */
  (function(){
    var track = document.querySelector("[data-ds-track]");
    if(!track) return;
    var values = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
    var html = "";
    values.forEach(function(v, i){
      html += '<div class="ds-tile' + (i === values.length - 1 ? " hot" : "") + '"><b>' +
              v.toLocaleString("en-US") + '</b><span>第 ' + i + ' 次</span></div>';
    });
    track.innerHTML = html;
    var tiles = track.children;
    onceVisible(track, function(){
      if(reduceMotion){
        Array.prototype.forEach.call(tiles, function(t){ t.classList.add("on"); });
        return;
      }
      Array.prototype.forEach.call(tiles, function(t, i){
        setTimeout(function(){ t.classList.add("on"); }, 120 + i * 110);
      });
    });
  })();

  /* 02：乘數鏈逐段點亮 */
  (function(){
    var flow = document.querySelector(".chain-flow");
    if(!flow) return;
    onceVisible(flow, function(){ flow.classList.add("reveal"); });
  })();

  /* 02：模擬器預設 */
  (function(){
    var presets = {
      plain:  { base: 4, add: 6,  mult: 0, turns: 10 },
      brann:  { base: 4, add: 6,  mult: 1, turns: 10 },
      double: { base: 4, add: 6,  mult: 2, turns: 8 }
    };
    var buttons = document.querySelectorAll("[data-preset]");
    if(!buttons.length) return;
    Array.prototype.forEach.call(buttons, function(btn){
      btn.addEventListener("click", function(){
        var cfg = presets[btn.getAttribute("data-preset")];
        if(!cfg) return;
        var b = document.getElementById("base"), a = document.getElementById("add");
        var m = document.getElementById("mult"), t = document.getElementById("turns");
        if(!b || !a || !m || !t) return;
        b.value = cfg.base; a.value = cfg.add; m.value = cfg.mult; t.value = cfg.turns;
        b.dispatchEvent(new Event("input", { bubbles: true }));
        Array.prototype.forEach.call(buttons, function(x){ x.classList.toggle("on", x === btn); });
      });
    });
  })();


  /* ---------- first-game simulator ---------- */
  (function(){
    var root = document.getElementById("simGame");
    if(!root || typeof SIM === "undefined") return;
    var el = {
      turn: root.querySelector("[data-sg-turn]"),
      hp: root.querySelector("[data-sg-hp]"),
      tier: root.querySelector("[data-sg-tier]"),
      power: root.querySelector("[data-sg-power]"),
      gold: root.querySelector("[data-sg-gold]"),
      scene: root.querySelector("[data-sg-scene]"),
      options: root.querySelector("[data-sg-options]"),
      feedback: root.querySelector("[data-sg-feedback]"),
      result: root.querySelector("[data-sg-result]")
    };
    var state;

    function reset(){
      state = { i: 0, hp: 30, tier: 1, power: 0, good: 0 };
      el.result.hidden = true;
      el.result.innerHTML = "";
      el.feedback.hidden = true;
      render();
    }

    function render(){
      var t = SIM.turns[state.i];
      el.turn.textContent = (state.i + 1) + " / " + SIM.turns.length;
      el.hp.textContent = Math.max(0, state.hp);
      el.tier.innerHTML = '<span class="stars">' + tierStars(state.tier) + '</span>';
      el.power.textContent = state.power;
      el.gold.textContent = t.gold;
      el.scene.textContent = t.scene;
      el.options.innerHTML = "";
      el.options.hidden = false;
      el.feedback.hidden = true;
      el.feedback.innerHTML = "";
      t.opts.forEach(function(o, idx){
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sg-opt";
        b.innerHTML = '<span class="k">' + (idx + 1) + '</span><span class="t">' + o.t + '</span>';
        b.addEventListener("click", function(){ choose(idx); });
        el.options.appendChild(b);
      });
    }

    function choose(idx){
      var t = SIM.turns[state.i], o = t.opts[idx], e = o.e || {};
      state.power = Math.max(0, state.power + (e.power || 0));
      state.tier += (e.tier || 0);
      state.hp += (e.hp || 0);
      if(o.good) state.good++;

      var opp = SIM.opp[state.i];
      var win = state.power >= opp;
      var dmg = 0;
      if(!win){ dmg = 3 + Math.floor(state.i / 2); state.hp -= dmg; }

      el.options.hidden = true;
      el.feedback.hidden = false;
      el.feedback.className = "sg-feedback " + (o.good ? "ok" : "no");
      el.feedback.innerHTML =
        '<div class="sg-fb-head">' + (o.good ? "✓ 好選擇" : "✗ 可以更好") +
        " · 戰鬥" + (win ? "勝利" : "失敗 −" + dmg + " 血") + '</div>' +
        '<p>' + o.fb + '</p>' +
        '<div class="sg-fb-state">戰力 ' + state.power + ' / 對手 ' + opp + ' · 血量 ' + Math.max(0, state.hp) + '</div>';

      var last = state.i === SIM.turns.length - 1 || state.hp <= 0;
      var next = document.createElement("button");
      next.type = "button";
      next.className = "sg-next";
      next.textContent = last ? "看結果 →" : "下一回合 →";
      next.addEventListener("click", function(){
        if(last){ showResult(); } else { state.i++; render(); }
      });
      el.feedback.appendChild(next);

      el.hp.textContent = Math.max(0, state.hp);
      el.power.textContent = state.power;
      el.tier.innerHTML = '<span class="stars">' + tierStars(state.tier) + '</span>';
    }

    function showResult(){
      var grade = state.hp <= 0 ? "D" : state.good >= 9 ? "S" : state.good >= 7 ? "A" : state.good >= 5 ? "B" : "C";
      el.feedback.hidden = true;
      el.result.hidden = false;
      el.result.innerHTML =
        '<div class="sg-grade">' + grade + '</div>' +
        '<div class="sg-sum"><b>' + state.good + ' / 10</b> 個回合做了正確選擇<br>終局：' +
        Math.max(0, state.hp) + ' 血 · ' + state.tier + ' 本 · 戰力 ' + state.power + '</div>' +
        '<p>' + (grade === "S"
          ? "節奏很標準：先站住、再升本、再收口。現在可以去看 01 的三條定律了。"
          : "記住一句話：血量健康就升本，血量危險就先買戰力；錢要花在能長大的卡上。") + '</p>' +
        '<button type="button" class="sg-next" id="sgRestart">↻ 再玩一次</button>';
      var btn = document.getElementById("sgRestart");
      if(btn) btn.addEventListener("click", reset);
    }

    reset();
  })();

  /* ---------- weekly meta ---------- */
  (function(){
    if(typeof META === "undefined") return;
    var top = document.getElementById("metaTop");
    var tbody = document.querySelector("#metaTable tbody");
    if(!top || !tbody) return;
    var wk = document.getElementById("metaWeek"), pt = document.getElementById("metaPatch");
    var dt = document.getElementById("metaDate"), nt = document.getElementById("metaNote");
    if(wk) wk.textContent = META.week;
    if(pt) pt.textContent = META.patch;
    if(dt) dt.textContent = META.updated;
    if(nt) nt.textContent = META.note;

    if(typeof STATS !== "undefined" && STATS && STATS.comps && STATS.comps.length){
      var host = document.getElementById("compStats");
      var tools = document.getElementById("compTools");
      var sub = document.getElementById("metaSub");
      var st = { hero: "", tier: "all", sort: "avg", q: "" };

      var DB = {};
      if(typeof POOL !== "undefined") POOL.forEach(function(c){ DB[c.i] = c; });
      if(typeof EXTRA_CARDS !== "undefined") Object.keys(EXTRA_CARDS).forEach(function(k){ DB[k] = EXTRA_CARDS[k]; });
      function tierOfCard(id){ var c = DB[id]; return c && c.t != null ? c.t : null; }

      var heroNames = [];
      if(STATS.heroComps){
        var order = {};
        (STATS.heroes || []).forEach(function(h, i){ order[h.name] = i; });
        heroNames = Object.keys(STATS.heroComps).sort(function(a, b){
          return (order[a] == null ? 999 : order[a]) - (order[b] == null ? 999 : order[b]);
        });
      }
      var heroSel = document.getElementById("compHero");
      if(heroSel){
        heroNames.forEach(function(n){ var o = document.createElement("option"); o.value = n; o.textContent = n; heroSel.appendChild(o); });
        try { st.hero = localStorage.getItem("tt-comp-hero") || ""; } catch(e){}
        if(st.hero && heroNames.indexOf(st.hero) < 0) st.hero = "";
        heroSel.value = st.hero;
      }

      function heroStat(key){
        if(!st.hero || !STATS.heroComps || !STATS.heroComps[st.hero]) return null;
        var list = STATS.heroComps[st.hero];
        for(var i = 0; i < list.length; i++) if(list[i].key === key) return list[i];
        return null;
      }

      function posHint(c){
        var tribeName = String(c.name || "").split("·")[0];
        var tr = (typeof TRIBES !== "undefined") ? TRIBES.filter(function(x){ return x.name === tribeName; })[0] : null;
        if(tr && tr.posHint) return tr.posHint + "（經驗站位）";
        return "通用原則：1–2 號位放前排吸收，3–5 號位放功能，6–7 號位放核心輸出";
      }

      function compCardHTML(c, rank){
        var list = (c.cards || []).slice();
        var note = (typeof COMP_NOTES !== "undefined" && c.key && COMP_NOTES[c.key]) ? COMP_NOTES[c.key] : null;
        if(note && note.order){
          var idx = {};
          note.order.forEach(function(n, k){ idx[n] = k; });
          list.sort(function(a, b){
            return (idx[a.name] == null ? 99 : idx[a.name]) - (idx[b.name] == null ? 99 : idx[b.name]);
          });
        }
        var hs = heroStat(c.key);
        var heroBadge = hs ? '<span class="cc-hero' + (hs.avg > c.avg ? " bad" : "") + '">你在玩：均位 ' + hs.avg + " · " + hs.sample + " 局</span>" : "";
        var cards = list.map(function(x, i){
          var t = tierOfCard(x.id);
          return '<a class="comp-slot" href="cards.html?card=' + x.id + '" data-card-id="' + x.id + '" title="' + x.name + '">' +
            '<span class="cs-no">' + (i + 1) + '</span>' +
            (t != null ? '<span class="cs-tier stars" title="' + t + ' 本">' + tierStars(t) + '</span>' : '') +
            '<span class="cs-img"><img loading="lazy" src="../pool/' + x.id + '.webp" alt="" onerror="this.parentNode.classList.add(\'noimg\');this.remove()"><i>' + x.name.slice(0,1) + '</i></span>' +
            '<span class="cs-name">' + x.name + '</span></a>';
        }).join("");
        return '<article class="comp-card" data-comp-key="' + (c.key || "") + '" id="comp-' + (c.key || "") + '">' +
          '<div class="cc-head"><span class="cc-rank">#' + (rank + 1) + '</span><b>' + c.name + '</b>' +
          '<span class="cc-tier ' + String(c.tier).toLowerCase() + '">' + c.tier + '</span>' +
          (c.key ? '<a class="cc-play" href="play.html?comp=' + c.key + '">對局模式</a>' : '') +
          (c.key ? '<a class="cc-share" href="share.html?comp=' + c.key + '">分享圖</a>' : '') +
          (c.key ? '<button type="button" class="cc-cmp" data-cmp="' + c.key + '">對比</button>' : '') +
          heroBadge +
          '<span class="cc-metrics">均位 ' + Number(c.avg).toFixed(2) + ' · 前四 ' + Math.round((c.top4 || 0) * 100) +
          '% · 吃雞 ' + Math.round((c.win || 0) * 100) + '% · ' + (c.sample || 0).toLocaleString("en-US") + ' 局</span></div>' +
          '<div class="cc-lineup">' + cards + '</div>' +
          '<div class="cc-pos"><b>站位</b> ' + ((note && note.pos) ? note.pos + '（手工站位）' : posHint(c)) + '</div>' +
          '<div class="cc-foot"><span>推薦英雄：' + ((c.heroes || []).join(" · ") || "—") + '</span><span>' +
          (c.difficulty || "") + (c.power ? ' / 強度 ' + c.power : "") + '</span></div>' +
          '</article>';
      }

      function renderBoard(){
        var list = STATS.comps.filter(function(c){
          if(st.tier !== "all" && c.tier !== st.tier) return false;
          if(st.q && c.name.toLowerCase().indexOf(st.q.toLowerCase()) < 0) return false;
          return true;
        });
        list.sort(function(a, b){
          if(st.hero){
            var ha = heroStat(a.key), hb = heroStat(b.key);
            if(ha && !hb) return -1;
            if(!ha && hb) return 1;
            if(ha && hb) return ha.avg - hb.avg;
          }
          if(st.sort === "top4") return (b.top4 || 0) - (a.top4 || 0);
          if(st.sort === "win") return (b.win || 0) - (a.win || 0);
          if(st.sort === "sample") return (b.sample || 0) - (a.sample || 0);
          return a.avg - b.avg;
        });

        var t = '<div class="cs-head">資料陣容榜 <span>' + STATS.source + ' · ' + (STATS.bracket || "") +
          " · " + (STATS.fetchedAt || "") + " · 樣本 " + (STATS.sample ? Math.round(STATS.sample / 10000) + " 萬局" : "-") +
          (st.hero ? " · 按 " + st.hero + " 排序" : "") + '</span></div>';

        if(!list.length){
          host.innerHTML = t + '<p class="cs-empty">沒有符合條件的陣容，換個梯度或清空搜尋試試。</p>';
          host.hidden = false;
          return;
        }

        t += '<div class="comp-board">' + list.slice(0, 8).map(function(c, i){ return compCardHTML(c, i); }).join("") + '</div>';
        if(list.length > 8){
          t += '<details class="comp-more"><summary>更多陣容（9–' + list.length + '，僅統計）</summary>' +
            '<div class="comp-board">' + list.slice(8).map(function(c, i){ return compCardHTML(c, i + 8); }).join("") + '</div></details>';
        }
        if(STATS.trinkets && STATS.trinkets.length){
          t += '<div class="trinket-board"><div class="cs-head">本週強勢飾品 <span>按平均排名</span></div><div class="trinket-grid">';
          STATS.trinkets.forEach(function(k){
            t += '<span class="tk"><b>' + k.name + '</b><em>均位 ' + Number(k.avg).toFixed(2) + ' · 選取 ' + k.pickrate + '%</em></span>';
          });
          t += '</div></div>';
        }
        host.innerHTML = t;
        host.hidden = false;
        if(tools) tools.hidden = false;
        Array.prototype.forEach.call(host.querySelectorAll("[data-cmp]"), function(x){
          x.classList.toggle("on", cmp.indexOf(x.getAttribute("data-cmp")) >= 0);
        });
      }

      if(heroSel){
        heroSel.addEventListener("change", function(){
          st.hero = heroSel.value;
          try { localStorage.setItem("tt-comp-hero", st.hero); } catch(e){}
          renderBoard();
        });
      }
      var cmp = [];
      var cmpOverlay = document.getElementById("cmpOverlay");
      var cmpBody = document.getElementById("cmpBody");

      function orderedCards(c){
        var list = (c.cards || []).slice();
        var note = (typeof COMP_NOTES !== "undefined" && c.key && COMP_NOTES[c.key]) ? COMP_NOTES[c.key] : null;
        if(note && note.order){
          var idx = {};
          note.order.forEach(function(n, k){ idx[n] = k; });
          list.sort(function(a, b){
            return (idx[a.name] == null ? 99 : idx[a.name]) - (idx[b.name] == null ? 99 : idx[b.name]);
          });
        }
        return list;
      }

      function cmpCol(c, other){
        var ids = orderedCards(c).map(function(x){ return x.id; });
        var oids = orderedCards(other).map(function(x){ return x.id; });
        var only = orderedCards(c).filter(function(x){ return oids.indexOf(x.id) < 0; }).map(function(x){ return x.name; });
        var slots = orderedCards(c).slice(0, 7).map(function(x, i){
          var t = tierOfCard(x.id);
          return '<div class="cmp-slot"><img src="../pool/' + x.id + '.webp" alt="" onerror="this.style.opacity=0"><span>' + x.name + '</span><em class="stars" title="' + (t != null ? t + ' 本' : '') + '">' + (t != null ? tierStars(t) : '') + '</em></div>';
        }).join("");
        return '<div class="cmp-col"><h3>' + c.name + ' <span class="cc-tier ' + String(c.tier).toLowerCase() + '">' + c.tier + '</span></h3>' +
          '<div class="cmp-metrics">均位 ' + Number(c.avg).toFixed(2) + ' · 前四 ' + Math.round((c.top4 || 0) * 100) + '% · 吃雞 ' +
          Math.round((c.win || 0) * 100) + '% · ' + (c.sample || 0).toLocaleString("en-US") + ' 局</div>' +
          '<div class="cmp-lineup">' + slots + '</div>' +
          '<div class="cmp-diff"><b>獨有</b>：' + (only.length ? only.join("、") : "無") + '<br><b>推薦英雄</b>：' +
          ((c.heroes || []).join(" · ") || "—") + '</div></div>';
      }

      function renderCompare(){
        if(!cmpOverlay) return;
        if(cmp.length < 2){ cmpOverlay.hidden = true; return; }
        var a = STATS.comps.filter(function(x){ return x.key === cmp[0]; })[0];
        var b = STATS.comps.filter(function(x){ return x.key === cmp[1]; })[0];
        if(!a || !b){ cmpOverlay.hidden = true; return; }
        cmpBody.innerHTML = cmpCol(a, b) + cmpCol(b, a);
        cmpOverlay.hidden = false;
      }

      if(host){
        host.addEventListener("click", function(e){
          var b = e.target.closest ? e.target.closest("[data-cmp]") : null;
          if(!b) return;
          e.preventDefault();
          var k = b.getAttribute("data-cmp");
          var i = cmp.indexOf(k);
          if(i >= 0) cmp.splice(i, 1);
          else { cmp.push(k); if(cmp.length > 2) cmp.shift(); }
          Array.prototype.forEach.call(host.querySelectorAll("[data-cmp]"), function(x){
            x.classList.toggle("on", cmp.indexOf(x.getAttribute("data-cmp")) >= 0);
          });
          renderCompare();
        });
      }
      var cmpClose = document.getElementById("cmpClose");
      if(cmpClose) cmpClose.addEventListener("click", function(){ cmp = []; if(cmpOverlay) cmpOverlay.hidden = true; });
      if(cmpOverlay) cmpOverlay.addEventListener("click", function(e){ if(e.target === cmpOverlay) cmpOverlay.hidden = true; });

      function openHash(){
        var m = /^#comp-(.+)$/.exec(location.hash || "");
        if(!m) return;
        var key = decodeURIComponent(m[1]);
        var card = document.querySelector('.comp-card[data-comp-key="' + key + '"]');
        if(!card){
          var det = document.querySelector(".comp-more");
          if(det) det.open = true;
          card = document.querySelector('.comp-card[data-comp-key="' + key + '"]');
        }
        if(!card) return;
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("comp-flash");
        setTimeout(function(){ card.classList.remove("comp-flash"); }, 1800);
      }
      window.addEventListener("hashchange", openHash);
      setTimeout(openHash, 500);

      var tierBox = document.getElementById("compTiers");
      if(tierBox){
        tierBox.addEventListener("click", function(e){
          var b = e.target.closest ? e.target.closest("button[data-tier]") : null;
          if(!b) return;
          st.tier = b.getAttribute("data-tier");
          Array.prototype.forEach.call(tierBox.querySelectorAll("button"), function(x){ x.classList.toggle("on", x === b); });
          renderBoard();
        });
      }
      var sortSel = document.getElementById("compSort");
      if(sortSel) sortSel.addEventListener("change", function(){ st.sort = sortSel.value; renderBoard(); });
      var searchEl = document.getElementById("compSearch");
      if(searchEl){
        var timer = null;
        searchEl.addEventListener("input", function(){
          clearTimeout(timer);
          timer = setTimeout(function(){ st.q = searchEl.value.trim(); renderBoard(); }, 180);
        });
      }

      renderBoard();
      if(sub) sub.hidden = false;
      var metaSec = document.getElementById("meta");
      if(metaSec) metaSec.classList.add("stats-live");
    }

    function cardFor(n){
      if(typeof CARDS === "undefined" || !CARDS) return null;
      if(CARDS[n]) return CARDS[n];
      var keys = Object.keys(CARDS), low = String(n).toLowerCase();
      for(var i = 0; i < keys.length; i++){
        var k = keys[i].toLowerCase();
        if(k.indexOf(low) >= 0 || low.indexOf(k) >= 0) return CARDS[keys[i]];
      }
      return null;
    }

    META.comps.slice(0, 3).forEach(function(c){
      var d = document.createElement("article");
      d.className = "meta-card " + c.rank.toLowerCase();
      d.innerHTML = '<span class="mc-rank">' + c.rank + '</span>' +
        '<h3>' + c.name + '</h3>' +
        '<p class="mc-line">' + c.line + '</p>' +
        '<div class="mc-core">' + c.core.map(function(x){
          var card = cardFor(x);
          return '<span class="mc-card" data-card="' + x + '">' + (card && card.img ? '<img src="' + card.img + '" alt="" loading="lazy">' : '') + '<em>' + x + '</em></span>';
        }).join("") + '</div>' +
        '<p class="mc-good"><b>強</b>' + c.good + '</p>' +
        '<p class="mc-bad"><b>怕</b>' + c.bad + '</p>';
      top.appendChild(d);
    });

    META.comps.slice(3).forEach(function(c){
      var tr = document.createElement("tr");
      tr.innerHTML = '<td>' + c.rank + '</td><td>' + c.name + '</td><td>' + c.line + '</td><td>' + c.good + '</td><td>' + c.bad + '</td>';
      tbody.appendChild(tr);
    });
  })();


  /* ---------- heroes & trinkets (stats-aware, MMR segments) ---------- */
  (function(){
    function pct(v){ return Math.round((Number(v) || 0) * 100) + "%"; }
    var SEG = 100;
    var LABEL = { "100": "全部", "50": "前 50%", "10": "前 10%", "1": "前 1%" };

    function seg(){ return (typeof STATS_MMR !== "undefined" && STATS_MMR[SEG]) ? STATS_MMR[SEG] : null; }

    function renderGuideList(id, data){
      var host = document.getElementById(id);
      if(!host || !data) return;
      host.innerHTML = "";
      data.forEach(function(x){
        var row = document.createElement("div");
        row.className = "hg-item";
        var rank = x.rank || x.tier || "T2";
        var tag = x.tag || (x.winrate ? "勝率 " + pct(x.winrate) : "");
        var recs = (typeof STATS !== "undefined" && STATS.heroComps && STATS.heroComps[x.n]) || [];
        var recHTML = recs.length ? '<p class="hg-comps">推薦：' + recs.map(function(r){
          return '<a href="#meta" data-comp="' + r.key + '">' + r.name + '</a>';
        }).join(" · ") + ' <a class="hg-play" href="play.html?hero=' + encodeURIComponent(x.n) + '">對局模式</a></p>' : '';
        row.innerHTML = '<span class="hg-rank ' + String(rank).toLowerCase() + '" title="' + tierName(rank) + '">' + rank + '</span>' +
          (tag ? '<span class="hg-tag">' + tag + '</span>' : '') +
          '<div><b>' + x.n + '</b><p>' + (x.why || "") + '</p>' + recHTML + '</div>';
        host.appendChild(row);
      });
    }

    function drawHeroes(){
      var d = seg();
      var src = d ? d.heroes : ((typeof STATS !== "undefined" && STATS.heroes) ? STATS.heroes : null);
      var list = src ? src.map(function(h){
        var base = (typeof HEROES !== "undefined") ? HEROES.filter(function(x){ return x.n === h.name; })[0] : null;
        var bits = [];
        if (h.top4) bits.push("前四 " + pct(h.top4));
        if (h.avg) bits.push("均位 " + Number(h.avg).toFixed(2));
        var detail = [];
        if (h.winrate) detail.push("吃雞 " + pct(h.winrate));
        if (h.pickrate) detail.push("選取 " + h.pickrate + "%");
        return {
          n: h.name,
          rank: h.tier,
          tag: bits.join(" · "),
          why: base ? base.why : (detail.length ? detail.join(" · ") : "資料來自 " + (STATS.source || "外部統計"))
        };
      }) : (typeof HEROES !== "undefined" ? HEROES : []);
      renderGuideList("heroList", list);

      var el = document.getElementById("heroStatsBadge");
      if(!el) return;
      if(d){
        el.className = "stats-badge live";
        el.innerHTML = "資料：<b>Firestone</b> · " + LABEL[SEG] + " · " + (d.fetchedAt || "") +
          " · 樣本 " + (d.sample ? Math.round(d.sample / 10000) + " 萬局" : "-");
      } else if(typeof STATS !== "undefined" && STATS && STATS.heroes && STATS.heroes.length){
        el.className = "stats-badge live";
        el.innerHTML = "資料：<b>" + STATS.source + "</b>" +
          (STATS.bracket ? " · " + STATS.bracket : "") +
          (STATS.fetchedAt ? " · " + STATS.fetchedAt : "") +
          (STATS.sample ? " · 樣本 " + Math.round(STATS.sample / 10000) + " 萬局" : "");
      } else {
        el.className = "stats-badge manual";
        el.textContent = "英雄梯度：社群整理（非統計） · 待接入實時資料";
      }
    }

    drawHeroes();
    if(typeof TRINKETS !== "undefined") renderGuideList("trinketList", TRINKETS);

    var sw = document.getElementById("segSwitch");
    if(sw){
      sw.addEventListener("click", function(e){
        var b = e.target.closest ? e.target.closest("button[data-seg]") : null;
        if(!b) return;
        SEG = +b.getAttribute("data-seg");
        Array.prototype.forEach.call(sw.querySelectorAll("button"), function(x){ x.classList.toggle("on", x === b); });
        drawHeroes();
      });
    }

    function badge(id, hasData, label){
      var el = document.getElementById(id);
      if(!el) return;
      if(hasData){
        el.className = "stats-badge live";
        el.innerHTML = "資料：<b>" + STATS.source + "</b>" +
          (STATS.bracket ? " · " + STATS.bracket : "") +
          (STATS.region ? " · " + STATS.region : "") +
          (STATS.fetchedAt ? " · " + STATS.fetchedAt : "") +
          (STATS.sample ? " · 樣本 " + (STATS.sample >= 10000 ? Math.round(STATS.sample / 10000) + " 萬局" : STATS.sample) : "");
      } else {
        el.className = "stats-badge manual";
        el.textContent = label + "：社群整理（非統計） · 待接入實時資料";
      }
    }
    badge("metaStatsBadge", !!(typeof STATS !== "undefined" && STATS && STATS.comps && STATS.comps.length), "週報");
  })();

/* ---------- lineup finder ---------- */
  (function(){
    var input = document.getElementById("finderCard");
    if(!input || typeof POOL === "undefined" || typeof TRIBES === "undefined") return;

    var CN2CODE = { "野獸":"BEAST", "惡魔":"DEMON", "龍":"DRAGON", "元素":"ELEMENTAL", "機械":"MECHANICAL",
      "魚人":"MURLOC", "納迦":"NAGA", "海盜":"PIRATE", "野豬人":"QUILBOAR", "亡靈":"UNDEAD",
      "畸變怪":"ABERRATION", "全種族":"ALL" };
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
      var h = '<div class="fr-recs"><div class="fr-recs-head">' + name + ' 的推薦陣容</div>';
      recs.forEach(function(r, i){
        var full = (STATS.comps || []).filter(function(c){ return c.key === r.key; })[0] || {};
        h += '<a class="fr-comp" href="#meta" data-comp="' + r.key + '">' +
          '<span class="fr-comp-rank">#' + (i + 1) + '</span>' +
          '<b>' + r.name + '</b>' +
          '<span class="fr-comp-tier ' + String(r.tier).toLowerCase() + '">' + r.tier + '</span>' +
          '<span class="fr-comp-meta">均位 ' + r.avg + ' · 前四 ' + pct(full.top4) + ' · 吃雞 ' + pct(full.win) + ' · ' + r.sample + ' 局</span>' +
          '</a>';
      });
      h += '<p class="fr-recs-tip">點任意一套，跳到週報區看 7 格卡牌與站位。</p></div>';
      result.innerHTML = h;
      return true;
    }

    heroSel.addEventListener("change", function(){
      if(!heroSel.value) return;
      if(!renderHeroComps(heroSel.value)){
        result.innerHTML = '<p class="fr-empty">這個英雄暫時沒有足夠樣本的陣容推薦。</p>';
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
    var HERO_MAP = { "經濟":["elemental","pirate"], "戰力":["beast","mech"], "戰吼":["murloc","dragon"],
      "重新整理":["naga","elemental"], "頻率":["beast","undead"], "偷牌":["pirate","demon"], "魚人":["murloc"] };
    var KEY = { elemental:["元素","酒館法術"], naga:["塑造"], mech:["磁力"], murloc:["魚人","戰吼","劇毒"],
      beast:["野獸","亡語"], undead:["亡靈","復生"], pirate:["海盜","鑄幣"], demon:["惡魔","吞噬"],
      dragon:["龍"], quilboar:["鮮血寶石"], aberration:["畸變","神明"] };

    function coreOfficial(t){
      return t.cores.map(function(x){
        var c = (typeof CARDS !== "undefined") ? CARDS[x.n] : null;
        return c ? c.n : x.n;
      });
    }

    function compute(){
      var hero = (typeof HEROES !== "undefined") ? HEROES.filter(function(h){ return h.n === heroSel.value; })[0] : null;
      if(!picked.length && !hero){ result.innerHTML = '<p class="fr-empty">至少選一個英雄或一張牌。</p>'; return; }
      if(!picked.length){
        var map = HERO_MAP[hero.tag] || [];
        if(!map.length){ result.innerHTML = '<p class="fr-empty">「' + hero.n + '」比較百搭，再輸入 1–2 張手裡的核心牌，就能算出方向。</p>'; return; }
        var names = map.map(function(id){ var t = TRIBES.filter(function(x){ return x.id === id; })[0]; return t ? t.name : id; });
        result.innerHTML = '<p class="fr-empty">「' + hero.n + '」適合：' + names.join("、") + '。再輸入手裡的牌可以算得更準。</p>';
        return;
      }

      var scores = TRIBES.map(function(t){
        var s = 0, reasons = [];
        if(hero){
          var map = HERO_MAP[hero.tag] || [];
          if(map.indexOf(t.id) >= 0){ s += 2; reasons.push("英雄「" + hero.n + "」適合" + t.name); }
          else if(hero.tag === "複製" || hero.tag === "點金"){ s += 0.6; reasons.push("英雄「" + hero.n + "」的複製能力對任何流派都有用"); }
        }
        var cores = coreOfficial(t);
        picked.forEach(function(name){
          var rec = byName.get(name);
          if(!rec) return;
          if(cores.indexOf(rec.official) >= 0){ s += 3.5; reasons.push("「" + name + "」是" + t.name + "的核心元件"); return; }
          var hit = rec.races.some(function(r){ return RACE2TRIBE[r] === t.id; });
          if(hit){ s += 2; reasons.push("「" + name + "」是" + t.name + "種族"); return; }
          var keys = KEY[t.id] || [];
          if(keys.some(function(k){ return rec.text.indexOf(k) >= 0; })){
            s += 1; reasons.push("「" + name + "」的效果和" + t.name + "相關");
          }
        });
        return { t: t, s: s, reasons: reasons };
      }).filter(function(x){ return x.s >= 1.5; }).sort(function(a, b){ return b.s - a.s; }).slice(0, 3);

      if(!scores.length){
        result.innerHTML = '<p class="fr-empty">這幾張牌暫時拼不出明確方向，再加一張核心牌試試。</p>';
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
          '<a class="fr-link" href="index.html?tribe=' + x.t.id + '#tribes">看圖鑑 →</a></div>';
      }).join("");
    }

    document.getElementById("finderGo").addEventListener("click", compute);
    renderChips();
  })();

})();


/* ---------- hero deep link + comp jump ---------- */
(function(){
  function jumpToComp(key){
    // exposed for the global search
    window.__jumpComp = jumpToComp;
    var card = document.querySelector('.comp-card[data-comp-key="' + key + '"]');
    if(!card){
      var more = document.querySelector(".comp-more");
      if(more) more.open = true;
      card = document.querySelector('.comp-card[data-comp-key="' + key + '"]');
    }
    if(!card) return false;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("comp-flash");
    setTimeout(function(){ card.classList.remove("comp-flash"); }, 1800);
    return true;
  }

  document.addEventListener("click", function(e){
    var a = e.target.closest ? e.target.closest("[data-comp]") : null;
    if(!a) return;
    if(jumpToComp(a.getAttribute("data-comp"))) e.preventDefault();
  });

  var hero = new URLSearchParams(location.search).get("hero");
  if(hero){
    var sel = document.getElementById("finderHero");
    if(sel){
      sel.value = hero;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      var f = document.getElementById("finder");
      if(f) setTimeout(function(){ f.scrollIntoView({ block: "start" }); }, 300);
    }
  }
})();


/* ---------- weekly change ---------- */
(function(){
  var host = document.getElementById("statsChange");
  if(!host || typeof STATS_CHANGE === "undefined" || !STATS_CHANGE) return;
  var c = STATS_CHANGE;
  function fmt(n){ return n ? Math.round(n / 10000) + " 萬" : "-"; }
  var range = (c.from && c.to && c.from !== c.to) ? (c.from + " → " + c.to) : "對比上一版";
  var h = '<div class="sc-head">本週變化 <span>' + range +
    " · 樣本 " + fmt(c.sampleFrom) + " → " + fmt(c.sampleTo) + '</span></div>';

  var rows = [];
  (c.comps || []).forEach(function(x){
    var up = x.rankTo < x.rankFrom;
    rows.push('<div class="sc-row"><span class="' + (up ? "sc-up" : "sc-down") + '">' + (up ? "↑" : "↓") + "</span>" +
      '<span class="sc-tag">陣容</span><b>' + x.name + '</b><span>#' + x.rankFrom + " → #" + x.rankTo +
      (x.avgFrom === x.avgTo ? "" : "（均位 " + x.avgFrom + " → " + x.avgTo + "）") + "</span></div>");
  });
  (c.heroes || []).forEach(function(x){
    var up = x.rankTo < x.rankFrom;
    rows.push('<div class="sc-row"><span class="' + (up ? "sc-up" : "sc-down") + '">' + (up ? "↑" : "↓") + "</span>" +
      '<span class="sc-tag">英雄</span><b>' + x.name + '</b><span>#' + x.rankFrom + " → #" + x.rankTo +
      (x.avgFrom === x.avgTo ? "" : "（均位 " + x.avgFrom + " → " + x.avgTo + "）") + "</span></div>");
  });

  if(c.first) h += '<div class="sc-row">首次接入真實資料，已記錄基線；下週開始顯示升降。</div>';
  else if(!rows.length) h += '<div class="sc-row">本週陣容與英雄排名無顯著變化。</div>';
  else h += rows.join("");

  host.innerHTML = h;
  host.hidden = false;
})();

/* ---------- global search ---------- */
(function(){
  var overlay = document.getElementById("searchOverlay");
  var input = document.getElementById("searchInput");
  var list = document.getElementById("searchList");
  if(!overlay || !input || !list) return;

  var idx = null, active = -1, shown = [];

  var ALIAS = {
    "血魔":"塔隆·血魔", "銅須":"布萊恩·銅須", "詩心龍":"執念詩心龍", "白狼":"巨狼戈德林",
    "摩托車":"極速野豬騎士", "摩托豬":"極速野豬騎士", "仙女龍":"折躍之翼", "紅龍":"赤紅守備巨龍",
    "瑞文":"提圖斯·瑞文戴爾", "巴琳達":"巴琳達·斯通赫爾斯", "卡雷":"奧術守護者卡雷苟斯",
    "尤朵拉":"尤朵拉船長", "鉤牙":"鉤牙船長", "雷諾":"雷諾·傑克遜",
    "螺絲":"炎魔之王拉格納羅斯", "大螺絲":"炎魔之王拉格納羅斯", "苔絲":"苔絲·格雷邁恩"
  };

  function buildIndex(){
    var items = [], seen = {};
    function add(type, name, sub, href, data){
      if(!name || seen[type + "|" + name]) return;
      seen[type + "|" + name] = 1;
      var al = Object.keys(ALIAS).filter(function(k){ return ALIAS[k] === name; }).join(" ");
      items.push({ type: type, name: name, sub: sub || "", href: href || "", data: data || {}, alias: al });
    }
    var RACE_CN = { BEAST:"野獸", DEMON:"惡魔", DRAGON:"龍", ELEMENTAL:"元素", MECHANICAL:"機械",
      MURLOC:"魚人", NAGA:"納迦", PIRATE:"海盜", QUILBOAR:"野豬人", UNDEAD:"亡靈", ABERRATION:"畸變怪" };
    if(typeof POOL !== "undefined"){
      POOL.forEach(function(c){
        var races = String(c.r || "").split("/").map(function(r){ return RACE_CN[r] || r; }).filter(Boolean).join("/");
        add("卡牌", c.n, (c.t != null ? tierStars(c.t) + " · " : "") + races, "cards.html?card=" + c.i, { id: c.i });
      });
    }
    if(typeof STATS !== "undefined" && STATS.heroComps){
      Object.keys(STATS.heroComps).forEach(function(n){
        var top = STATS.heroComps[n][0];
        add("英雄", n, top ? "推薦 " + top.name : "", "", { hero: n });
      });
    }
    if(typeof STATS !== "undefined" && STATS.comps){
      STATS.comps.forEach(function(c){
        add("陣容", c.name, "均位 " + c.avg + " · " + c.tier, "", { comp: c.key });
      });
    }
    if(typeof GLOSSARY !== "undefined"){
      GLOSSARY.forEach(function(g){ add("術語", g[0], g[1], "#glossary"); });
    }
    [["start","入門"],["laws","三條定律"],["math","數學"],["positioning","站位"],["tribes","種族"],
     ["heroes","英雄與飾品"],["meta","週報"],["finder","陣容反查"],["glossary","術語"]].forEach(function(s){
      add("章節", s[1], "", "#" + s[0]);
    });
    return items;
  }

  function open(){
    if(!idx) idx = buildIndex();
    overlay.hidden = false;
    input.value = "";
    render("");
    setTimeout(function(){ input.focus(); }, 20);
  }
  function close(){ overlay.hidden = true; active = -1; }

  function render(q){
    q = String(q || "").trim().toLowerCase();
    var pool = idx;
    if(q){
      pool = idx.filter(function(x){
        return x.name.toLowerCase().indexOf(q) >= 0 || (x.alias || "").toLowerCase().indexOf(q) >= 0;
      });
      pool.sort(function(a, b){
        var an = a.name.toLowerCase(), bn = b.name.toLowerCase();
        var as = (an.indexOf(q) === 0 || (a.alias || "").toLowerCase() === q) ? 0 : 1;
        var bs = (bn.indexOf(q) === 0 || (b.alias || "").toLowerCase() === q) ? 0 : 1;
        return as - bs || a.name.length - b.name.length;
      });
    }
    shown = pool.slice(0, 12);
    active = shown.length ? 0 : -1;
    if(!shown.length){
      list.innerHTML = '<div class="sr-empty">沒找到「' + q + '」相關的內容</div>';
      return;
    }
    list.innerHTML = shown.map(function(x, i){
      var byAlias = x.alias && x.name.toLowerCase().indexOf(q) < 0;
      return '<a class="sr' + (i === 0 ? " on" : "") + '" href="' + (x.href || "#") + '" data-i="' + i + '">' +
        '<span class="sr-type">' + x.type + '</span><span class="sr-name">' + x.name + '</span>' +
        '<span class="sr-sub">' + (byAlias ? "俗稱：" + x.alias.split(" ")[0] + " · " : "") + x.sub + '</span></a>';
    }).join("");
  }

  function choose(i){
    var x = shown[i];
    if(!x) return;
    if(x.data.comp){
      close();
      var link = document.querySelector('[data-comp="' + x.data.comp + '"]');
      if(link) link.click();
      else if(window.__jumpComp) window.__jumpComp(x.data.comp);
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
    var el = list.children[active];
    if(el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
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
    e.preventDefault();
    choose(+a.getAttribute("data-i"));
  });
  overlay.addEventListener("click", function(e){ if(e.target === overlay) close(); });

  var btn = document.getElementById("searchOpen");
  if(btn) btn.addEventListener("click", open);

  document.addEventListener("keydown", function(e){
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); open(); return; }
    if(e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && overlay.hidden){ e.preventDefault(); open(); return; }
    if(e.key === "Escape" && !overlay.hidden) close();
  });
})();


/* ---------- tier legend modal ---------- */
(function(){
  var modal = document.getElementById("tierModal");
  if(!modal) return;
  function close(){ modal.hidden = true; }
  document.addEventListener("click", function(e){
    var h = e.target.closest ? e.target.closest(".tier-help") : null;
    if(h){ e.preventDefault(); modal.hidden = false; return; }
    if(e.target === modal) close();
  });
  var b = document.getElementById("tierClose");
  if(b) b.addEventListener("click", close);
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !modal.hidden) close(); });
})();
