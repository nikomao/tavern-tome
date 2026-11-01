/* 渲染与交互 */
(function(){
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
    if(n < 1e8) return (n/1e4).toFixed(n < 1e5 ? 1 : 0) + "万";
    if(n < 1e12) return (n/1e8).toFixed(n < 1e9 ? 2 : 1) + "亿";
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
    var tip = isNoArt(name) ? '卡图暂未收录（37.0 新卡）' : '暂无卡图';
    return '<span class="ci-thumb noimg" title="'+tip+'"><i>'+name.slice(0,1)+'</i></span>';
  }


  function planSlot(nm){
    var c = cardOf(nm);
    if(c && c.img){
      return '<button type="button" class="fc" data-card="'+nm+'"><span class="fc-img"><img src="'+c.img+'" alt="'+nm+'"></span><span class="fc-name">'+nm+'</span></button>';
    }
    if(isNoArt(nm)){
      return '<span class="fc" title="卡图暂未收录"><span class="fc-img noimg"><i>'+nm.slice(0,1)+'</i></span><span class="fc-name">'+nm+'</span></span>';
    }
    return '<span class="fc generic"><span class="fc-img"><i>+</i></span><span class="fc-name">'+nm+'</span></span>';
  }

  function planBlock(t){
    var plans = (typeof PLANS !== "undefined" && PLANS[t.id]) ? PLANS[t.id] : null;
    if(!plans){
      var fin = (typeof FINALS !== "undefined" && FINALS[t.id]) || [];
      plans = [{ k: "标准", when: "按这个顺序摆。", slots: fin }];
    }
    var h = '<div class="plans" data-plans="'+t.id+'">';
    h += '<div class="plan-tabs"><span class="plan-label">终盘方案</span>';
    plans.forEach(function(p, i){
      h += '<button type="button" class="plan-tab'+(i===0?" on":"")+'" data-plan="'+i+'">'+p.k+'</button>';
    });
    h += '</div>';
    h += '<div class="plan-when">'+plans[0].when+'</div>';
    h += '<div class="plan-line fl-cards">'+plans[0].slots.map(planSlot).join("")+'</div>';
    h += '</div>';
    return h;
  }


  var TRIBE_RACE = { aberration:"ABERRATION", elemental:"ELEMENTAL", demon:"DEMON", naga:"NAGA",
    pirate:"PIRATE", beast:"BEAST", dragon:"DRAGON", mech:"MECHANICAL", murloc:"MURLOC",
    undead:"UNDEAD", quilboar:"QUILBOAR" };

  function tribeAllCards(t){
    var race = TRIBE_RACE[t.id];
    if(!race || typeof POOL === "undefined") return "";
    var list = POOL.filter(function(c){ return (c.r || "").split("/").indexOf(race) >= 0; });
    if(!list.length) return "";
    var h = '<details class="tribe-all"><summary>该种族全部卡牌 <b>' + list.length + '</b> 张 <span>含历史卡 · 点开查看</span></summary>';
    h += '<div class="tribe-grid">';
    list.forEach(function(c){
      h += '<a class="tc" href="cards.html?card=' + c.i + '" title="' + c.n + '">' +
        '<span class="tc-img">' + (c.m ? '<img loading="lazy" src="pool/' + c.i + '.webp" alt="">' : '<i>?</i>') + '</span>' +
        '<span class="tc-name">' + c.n + '</span>' +
        '<span class="tc-meta">' + c.t + ' 本</span></a>';
    });
    h += '</div>';
    h += '<a class="tribe-more" href="cards.html?race=' + race + '">在卡池页筛选「' + t.name + '」→</a>';
    h += '</details>';
    return h;
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
    h +=     '<div class="tp-body">';
    h +=       '<div class="core-wrap"><h4>核心组件<span class="h4-hint">悬停 / 点击卡图，查看完整卡牌效果</span></h4><ul class="core-list">';
    t.cores.forEach(function(x){
      var c = cardOf(x.n);
      var sub = "";
      if(c){
        var bits = [];
        if(c.n && c.n !== x.n) bits.push(c.n);
        if(c.k === "spell") bits.push("酒馆法术");
        else if(c.t != null) bits.push("等级 " + c.t);
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
    h +=       '<div class="pos-wrap"><h4>标准站位</h4><div class="posbar">';
    t.position.forEach(function(p,i){
      h += '<div class="pb '+p.k+'"><span class="n">'+(i+1)+'</span><span class="r">'+p.r+'</span><span class="m">'+p.m+'</span></div>';
    });
    h +=       '</div><p class="pos-hint">'+t.posHint+'</p>';
    h +=       planBlock(t) + '</div>';
    h +=     '</div>';
    h +=     '<div class="tp-grid">';
    h +=       '<div class="tp-cell"><h4>运营节奏</h4><div class="curve">';
    t.curve.forEach(function(cv){
      h += '<div><span>'+cv.k+'</span><b>'+cv.v+'</b></div>';
    });
    h +=       '</div></div>';
    h +=       '<div class="tp-cell"><h4>为什么强</h4><ul>';
    t.why.forEach(function(w){ h += '<li>'+w+'</li>'; });
    h +=       '</ul></div>';
    h +=       '<div class="tp-cell"><h4>天敌与弱点</h4><ul>';
    t.weak.forEach(function(w){ h += '<li>'+w+'</li>'; });
    h +=       '</ul></div>';
    h +=       '<div class="tp-cell"><h4>常见错误</h4><ul>';
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
      if(c.k === "spell") meta.push("酒馆法术");
      else {
        if(c.t != null) meta.push("等级 " + c.t);
        if(c.a != null) meta.push(c.a + " / " + c.h);
      }
      if(c.r) meta.push(c.r);
      popMeta.textContent = meta.join(" · ");
      popText.textContent = c.x || "暂未收录卡牌描述";
      return true;
    }

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
      note.textContent = "同样的 4/4 起手，第 5 回合只差 4 倍，第 10 回合差 64 倍。";
      btn.textContent = "▶ 播放 10 回合";
      render();
    }
    function step(my){
      if(my !== token) return;
      if(r >= MAX){
        note.innerHTML = "10 回合后：<b>64</b> vs <b>4,096</b>，相差 64 倍。";
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

  /* 定律二：铸币 = 触发次数 */
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
      note.textContent = "同样一次 +3/+3：10 次是 +30，30 次是 +90。";
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
              note.innerHTML = "10 次：<b>34/34</b>；30 次：<b>94/94</b>。如果每次是 ×2，10 次是 1024，30 次是 10.7 亿。";
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
      note.textContent = "对手从左边开始，连续打三次。";
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
        note.innerHTML = "坏站位：<b>大哥、铜须、巴琳达</b>全没了；好站位：只死了三个小怪，<b>大哥和铜须还活着</b>。";
        btn.disabled = false;
      }, 220 + 3 * 900));
    }
    btn.addEventListener("click", play);
    reset();
    onceVisible(root, function(){ if(!reduceMotion) play(); });
  })();

  /* 02：翻倍积木 */
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

  /* 02：乘数链逐段点亮 */
  (function(){
    var flow = document.querySelector(".chain-flow");
    if(!flow) return;
    onceVisible(flow, function(){ flow.classList.add("reveal"); });
  })();

  /* 02：模拟器预设 */
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
      el.tier.textContent = state.tier + " 本";
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
        '<div class="sg-fb-head">' + (o.good ? "✓ 好选择" : "✗ 可以更好") +
        " · 战斗" + (win ? "胜利" : "失败 −" + dmg + " 血") + '</div>' +
        '<p>' + o.fb + '</p>' +
        '<div class="sg-fb-state">战力 ' + state.power + ' / 对手 ' + opp + ' · 血量 ' + Math.max(0, state.hp) + '</div>';

      var last = state.i === SIM.turns.length - 1 || state.hp <= 0;
      var next = document.createElement("button");
      next.type = "button";
      next.className = "sg-next";
      next.textContent = last ? "看结果 →" : "下一回合 →";
      next.addEventListener("click", function(){
        if(last){ showResult(); } else { state.i++; render(); }
      });
      el.feedback.appendChild(next);

      el.hp.textContent = Math.max(0, state.hp);
      el.power.textContent = state.power;
      el.tier.textContent = state.tier + " 本";
    }

    function showResult(){
      var grade = state.hp <= 0 ? "D" : state.good >= 9 ? "S" : state.good >= 7 ? "A" : state.good >= 5 ? "B" : "C";
      el.feedback.hidden = true;
      el.result.hidden = false;
      el.result.innerHTML =
        '<div class="sg-grade">' + grade + '</div>' +
        '<div class="sg-sum"><b>' + state.good + ' / 10</b> 个回合做了正确选择<br>终局：' +
        Math.max(0, state.hp) + ' 血 · ' + state.tier + ' 本 · 战力 ' + state.power + '</div>' +
        '<p>' + (grade === "S"
          ? "节奏很标准：先站住、再升本、再收口。现在可以去看 01 的三条定律了。"
          : "记住一句话：血量健康就升本，血量危险就先买战力；钱要花在能长大的卡上。") + '</p>' +
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
      var sub = document.getElementById("metaSub");
      if(host){
        var t = '<div class="cs-head">数据阵容榜 <span>' + STATS.source + ' · ' + (STATS.bracket || "") +
          " · " + (STATS.fetchedAt || "") + " · 样本 " + (STATS.sample ? Math.round(STATS.sample/10000)+" 万局" : "-") + '</span></div>';

        function posHint(c){
          var tribeName = String(c.name || "").split("·")[0];
          var tr = (typeof TRIBES !== "undefined") ? TRIBES.filter(function(x){ return x.name === tribeName; })[0] : null;
          if(tr && tr.posHint) return tr.posHint + '（经验站位）';
          return '通用原则：1–2 号位放前排吸收，3–5 号位放功能，6–7 号位放核心输出';
        }

        t += '<div class="comp-board">';
        STATS.comps.slice(0, 8).forEach(function(c, i){
          var list = (c.cards || []).slice();
          var note = (typeof COMP_NOTES !== "undefined" && c.key && COMP_NOTES[c.key]) ? COMP_NOTES[c.key] : null;
          if(note && note.order){
            var posIdx = {};
            note.order.forEach(function(n, k){ posIdx[n] = k; });
            list.sort(function(a, b){
              return (posIdx[a.name] == null ? 99 : posIdx[a.name]) - (posIdx[b.name] == null ? 99 : posIdx[b.name]);
            });
          }
          var cards = list.map(function(x, idx){
            return '<a class="comp-slot" href="cards.html?card=' + x.id + '" title="' + x.name + '">' +
              '<span class="cs-no">' + (idx + 1) + '</span>' +
              '<span class="cs-img"><img loading="lazy" src="pool/' + x.id + '.webp" alt="" onerror="this.parentNode.classList.add(\'noimg\');this.remove()"><i>' + x.name.slice(0,1) + '</i></span>' +
              '<span class="cs-name">' + x.name + '</span></a>';
          }).join("");
          var heroes = (c.heroes || []).join(" · ");
          t += '<article class="comp-card">' +
            '<div class="cc-head"><span class="cc-rank">#' + (i+1) + '</span><b>' + c.name + '</b>' +
            '<span class="cc-tier ' + String(c.tier).toLowerCase() + '">' + c.tier + '</span>' +
            '<span class="cc-metrics">均位 ' + Number(c.avg).toFixed(2) + ' · 前四 ' + Math.round((c.top4||0)*100) +
            '% · 吃鸡 ' + Math.round((c.win||0)*100) + '% · ' + (c.sample||0).toLocaleString("en-US") + ' 局</span></div>' +
            '<div class="cc-lineup">' + cards + '</div>' +
            '<div class="cc-pos"><b>站位</b> ' + ((note && note.pos) ? note.pos + '（手工站位）' : posHint(c)) + '</div>' +
            '<div class="cc-foot"><span>推荐英雄：' + (heroes || "—") + '</span><span>' +
            (c.difficulty || "") + (c.power ? ' / 强度 ' + c.power : "") + '</span></div>' +
            '</article>';
        });
        t += '</div>';

        if(STATS.comps.length > 8){
          t += '<details class="comp-more"><summary>更多阵容（9–' + STATS.comps.length + '）</summary>' +
            '<div class="table-wrap"><table class="meta-table"><thead><tr><th>#</th><th>阵容</th><th>梯度</th><th>均位</th><th>前四</th><th>吃鸡</th><th>样本</th></tr></thead><tbody>';
          STATS.comps.slice(8).forEach(function(c, i){
            t += '<tr><td>' + (i+9) + '</td><td>' + c.name + '</td><td>' + c.tier + '</td><td>' + Number(c.avg).toFixed(2) +
              '</td><td>' + Math.round((c.top4||0)*100) + '%</td><td>' + Math.round((c.win||0)*100) + '%</td><td>' + (c.sample||0).toLocaleString("en-US") + '</td></tr>';
          });
          t += '</tbody></table></div></details>';
        }

        if(STATS.trinkets && STATS.trinkets.length){
          t += '<div class="trinket-board"><div class="cs-head">本周强势饰品 <span>按平均排名</span></div><div class="trinket-grid">';
          STATS.trinkets.forEach(function(k){
            t += '<span class="tk"><b>' + k.name + '</b><em>均位 ' + Number(k.avg).toFixed(2) + ' · 选取 ' + k.pickrate + '%</em></span>';
          });
          t += '</div></div>';
        }

        host.innerHTML = t;
        host.hidden = false;
        if(!t || !document.querySelector(".comp-card")){
          host.innerHTML = '<div class="cs-empty">卡表数据未加载（可能是旧缓存）。请按 <b>Ctrl+F5</b> 强制刷新，或换无痕窗口打开。</div>';
        }
      }
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
          return '<span class="mc-card">' + (card && card.img ? '<img src="' + card.img + '" alt="" loading="lazy">' : '') + '<em>' + x + '</em></span>';
        }).join("") + '</div>' +
        '<p class="mc-good"><b>强</b>' + c.good + '</p>' +
        '<p class="mc-bad"><b>怕</b>' + c.bad + '</p>';
      top.appendChild(d);
    });

    META.comps.slice(3).forEach(function(c){
      var tr = document.createElement("tr");
      tr.innerHTML = '<td>' + c.rank + '</td><td>' + c.name + '</td><td>' + c.line + '</td><td>' + c.good + '</td><td>' + c.bad + '</td>';
      tbody.appendChild(tr);
    });
  })();


  /* ---------- heroes & trinkets (stats-aware) ---------- */
  (function(){
    function pct(v){ return Math.round((Number(v) || 0) * 100) + "%"; }

    function renderGuideList(id, data){
      var host = document.getElementById(id);
      if(!host || !data) return;
      host.innerHTML = "";
      data.forEach(function(x){
        var row = document.createElement("div");
        row.className = "hg-item";
        var rank = x.rank || x.tier || "T2";
        var tag = x.tag || (x.winrate ? "胜率 " + pct(x.winrate) : "");
        row.innerHTML = '<span class="hg-rank ' + String(rank).toLowerCase() + '">' + rank + '</span>' +
          (tag ? '<span class="hg-tag">' + tag + '</span>' : '') +
          '<div><b>' + x.n + '</b><p>' + (x.why || "") + '</p></div>';
        host.appendChild(row);
      });
    }

    var live = (typeof STATS !== "undefined" && STATS && STATS.heroes && STATS.heroes.length) ? STATS.heroes : null;
    var heroes = live ? live.map(function(h){
      var base = (typeof HEROES !== "undefined") ? HEROES.filter(function(x){ return x.n === h.name; })[0] : null;
      var bits = [];
      if (h.top4) bits.push("前四 " + pct(h.top4));
      if (h.avg) bits.push("均位 " + Number(h.avg).toFixed(2));
      var detail = [];
      if (h.winrate) detail.push("吃鸡 " + pct(h.winrate));
      if (h.pickrate) detail.push("选取 " + h.pickrate + "%");
      return {
        n: h.name,
        rank: h.tier,
        tag: bits.join(" · "),
        why: base ? base.why : (detail.length ? detail.join(" · ") : "数据来自 " + (STATS.source || "外部统计"))
      };
    }) : (typeof HEROES !== "undefined" ? HEROES : []);

    renderGuideList("heroList", heroes);
    if(typeof TRINKETS !== "undefined") renderGuideList("trinketList", TRINKETS);

    function badge(id, hasData, label){
      var el = document.getElementById(id);
      if(!el) return;
      if(hasData){
        el.className = "stats-badge live";
        el.innerHTML = "数据：<b>" + STATS.source + "</b>" +
          (STATS.bracket ? " · " + STATS.bracket : "") +
          (STATS.region ? " · " + STATS.region : "") +
          (STATS.fetchedAt ? " · " + STATS.fetchedAt : "") +
          (STATS.sample ? " · 样本 " + (STATS.sample >= 10000 ? Math.round(STATS.sample / 10000) + " 万局" : STATS.sample) : "");
      } else {
        el.className = "stats-badge manual";
        el.textContent = label + "：社区整理（非统计） · 待接入实时数据";
      }
    }
    badge("heroStatsBadge", !!live, "英雄梯度");
    badge("metaStatsBadge", !!(typeof STATS !== "undefined" && STATS && STATS.comps && STATS.comps.length), "周报");
  })();

  /* ---------- lineup finder ---------- */
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
    if(typeof HEROES !== "undefined"){
      HEROES.forEach(function(h){ var o = document.createElement("option"); o.value = h.n; o.textContent = h.n; heroSel.appendChild(o); });
    }

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

    document.getElementById("finderGo").addEventListener("click", compute);
    renderChips();
  })();

})();
