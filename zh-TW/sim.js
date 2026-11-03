/* 模擬器模塊：02 成長數学模擬器 + 00 第一局教練模式 (10 回合) */
(function(){
  "use strict";

  function fmt(n){
    if(!isFinite(n)) return "∞";
    if(n < 1000) return String(Math.round(n));
    if(n < 10000) return Math.round(n).toLocaleString("en-US");
    if(n < 1e8) return (n/1e4).toFixed(n < 1e5 ? 1 : 0) + "萬";
    if(n < 1e12) return (n/1e8).toFixed(n < 1e9 ? 2 : 1) + "億";
    return n.toExponential(2).replace("e+","×10^");
  }

  function tierStars(n){ n = Number(n); if(!n || n < 1) return ""; return '<i class="star"></i>'.repeat(Math.min(7, n)); }

  /* ---------- 成長數学模擬器 ---------- */
  (function(){
    var $ = function(id){ return document.getElementById(id); };
    var base=$("base"), add=$("add"), mult=$("mult"), turns=$("turns");
    var canvas = $("chart");
    if(!base || !canvas) return;

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
  })();

  /* ---------- 第一局模擬器 (10 回合教練模式) ---------- */
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
      if(el.result){ el.result.hidden = true; el.result.innerHTML = ""; }
      if(el.feedback) el.feedback.hidden = true;
      render();
    }

    function render(){
      var t = SIM.turns[state.i];
      if(!t) return;
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
        '<div class="sg-fb-head">' + (o.good ? "✓ 好選择" : "✗ 可以更好") +
        " · 戰斗" + (win ? "勝利" : "失败 −" + dmg + " 血") + '</div>' +
        '<p>' + o.fb + '</p>' +
        '<div class="sg-fb-state">戰力 ' + state.power + ' / 对手 ' + opp + ' · 血量 ' + Math.max(0, state.hp) + '</div>';

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
      el.tier.innerHTML = '<span class="stars">' + tierStars(state.tier) + '</span>';
    }

    function showResult(){
      var grade = state.hp <= 0 ? "D" : state.good >= 9 ? "S" : state.good >= 7 ? "A" : state.good >= 5 ? "B" : "C";
      el.feedback.hidden = true;
      el.result.hidden = false;
      el.result.innerHTML =
        '<div class="sg-grade">' + grade + '</div>' +
        '<div class="sg-sum"><b>' + state.good + ' / 10</b> 個回合做了正確選择<br>終局：' +
        Math.max(0, state.hp) + ' 血 · ' + state.tier + ' 本 · 戰力 ' + state.power + '</div>' +
        '<p>' + (grade === "S"
          ? "節奏很標准：先站住、再升本、再收口。現在可以去看 01 的三條定律了。"
          : "記住一句話：血量健康就升本，血量危險就先買戰力；钱要花在能长大的卡上。") + '</p>' +
        '<button type="button" class="sg-next" id="sgRestart">↻ 再玩一次</button>';
      var btn = document.getElementById("sgRestart");
      if(btn) btn.addEventListener("click", reset);
    }

    reset();
  })();
})();
