/* 00-04 卡牌示例 */
(function(){
  if(typeof POOL === "undefined") return;
  var byName = {};
  POOL.forEach(function(c){ if(!byName[c.n]) byName[c.n] = c; });

  var DEMOS = {
    start: [
      { label: "第 1–3 回合 · 買站場", note: "先買能打的，別追夢", cards: ["雄斑虎", "路霸野豬人"] },
      { label: "第 4–7 回合 · 找引擎", note: "引擎決定後期上限", cards: ["布莱恩·铜須", "巴琳达·斯通赫尔斯"] },
      { label: "第 8 回合後 · 轉終端", note: "把前期的积累變成終端", cards: ["執念詩心龍", "赤紅守備巨龍"] }
    ],
    laws: [
      { label: "乘數 · 加法變乘法", note: "铜須/瑞文/巴琳达，一張牌改變整局", cards: ["布莱恩·铜須", "提圖斯·瑞文戴尔", "巴琳达·斯通赫尔斯"] },
      { label: "頻率 · 死了还能再來", note: "複生、死亡之聲、召喚，都是額外攻擊次數", cards: ["永恆召喚者", "斷手被遺忘者"] },
      { label: "經济 · 把金幣轉起來", note: "倒轉的核心是“買—賣—回金幣”", cards: ["火藥运输工", "複映無人機"] }
    ],
    math: [
      { label: "永久保留 · 戰斗裡长的屬性留下來", note: "詩心龍是把臨時體質變永久的關鍵", cards: ["執念詩心龍"] },
      { label: "攻擊加倍 · 乘法的最短路徑", note: "怒鱗讓攻擊加倍，配合傳血越滚越大", cards: ["怒鱗隱蔽者"] },
      { label: "吞食 · 把旅店變成體質", note: "邪能野豬人吃旅店，等于把經济換成體質", cards: ["邪能野豬人"] }
    ],
    fusion: [
      { label: "戰吼 ×2 · 铜須體系", note: "铜須 + 戰吼，一次戰吼吃两次收益", cards: ["布莱恩·铜須", "邪能野豬人"] },
      { label: "法術 ×2 · 巴琳达體系", note: "巴琳达 + 法術，把單次 buff 變成雙倍", cards: ["巴琳达·斯通赫尔斯", "达卡莱附魔師"] },
      { label: "龍 × 傳血 · 詩心龍體系", note: "詩心龍保留屬性，赤紅守備提供聖盾術與龍息", cards: ["執念詩心龍", "赤紅守備巨龍"] }
    ],
    positioning: [
      { label: "1–2 號位 · 破盾 / 主坦", note: "先用小怪破盾，再讓主坦吸收", cards: ["雄斑虎", "堅牙野豬人"] },
      { label: "3 號位 · 複生", note: "複生單位适合第二層墙", cards: ["斷手被遺忘者"] },
      { label: "5 號位 · 引擎", note: "引擎永远放在至少两個身位之後", cards: ["布莱恩·铜須"] },
      { label: "7 號位 · 收割", note: "死亡之聲/召喚類放最後，死了还能铺", cards: ["永恆召喚者"] }
    ]
  };

  function cardChip(name){
    var c = byName[name];
    if(!c) return "";
    return '<a class="demo-card" href="cards.html?card=' + c.i + '" data-card-id="' + c.i + '" data-card="' + name + '" title="点擊查看卡牌效果">' +
      '<span class="dc-img"><img loading="lazy" src="../pool/' + c.i + '.webp" alt="' + name + '"></span>' +
      '<span class="dc-name">' + name + '</span></a>';
  }

  Object.keys(DEMOS).forEach(function(id){
    var sec = document.getElementById(id);
    if(!sec) return;
    var head = sec.querySelector(".section-head");
    if(!head) return;
    var groups = DEMOS[id].map(function(g){
      var chips = g.cards.map(cardChip).join("");
      if(!chips) return "";
      return '<div class="demo-group"><div class="dg-label">' + g.label + '</div>' +
        '<div class="dg-cards">' + chips + '</div>' +
        '<div class="dg-note">' + g.note + '</div></div>';
    }).join("");
    if(!groups) return;
    var wrap = document.createElement("div");
    wrap.className = "demo-wrap";
    wrap.innerHTML = '<div class="demo-title">卡牌示例 <span>懸停 / 点擊看效果</span></div><div class="demo-groups">' + groups + '</div>';
    head.insertAdjacentElement("afterend", wrap);
  });
})();
