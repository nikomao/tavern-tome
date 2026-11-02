/* 首屏快捷入口：本周 T0 + 继续上次 */
(function(){
  var top = document.getElementById("heroTopComp");
  if(top && typeof STATS !== "undefined" && STATS.comps && STATS.comps.length){
    var c = STATS.comps.slice().sort(function(a,b){ return a.avg - b.avg; })[0];
    top.innerHTML = '本周 T0：<b>' + c.name + '</b><span>' + c.tier + ' · 均位 ' + Number(c.avg).toFixed(2) + '</span>';
    top.href = "#comp-" + c.key;
  }

  try {
    var h = JSON.parse(localStorage.getItem("tt-history") || "[]");
    var last = h.filter(function(x){ return x.type === "comp"; })[0];
    if(last){
      var a = document.createElement("a");
      a.className = "hq hq-last";
      a.href = last.url;
      a.textContent = "继续上次：" + last.name;
      var q = document.getElementById("heroQuick");
      if(q) q.appendChild(a);
    }
  } catch(e){}

  // 7 格站位：悬停显示职责
  var board = document.getElementById("heroBoard");
  var note = document.getElementById("hbNote");
  if(board && note){
    var def = note.textContent;
    Array.prototype.forEach.call(board.querySelectorAll("a"), function(a){
      function show(){ note.textContent = a.getAttribute("data-note"); }
      function reset(){ note.textContent = def; }
      a.addEventListener("mouseenter", show);
      a.addEventListener("focus", show);
      a.addEventListener("mouseleave", reset);
      a.addEventListener("blur", reset);
      a.addEventListener("touchstart", show, { passive: true });
    });
  }

  // 按来源调整主 CTA
  (function(){
    var q = new URLSearchParams(location.search);
    var ref = document.referrer || q.get("from") || "";
    var fromCommunity = /nga|bbs\.nga|bilibili|douyin|weixin|xiaohongshu/i.test(ref);
    var fromSearch = /google|bing|baidu|so\.com|sogou/i.test(ref);
    var cta = document.querySelector(".hero-cta");
    if(!cta) return;
    var primary = cta.querySelector(".btn.primary");
    var ghost = cta.querySelector(".btn.ghost");
    if(!primary || !ghost) return;
    if(fromCommunity){
      // 社区来的更可能已经会玩：把“看阵容”提到主位
      primary.classList.remove("primary"); primary.classList.add("ghost");
      ghost.classList.remove("ghost"); ghost.classList.add("primary");
      cta.insertBefore(ghost, primary);
    } else if(fromSearch){
      // 搜索来的多是新手：保持“第一局”为主，并把它放到最前
      cta.insertBefore(primary, ghost);
    }
  })();

  var btn = document.getElementById("heroSearch");
  if(btn) btn.addEventListener("click", function(){
    var s = document.getElementById("searchOpen");
    if(s) s.click();
  });
})();
