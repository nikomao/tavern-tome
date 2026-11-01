/* 阵容分享图生成器 */
(function(){
  var comps = (typeof STATS !== "undefined" && STATS.comps) || [];
  var sel = document.getElementById("comp");
  var cv = document.getElementById("cv");
  var ctx = cv.getContext("2d");

  var DB = {};
  if(typeof POOL !== "undefined") POOL.forEach(function(c){ DB[c.i] = c; });
  if(typeof EXTRA_CARDS !== "undefined") Object.keys(EXTRA_CARDS).forEach(function(k){ DB[k] = EXTRA_CARDS[k]; });

  var params = new URLSearchParams(location.search);
  var key = params.get("comp") || (comps[0] && comps[0].key);
  comps.forEach(function(c){
    var o = document.createElement("option");
    o.value = c.key; o.textContent = c.name + "（" + c.tier + "）";
    sel.appendChild(o);
  });
  sel.value = key;

  function tierOf(id){ var c = DB[id]; return c && c.t != null ? c.t : null; }
  function stars(n){ return n ? "★".repeat(Math.min(7, n)) : ""; }

  function ordered(c){
    var list = (c.cards || []).slice();
    var note = (typeof COMP_NOTES !== "undefined" && c.key && COMP_NOTES[c.key]) ? COMP_NOTES[c.key] : null;
    if(note && note.order){
      var idx = {};
      note.order.forEach(function(n, i){ idx[n] = i; });
      list.sort(function(a, b){ return (idx[a.name] == null ? 99 : idx[a.name]) - (idx[b.name] == null ? 99 : idx[b.name]); });
    }
    return list;
  }

  function roundRect(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrap(text, x, y, maxW, lineH, font, color){
    ctx.font = font; ctx.fillStyle = color;
    var line = "";
    for(var i = 0; i < text.length; i++){
      var test = line + text[i];
      if(ctx.measureText(test).width > maxW && line){
        ctx.fillText(line, x, y); y += lineH; line = text[i];
      } else line = test;
    }
    if(line) ctx.fillText(line, x, y);
    return y + lineH;
  }

  function loadImage(src){
    return new Promise(function(res){
      var im = new Image();
      im.onload = function(){ res(im); };
      im.onerror = function(){ res(null); };
      im.src = src;
    });
  }

  async function draw(){
    var c = comps.filter(function(x){ return x.key === key; })[0] || comps[0];
    var list = ordered(c);

    // bg
    var g = ctx.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, "#2a1a10");
    g.addColorStop(1, "#120b07");
    ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);

    // frame
    ctx.strokeStyle = "rgba(226,180,95,.35)"; ctx.lineWidth = 3;
    roundRect(30, 30, cv.width - 60, cv.height - 60, 18); ctx.stroke();

    // header
    ctx.fillStyle = "#9c8a74"; ctx.font = "24px 'Microsoft YaHei'";
    ctx.fillText("酒馆手札 · 本周阵容", 64, 96);

    ctx.fillStyle = "#f4e7cf"; ctx.font = "bold 68px 'Microsoft YaHei'";
    var nameW = ctx.measureText(c.name).width;
    ctx.fillText(c.name, 64, 178);

    // tier badge
    var bx = 64 + nameW + 22;
    ctx.fillStyle = "rgba(226,180,95,.18)";
    roundRect(bx, 128, 92, 54, 10); ctx.fill();
    ctx.strokeStyle = "rgba(226,180,95,.5)"; ctx.lineWidth = 2; roundRect(bx, 128, 92, 54, 10); ctx.stroke();
    ctx.fillStyle = "#e2b45f"; ctx.font = "bold 30px 'Microsoft YaHei'";
    ctx.fillText(c.tier, bx + 26, 166);

    // metrics
    ctx.fillStyle = "#c9b79b"; ctx.font = "26px 'Microsoft YaHei'";
    var metrics = "均位 " + Number(c.avg).toFixed(2) + "　前四 " + Math.round((c.top4||0)*100) + "%　吃鸡 " + Math.round((c.win||0)*100) + "%　样本 " + (c.sample||0).toLocaleString("en-US");
    ctx.fillText(metrics, 64, 246);

    // cards
    var n = list.length;
    var size = 132, gap = 12;
    var totalW = n * size + (n - 1) * gap;
    var x0 = (cv.width - totalW) / 2;
    var y0 = 310;
    for(var i = 0; i < n; i++){
      var x = x0 + i * (size + gap);
      var item = list[i];
      var im = await loadImage("pool/" + item.id + ".webp");
      ctx.save();
      roundRect(x, y0, size, size, 12); ctx.clip();
      if(im){ ctx.drawImage(im, x, y0, size, size); }
      else { ctx.fillStyle = "#3a2617"; ctx.fillRect(x, y0, size, size); }
      ctx.restore();
      ctx.strokeStyle = "rgba(226,180,95,.3)"; ctx.lineWidth = 2;
      roundRect(x, y0, size, size, 12); ctx.stroke();

      // number
      ctx.beginPath(); ctx.arc(x + 16, y0 + 16, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#e2b45f"; ctx.fill();
      ctx.fillStyle = "#1a100a"; ctx.font = "bold 18px 'Microsoft YaHei'"; ctx.textAlign = "center";
      ctx.fillText(String(i + 1), x + 16, y0 + 23);
      ctx.textAlign = "left";

      // name
      ctx.fillStyle = "#e8dcc7"; ctx.font = "20px 'Microsoft YaHei'"; ctx.textAlign = "center";
      var nm = item.name.length > 7 ? item.name.slice(0, 7) + "…" : item.name;
      ctx.fillText(nm, x + size / 2, y0 + size + 32);

      // stars
      var t = tierOf(item.id);
      ctx.fillStyle = "#e2b45f"; ctx.font = "18px 'Microsoft YaHei'";
      ctx.fillText(stars(t), x + size / 2, y0 + size + 60);
      ctx.textAlign = "left";
    }

    // position
    var note = (typeof COMP_NOTES !== "undefined" && COMP_NOTES[c.key]) ? COMP_NOTES[c.key] : null;
    var posText = (note && note.pos) ? note.pos : "站位：1–2 号位放前排吸收，3–5 号位放功能，6–7 号位放核心输出。";
    ctx.fillStyle = "#e2b45f"; ctx.font = "bold 24px 'Microsoft YaHei'";
    ctx.fillText("站位", 64, y0 + size + 120);
    var y = wrap(posText, 64, y0 + size + 158, cv.width - 128, 40, "24px 'Microsoft YaHei'", "#c9b79b");

    // heroes
    if(c.heroes && c.heroes.length){
      ctx.fillStyle = "#9c8a74"; ctx.font = "22px 'Microsoft YaHei'";
      ctx.fillText("推荐英雄", 64, y + 20);
      ctx.fillStyle = "#e8dcc7"; ctx.font = "24px 'Microsoft YaHei'";
      ctx.fillText(c.heroes.join(" · "), 180, y + 20);
      y += 50;
    }

    // footer
    ctx.strokeStyle = "rgba(226,180,95,.2)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(64, cv.height - 108); ctx.lineTo(cv.width - 64, cv.height - 108); ctx.stroke();

    ctx.fillStyle = "#f4e7cf"; ctx.font = "bold 28px 'Microsoft YaHei'";
    ctx.fillText("酒馆手札", 64, cv.height - 62);
    ctx.fillStyle = "#e2b45f"; ctx.font = "24px 'Microsoft YaHei'"; ctx.textAlign = "right";
    ctx.fillText("nikom-blog.org", cv.width - 64, cv.height - 62);
    ctx.textAlign = "left";
    ctx.fillStyle = "#9c8a74"; ctx.font = "18px 'Microsoft YaHei'";
    ctx.fillText("数据：Firestone / ZeroToHeroes · " + (STATS.fetchedAt || ""), 64, cv.height - 28);
  }

  draw();

  sel.addEventListener("change", function(){ key = sel.value; draw(); history.replaceState(null, "", "?comp=" + key); });

  document.getElementById("download").addEventListener("click", function(){
    cv.toBlob(function(b){
      var a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = (comps.filter(function(x){ return x.key === key; })[0] || {}).name + "-酒馆手札.png";
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 3000);
    }, "image/png");
  });

  document.getElementById("copy").addEventListener("click", async function(){
    var btn = this;
    try {
      await new Promise(function(res, rej){
        cv.toBlob(async function(b){
          try { await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); res(); }
          catch(e){ rej(e); }
        }, "image/png");
      });
      btn.textContent = "已复制";
      setTimeout(function(){ btn.textContent = "复制图片"; }, 1500);
    } catch(e) { alert("当前浏览器不支持复制图片，请用「下载 PNG」。"); }
  });
})();
