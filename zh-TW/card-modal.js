/**
 * 旅店手札 - 全局卡牌詳情彈窗與卡牌名稱交互引擎
 * 支持全站所有卡牌名稱/格子点擊彈窗查看卡牌具體信息
 */
(function(){
  "use strict";

  // 1. 常用玩家別名/黑話與官方全名映射表
  var ALIAS_MAP = {
    "铜須": "布莱恩·铜須",
    "瑞文": "提圖斯·瑞文戴尔",
    "提圖斯": "提圖斯·瑞文戴尔",
    "巴琳达": "巴琳达·斯通赫尔斯",
    "白狼": "巨狼戈德林",
    "戈德林": "巨狼戈德林",
    "赤紅守備": "赤紅守備巨龍",
    "守備巨龍": "赤紅守備巨龍",
    "詩心龍": "執念詩心龍",
    "偏折": "偏折機器人",
    "偏折機械": "偏折機器人",
    "光耀": "炫目的光耀之子",
    "光耀之子": "炫目的光耀之子",
    "卡雷": "奧術守護者卡雷苟斯",
    "卡雷苟斯": "奧術守護者卡雷苟斯",
    "达卡莱": "达卡莱附魔師",
    "附魔師": "达卡莱附魔師",
    "卡尔加": "卡尔加",
    "诺米": "廚房名廚诺米",
    "狂戰": "死神4000型",
    "狂暴之斧": "死神4000型",
    "火車王": "莽神火車王",
    "坑道爆破師": "坑道爆破師",
    "爆破師": "坑道爆破師",
    "扎普": "扎普·斯裡維克",
    "扎普·斯罗格": "扎普·斯裡維克",
    "扎普·斯裡維克": "扎普·斯裡維克",
    "茶水": "茶水大師西塔尔",
    "茶水大師": "茶水大師西塔尔",
    "西塔尔": "茶水大師西塔尔",
    "电表": "艦队上将特塞斯",
    "特塞斯": "艦队上将特塞斯",
    "紅衣": "紅衣納迪娜",
    "納迪娜": "紅衣納迪娜",
    "青铜守衛": "青铜守衛",
    "烏祖尔": "貪食的烏祖尔",
    "魔蝠": "饥饿的魔蝠",
    "跳蛙": "跳蛙騎士",
    "跳蛙騎士": "跳蛙騎士",
    "瑪诺洛斯": "瑪诺洛斯",
    "斯瑟拉": "異教徒斯瑟拉",
    "異教徒斯瑟拉": "異教徒斯瑟拉",
    "地卜術師": "得勝的地卜術師",
    "得勝的地卜術師": "得勝的地卜術師",
    "测绘員": "热气球测绘員",
    "热气球": "热气球测绘員",
    "热气球测绘員": "热气球测绘員",
    "邪能野豬人": "邪能野豬人",
    "邪能豬": "邪能野豬人",
    "惡魔幹擾者": "惡魔幹擾者",
    "幹擾者": "惡魔幹擾者",
    "骄傲的私掠者": "骄傲的私掠者",
    "私掠者": "骄傲的私掠者",
    "空軍上将罗杰斯": "空軍上将罗杰斯",
    "罗杰斯": "空軍上将罗杰斯",
    "剃刀沼泽织藤者": "剃刀沼泽织藤者",
    "织藤者": "剃刀沼泽织藤者",
    "守門融合怪": "守門融合怪",
    "融合怪": "守門融合怪",
    "邪火咒龍": "邪火咒龍",
    "傀儡師": "黑暗傀儡師",
    "黑暗傀儡師": "黑暗傀儡師",
    "摩托車": "極速野豬騎士",
    "極速野豬騎士": "極速野豬騎士",
    "雙頭飛龍": "重金屬雙頭飛龍",
    "香蕉猴": "香蕉猛猿",
    "香蕉猛猿": "香蕉猛猿",
    "佩吉": "佩吉·斯特迪伯",
    "金槍": "金槍格蕾塔",
    "金槍格蕾塔": "金槍格蕾塔",
    "小瞎眼": "小瞎眼",
    "合唱魚人": "合唱魚人",
    "低音提琴魚人": "低音提琴魚人",
    "裁脍魚人": "裁脍魚人",
    "深沉藍調": "深沉藍調歌手",
    "深沉藍調歌手": "深沉藍調歌手",
    "藍調": "深沉藍調歌手",
    "沙錘手": "热情沙錘手",
    "潮汐主母": "潮汐主母阿茜薩",
    "奧戈佐亞": "照看者奧戈佐亞",
    "永恆騎士": "永恆騎士",
    "永恆召喚者": "永恆召喚者",
    "死亡之聲者姐妹": "死亡之聲者姐妹",
    "蛛魔之王": "蛛魔之王阿努巴拉克",
    "阿努巴拉克": "蛛魔之王阿努巴拉克",
    "兵主": "兵主的勇士",
    "兵主的勇士": "兵主的勇士",
    "作曲鬃師": "作曲鬃師",
    "暗膘爵士樂手": "暗膘爵士樂手",
    "獠牙队长": "獠牙队长",
    "阿格姆": "阿格姆·棘咒",
    "阿格姆·棘咒": "阿格姆·棘咒",
    "寶石走私商": "寶石走私商",
    "走私商": "寶石走私商",
    "鲁古格": "地卜大師鲁古格",
    "地卜大師鲁古格": "地卜大師鲁古格",
    "油彩畫家": "油彩畫家",
    "惊喜元素": "惊喜元素",
    "缤纷冰灵": "缤纷冰灵",
    "農場热舞旋風": "農場热舞旋風",
    "热舞旋風": "農場热舞旋風",
    "摇滚岩石": "摇滚岩石",
    "回收魔灵": "回收魔灵",
    "無人機": "多面辅助無人機",
    "多面辅助無人機": "多面辅助無人機",
    "拳手": "極性B-Box拳手",
    "B-BOX": "極性B-Box拳手",
    "B-Box": "極性B-Box拳手",
    "極性B-Box拳手": "極性B-Box拳手",
    "吵吵演藝團": "吵吵演藝團",
    "欧米茄破壞者": "欧米茄破壞者",
    "自适應路障": "自适應路障",
    "唱片走私犯": "唱片走私犯",
    "火藥运输工": "火藥运输工",
    "開掛荷官": "開掛荷官",
    "刀剑收藏家": "刀剑收藏家",
    "重傷的強盜": "重傷的強盜",
    "克尔苏加德": "大巫妖克尔苏加德",
    "大巫妖克尔苏加德": "大巫妖克尔苏加德",
    "莫罗斯": "死亡管家莫罗斯",
    "死亡管家莫罗斯": "死亡管家莫罗斯",
    "灵魂切分者": "灵魂切分者",
    "千纸幼龍": "千纸幼龍",
    "英勇的巢母": "英勇的巢母",
    "巢母": "英勇的巢母",
    "诺茲多姆的子嗣": "诺茲多姆的子嗣",
    "子嗣": "诺茲多姆的子嗣",
    "希望信使": "希望信使",
    "灵魂倒帶者": "灵魂回溯者",
    "倒帶者": "灵魂回溯者",
    "回溯者": "灵魂回溯者",
    "灵魂回溯者": "灵魂回溯者",
    "粗暴的猢狲": "粗暴的猢狲",
    "猢狲": "粗暴的猢狲",
    "死神4000型": "死神4000型",
    "洞穴多頭蛇": "洞穴多頭蛇",
    "挖掘工": "棘刺挖掘工",
    "搏豬": "健身搏豬",
    "開拓者": "刺棘開拓者",
    "矿工": "坑谷矿工",
    "假手": "義肢假手",
    "義肢假手": "義肢假手",
    "海藻": "海藻護衛",
    "海藻護衛": "海藻護衛",
    "精研者": "鲜血精研者",
    "鲜血精研者": "鲜血精研者",
    "阿菲拉斯": "預言者阿菲拉斯",
    "艾泽裡特": "活化艾泽裡特",
    "火花": "火花破壞機",
    "炫彩": "炫彩機器人",
    "複映": "複映無人機",
    "菌学家": "魔鳍真菌学家",
    "克熙尔": "神秘的克熙尔",
    "喚冰者": "恩拉其喚冰者",
    "擴音機": "紅色擴音機",
    "紅色擴音機": "紅色擴音機",
    "钩牙": "掠奪大師钩牙"
  };

  var RACE_CN = {
    BEAST: "野獸", DEMON: "惡魔", DRAGON: "龍", ELEMENTAL: "元素", MECHANICAL: "機械",
    MURLOC: "魚人", NAGA: "納迦", PIRATE: "海盜", QUILBOAR: "野豬人", UNDEAD: "不死族",
    ABERRATION: "畸變體", ALL: "全部種族"
  };

  var TRIBE_ID = {
    BEAST: "beast", DEMON: "demon", DRAGON: "dragon", ELEMENTAL: "elemental",
    MECHANICAL: "mech", MURLOC: "murloc", NAGA: "naga", PIRATE: "pirate",
    QUILBOAR: "quilboar", UNDEAD: "undead", ABERRATION: "aberration", ALL: "fusion"
  };

  function tierStars(n){
    n = Number(n);
    if(!n || n < 1) return "";
    return '<i class="star"></i>'.repeat(Math.min(7, n));
  }

  // 格式化卡牌效果關鍵詞為彩色胶囊
  function formatCardKeywords(text){
    return String(text || "")
      .replace(/戰吼/g, '<span class="cp-kw battlecry">戰吼</span>')
      .replace(/死亡之聲/g, '<span class="cp-kw deathrattle">死亡之聲</span>')
      .replace(/聖盾術/g, '<span class="cp-kw shield">聖盾術</span>')
      .replace(/烈毒|劇毒/g, '<span class="cp-kw poison">烈毒</span>')
      .replace(/風怒/g, '<span class="cp-kw windfury">風怒</span>')
      .replace(/嘲諷/g, '<span class="cp-kw taunt">嘲諷</span>')
      .replace(/複生/g, '<span class="cp-kw reborn">複生</span>')
      .replace(/合體/g, '<span class="cp-kw magnetic">合體</span>')
      .replace(/進擊/g, '<span class="cp-kw magnetic">進擊</span>')
      .replace(/法術塑造/g, '<span class="cp-kw windfury">法術塑造</span>')
      .replace(/複仇/g, '<span class="cp-kw deathrattle">複仇</span>');
  }

  // 全局卡牌查询核心
  function findCard(query){
    if(!query) return null;
    var raw = String(query).trim().replace(/^[【「『]/, '').replace(/[】」』]$/, '').trim();
    if(!raw) return null;

    var poolList = (typeof POOL !== "undefined" && Array.isArray(POOL)) ? POOL : [];
    var extraDict = (typeof EXTRA_CARDS !== "undefined") ? EXTRA_CARDS : {};
    var cardsDict = (typeof CARDS !== "undefined") ? CARDS : {};

    // 1. 根據 ID 精確匹配 (如 BG25_354, TB_BaconUps_045, BGS_040 等)
    if(/^[A-Za-z0-9_]+$/.test(raw)){
      for(var i = 0; i < poolList.length; i++){
        if(poolList[i].i === raw) return buildCardDetail(poolList[i], raw);
      }
      if(extraDict[raw]){
        return buildCardDetail(Object.assign({ i: raw }, extraDict[raw]), raw);
      }
    }

    // 2. 根據官方全名在 POOL 中精確匹配
    for(var j = 0; j < poolList.length; j++){
      if(poolList[j].n === raw) return buildCardDetail(poolList[j], raw);
    }

    // 3. 在 EXTRA_CARDS 中精確匹配
    for(var ek in extraDict){
      if(extraDict[ek].n === raw) return buildCardDetail(Object.assign({ i: ek }, extraDict[ek]), raw);
    }

    // 4. 在 CARDS 字典中匹配 key
    if(cardsDict[raw]){
      var cd = cardsDict[raw];
      var offName = cd.n || raw;
      // 尝試去 POOL 拿完整數據
      for(var k = 0; k < poolList.length; k++){
        if(poolList[k].n === offName) return buildCardDetail(poolList[k], raw, cd);
      }
      return buildCardDetailFromCARDS(cd, raw);
    }

    // 5. 在 ALIAS_MAP 中查找別名映射
    var aliasTarget = ALIAS_MAP[raw];
    if(aliasTarget){
      for(var m = 0; m < poolList.length; m++){
        if(poolList[m].n === aliasTarget) return buildCardDetail(poolList[m], raw);
      }
      for(var em in extraDict){
        if(extraDict[em].n === aliasTarget) return buildCardDetail(Object.assign({ i: em }, extraDict[em]), raw);
      }
      if(cardsDict[aliasTarget]){
        return buildCardDetailFromCARDS(cardsDict[aliasTarget], raw);
      }
    }

    // 6. 模糊匹配 (前綴/包含/去修饰詞)
    var clean = raw.replace(/^(金色|巨型|普通)/, '');
    for(var n = 0; n < poolList.length; n++){
      var pName = poolList[n].n;
      if(pName === clean || pName.indexOf(clean) >= 0 || clean.indexOf(pName) >= 0){
        return buildCardDetail(poolList[n], raw);
      }
    }

    for(var ck in cardsDict){
      if(ck === clean || ck.indexOf(clean) >= 0 || clean.indexOf(ck) >= 0){
        return buildCardDetailFromCARDS(cardsDict[ck], raw);
      }
    }

    return null;
  }

  // 組裝標准卡牌數據对象
  function buildCardDetail(c, queryName, optionalCardObj){
    var id = c.i || (optionalCardObj && optionalCardObj.img ? optionalCardObj.img.replace(/^.*\//, '').replace(/\.[^.]+$/, '') : "");
    var name = c.n || queryName;
    var alias = (queryName && queryName !== name) ? queryName : "";
    var tier = c.t != null ? c.t : (optionalCardObj ? optionalCardObj.t : null);
    var isSpell = (c.y === 1) || (optionalCardObj && optionalCardObj.k === "spell");
    var atk = c.a != null ? c.a : (optionalCardObj ? optionalCardObj.a : null);
    var hp = c.h != null ? c.h : (optionalCardObj ? optionalCardObj.h : null);
    var desc = c.x || (optionalCardObj ? optionalCardObj.x : "") || "暂無卡牌描述";
    var raceRaw = c.r || (optionalCardObj ? optionalCardObj.r : "") || "";

    var races = [];
    if(raceRaw){
      races = String(raceRaw).split("/").map(function(r){ return RACE_CN[r] || r; }).filter(Boolean);
    }

    // 圖片路徑自适應
    var inSub = (typeof location !== "undefined" && (location.pathname.indexOf("/zh-TW/") >= 0 || location.pathname.indexOf("\\zh-TW\\") >= 0));
    var pfx = inSub ? "../pool/" : "../pool/";
    var imgSrc = "";
    if(c.m && c.i){
      imgSrc = pfx + c.i + ".webp";
    } else if(optionalCardObj && optionalCardObj.img){
      imgSrc = (inSub && optionalCardObj.img.indexOf("../") !== 0) ? ("../" + optionalCardObj.img) : optionalCardObj.img;
    } else if(c.i){
      imgSrc = pfx + c.i + ".webp";
    }

    // 角色定位
    var roleTag = getCardRoleTag(name, queryName);

    return {
      id: id,
      name: name,
      alias: alias,
      tier: tier,
      isSpell: isSpell,
      attack: atk,
      health: hp,
      races: races,
      raceRaw: raceRaw,
      desc: desc,
      img: imgSrc,
      hasImg: !!imgSrc,
      roleTag: roleTag
    };
  }

  function buildCardDetailFromCARDS(cd, queryName){
    var name = cd.n || queryName;
    var alias = (queryName && queryName !== name) ? queryName : "";
    var races = cd.r ? [cd.r] : [];
    var id = "";
    if(cd.img){
      var m = /\/([^\/]+)\.webp$/.exec(cd.img);
      if(m) id = m[1];
    }
    return {
      id: id,
      name: name,
      alias: alias,
      tier: cd.t,
      isSpell: cd.k === "spell",
      attack: cd.a,
      health: cd.h,
      races: races,
      raceRaw: cd.r || "",
      desc: cd.x || "暂無卡牌描述",
      img: cd.img || "",
      hasImg: !!cd.img,
      roleTag: getCardRoleTag(name, queryName)
    };
  }

  // 提取核心定位標签 (Carrier / Engine / Finisher)
  function getCardRoleTag(name, alias){
    if(typeof COMP_NOTES === "undefined") return null;
    var targets = [name, alias].filter(Boolean);
    for(var key in COMP_NOTES){
      var m = COMP_NOTES[key].cardsMapping;
      if(!m) continue;
      for(var i = 0; i < targets.length; i++){
        var t = targets[i];
        if(m.carrier && m.carrier.indexOf(t) >= 0) return { type: "carrier", label: "🎯 核心承載宿主" };
        if(m.engine && m.engine.indexOf(t) >= 0) return { type: "engine", label: "⚡ 核心乘數引擎" };
        if(m.finisher && m.finisher.indexOf(t) >= 0) return { type: "finisher", label: "👑 終局終结位" };
      }
    }
    return null;
  }

  // 2. 初始化全局彈窗 DOM
  var modalEl = null;

  function ensureModalDOM(){
    if(modalEl && document.body.contains(modalEl)) return modalEl;

    // 檢查是否页面已有 poolModal (cards.html) 或預置的 globalCardModal (play.html / index.html)
    var existing = document.getElementById("poolModal") || document.getElementById("globalCardModal");
    if(existing){
      modalEl = existing;
      if(!modalEl.getAttribute("data-gcm-bound")){
        bindModalEvents(modalEl);
        modalEl.setAttribute("data-gcm-bound", "1");
      }
      return modalEl;
    }

    var div = document.createElement("div");
    div.className = "pool-modal";
    div.id = "globalCardModal";
    div.hidden = true;
    div.setAttribute("aria-hidden", "true");
    div.setAttribute("role", "dialog");
    div.setAttribute("aria-modal", "true");

    div.innerHTML =
      '<div class="pm-card">' +
        '<button type="button" class="pm-close" id="gcmClose" aria-label="關閉">×</button>' +
        '<div class="pm-img" id="gcmImgWrap">' +
          '<img id="gcmImg" alt="" />' +
          '<div class="pm-noimg" id="gcmNoImg" style="display:none;"><i>?</i><span>卡圖收錄中</span></div>' +
        '</div>' +
        '<div class="pm-info">' +
          '<div class="pm-title-row">' +
            '<h3 id="gcmName"></h3>' +
            '<span class="pm-alias" id="gcmAlias" style="display:none;"></span>' +
          '</div>' +
          '<div class="pm-meta" id="gcmMeta"></div>' +
          '<p class="pm-text" id="gcmText"></p>' +
          '<div class="pm-extra" id="gcmExtra"></div>' +
          '<div class="pm-footer">' +
            '<div class="pm-tribes" id="gcmTribes"></div>' +
            '<a class="pm-pool-link" id="gcmPoolLink" href="#" target="_blank" rel="noopener">在完整卡牌池中查看 →</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(div);
    modalEl = div;
    bindModalEvents(modalEl);
    return modalEl;
  }

  function bindModalEvents(m){
    m.addEventListener("click", function(e){
      if(e.target === m || e.target.closest("#gcmClose") || e.target.closest("#pmClose") || e.target.closest(".pm-close")){
        closeCardModal();
      }
    });
  }

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && modalEl && !modalEl.hidden){
      closeCardModal();
    }
  });

  // 打開卡牌詳情彈窗
  function openCardModal(query){
    var card = findCard(query);
    if(!card) return false;

    var m = ensureModalDOM();
    if(!m) return false;

    // 隱藏現有可能跟隨鼠標的 popover
    var pop = document.getElementById("cardPop");
    if(pop) pop.hidden = true;

    // 填充數據
    var nameEl = m.querySelector("#gcmName") || m.querySelector("#pmName");
    var aliasEl = m.querySelector("#gcmAlias") || m.querySelector("#pmAlias");
    var metaEl = m.querySelector("#gcmMeta") || m.querySelector("#pmMeta");
    var textEl = m.querySelector("#gcmText") || m.querySelector("#pmText");
    var imgEl = m.querySelector("#gcmImg") || m.querySelector("#pmImg");
    var noImgEl = m.querySelector("#gcmNoImg");
    var extraEl = m.querySelector("#gcmExtra");
    var tribesEl = m.querySelector("#gcmTribes") || m.querySelector("#pmTribes");
    var poolLinkEl = m.querySelector("#gcmPoolLink");

    // 標題與別名
    if(nameEl) nameEl.textContent = card.name;
    if(aliasEl){
      if(card.alias && card.alias !== card.name){
        aliasEl.textContent = "別名：" + card.alias;
        aliasEl.style.display = "";
      } else {
        aliasEl.style.display = "none";
      }
    }

    // 元數據 (星级 / 體質 / 種族)
    var metaBits = [];
    if(card.tier != null) metaBits.push('<span class="stars">' + tierStars(card.tier) + '</span>');
    if(card.isSpell) metaBits.push('旅店法術');
    else if(card.attack != null && card.health != null) metaBits.push(card.attack + ' / ' + card.health);
    if(card.races && card.races.length) metaBits.push(card.races.join(' / '));
    else if(!card.isSpell) metaBits.push('無種族');

    if(metaEl) metaEl.innerHTML = metaBits.join(' · ');

    // 卡牌效果描述 (高亮關鍵詞)
    if(textEl) textEl.innerHTML = formatCardKeywords(card.desc);

    // 圖片處理
    if(imgEl){
      if(card.hasImg && card.img){
        imgEl.src = card.img;
        imgEl.style.display = "";
        if(noImgEl) noImgEl.style.display = "none";
        imgEl.onerror = function(){
          this.style.display = "none";
          if(noImgEl) noImgEl.style.display = "flex";
        };
      } else {
        imgEl.style.display = "none";
        if(noImgEl) noImgEl.style.display = "flex";
      }
    }

    // 进階屬性 (金色體質 / 核心定位)
    if(extraEl){
      var extras = [];
      if(!card.isSpell && card.attack != null && card.health != null){
        extras.push('<span class="cp-golden">✨ 金色 <b>' + (card.attack * 2) + '/' + (card.health * 2) + '</b> (加倍)</span>');
      }
      if(card.roleTag){
        extras.push('<span class="cp-role ' + card.roleTag.type + '">' + card.roleTag.label + '</span>');
      }
      extraEl.innerHTML = extras.join(' ');
      extraEl.style.display = extras.length ? "flex" : "none";
    }

    // 種族圖鑑跳轉
    if(tribesEl){
      tribesEl.innerHTML = "";
      var rRaw = (card.raceRaw || "").split("/");
      rRaw.forEach(function(r){
        var tid = TRIBE_ID[r];
        if(!tid) return;
        var rName = RACE_CN[r] || r;
        var a = document.createElement("a");
        a.href = "index.html?tribe=" + tid + "#tribes";
        a.textContent = "看「" + rName + "」流派 →";
        a.addEventListener("click", function(){ closeCardModal(); });
        tribesEl.appendChild(a);
      });
    }

    // 卡牌池页面鏈接
    if(poolLinkEl){
      if(card.id){
        poolLinkEl.href = "cards.html?card=" + encodeURIComponent(card.id);
        poolLinkEl.style.display = "";
      } else {
        poolLinkEl.href = "cards.html?search=" + encodeURIComponent(card.name);
        poolLinkEl.style.display = "";
      }
    }

    m.hidden = false;
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    return true;
  }

  function closeCardModal(){
    if(!modalEl) return;
    modalEl.hidden = true;
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // 3. 全局捕獲階段点擊委托攔截器
  // 增加移動端滑動防誤觸機制：手指滑動距離超过 8px 視作滑屏滚屏，不觸發卡牌彈窗
  var touchStartX = 0, touchStartY = 0, touchMoved = false;
  document.addEventListener("touchstart", function(e){
    if(e.touches && e.touches[0]){
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
    }
  }, { passive: true });

  document.addEventListener("touchmove", function(e){
    if(e.touches && e.touches[0]){
      var dx = Math.abs(e.touches[0].clientX - touchStartX);
      var dy = Math.abs(e.touches[0].clientY - touchStartY);
      if(dx > 8 || dy > 8){
        touchMoved = true;
      }
    }
  }, { passive: true });

  document.addEventListener("click", function(e){
    // 如果在觸摸屏上是在滑屏翻滚，徹底忽略，防止移動端手勢誤碰
    if(touchMoved) return;

    // 彈窗內部的点擊不作為卡牌觸發
    if(e.target.closest("#globalCardModal") || e.target.closest("#poolModal")){
      var closeBtn = e.target.closest(".pm-close");
      var modalWrap = e.target.classList.contains("pool-modal");
      if(closeBtn || modalWrap){
        closeCardModal();
      }
      return;
    }

    // 忽略特定功能按钮
    if(e.target.closest(".swap, .ps-tools, .to-top, .search-open, #searchOverlay, #tierModal")) return;

    var target = e.target;

    // 寻找任何可能代表卡牌的目標元素
    var chip = target.closest(".card-chip, .card-name-btn");
    var slot = target.closest("[data-card-id], [data-card], .comp-slot, .cr-slot, .tb-card, .fc, .tc, .mc-card, .cmp-slot, .hc-card-item, .demo-card, .fchip, .hero-board a, .core-item .ci-head b, #missList .miss");

    var el = chip || slot;
    if(!el) return;

    // 提取卡牌 ID 或名稱
    var id = el.getAttribute("data-card-id");
    var name = el.getAttribute("data-card");

    if(!id && !name){
      var innerIdEl = el.querySelector ? el.querySelector("[data-card-id]") : null;
      if(innerIdEl) id = innerIdEl.getAttribute("data-card-id");
      var innerNameEl = el.querySelector ? el.querySelector(".cs-name, .tb-name, .fc-name, .tc-name, .hc-ci-name, .dc-name, .ps-name, em, b") : null;
      if(innerNameEl) name = innerNameEl.textContent.trim();
    }

    if(!id && !name && el.textContent){
      var txt = el.textContent.trim().replace(/^#[0-9]+\s*/, '').replace(/^[0-9]+\.\s*/, '');
      if(txt.length <= 25) name = txt;
    }

    var query = id || name;
    if(!query) return;

    var hit = findCard(query);
    if(hit){
      e.preventDefault();
      e.stopPropagation();
      openCardModal(query);
    }
  }, true);

  // 4. 文本節点中的卡牌名稱自動掃描與增強
  var REGEX_BRACKET_CARD = /【([^】\n\r]+)】/g;

  function enhanceBracketText(text){
    if(!text || text.indexOf("【") < 0) return text;
    return text.replace(REGEX_BRACKET_CARD, function(match, inner){
      // 檢查是否有斜杠分隔的多張卡牌，如【地卜師/测绘員】
      if(inner.indexOf("/") >= 0 || inner.indexOf("、") >= 0){
        var parts = inner.split(/[\/、]/);
        var res = [];
        var allMatch = true;
        for(var i = 0; i < parts.length; i++){
          var p = parts[i].trim();
          if(findCard(p)){
            res.push('<span class="card-chip" data-card="' + p + '" role="button" tabindex="0" title="点擊查看卡牌具體信息">' + p + '</span>');
          } else {
            allMatch = false;
            break;
          }
        }
        if(allMatch && res.length){
          return '【' + res.join('/') + '】';
        }
      }

      var card = findCard(inner);
      if(card){
        return '<span class="card-chip" data-card="' + inner + '" role="button" tabindex="0" title="点擊查看卡牌具體信息">【' + inner + '】</span>';
      }
      return match;
    });
  }

  // 掃描页面上的教学、描述與說明文本
  function enhanceCardMentions(root){
    root = root || document.body;
    if(!root) return;

    var selectors = [
      ".ct-flow-item p", ".ct-trans-row", ".ct-block-head", ".ct-mis-list li", ".ct-math-desc",
      ".sc-desc", ".sc-stage-desc", ".pos-hint", ".cc-pos", "#summaryTable td:nth-child(3)",
      "#glossaryList dd", "#glossaryList dt", ".hc-strat", ".hc-trap", ".tn-desc", ".tn-action",
      ".tech-tag", ".rule p", ".dg-note", ".mc-line", ".mc-good", ".mc-bad", "#adviceMain", "#adviceSub", ".psc-body p", ".psc-list li", ".ppb-text"
    ];

    selectors.forEach(function(sel){
      var els = root.querySelectorAll(sel);
      for(var i = 0; i < els.length; i++){
        var el = els[i];
        if(el.getAttribute("data-card-enhanced")) continue;
        el.setAttribute("data-card-enhanced", "1");
        if(el.innerHTML && el.innerHTML.indexOf("【") >= 0){
          el.innerHTML = enhanceBracketText(el.innerHTML);
        }
      }
    });

    // 核心組件列表中的名稱：.core-item .ci-head b
    var coreHeadB = root.querySelectorAll(".core-item .ci-head b");
    for(var j = 0; j < coreHeadB.length; j++){
      var b = coreHeadB[j];
      if(!b.classList.contains("card-name-btn")){
        b.classList.add("card-name-btn");
        b.setAttribute("data-card", b.textContent.trim());
        b.setAttribute("role", "button");
        b.setAttribute("tabindex", "0");
        b.title = "点擊查看卡牌效果";
      }
    }
  }

  // DOM 准備好後运行
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){
      ensureModalDOM();
      enhanceCardMentions();
    });
  } else {
    ensureModalDOM();
    enhanceCardMentions();
  }

  // 监聽 DOM 變動 (如切換 tab、週報列表異步渲染)
  if("MutationObserver" in window){
    var observer = new MutationObserver(function(mutations){
      var shouldEnhance = false;
      for(var i = 0; i < mutations.length; i++){
        if(mutations[i].addedNodes.length > 0){
          shouldEnhance = true;
          break;
        }
      }
      if(shouldEnhance){
        enhanceCardMentions();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 暴露全局 API
  window.findCard = findCard;
  window.openCardModal = openCardModal;
  window.closeCardModal = closeCardModal;
  window.enhanceCardMentions = enhanceCardMentions;
  window.formatCardKeywords = formatCardKeywords;

})();
