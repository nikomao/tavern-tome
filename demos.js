/* 00-04 卡牌示例 */
(function(){
  if(typeof POOL === "undefined") return;
  var byName = {};
  POOL.forEach(function(c){ if(!byName[c.n]) byName[c.n] = c; });

  var DEMOS = {
    start: [
      { label: "第 1–3 回合 · 买站场", note: "先买能打的，别追梦", cards: ["雄斑虎", "路霸野猪人"] },
      { label: "第 4–7 回合 · 找引擎", note: "引擎决定后期上限", cards: ["布莱恩·铜须", "巴琳达·斯通赫尔斯"] },
      { label: "第 8 回合后 · 转终端", note: "把前期的积累变成终端", cards: ["执念诗心龙", "赤红守备巨龙"] }
    ],
    laws: [
      { label: "乘数 · 加法变乘法", note: "铜须/瑞文/巴琳达，一张牌改变整局", cards: ["布莱恩·铜须", "提图斯·瑞文戴尔", "巴琳达·斯通赫尔斯"] },
      { label: "频率 · 死了还能再来", note: "复生、亡语、召唤，都是额外攻击次数", cards: ["永恒召唤者", "断手被遗忘者"] },
      { label: "经济 · 把铸币转起来", note: "倒转的核心是“买—卖—回铸币”", cards: ["火药运输工", "复映无人机"] }
    ],
    math: [
      { label: "永久保留 · 战斗里长的属性留下来", note: "诗心龙是把临时身材变永久的关键", cards: ["执念诗心龙"] },
      { label: "攻击翻倍 · 乘法的最短路径", note: "怒鳞让攻击翻倍，配合传血越滚越大", cards: ["怒鳞潜行者"] },
      { label: "吞食 · 把酒馆变成身材", note: "邪能野猪人吃酒馆，等于把经济换成身材", cards: ["邪能野猪人"] }
    ],
    fusion: [
      { label: "战吼 ×2 · 铜须体系", note: "铜须 + 战吼，一次战吼吃两次收益", cards: ["布莱恩·铜须", "邪能野猪人"] },
      { label: "法术 ×2 · 巴琳达体系", note: "巴琳达 + 法术，把单次 buff 变成双倍", cards: ["巴琳达·斯通赫尔斯", "达卡莱附魔师"] },
      { label: "龙 × 传血 · 诗心龙体系", note: "诗心龙保留属性，赤红守备提供圣盾与龙息", cards: ["执念诗心龙", "赤红守备巨龙"] }
    ],
    positioning: [
      { label: "1–2 号位 · 破盾 / 主坦", note: "先用小怪破盾，再让主坦吸收", cards: ["雄斑虎", "坚牙野猪人"] },
      { label: "3 号位 · 复生", note: "复生单位适合第二层墙", cards: ["断手被遗忘者"] },
      { label: "5 号位 · 引擎", note: "引擎永远放在至少两个身位之后", cards: ["布莱恩·铜须"] },
      { label: "7 号位 · 收割", note: "亡语/召唤类放最后，死了还能铺", cards: ["永恒召唤者"] }
    ]
  };

  function cardChip(name){
    var c = byName[name];
    if(!c) return "";
    return '<a class="demo-card" href="cards.html?card=' + c.i + '" data-card-id="' + c.i + '" data-card="' + name + '" title="点击查看卡牌效果">' +
      '<span class="dc-img"><img loading="lazy" src="pool/' + c.i + '.webp" alt="' + name + '"></span>' +
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
    wrap.innerHTML = '<div class="demo-title">卡牌示例 <span>悬停 / 点击看效果</span></div><div class="demo-groups">' + groups + '</div>';
    head.insertAdjacentElement("afterend", wrap);
  });
})();
