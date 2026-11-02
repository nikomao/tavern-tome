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

  var btn = document.getElementById("heroSearch");
  if(btn) btn.addEventListener("click", function(){
    var s = document.getElementById("searchOpen");
    if(s) s.click();
  });
})();
