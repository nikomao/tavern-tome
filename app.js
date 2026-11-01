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
    var fin = (typeof FINALS !== "undefined" && FINALS[t.id]) || [];
    h +=       '<div class="final-line"><span class="fl-tag">终盘 7 格</span><div class="fl-cards">';
    fin.forEach(function(nm){
      var c = cardOf(nm);
      if(c && c.img){
        h += '<button type="button" class="fc" data-card="'+nm+'"><span class="fc-img"><img src="'+c.img+'" alt="'+nm+'"></span><span class="fc-name">'+nm+'</span></button>';
      } else if(isNoArt(nm)){
        h += '<span class="fc" title="卡图暂未收录"><span class="fc-img noimg"><i>'+nm.slice(0,1)+'</i></span><span class="fc-name">'+nm+'</span></span>';
      } else {
        h += '<span class="fc generic"><span class="fc-img"><i>+</i></span><span class="fc-name">'+nm+'</span></span>';
      }
    });
    h +=       '</div></div></div>';
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

    META.comps.slice(0, 3).forEach(function(c){
      var d = document.createElement("article");
      d.className = "meta-card " + c.rank.toLowerCase();
      d.innerHTML = '<span class="mc-rank">' + c.rank + '</span>' +
        '<h3>' + c.name + '</h3>' +
        '<p class="mc-line">' + c.line + '</p>' +
        '<div class="mc-core">' + c.core.map(function(x){ return '<span>' + x + '</span>'; }).join("") + '</div>' +
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


  /* ---------- heroes & trinkets ---------- */
  (function(){
    function renderGuideList(id, data){
      var host = document.getElementById(id);
      if(!host || typeof data === "undefined") return;
      data.forEach(function(x){
        var row = document.createElement("div");
        row.className = "hg-item";
        row.innerHTML = '<span class="hg-tag">' + x.tag + '</span>' +
          '<div><b>' + x.n + '</b><p>' + x.why + '</p></div>';
        host.appendChild(row);
      });
    }
    if(typeof HEROES !== "undefined") renderGuideList("heroList", HEROES);
    if(typeof TRINKETS !== "undefined") renderGuideList("trinketList", TRINKETS);
  })();

})();
