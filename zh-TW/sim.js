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

    var realPanel = $("simRealPanel"), realDesc = $("simRealDesc"), playLink = $("simPlayLink");
    var hasEngEl = $("simHasEngine"), isGoldEl = $("simIsGold"), engTurnEl = $("simEngTurn"), engTurnOut = $("o-engTurn");
    var lblLin = $("l-linear"), lblCom = $("l-compound"), lblRat = $("l-ratio");
    var lgLin = $("lgLinear"), lgCom = $("lgCompound"), lgHint = $("lgHint");
    var compBtns = document.querySelectorAll("[data-comp-sim]");

    var COMP_SIMS = {
      dragon_shield: {
        name: "龍·執念聖盾術（永久保留模型）",
        desc: "<b>思路：</b>第 7–8 回合湊齊「執念詩心龍 + 赤紅守備巨龍 + 诺茲多姆的子嗣」，把戰斗加倍屬性永久锁到場上。没詩心龍只能靠每回合戰吼加固定攻血。",
        turns: 13, defEngTurn: 7, start: 6, linStep: 14, growthBase: 2.05, growthGold: 2.55
      },
      mech_volumizer: {
        name: "機械·擴音機+达卡莱（合體次數模型）",
        desc: "<b>思路：</b>合體全喂同一宿主，8 回合前後補齊「多面辅助無人機 + 达卡莱附魔師」（配 B-Box 再雙吸），合體數 × 回合末次數實現二次起飛。",
        turns: 14, defEngTurn: 8, start: 6, linStep: 18, growthBase: 2.0, growthGold: 2.5
      },
      aberration_discard: {
        name: "畸變體·克熙尔+达卡莱（棄牌乘數模型）",
        desc: "<b>思路：</b>留 3 張低費手牌讓「神秘的克熙尔 + 达卡莱附魔師」每回合末棄 6 張疊加「邪火咒龍」與「預言者阿菲拉斯」，缺达卡莱只剩一半慢滚。",
        turns: 14, defEngTurn: 8, start: 6, linStep: 16, growthBase: 2.0, growthGold: 2.5
      },
      quilboar_choose_one: {
        name: "野豬人·二選一寶石（單價 × 批量泼洒）",
        desc: "<b>思路：</b>「鲜血精研者」先抬高鮮血寶石單價，「刺棘開拓者 + 極速野豬騎士」把單價一次性泼給全队野豬人。只泼不抬單價頂多两三百。",
        turns: 14, defEngTurn: 8, start: 6, linStep: 15, growthBase: 2.0, growthGold: 2.5
      }
    };
    var activeCompKey = null;

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

    function syncRealUI(){
      var isReal = !!(activeCompKey && COMP_SIMS[activeCompKey]);
      if(realPanel) realPanel.hidden = !isReal;
      Array.prototype.forEach.call(compBtns, function(btn){
        btn.classList.toggle("on", btn.getAttribute("data-comp-sim") === activeCompKey);
      });
      if(isReal){
        var cfg = COMP_SIMS[activeCompKey];
        if(realDesc) realDesc.innerHTML = cfg.desc;
        if(playLink) playLink.href = "play.html?comp=" + encodeURIComponent(activeCompKey);
        if(lblLin) lblLin.textContent = "缺核心（純線性）";
        if(lblCom) lblCom.textContent = "實戰陣容終盤";
        if(lblRat) lblRat.textContent = "引擎倍差";
        if(lgLin) lgLin.textContent = "缺引擎線性打工";
        if(lgCom) lgCom.textContent = "當前配置走勢";
        if(lgHint) lgHint.textContent = "· 垂直虚線為引擎到位回合 · 横線為 1 萬門槛";
      } else {
        if(lblLin) lblLin.textContent = "純加法";
        if(lblCom) lblCom.textContent = "複利";
        if(lblRat) lblRat.textContent = "倍差";
        if(lgLin) lgLin.textContent = "加法";
        if(lgCom) lgCom.textContent = "複利";
        if(lgHint) lgHint.textContent = "· 两條線的纵轴差距，就是「乘數」的價值";
      }
    }

    function buildSeries(){
      if(activeCompKey && COMP_SIMS[activeCompKey]){
        var cfg = COMP_SIMS[activeCompKey];
        var N = cfg.turns;
        var hasEng = hasEngEl ? hasEngEl.checked : true;
        var isGold = isGoldEl ? isGoldEl.checked : false;
        var eTurn = engTurnEl ? +engTurnEl.value : cfg.defEngTurn;
        if(engTurnOut) engTurnOut.textContent = "T" + eTurn;
        if(turns) turns.value = N;
        $("o-turns").textContent = N;
        $("o-base").textContent = cfg.start;
        $("o-add").textContent = cfg.linStep;
        $("o-mult").textContent = hasEng ? (isGold ? 2 : 1) : 0;

        var linArr = [], comArr = [];
        for(var t = 0; t <= N; t++){
          var lv = cfg.start + cfg.linStep * t;
          linArr.push(lv);
          if(!hasEng || t < eTurn){
            comArr.push(lv);
          } else {
            var rate = isGold ? cfg.growthGold : cfg.growthBase;
            var prev = comArr[t - 1];
            // Ramp early turns after arrival cleanly then compound smoothly
            var stepMult = t === eTurn ? 1.45 : rate;
            comArr.push(Math.round(prev * stepMult + cfg.linStep));
          }
        }
        return {
          N: N, linArr: linArr, comArr: comArr,
          markerTurn: hasEng ? eTurn : -1,
          showTenK: true
        };
      }

      var b = +base.value, a = +add.value, m = +mult.value, N = +turns.value;
      $("o-base").textContent = b;
      $("o-add").textContent = a;
      $("o-mult").textContent = m;
      $("o-turns").textContent = N;
      var linArr2 = [], comArr2 = [];
      for(var i = 0; i <= N; i++){
        linArr2.push(b + a * i);
        comArr2.push(b * Math.pow(2, m * i));
      }
      return { N: N, linArr: linArr2, comArr: comArr2, markerTurn: -1, showTenK: false };
    }

    function draw(){
      syncRealUI();
      var ser = buildSeries();
      var N = ser.N, linArr = ser.linArr, comArr = ser.comArr;
      var lin = linArr[N], com = comArr[N];
      $("r-linear").textContent = fmt(lin);
      $("r-compound").textContent = fmt(com);
      var ratio = com / Math.max(lin, 0.0001);
      $("r-ratio").textContent = (ratio < 10 ? ratio.toFixed(1) : fmt(ratio)) + "×";

      var maxV = Math.max(lin, com, ser.showTenK ? 11000 : 10);
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
        ctx.fillText("T" + t, x, H - B + 12);
      }

      function px(t){ return L + (t / N) * pw; }

      // 10k threshold dashed line in Real Comp mode
      if(ser.showTenK){
        var y10k = py(10000);
        if(y10k >= T && y10k <= T + ph){
          ctx.save();
          ctx.setLineDash([5, 4]);
          ctx.strokeStyle = "rgba(110,231,168,.42)";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(L, y10k); ctx.lineTo(W - R, y10k); ctx.stroke();
          ctx.fillStyle = "#6ee7a8";
          ctx.font = "10.5px sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "bottom";
          ctx.fillText("1萬門槛", L + 6, y10k - 3);
          ctx.restore();
        }
      }

      // Vertical engine inflection line
      if(ser.markerTurn > 0 && ser.markerTurn <= N){
        var mx = px(ser.markerTurn);
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(240,201,121,.52)";
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(mx, T); ctx.lineTo(mx, T + ph); ctx.stroke();
        ctx.fillStyle = "#f0c979";
        ctx.font = "10.5px sans-serif";
        ctx.textAlign = ser.markerTurn >= N - 1 ? "right" : "left";
        ctx.textBaseline = "top";
        ctx.fillText("引擎 T" + ser.markerTurn, mx + (ser.markerTurn >= N - 1 ? -4 : 4), T + 4);
        ctx.restore();
      }

      // compound fill
      var grad = ctx.createLinearGradient(0, T, 0, T+ph);
      grad.addColorStop(0, "rgba(240,201,121,.22)");
      grad.addColorStop(1, "rgba(240,201,121,0)");
      ctx.beginPath();
      ctx.moveTo(px(0), py(comArr[0]));
      for(var i2 = 1; i2 <= N; i2++){ ctx.lineTo(px(i2), py(comArr[i2])); }
      ctx.lineTo(px(N), T+ph); ctx.lineTo(px(0), T+ph); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();

      // linear
      ctx.beginPath();
      ctx.moveTo(px(0), py(linArr[0]));
      for(var j = 1; j <= N; j++){ ctx.lineTo(px(j), py(linArr[j])); }
      ctx.strokeStyle = "#8d6f4f"; ctx.lineWidth = 2; ctx.stroke();

      // compound
      ctx.beginPath();
      ctx.moveTo(px(0), py(comArr[0]));
      for(var q = 1; q <= N; q++){ ctx.lineTo(px(q), py(comArr[q])); }
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
        ctx.fillStyle = com >= 10000 ? "#6ee7a8" : "#f2dfae";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(fmt(com), Math.min(ex - 8, W - 4), Math.max(ey - 8, 14));
      }
    }

    fitCanvas(); draw();
    [base, add, mult, turns].forEach(function(el){
      el.addEventListener("input", function(){
        activeCompKey = null;
        draw();
      });
    });
    Array.prototype.forEach.call(compBtns, function(btn){
      btn.addEventListener("click", function(){
        var k = btn.getAttribute("data-comp-sim");
        if(!COMP_SIMS[k]) return;
        activeCompKey = k;
        Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function(pb){ pb.classList.remove("on"); });
        if(engTurnEl) engTurnEl.value = COMP_SIMS[k].defEngTurn;
        if(hasEngEl) hasEngEl.checked = true;
        draw();
      });
    });
    [hasEngEl, isGoldEl, engTurnEl].forEach(function(el){
      if(!el) return;
      el.addEventListener("input", draw);
      el.addEventListener("change", draw);
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
