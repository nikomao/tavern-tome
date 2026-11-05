/* 渲染與交互 */
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
      return '<span class="ci-thumb" data-card="'+name+'" title="懸停卡圖查看完整卡牌效果"><img src="'+c.img+'" alt="'+name+'"></span>';
    }
    var tip = isNoArt(name) ? '卡圖暂未收錄（37.0 新卡）' : '暂無卡圖';
    return '<span class="ci-thumb noimg" data-card="'+name+'" title="'+tip+'"><i>'+name.slice(0,1)+'</i></span>';
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
      return '<button type="button" class="fc" data-card="'+nm+'" title="点擊查看卡牌效果">' +
        (st ? '<span class="fc-tier"><span class="stars">'+st+'</span></span>' : '') +
        '<span class="fc-img"><img src="'+c.img+'" alt="'+nm+'"></span><span class="fc-name">'+nm+'</span></button>';
    }
    if(isNoArt(nm)){
      return '<button type="button" class="fc" data-card="'+nm+'" title="点擊查看卡牌效果"><span class="fc-img noimg"><i>'+nm.slice(0,1)+'</i></span><span class="fc-name">'+nm+'</span></button>';
    }
    return '<button type="button" class="fc generic" data-card="'+nm+'" title="点擊查看卡牌效果"><span class="fc-img"><i>+</i></span><span class="fc-name">'+nm+'</span></button>';
  }

  function planBlock(t){
    var plans = (typeof PLANS !== "undefined" && PLANS[t.id]) ? PLANS[t.id] : null;
    if(!plans){
      var fin = (typeof FINALS !== "undefined" && FINALS[t.id]) || [];
      plans = [{ k: "標准", when: "按这個順序擺。", slots: fin }];
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
    var h = '<details class="tribe-all"><summary>该種族全部卡牌 <b>' + list.length + '</b> 張 <span>含歷史卡 · 点開查看</span></summary>';
    h += '<div class="tribe-grid">';
    list.forEach(function(c){
      h += '<a class="tc" href="cards.html?card=' + c.i + '" title="' + c.n + '">' +
        '<span class="tc-img">' + (c.m ? '<img loading="lazy" src="../pool/' + c.i + '.webp" alt="">' : '<i>?</i>') + '</span>' +
        '<span class="tc-name">' + c.n + '</span>' +
        '<span class="tc-meta stars">' + tierStars(c.t) + '</span></a>';
    });
    h += '</div>';
    h += '<a class="tribe-more" href="cards.html?race=' + race + '">在卡牌池页筛選「' + t.name + '」→</a>';
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

  function compTeachingHTML(c, note, rank){
    if(!note) return "";
    var defaultOpen = rank < 2 ? " open" : "";
    var h = '<details class="comp-teaching"' + defaultOpen + ' id="teach-' + (c.key || "") + '">';
    h += '<summary class="ct-summary">';
    h += '<span class="ct-summary-title"><b>💡 新手實操教学</b>：卡牌流向 · 數值推演舉例 · 牌面替換过程</span>';
    h += '<span class="ct-summary-hint">点按展開/收起 ▾</span>';
    h += '</summary>';
    h += '<div class="ct-body">';

    // 1. 卡牌对應與资源流向
    if(note.cardsMapping){
      var cm = note.cardsMapping;
      h += '<div class="ct-block ct-flow">';
      h += '<div class="ct-block-head"><span class="ct-badge flow">🎯 卡牌对應與资源流向</span> 资源從哪來？贴給誰？誰負责加倍？</div>';
      h += '<div class="ct-flow-grid">';
      h += '<div class="ct-flow-item"><span class="ct-role src">1. 资源產出（發薪水）</span><p>' + cm.source + '</p></div>';
      h += '<div class="ct-flow-arrow">→</div>';
      h += '<div class="ct-flow-item"><span class="ct-role eng">2. 乘數放大（加杠杆）</span><p>' + cm.engine + '</p></div>';
      h += '<div class="ct-flow-arrow">→</div>';
      h += '<div class="ct-flow-item highlight"><span class="ct-role car">3. 唯一承載（贴給誰）</span><p><b>' + cm.carrier + '</b></p></div>';
      h += '<div class="ct-flow-arrow">→</div>';
      h += '<div class="ct-flow-item"><span class="ct-role fin">4. 決勝終结</span><p>' + cm.finisher + '</p></div>';
      h += '</div></div>';
    }

    // 2. 數值推演舉例
    if(note.mathExample && note.mathExample.steps){
      var me = note.mathExample;
      h += '<div class="ct-block ct-math">';
      h += '<div class="ct-block-head"><span class="ct-badge math">🔢 實操數值推演舉例</span> ' + me.title + '</div>';
      h += '<div class="ct-math-list">';
      me.steps.forEach(function(s, idx){
        h += '<div class="ct-math-step">';
        h += '<div class="ct-math-step-head"><b>階段 ' + (idx + 1) + '：' + s.round + '</b><span class="ct-math-state">' + s.state + '</span></div>';
        h += '<p class="ct-math-desc">' + s.math + '</p>';
        h += '</div>';
      });
      h += '</div></div>';
    }

    // 3. 陣容替換过程
    if(note.transitions && note.transitions.length){
      h += '<div class="ct-block ct-trans">';
      h += '<div class="ct-block-head"><span class="ct-badge trans">🔄 陣容过渡與替換變化</span> 前期留什麼？核心來時誰換誰？決賽淘汰誰？</div>';
      h += '<div class="ct-trans-grid">';
      note.transitions.forEach(function(tr){
        h += '<div class="ct-trans-col">';
        h += '<div class="ct-trans-title">' + tr.phase + '</div>';
        if(tr.pick) h += '<div class="ct-trans-row"><span class="ct-tlabel pick">抓牌</span>' + tr.pick + '</div>';
        if(tr.hold) h += '<div class="ct-trans-row"><span class="ct-tlabel hold">保留</span>' + tr.hold + '</div>';
        if(tr.replace) h += '<div class="ct-trans-row"><span class="ct-tlabel rep">替換</span><b>' + tr.replace + '</b></div>';
        if(tr.trigger) h += '<div class="ct-trans-row"><span class="ct-tlabel trig">信號</span>' + tr.trigger + '</div>';
        if(tr.drop) h += '<div class="ct-trans-row"><span class="ct-tlabel drop">淘汰</span>' + tr.drop + '</div>';
        if(tr.final) h += '<div class="ct-trans-row"><span class="ct-tlabel fin">決勝</span>' + tr.final + '</div>';
        h += '</div>';
      });
      h += '</div></div>';
    }

    // 4. 新手避坑
    if(note.mistakes && note.mistakes.length){
      h += '<div class="ct-block ct-mistakes">';
      h += '<div class="ct-block-head"><span class="ct-badge mis">⚠️ 新手致命避坑</span> 照著玩為什麼还是速八？</div>';
      h += '<ul class="ct-mis-list">';
      note.mistakes.forEach(function(m){
        h += '<li>' + m + '</li>';
      });
      h += '</ul></div>';
    }

    h += '</div></details>';
    return h;
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

    var teachingHtml = compTeachingHTML(c, note, 0);

    return '<div class="tribe-best"><div class="tb-head"><span class="tb-label">本週最佳</span><b>' + c.name + '</b>' +
      '<span class="cc-tier ' + String(c.tier).toLowerCase() + '" title="' + tierName(c.tier) + '">' + c.tier + '</span>' +
      '<span class="tb-meta">均位 ' + Number(c.avg).toFixed(2) + ' · 前四 ' + Math.round((c.top4 || 0) * 100) +
      '% · 奪冠 ' + Math.round((c.win || 0) * 100) + '%</span>' +
      '<a class="tb-play" href="play.html?comp=' + c.key + '">對局模式</a></div>' +
      '<div class="tb-cards">' + cards + '</div>' +
      teachingHtml +
      '</div>';
  }

  function scalingHTML(t){
    if(!t.scaling) return "";
    var sc = t.scaling;
    var stagesHtml = "";
    if(sc.pipeline && sc.pipeline.length){
      stagesHtml = '<div class="sc-stages">' + sc.pipeline.map(function(st){
        return '<div class="sc-stage"><div class="sc-stage-title">' + st.stage + '</div><div class="sc-stage-desc">' + st.desc + '</div></div>';
      }).join("") + '</div>';
    }
    var exampleHtml = "";
    if(sc.concreteExample){
      exampleHtml = '<div class="sc-box sc-example-box" style="grid-column:1/-1;border-color:rgba(226,180,95,.4);background:rgba(226,180,95,.06);">' +
        '<div class="sc-title" style="color:var(--gold-2);"><span class="sc-badge math">🔢 實操數值推演舉例</span> ' + (sc.concreteExample.title || '成長算式推演') + '</div>' +
        '<p class="sc-desc" style="color:var(--ink);line-height:1.6;">' + sc.concreteExample.math + '</p>' +
        '</div>';
    }
    return '<div class="scaling-wrap">' +
      '<h4>種族成長流水線：资源怎麼用？體質贴給誰？怎麼破萬？<span class="h4-hint">從加法到複利的實操指引</span></h4>' +
      '<div class="scaling-grid">' +
        '<div class="sc-box"><div class="sc-title"><span class="sc-badge resource">核心资源</span> 资源從何而來？怎麼轉？</div><p class="sc-desc">' + sc.resource + '</p></div>' +
        '<div class="sc-box"><div class="sc-title"><span class="sc-badge carrier">載體選择</span> 體質贴給誰？誰承載萬点？</div><p class="sc-desc">' +
          (sc.carrierTarget ? '<b style="color:var(--gold-2);display:block;margin-bottom:4px;">🎯 锁定宿主：' + sc.carrierTarget + '</b>' : '') +
          sc.carrier + '</p></div>' +
        exampleHtml +
      '</div>' +
      (stagesHtml ? '<div class="sc-pipeline-box"><div class="sc-pipeline-head">📈 從零到上萬：三階膨胀流水線</div>' + stagesHtml + '</div>' : '') +
      (sc.proTip ? '<div class="sc-protip"><span class="sc-protip-tag">💡 實操避坑：</span><span>' + sc.proTip + '</span></div>' : '') +
    '</div>';
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
    h +=       '<div class="core-wrap"><h4>核心組件<span class="h4-hint">懸停 / 点擊卡圖，查看完整卡牌效果</span></h4><ul class="core-list">';
    t.cores.forEach(function(x){
      var c = cardOf(x.n);
      var sub = "";
      if(c){
        var bits = [];
        if(c.n && c.n !== x.n) bits.push(c.n);
        if(c.k === "spell") bits.push("旅店法術");
        else if(tierByName(x.n) != null) bits.push((typeof tierStars === "function" ? tierStars(tierByName(x.n)) : ""));
        sub = bits.join(" · ");
      }
      h += '<li class="core-item">' +
             thumbHTML(x.n) +
             '<span class="ci-main">' +
               '<span class="ci-head"><b class="card-name-btn" data-card="'+x.n+'" role="button" tabindex="0" title="点擊查看卡牌效果">'+x.n+'</b><span class="cr">'+x.r+'</span></span>' +
               (sub ? '<span class="ci-sub">'+sub+'</span>' : '') +
               '<span class="cd">'+x.d+'</span>' +
             '</span>' +
           '</li>';
    });
    h +=       '</ul></div>';
    h +=       '<div class="pos-wrap"><h4>標准站位</h4><div class="posbar">';
    t.position.forEach(function(p,i){
      h += '<div class="pb '+p.k+'"><span class="n">'+(i+1)+'</span><span class="r">'+p.r+'</span><span class="m">'+p.m+'</span></div>';
    });
    h +=       '</div><p class="pos-hint">'+t.posHint+'</p>';
    h +=       planBlock(t) + '</div>';
    h +=     '</div>';
    h +=     scalingHTML(t);
    h +=     '<div class="tp-grid">';
    h +=       '<div class="tp-cell"><h4>运营節奏</h4><div class="curve">';
    t.curve.forEach(function(cv){
      h += '<div><span>'+cv.k+'</span><b>'+cv.v+'</b></div>';
    });
    h +=       '</div></div>';
    h +=       '<div class="tp-cell"><h4>為什麼強</h4><ul>';
    t.why.forEach(function(w){ h += '<li>'+w+'</li>'; });
    h +=       '</ul></div>';
    h +=       '<div class="tp-cell"><h4>天敵與弱点</h4><ul>';
    t.weak.forEach(function(w){ h += '<li>'+w+'</li>'; });
    h +=       '</ul></div>';
    h +=       '<div class="tp-cell"><h4>常见错誤</h4><ul>';
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
    if(window.enhanceCardMentions) window.enhanceCardMentions(panelWrap);

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

  /* ---------- lineup plan tabs & best comp guide toggle ---------- */
  (function(){
    var wrap = document.getElementById("tribePanels");
    if(!wrap) return;
    wrap.addEventListener("click", function(e){
      var guideBtn = e.target.closest ? e.target.closest(".tb-toggle-guide") : null;
      if(guideBtn){
        var key = guideBtn.getAttribute("data-comp");
        var guide = document.getElementById("guide-" + key);
        if(guide){
          var isClosed = guide.classList.toggle("collapsed");
          guideBtn.textContent = isClosed ? "展開成長指南 ▾" : "收起成長指南 ▴";
        }
        return;
      }
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
            var isActive = a.getAttribute("href") === "#"+en.target.id;
            a.classList.toggle("active", isActive);
            if(isActive){
              var navEl = document.getElementById("nav");
              if(navEl && navEl.scrollWidth > navEl.clientWidth){
                try {
                  a.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                } catch(e){}
              }
            }
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
    var popLink = document.getElementById("cpLink");
    var popClose = document.getElementById("cpClose");
    var TOUCH = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

    function renderPopExtra(c, cardName){
      var extraBox = pop.querySelector(".cp-extra");
      if(!extraBox){
        extraBox = document.createElement("div");
        extraBox.className = "cp-extra";
        popText.parentNode.insertBefore(extraBox, popLink);
      }
      var parts = [];
      if(c && c.a != null && c.h != null){
        parts.push('<span class="cp-golden">✨ 金色 <b>' + (c.a * 2) + '/' + (c.h * 2) + '</b> (加倍)</span>');
      }
      if(cardName && typeof COMP_NOTES !== "undefined"){
        for(var k in COMP_NOTES){
          var m = COMP_NOTES[k].cardsMapping;
          if(!m) continue;
          if(m.carrier && m.carrier.indexOf(cardName) !== -1){
            parts.push('<span class="cp-role carrier">🎯 核心承載宿主</span>');
            break;
          } else if(m.engine && m.engine.indexOf(cardName) !== -1){
            parts.push('<span class="cp-role engine">⚡ 核心乘數引擎</span>');
            break;
          } else if(m.finisher && m.finisher.indexOf(cardName) !== -1){
            parts.push('<span class="cp-role finisher">👑 終局終结位</span>');
            break;
          }
        }
      }
      extraBox.innerHTML = parts.join(" ");
    }

    function formatCardKeywords(text){
      return String(text || "")
        .replace(/戰吼/g, '<span class="cp-kw battlecry">戰吼</span>')
        .replace(/死亡之聲/g, '<span class="cp-kw deathrattle">死亡之聲</span>')
        .replace(/聖盾術/g, '<span class="cp-kw shield">聖盾術</span>')
        .replace(/烈毒|劇毒/g, '<span class="cp-kw poison">烈毒</span>')
        .replace(/風怒/g, '<span class="cp-kw windfury">風怒</span>')
        .replace(/嘲諷/g, '<span class="cp-kw taunt">嘲諷</span>')
        .replace(/複生/g, '<span class="cp-kw reborn">複生</span>')
        .replace(/合體/g, '<span class="cp-kw magnetic">合體</span>');
    }

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
      if(c.k === "spell") meta.push("旅店法術");
      else {
        if(c.t != null) meta.push(tierStars(c.t));
        if(c.a != null) meta.push(c.a + " / " + c.h);
      }
      if(c.r) meta.push(c.r);
      popMeta.innerHTML = meta.join(" · ");
      popText.innerHTML = formatCardKeywords(c.x || "暂未收錄卡牌描述");
      renderPopExtra(c, name);
      return true;
    }

    var POOL_BY_ID = {};
    if(typeof POOL !== "undefined"){ POOL.forEach(function(x){ POOL_BY_ID[x.i] = x; }); }
    if(typeof EXTRA_CARDS !== "undefined"){ Object.keys(EXTRA_CARDS).forEach(function(k){ POOL_BY_ID[k] = EXTRA_CARDS[k]; }); }
    var RACE_CN = { BEAST:"野獸", DEMON:"惡魔", DRAGON:"龍", ELEMENTAL:"元素", MECHANICAL:"機械",
      MURLOC:"魚人", NAGA:"納迦", PIRATE:"海盜", QUILBOAR:"野豬人", UNDEAD:"不死族", ABERRATION:"畸變體" };

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
      var en = (window.__lang === "en" && window.EN_CARDS && window.EN_CARDS[id]) ? window.EN_CARDS[id] : null;
      var cName = (en ? en.n : c.n) || "";
      popName.innerHTML = "<b>" + cName + "</b>";
      var meta = [];
      if(c.t != null) meta.push(tierStars(c.t));
      if(c.a != null) meta.push(c.a + " / " + c.h);
      var EN_RACE = { BEAST:"Beast", DEMON:"Demon", DRAGON:"Dragon", ELEMENTAL:"Elemental", MECHANICAL:"Mech",
        MURLOC:"Murloc", NAGA:"Naga", PIRATE:"Pirate", QUILBOAR:"Quilboar", UNDEAD:"Undead", ABERRATION:"Aberration" };
      var isEn = (window.__lang === "en");
      var races = String(c.r || "").split("/").map(function(r){ return isEn ? (EN_RACE[r] || r) : (RACE_CN[r] || r); }).filter(Boolean);
      if(races.length) meta.push(races.join(" / "));
      popMeta.innerHTML = meta.join(" · ");
      var rawDesc = (en && en.x) ? en.x : (c.x || "暂無卡牌描述");
      popText.innerHTML = formatCardKeywords(rawDesc);
      renderPopExtra(c, cName);
      return true;
    }

    function getCardTarget(target){
      if(!target || !target.closest) return null;
      return target.closest("[data-card-id], [data-card], .card-chip, .card-name-btn, .comp-slot, .cr-slot, .tb-card, .fc, .tc, .mc-card, .cmp-slot, .hc-card-item, .demo-card");
    }

    document.addEventListener("mouseover", function(e){
      if(TOUCH) return;
      var el = getCardTarget(e.target);
      if(!el){
        if(e.target.closest && !e.target.closest("#cardPop")){
          pop.hidden = true;
        }
        return;
      }
      var id = el.getAttribute("data-card-id");
      var name = el.getAttribute("data-card");
      if(!id && !name){
        var nameEl = el.querySelector ? el.querySelector(".cs-name, .tb-name, .fc-name, .tc-name, .hc-ci-name, .dc-name, em, b") : null;
        if(nameEl) name = nameEl.textContent.trim();
      }
      var ok = id ? fillById(id) : (name ? fillCard(name) : false);
      if(!ok){ pop.hidden = true; return; }
      pop.hidden = false;
      placePop(e.clientX, e.clientY);
    });

    if(popClose) popClose.addEventListener("click", function(){ pop.hidden = true; });

    // 移動端/iPad 禁用 touch hover 與 touchend，徹底避免滑屏誤觸
    // 只有明確点擊卡牌時由 card-modal.js 彈出居中卡牌詳情模態框
    if(TOUCH && pop){
      pop.style.display = "none";
    }

    document.addEventListener("mouseout", function(e){
      if(TOUCH) return;
      var el = getCardTarget(e.target);
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

    document.addEventListener("mousemove", function(e){
      if(!pop.hidden){
        placePop(e.clientX, e.clientY);
      }
    });

    document.addEventListener("click", function(e){
      var el = getCardTarget(e.target);
      if(!el){
        if(e.target.closest && (e.target.closest("#cardPop") || e.target.closest("[data-card-id],[data-card]"))) return;
        pop.hidden = true; return;
      }
      var id = el.getAttribute("data-card-id");
      var name = el.getAttribute("data-card");
      if(!id && !name){
        var nameEl = el.querySelector ? el.querySelector(".cs-name, .tb-name, .fc-name, .tc-name, .hc-ci-name, .dc-name, em, b") : null;
        if(nameEl) name = nameEl.textContent.trim();
      }
      if(window.openCardModal && (id || name)){
        e.preventDefault();
        window.openCardModal(id || name);
        pop.hidden = true;
        return;
      }
      var r = el.getBoundingClientRect();
      var ok = id ? fillById(id) : (name ? fillCard(name) : false);
      if(ok){
        pop.hidden = false;
        placePop(r.left + r.width / 2, r.bottom - 10);
      }
    });

    if(!TOUCH) window.addEventListener("scroll", function(){ pop.hidden = true; }, { passive: true });
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

  /* 定律二：金幣 = 觸發次數 */
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
      note.textContent = "对手從左边開始，连續打三次。";
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
        note.innerHTML = "壞站位：<b>大哥、铜須、巴琳达</b>全没了；好站位：只死了三個小怪，<b>大哥和铜須还活著</b>。";
        btn.disabled = false;
      }, 220 + 3 * 900));
    }
    btn.addEventListener("click", play);
    reset();
    onceVisible(root, function(){ if(!reduceMotion) play(); });
  })();

  /* 02：加倍积木 */
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

  /* 02：乘數鏈逐段点亮 */
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
      var savedView = "cards";
      try { savedView = localStorage.getItem("tt-comp-view") || "cards"; } catch(e){}
      var st = { hero: "", tier: "all", sort: "avg", q: "", heroOnly: false, bannedTribes: [], view: savedView };

      var DB = {};
      if(typeof POOL !== "undefined") POOL.forEach(function(c){ DB[c.i] = c; });
      if(typeof EXTRA_CARDS !== "undefined") Object.keys(EXTRA_CARDS).forEach(function(k){ DB[k] = EXTRA_CARDS[k]; });
      function tierOfCard(id){ var c = DB[id]; return c && c.t != null ? c.t : null; }

      var heroNames = [];
      var heroInfoMap = {};
      (STATS.heroes || []).forEach(function(h){ heroInfoMap[h.name] = h; });

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

      /* Hero Searchable Filter Picker */
      var hpBtn = document.getElementById("hpBtn");
      var hpVal = document.getElementById("hpVal");
      var hpTier = document.getElementById("hpTier");
      var hpClear = document.getElementById("hpClear");
      var hpPop = document.getElementById("hpPop");
      var hpSearch = document.getElementById("hpSearch");
      var hpFilters = document.getElementById("hpFilters");
      var hpList = document.getElementById("hpList");
      var hpCount = document.getElementById("hpCount");
      var hpReset = document.getElementById("hpReset");
      var compHeroOnly = document.getElementById("compHeroOnly");
      var currentFilterTier = "all";

      function updatePickerUI(name){
        if(!hpVal) return;
        if(name){
          hpVal.textContent = name;
          var info = heroInfoMap[name];
          if(info && info.tier){
            hpTier.textContent = info.tier;
            hpTier.className = "hp-tier " + info.tier.toLowerCase();
            hpTier.hidden = false;
          } else {
            hpTier.hidden = true;
          }
          if(hpClear) hpClear.hidden = false;
          if(compHeroOnly) compHeroOnly.hidden = false;
        } else {
          hpVal.textContent = "不選英雄";
          if(hpTier) hpTier.hidden = true;
          if(hpClear) hpClear.hidden = true;
          if(compHeroOnly){
            compHeroOnly.hidden = true;
            compHeroOnly.classList.remove("on");
            st.heroOnly = false;
          }
        }
      }

      function selectHero(name){
        st.hero = name || "";
        try { localStorage.setItem("tt-comp-hero", st.hero); } catch(e){}
        if(heroSel) heroSel.value = st.hero;
        updatePickerUI(st.hero);
        closePicker();
        renderBoard();
      }

      function openPicker(){
        if(!hpPop) return;
        hpPop.hidden = false;
        if(hpBtn) hpBtn.setAttribute("aria-expanded", "true");
        if(hpSearch){
          hpSearch.value = "";
          setTimeout(function(){ try { hpSearch.focus(); } catch(e){} }, 40);
        }
        currentFilterTier = "all";
        if(hpFilters){
          Array.prototype.forEach.call(hpFilters.children, function(b){
            b.classList.toggle("on", b.getAttribute("data-tier") === "all");
          });
        }
        renderPickerItems();
      }

      function closePicker(){
        if(!hpPop) return;
        hpPop.hidden = true;
        if(hpBtn) hpBtn.setAttribute("aria-expanded", "false");
      }

      function escapeHtml(str){
        return String(str || "").replace(/[&<>"']/g, function(m){
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
      }

      function highlightMatch(text, q){
        if(!q) return escapeHtml(text);
        var idx = text.toLowerCase().indexOf(q.toLowerCase());
        if(idx < 0) return escapeHtml(text);
        return escapeHtml(text.slice(0, idx)) +
          '<mark>' + escapeHtml(text.slice(idx, idx + q.length)) + '</mark>' +
          escapeHtml(text.slice(idx + q.length));
      }

      function renderPickerItems(){
        if(!hpList) return;
        var q = (hpSearch ? hpSearch.value : "").trim();
        var matched = heroNames.filter(function(n){
          var info = heroInfoMap[n] || {};
          if(currentFilterTier !== "all" && info.tier !== currentFilterTier) return false;
          if(q && n.toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
          return true;
        });

        var html = '';
        if(!q && currentFilterTier === "all"){
          html += '<div class="hp-item hp-item-none" data-hero="">✕ 不選英雄（顯示全局陣容）</div>';
        }

        if(!matched.length){
          html += '<div class="hp-empty">未找到匹配英雄，換個搜索詞試試</div>';
        } else {
          matched.forEach(function(n){
            var info = heroInfoMap[n] || {};
            var comps = (STATS.heroComps && STATS.heroComps[n]) || [];
            var isSel = (st.hero === n);
            html += '<div class="hp-item' + (isSel ? ' is-selected' : '') + '" data-hero="' + escapeHtml(n) + '" role="option" aria-selected="' + (isSel ? 'true' : 'false') + '">' +
              '<span class="hp-item-name">' + highlightMatch(n, q) + '</span>' +
              (info.tier ? '<span class="hp-item-tier ' + info.tier.toLowerCase() + '">' + info.tier + '</span>' : '') +
              (info.avg != null ? '<span class="hp-item-meta">均位 ' + Number(info.avg).toFixed(2) + (info.top4 ? ' · ' + Math.round(info.top4 * 100) + '% 前四' : '') + '</span>' : '') +
              (comps.length ? '<span class="hp-item-comps">适配 ' + comps.length + ' 套</span>' : '') +
              '</div>';
          });
        }

        hpList.innerHTML = html;
        if(hpCount){
          hpCount.textContent = (!q && currentFilterTier === "all") ?
            ("共 " + heroNames.length + " 位英雄") :
            ("找到 " + matched.length + " 位英雄");
        }
      }

      if(hpBtn){
        hpBtn.addEventListener("click", function(e){
          e.stopPropagation();
          if(hpPop && !hpPop.hidden) closePicker();
          else openPicker();
        });
      }
      if(hpClear){
        hpClear.addEventListener("click", function(e){
          e.stopPropagation();
          selectHero("");
        });
      }
      if(hpReset){
        hpReset.addEventListener("click", function(){
          selectHero("");
        });
      }
      if(hpSearch){
        hpSearch.addEventListener("input", function(){
          renderPickerItems();
        });
        hpSearch.addEventListener("keydown", function(e){
          if(e.key === "Escape"){
            closePicker();
          } else if(e.key === "Enter"){
            var firstItem = hpList.querySelector(".hp-item[data-hero]");
            if(firstItem){
              selectHero(firstItem.getAttribute("data-hero"));
            }
          }
        });
      }
      if(hpFilters){
        hpFilters.addEventListener("click", function(e){
          var b = e.target.closest("button[data-tier]");
          if(!b) return;
          currentFilterTier = b.getAttribute("data-tier") || "all";
          Array.prototype.forEach.call(hpFilters.children, function(btn){
            btn.classList.toggle("on", btn === b);
          });
          renderPickerItems();
        });
      }
      if(hpList){
        hpList.addEventListener("click", function(e){
          var item = e.target.closest(".hp-item");
          if(!item) return;
          var hName = item.getAttribute("data-hero") || "";
          selectHero(hName);
        });
      }
      document.addEventListener("click", function(e){
        if(hpPop && !hpPop.hidden && !e.target.closest("#heroPicker")){
          closePicker();
        }
      });
      document.addEventListener("keydown", function(e){
        if(e.key === "Escape" && hpPop && !hpPop.hidden){
          closePicker();
        }
      });
      if(compHeroOnly){
        compHeroOnly.addEventListener("click", function(){
          st.heroOnly = !st.heroOnly;
          compHeroOnly.classList.toggle("on", st.heroOnly);
          renderBoard();
        });
      }

      updatePickerUI(st.hero);

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
        return "通用原則：1–2 號位放前排吸收，3–5 號位放功能，6–7 號位放核心输出";
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
        var trinketHTML = "";
        if(note && note.trinket){
          var tk = note.trinket;
          trinketHTML = '<div class="cc-trinket">' +
            '<div class="cct-head"><span class="cct-badge">核心飾品推薦</span>' +
            '<span class="cct-item"><b>' + tk.core + '</b> <i class="cct-tier">' + tk.coreTier + '</i></span>' +
            (tk.alt ? '<span class="cct-divider">/</span><span class="cct-item"><b>' + tk.alt + '</b> <i class="cct-tier">' + tk.altTier + '</i></span>' : '') +
            '</div>' +
            '<p class="cct-desc"><b>聯動质變：</b>' + tk.synergy + '</p>' +
            '</div>';
        }
        return '<article class="comp-card" data-comp-key="' + (c.key || "") + '" id="comp-' + (c.key || "") + '">' +
          '<div class="cc-head"><span class="cc-rank">#' + (rank + 1) + '</span><b>' + c.name + '</b>' +
          '<span class="cc-tier ' + String(c.tier).toLowerCase() + '">' + c.tier + '</span>' +
          (c.key ? '<a class="cc-play" href="play.html?comp=' + c.key + '">對局模式</a>' : '') +
          (c.key ? '<a class="cc-share" href="share.html?comp=' + c.key + '">分享圖</a>' : '') +
          (c.key ? '<button type="button" class="cc-cmp" data-cmp="' + c.key + '">对比</button>' : '') +
          heroBadge +
          '<span class="cc-metrics">均位 ' + Number(c.avg).toFixed(2) + ' · 前四 ' + Math.round((c.top4 || 0) * 100) +
          '% · 奪冠 ' + Math.round((c.win || 0) * 100) + '% · ' + (c.sample || 0).toLocaleString("en-US") + ' 局</span></div>' +
          '<div class="cc-lineup">' + cards + '</div>' +
          '<div class="cc-pos"><b>站位</b> ' + ((note && note.pos) ? note.pos + '（手工站位）' : posHint(c)) + '</div>' +
          trinketHTML +
          compTeachingHTML(c, note, rank) +
          '<div class="cc-foot"><span>推薦英雄：' + ((c.heroes || []).join(" · ") || "—") + '</span><span>' +
          (c.difficulty || "") + (c.power ? ' / 強度 ' + c.power : "") + '</span></div>' +
          '</article>';
      }

      function compRowHTML(c, rank){
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
        var heroBadge = hs ? '<span class="cr-hero' + (hs.avg > c.avg ? ' bad' : '') + '">你在玩：均位 ' + hs.avg + '</span>' : '';
        var cardsMini = list.map(function(x, i){
          var t = tierOfCard(x.id);
          return '<a class="cr-slot" href="cards.html?card=' + x.id + '" data-card-id="' + x.id + '" title="' + (i + 1) + '. ' + x.name + (t != null ? ' (' + t + '本)' : '') + '">' +
            '<img loading="lazy" src="../pool/' + x.id + '.webp" alt="" onerror="this.remove()">' +
            '<span class="cr-no">' + (i + 1) + '</span>' +
            '</a>';
        }).join("");

        var tk = (note && note.trinket) ?
          ('<span class="cr-trinket" title="飾品聯動：' + (note.trinket.synergy || '') + '">💎 ' + note.trinket.core + ' (' + note.trinket.coreTier + ')</span>') : '';

        return '<div class="comp-row" data-comp-key="' + (c.key || "") + '" id="comp-row-' + (c.key || "") + '">' +
          '<div class="cr-main">' +
            '<span class="cr-rank">#' + (rank + 1) + '</span>' +
            '<span class="cr-tier ' + String(c.tier).toLowerCase() + '">' + c.tier + '</span>' +
            '<b class="cr-name">' + c.name + '</b>' +
            tk +
            heroBadge +
          '</div>' +
          '<div class="cr-lineup">' + cardsMini + '</div>' +
          '<div class="cr-metrics">' +
            '<span class="crm-avg">均位 <b>' + Number(c.avg).toFixed(2) + '</b></span>' +
            '<span class="crm-top4">前四 <b>' + Math.round((c.top4 || 0) * 100) + '%</b></span>' +
            '<span class="crm-win">奪冠 <b>' + Math.round((c.win || 0) * 100) + '%</b></span>' +
          '</div>' +
          '<div class="cr-actions">' +
            (c.key ? '<a class="cr-play-btn" href="play.html?comp=' + c.key + '">對局</a>' : '') +
            (c.key ? '<button type="button" class="cc-cmp cr-cmp" data-cmp="' + c.key + '">对比</button>' : '') +
          '</div>' +
        '</div>';
      }

      function renderBoard(){
        var list = STATS.comps.filter(function(c){
          if(st.tier !== "all" && c.tier !== st.tier) return false;
          if(st.q && c.name.toLowerCase().indexOf(st.q.toLowerCase()) < 0) return false;
          var trName = String(c.name || "").split("·")[0];
          if(st.bannedTribes && st.bannedTribes.indexOf(trName) >= 0) return false;
          if(st.hero && st.heroOnly){
            var ha = heroStat(c.key);
            var inRec = (c.heroes || []).indexOf(st.hero) >= 0;
            if(!ha && !inRec) return false;
          }
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

        var t = '<div class="cs-head">數據陣容榜 <span>' + STATS.source + ' · ' + (STATS.bracket || "") +
          " · " + (STATS.fetchedAt || "") + " · 樣本 " + (STATS.sample ? Math.round(STATS.sample / 10000) + " 萬局" : "-") +
          (st.bannedTribes && st.bannedTribes.length ? " · 已禁選 " + st.bannedTribes.join("、") : "") +
          (st.hero ? (st.heroOnly ? " · 僅看 " + st.hero + " 适配陣容" : " · 按 " + st.hero + " 排序") : "") + '</span></div>';

        if(!list.length){
          var emptyMsg = (st.bannedTribes && st.bannedTribes.length) ?
            ('當前禁選種族（' + st.bannedTribes.join("、") + '）已过滤全部匹配陣容，可点擊上方「重置」或取消部分禁選。') :
            ((st.hero && st.heroOnly) ?
              ('「' + st.hero + '」暂無專屬高勝率陣容推薦，可取消「僅看该英雄适配」查看全局推薦。') :
              '没有符合條件的陣容，換個梯度或清空搜索試試。');
          host.innerHTML = t + '<p class="cs-empty">' + emptyMsg + '</p>';
          host.hidden = false;
          return;
        }

        var isCompact = st.view === "compact";
        if(isCompact){
          t += '<div class="comp-board compact">' + list.map(function(c, i){ return compRowHTML(c, i); }).join("") + '</div>';
        } else {
          t += '<div class="comp-board">' + list.slice(0, 8).map(function(c, i){ return compCardHTML(c, i); }).join("") + '</div>';
          if(list.length > 8){
            t += '<details class="comp-more"><summary>更多陣容（9–' + list.length + '，僅統計）</summary>' +
              '<div class="comp-board">' + list.slice(8).map(function(c, i){ return compCardHTML(c, i + 8); }).join("") + '</div></details>';
          }
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
        if(window.enhanceCardMentions) window.enhanceCardMentions(host);
      }

      if(heroSel){
        heroSel.addEventListener("change", function(){
          selectHero(heroSel.value);
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
          return '<div class="cmp-slot" data-card-id="' + x.id + '" data-card="' + x.name + '" role="button" tabindex="0" title="点擊查看卡牌具體信息"><img src="../pool/' + x.id + '.webp" alt="" onerror="this.style.opacity=0"><span>' + x.name + '</span><em class="stars" title="' + (t != null ? t + ' 本' : '') + '">' + (t != null ? tierStars(t) : '') + '</em></div>';
        }).join("");
        return '<div class="cmp-col"><h3>' + c.name + ' <span class="cc-tier ' + String(c.tier).toLowerCase() + '">' + c.tier + '</span></h3>' +
          '<div class="cmp-metrics">均位 ' + Number(c.avg).toFixed(2) + ' · 前四 ' + Math.round((c.top4 || 0) * 100) + '% · 奪冠 ' +
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
        var card = document.querySelector('.comp-card[data-comp-key="' + key + '"]') ||
          document.querySelector('.comp-row[data-comp-key="' + key + '"]');
        if(!card){
          var det = document.querySelector(".comp-more");
          if(det) det.open = true;
          card = document.querySelector('.comp-card[data-comp-key="' + key + '"]') ||
            document.querySelector('.comp-row[data-comp-key="' + key + '"]');
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

      var viewToggle = document.getElementById("compViewToggle");
      if(viewToggle){
        Array.prototype.forEach.call(viewToggle.querySelectorAll(".cvt-btn"), function(btn){
          btn.classList.toggle("on", btn.getAttribute("data-view") === st.view);
        });
        viewToggle.addEventListener("click", function(e){
          var b = e.target.closest ? e.target.closest(".cvt-btn") : null;
          if(!b) return;
          st.view = b.getAttribute("data-view");
          try { localStorage.setItem("tt-comp-view", st.view); } catch(err){}
          Array.prototype.forEach.call(viewToggle.querySelectorAll(".cvt-btn"), function(x){ x.classList.toggle("on", x === b); });
          renderBoard();
        });
      }

      var bannedChips = document.getElementById("bannedChips");
      var bannedClear = document.getElementById("bannedClear");
      if(bannedChips){
        bannedChips.addEventListener("click", function(e){
          var b = e.target.closest ? e.target.closest(".ct-bchip") : null;
          if(!b) return;
          var tribe = b.getAttribute("data-tribe");
          var idx = st.bannedTribes.indexOf(tribe);
          if(idx >= 0){
            st.bannedTribes.splice(idx, 1);
            b.classList.remove("is-banned");
          } else {
            st.bannedTribes.push(tribe);
            b.classList.add("is-banned");
          }
          window.__bannedTribes = st.bannedTribes.slice();
          if(bannedClear) bannedClear.hidden = (st.bannedTribes.length === 0);
          renderBoard();
        });
      }
      if(bannedClear){
        bannedClear.addEventListener("click", function(){
          st.bannedTribes = [];
          window.__bannedTribes = [];
          if(bannedChips){
            Array.prototype.forEach.call(bannedChips.querySelectorAll(".ct-bchip"), function(x){
              x.classList.remove("is-banned");
            });
          }
          bannedClear.hidden = true;
          renderBoard();
        });
      }

      var deferredPrompt = null;
      var pwaBanner = document.getElementById("pwaBanner");
      var pwaInstall = document.getElementById("pwaInstall");
      var pwaClose = document.getElementById("pwaClose");
      window.addEventListener("beforeinstallprompt", function(e){
        e.preventDefault();
        deferredPrompt = e;
        try {
          if(pwaBanner && !localStorage.getItem("tt-pwa-dismissed")){
            pwaBanner.hidden = false;
          }
        } catch(err){}
      });
      if(pwaInstall){
        pwaInstall.addEventListener("click", async function(){
          if(!deferredPrompt) return;
          deferredPrompt.prompt();
          var choice = await deferredPrompt.userChoice;
          deferredPrompt = null;
          if(pwaBanner) pwaBanner.hidden = true;
        });
      }
      if(pwaClose){
        pwaClose.addEventListener("click", function(){
          if(pwaBanner) pwaBanner.hidden = true;
          try { localStorage.setItem("tt-pwa-dismissed", "1"); } catch(err){}
        });
      }

      renderBoard();
      if(sub) sub.hidden = false;
      var metaSec = document.getElementById("meta");
      if(metaSec) metaSec.classList.add("stats-live");
    }

    function cardFor(n){
      if(typeof CARDS !== "undefined" && CARDS){
        if(CARDS[n]) return CARDS[n];
        var keys = Object.keys(CARDS), low = String(n).toLowerCase();
        for(var i = 0; i < keys.length; i++){
          var k = keys[i].toLowerCase();
          if(k.indexOf(low) >= 0 || low.indexOf(k) >= 0) return CARDS[keys[i]];
        }
      }
      if(window.findCard){
        var found = window.findCard(n);
        if(found && found.img) return { n: found.name, img: found.img };
      }
      if(typeof POOL !== "undefined" && POOL){
        for(var j = 0; j < POOL.length; j++){
          var p = POOL[j];
          if(p.n === n || p.n.indexOf(n) >= 0 || n.indexOf(p.n) >= 0){
            return { n: p.n, img: "../pool/" + p.i + ".webp" };
          }
        }
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
          return '<span class="mc-card" data-card="' + x + '" role="button" tabindex="0" title="点擊查看卡牌效果">' + (card && card.img ? '<img src="' + card.img + '" alt="" loading="lazy">' : '') + '<em>' + x + '</em></span>';
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

      if(id === "heroList"){
        var TRIBE_CLS = {
          "惡魔":"demon", "野豬人":"quilboar", "龍族":"dragon", "龍·聖盾術":"dragon",
          "元素":"elemental", "機械":"mech", "魚人":"murloc", "不死族":"undead", "野獸":"beast", "海盜":"mech"
        };

        data.forEach(function(x){
          var g = (typeof HERO_GUIDE_DATA !== "undefined" && HERO_GUIDE_DATA[x.n]) ? HERO_GUIDE_DATA[x.n] : null;
          var row = document.createElement("div");
          row.className = "hg-item hero-rich";
          var rank = x.rank || (g ? g.tier : "T2");
          var tag = x.tag || (x.winrate ? "勝率 " + pct(x.winrate) : "");

          var heroId = g ? g.id : "TB_BaconShop_HERO_37";
          var avatarHtml = '<div class="hc-avatar"><img loading="lazy" src="https://art.hearthstonejson.com/v1/256x/' + heroId + '.jpg" alt="' + x.n + '" onerror="this.style.display=\'none\';"></div>';

          var tribes = (g && g.tribes) ? g.tribes : [];
          var tribesHtml = tribes.length ? ('<div class="hc-tribes"><span class="hc-lbl">推薦種族：</span>' + tribes.map(function(t){
            var c = TRIBE_CLS[t] || "";
            return '<span class="hc-tribe-pill ' + c + '">' + t + '</span>';
          }).join("") + (g && g.difficulty ? '<span class="hc-diff">' + g.difficulty + '</span>' : '') + '</div>') : '';

          var powerHtml = (g && g.powerName) ? ('<div class="hc-power"><span class="hc-pw-tag">⚡ 技能【' + g.powerName + '】' + (g.powerCost ? '(' + g.powerCost + ')' : '') + '</span><span class="hc-pw-desc">' + g.powerDesc + '</span></div>') : '';

          var stratHtml = (g && g.strategy) ? ('<div class="hc-strat"><span class="hc-lbl">🎯 打法推薦：</span>' + g.strategy + '</div>') : ('<p>' + (x.why || "") + '</p>');

          var trapHtml = (g && g.trap) ? ('<div class="hc-trap"><span class="hc-lbl">⚠️ 避坑要点：</span>' + g.trap + '</div>') : '';

          var keyCards = (g && g.keyCards) ? g.keyCards : [];
          var cardsHtml = "";
          if(keyCards.length){
            cardsHtml = '<div class="hc-cards"><span class="hc-lbl">核心搭檔：</span><div class="hc-card-grid">' + keyCards.map(function(c){
              return '<a class="hc-card-item" href="cards.html?card=' + c.id + '" data-card-id="' + c.id + '" title="' + c.name + ' - ' + (c.role || '') + '">' +
                '<span class="hc-ci-img"><img loading="lazy" src="../pool/' + c.id + '.webp" alt="' + c.name + '"></span>' +
                '<span class="hc-ci-name">' + c.name + '</span>' +
                (c.role ? '<span class="hc-ci-role">' + c.role + '</span>' : '') +
              '</a>';
            }).join("") + '</div></div>';
          }

          row.innerHTML = 
            '<div class="hc-top">' +
              avatarHtml +
              '<div class="hc-info">' +
                '<div class="hc-title-row">' +
                  '<b class="hc-name">' + x.n + '</b>' +
                  '<span class="hg-rank ' + String(rank).toLowerCase() + '" title="' + tierName(rank) + '">' + rank + '</span>' +
                  '<a class="hc-play" href="play.html?hero=' + encodeURIComponent(x.n) + '">對局模擬 →</a>' +
                '</div>' +
                (tag ? '<span class="hc-stats">' + tag + '</span>' : '') +
              '</div>' +
            '</div>' +
            powerHtml +
            tribesHtml +
            stratHtml +
            trapHtml +
            cardsHtml;

          host.appendChild(row);
        });
        return;
      }

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
        if (h.winrate) detail.push("奪冠 " + pct(h.winrate));
        if (h.pickrate) detail.push("選取 " + h.pickrate + "%");
        return {
          n: h.name,
          rank: h.tier,
          tag: bits.join(" · "),
          why: base ? base.why : (detail.length ? detail.join(" · ") : "數據來自 " + (STATS.source || "外部統計"))
        };
      }) : (typeof HEROES !== "undefined" ? HEROES : []);
      renderGuideList("heroList", list);

      var el = document.getElementById("heroStatsBadge");
      if(!el) return;
      if(d){
        el.className = "stats-badge live";
        el.innerHTML = "數據：<b>Firestone</b> · " + LABEL[SEG] + " · " + (d.fetchedAt || "") +
          " · 樣本 " + (d.sample ? Math.round(d.sample / 10000) + " 萬局" : "-");
      } else if(typeof STATS !== "undefined" && STATS && STATS.heroes && STATS.heroes.length){
        el.className = "stats-badge live";
        el.innerHTML = "數據：<b>" + STATS.source + "</b>" +
          (STATS.bracket ? " · " + STATS.bracket : "") +
          (STATS.fetchedAt ? " · " + STATS.fetchedAt : "") +
          (STATS.sample ? " · 樣本 " + Math.round(STATS.sample / 10000) + " 萬局" : "");
      } else {
        el.className = "stats-badge manual";
        el.textContent = "英雄梯度：社區整理（非統計） · 待接入實時數據";
      }
    }

    drawHeroes();
    if(typeof TRINKETS !== "undefined") renderGuideList("trinketList", TRINKETS);
    if(window.enhanceCardMentions){
      var hl = document.getElementById("heroList");
      if(hl) window.enhanceCardMentions(hl);
    }

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
        el.innerHTML = "數據：<b>" + STATS.source + "</b>" +
          (STATS.bracket ? " · " + STATS.bracket : "") +
          (STATS.region ? " · " + STATS.region : "") +
          (STATS.fetchedAt ? " · " + STATS.fetchedAt : "") +
          (STATS.sample ? " · 樣本 " + (STATS.sample >= 10000 ? Math.round(STATS.sample / 10000) + " 萬局" : STATS.sample) : "");
      } else {
        el.className = "stats-badge manual";
        el.textContent = label + "：社區整理（非統計） · 待接入實時數據";
      }
    }
    badge("metaStatsBadge", !!(typeof STATS !== "undefined" && STATS && STATS.comps && STATS.comps.length), "週報");
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
  var range = (c.from && c.to && c.from !== c.to) ? (c.from + " → " + c.to) : "对比上一版";
  var h = '<div class="sc-head"><span class="sc-title">本週變化</span><span class="sc-range">' + range +
    " · 樣本 " + fmt(c.sampleFrom) + " → " + fmt(c.sampleTo) + '</span></div>';

  function getCardData(nameOrId){
    if(window.findCard){
      var hit = window.findCard(nameOrId);
      if(hit) return { name: hit.name, img: hit.img || "" };
    }
    if(typeof CARDS !== "undefined" && CARDS){
      if(CARDS[nameOrId]) return { name: nameOrId, img: CARDS[nameOrId].img || "" };
      if(nameOrId === "布莱恩·铜須" && CARDS["铜須"]) return { name: "布莱恩·铜須", img: CARDS["铜須"].img };
    }
    if(typeof POOL !== "undefined" && POOL){
      for(var i = 0; i < POOL.length; i++){
        var p = POOL[i];
        if(p.i === nameOrId || p.n === nameOrId || p.n.indexOf(nameOrId) >= 0 || nameOrId.indexOf(p.n) >= 0){
          return { name: p.n, img: "../pool/" + p.i + ".webp" };
        }
      }
    }
    return { name: nameOrId, img: "" };
  }

  function renderCardsHTML(cards, label){
    if(!cards || !cards.length) return "";
    var items = cards.slice(0, 5).map(function(cd){
      var info = getCardData(cd.id || cd.name);
      var cname = cd.name || info.name;
      var imgTag = info.img ? '<img class="sc-cimg" src="' + info.img + '" alt="" loading="lazy">' : '';
      return '<span class="sc-card-chip card-chip" data-card="' + cname + '" role="button" tabindex="0" title="点擊查看【' + cname + '】詳情">' +
        imgTag + '<span class="sc-cname">' + cname + '</span></span>';
    });
    return '<div class="sc-cards"><span class="sc-clabel">' + (label || "核心卡牌：") + '</span><div class="sc-clist">' + items.join("") + '</div></div>';
  }

  var rows = [];

  (c.comps || []).forEach(function(x){
    var up = x.rankTo < x.rankFrom;
    var cards = [];
    if(typeof STATS !== "undefined" && STATS.comps){
      var compObj = STATS.comps.find(function(item){ return item.key === x.key || item.name === x.name; });
      if(compObj && compObj.cards) cards = compObj.cards;
    }
    if(!cards.length && typeof META !== "undefined" && META.comps){
      var metaObj = META.comps.find(function(item){ return item.name.indexOf(x.name) >= 0 || x.name.indexOf(item.name) >= 0; });
      if(metaObj && metaObj.core) cards = metaObj.core.map(function(cn){ return { name: cn }; });
    }

    var cardsHTML = renderCardsHTML(cards, "核心卡牌：");
    var jumpLink = x.key ? '<a class="sc-link" href="#comp-' + x.key + '">查看完整站位 →</a>' : '';

    rows.push('<div class="sc-row sc-comp-item">' +
      '<div class="sc-top-line">' +
        '<span class="' + (up ? "sc-up" : "sc-down") + '">' + (up ? "↑" : "↓") + "</span>" +
        '<span class="sc-tag sc-tag-comp">陣容</span>' +
        '<b class="sc-name">' + x.name + '</b>' +
        '<span class="sc-meta">#' + x.rankFrom + " → #" + x.rankTo +
        (x.avgFrom === x.avgTo ? "" : "（均位 " + x.avgFrom + " → " + x.avgTo + "）") + "</span>" +
        jumpLink +
      '</div>' +
      cardsHTML +
    '</div>');
  });

  (c.heroes || []).forEach(function(x){
    var up = x.rankTo < x.rankFrom;
    var heroCards = [];
    if(typeof HERO_GUIDE_DATA !== "undefined" && HERO_GUIDE_DATA[x.name] && HERO_GUIDE_DATA[x.name].keyCards){
      heroCards = HERO_GUIDE_DATA[x.name].keyCards;
    }
    if(!heroCards.length && typeof STATS !== "undefined" && STATS.heroComps && STATS.heroComps[x.name] && STATS.heroComps[x.name].length){
      var topCompKey = STATS.heroComps[x.name][0].key;
      var fullComp = (STATS.comps || []).find(function(item){ return item.key === topCompKey; });
      if(fullComp && fullComp.cards) heroCards = fullComp.cards;
    }

    var cardsHTML = renderCardsHTML(heroCards, "适配核心：");
    var jumpLink = '<a class="sc-link" href="#heroes" data-hero="' + x.name + '">查看英雄攻略 →</a>';

    rows.push('<div class="sc-row sc-hero-item">' +
      '<div class="sc-top-line">' +
        '<span class="' + (up ? "sc-up" : "sc-down") + '">' + (up ? "↑" : "↓") + "</span>" +
        '<span class="sc-tag sc-tag-hero">英雄</span>' +
        '<b class="sc-name">' + x.name + '</b>' +
        '<span class="sc-meta">#' + x.rankFrom + " → #" + x.rankTo +
        (x.avgFrom === x.avgTo ? "" : "（均位 " + x.avgFrom + " → " + x.avgTo + "）") + "</span>" +
        jumpLink +
      '</div>' +
      cardsHTML +
    '</div>');
  });

  if(c.first) h += '<div class="sc-row">首次接入真實數據，已記錄基線；下周開始顯示升降。</div>';
  else if(!rows.length) h += '<div class="sc-row">本週陣容與英雄排名無顯著變化。</div>';
  else h += '<div class="sc-list">' + rows.join("") + '</div>';

  host.innerHTML = h;
  host.hidden = false;
  if(window.enhanceCardMentions) window.enhanceCardMentions(host);
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

/* ---------- 3D Card Interactive Tilt & Living Sheen ---------- */
(function initCardTilt(){
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var isTouch = "ontouchstart" in window || (navigator.maxTouchPoints > 0);
  if(isTouch) return;

  document.addEventListener("mousemove", function(e){
    var card = e.target.closest ? e.target.closest(".comp-slot, .tb-card, .fc, .ps-slot, .hero-board a, .tc-card") : null;
    if(!card) return;
    var rect = card.getBoundingClientRect();
    if(!rect.width || !rect.height) return;
    var px = (e.clientX - rect.left) / rect.width - 0.5;
    var py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--rx", (-py * 16).toFixed(1) + "deg");
    card.style.setProperty("--ry", (px * 16).toFixed(1) + "deg");
  }, { passive: true });

  document.addEventListener("mouseout", function(e){
    var card = e.target.closest ? e.target.closest(".comp-slot, .tb-card, .fc, .ps-slot, .hero-board a, .tc-card") : null;
    if(card && (!e.relatedTarget || !card.contains(e.relatedTarget))){
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    }
  }, { passive: true });
})();

/* ---------- Tavern Leveling Curves Tab Switcher ---------- */
(function initCurvesTabs(){
  var tabs = document.querySelectorAll(".curves-tab");
  var panes = document.querySelectorAll(".curves-pane");
  if(!tabs.length || !panes.length) return;

  tabs.forEach(function(tab){
    tab.addEventListener("click", function(){
      var targetId = tab.getAttribute("data-curve");
      if(!targetId) return;
      tabs.forEach(function(t){ t.classList.remove("active"); });
      panes.forEach(function(p){ p.classList.remove("active"); });
      tab.classList.add("active");
      var targetPane = document.getElementById("curve-" + targetId);
      if(targetPane) targetPane.classList.add("active");
    });
  });
})();
