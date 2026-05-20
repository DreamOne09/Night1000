/**
 * 產生 question.js：保留前段經典真心話 + 全新辛辣真心話尾段 + 全新大冒險 500 題
 * 執行：node build-question-bank.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const HEADER = `/**
 * NightBox 題庫
 * 題目總數：1000 題（真心話 500、大冒險 500）
 * 語言：繁體中文
 * 尺度：見 question-meta.js 數字標籤 1–3（僅供建置／手動備註；前端不顯示、不過濾抽題）
 * 風格：熟人或想變熟；2.0 篩選：前段約半數改為「說一個…」故事題，尾段為 tail-manual-pool 人工池
 * 大冒險：以「真心連線／直球電話／家人／曖昧與告白」勇者任務為主；相簿與口述為輔；捨同步拍手、舞步道具等過度遊樂園式項目
 */

`;

/** 1=輕鬆閒聊 2=一般派對 3=較辛辣／身體／親密；由關鍵字推斷，可事後人工覆寫 question-meta.js */
function inferTruthLevel(q) {
  const s = q;
  if (
    /性行為|口交|裸體|裸奔|內褲|罩杯|胸圍|春夢|避孕|謎片|成人片|一夜情|炮友|舌吻|做愛|上床|高潮|出軌|第三者|意淫|保險套|硬\/濕|親密行為|自慰|手淫|為另一半「口」|初夜/.test(
      s,
    )
  ) {
    return 3;
  }
  if (
    /最喜歡的食物|最喜歡的季節|最喜歡的三個顏色|最喜歡的書|最喜歡的電影|四個字形容|廁紙|指頭挖鼻子|放的屁|鬼怪或者神靈|最喜歡哪部電影/.test(
      s,
    )
  ) {
    return 1;
  }
  return 2;
}

function inferDareLevel(q) {
  const s = q;
  if (
    /相簿第|私密|親吻|接吻|摸|脫|裸|舌吻|吻痕|餵食|情侶合照|擊掌後對視|對視|前任|視訊|擴音|免持|曖昧|想念|電話/.test(s)
  ) {
    return 3;
  }
  if (/成語|動物叫|拍手|走秀|誇張稱讚|頒獎|征友|新聞跑馬燈|購物台|抖音|KPOP/.test(s)) return 1;
  return 2;
}

/** 方向 A＝關係／故事／價值；方向 B＝身體／親密／性向話題（關鍵字啟發式，可事後人工覆寫） */
function inferTruthDirectionAB(q) {
  const s = q;
  if (
    /性行為|口交|裸體|裸奔|內褲|罩杯|胸圍|春夢|避孕|謎片|成人片|一夜情|炮友|舌吻|做愛|上床|高潮|意淫|保險套|自慰|手淫|初夜|親密|接吻|吻|濕|硬|身體|胸部|屁股/.test(
      s,
    )
  ) {
    return "B";
  }
  return "A";
}

/** 方向 A＝單人表演／口才；方向 B＝與現場他人互動或相簿等（關鍵字啟發式） */
function inferDareDirectionAB(q) {
  const s = q;
  if (
    /與一位朋友|一位朋友|擊掌|合照|對視|相簿第|採訪一位朋友|背靠背|同步拍手|輪流.*朋友|旁邊的人|指定.*朋友|選一位/.test(
      s,
    )
  ) {
    return "B";
  }
  return "A";
}

function uniquePush(arr, set, s) {
  if (!s || set.has(s)) return;
  set.add(s);
  arr.push(s);
}

function extractQuestionsFromSource(raw) {
  const re = /^\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/gm;
  const out = [];
  let m;
  while ((m = re.exec(raw))) {
    out.push(JSON.parse('"' + m[1].replace(/\\"/g, '"') + '"'));
  }
  return out;
}

function buildTruthTail() {
  const headPath = new URL("./question-truth-head.txt", import.meta.url);
  const headQs = new Set(extractQuestionsFromSource(readFileSync(headPath, "utf8")));

  const path = new URL("./tail-manual-pool.txt", import.meta.url);
  const lines = readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const out = [];
  const seen = new Set();
  for (const q of lines) {
    if (headQs.has(q) || seen.has(q)) continue;
    uniquePush(out, seen, q);
    if (out.length >= 275) break;
  }

  if (out.length < 275) {
    for (const q of lines) {
      if (seen.has(q)) continue;
      uniquePush(out, seen, q);
      if (out.length >= 275) break;
    }
  }

  if (out.length < 275) {
    throw new Error(
      `真心話尾段湊不滿 275 題（與前段去重後 ${out.length} 題），請補充 tail-manual-pool.txt`,
    );
  }
  return out.slice(0, 275);
}

function buildDareQuestions() {
  const out = [];
  const seen = new Set();
  const add = (s) => uniquePush(out, seen, s);
  const AGREED =
    "須對方事先知情且同意；對方明示拒談、封鎖、未接或未讀即止，不得以連續騷擾取代；可換人／改喝啤酒半杯／改題。";

  const D = ["20 秒", "25 秒", "30 秒", "35 秒", "40 秒", "45 秒", "55 秒", "1 分鐘"];

  // ---（1）爸媽：我愛你 --- 
  const elders = ["爸爸", "媽媽"];
  const loveModes = [
    "接通後第一句就打直球說「我愛你」再補一句這週你想到他／她的一刻（可先說在玩大冒險）",
    "接通後先道歉打擾，再謝謝對方平常的照顧，最後補愛你並問夜宵吃了沒",
    "人若在旁：當面說愛你並讓對方講一句回你（可搞笑）；離席就視訊臉對臉講完並揮手給全桌看一眼",
    "未接：語音信箱二十秒內說愛你＋在玩大冒險，不得補對方私生活八卦",
  ];
  for (const who of elders) {
    for (const how of loveModes) {
      for (const dl of ["全程六十秒內收束", "耐性版九分鐘內要有語音紀錄或已撥紀錄"]) {
        add(`打給「${who}」（或視訊）：${how}；${dl}；${AGREED}`);
      }
    }
  }

  // ---（2）曖昧對象／狂撥與語音張力 ---
  const ambiguousTargets = [
    "目前正在曖昧、私訊最勤的那位對象",
    "你想推進但仍卡住的那位曖昧對象",
    "單想好一陣子、但還沒講過喜歡的那位",
    "若心動對象在座可當場；不在座就換電話或視訊",
  ];
  const spamRules = [
    "對方電話若未接通，二十分鐘內要完成至少五次不同時間戳的外撥或平台語音（現場幫數；同一分鐘狂震不算）；任一接通就立刻停並開免持講你是在續攤大冒險",
    "改用訊息：連傳五次不重複問候語（由左右鄰協助句式）直到已讀或回覆任一；對方明示勿再傳就立刻停並改喝啤酒",
    "先規定對方接了只講「今天抽到你就想到你」再報十五秒近況就掛；若未接再起第二次到第五次留最後一則語音信箱",
    "視訊響三下不接就改電話門號；全流程最多五通並每通間隔三十分鐘內要完成（避免深夜騷擾）",
  ];
  for (const t of ambiguousTargets) {
    for (const r of spamRules) {
      for (const cap of ["整段上限五分鐘", "整段上限九分鐘"]) {
        add(`對「${t}」：${r}；${cap}；${AGREED}`);
      }
    }
  }

  // ---（3）告白／對心動對象直球 ---
  const confessBodies = [
    "對「此刻最想認真告白」對象講出心裡那句結論——人在現場可先拉到一旁講完；缺席就視訊或電話並開擴音讓這桌聽到你的收束句",
    "十到三十秒內選一句：我很喜歡你／我很想跟你一起走更遠／我很想認真試一次，並各補「因為」一句具體小事，不能全靠搞笑帶過",
    "把你寫好的告白草稿念給對方聽，或拍照傳送並秀已送出截圖（頭像打碼）；對方若拒收就立刻停",
    "若暫時無法對真人告白：對空氣三十秒講完你要對「某代號對象」說的愛意，再加一句對自己的勇氣承諾，然後喝一口",
  ];
  for (const c of confessBodies) {
    for (const urg of ["須對方事前願意玩這種梗", "若對方強烈為難就改對手機備忘錄自錄並刪"]) {
      for (const d of D.slice(0, 6)) {
        add(`${c}；單輪發言不超 ${d}；${urg}；${AGREED}`);
      }
    }
  }

  // ---（4）前任／白月光 --- 
  const relic = [
    "其中一位前任／前女友／前男友（自選號）",
    "久未聯絡、但今天抽題腦最先浮現的那位舊對象",
    "曾最想走到最後卻沒在一起的那位",
    "你敢承認的那位白月光式人物（代號講也行）",
  ];
  const relicActs = [
    "接通後只講三十秒近況＋問對方現在好不好並道謝掛線",
    "語音信箱：對當年不懂事的自己道歉並祝福對方之後順利",
    "若接通請對方用一句話評價「現在的你」，你道謝十秒後掛線",
    "傳短文訊：「突然想起你／今晚玩太大」起手，正文不得騷擾；截圖打碼交差",
    "開擴音對全場講「對不起當年沒勇氣」，再對線上那頭補一句近況",
  ];
  for (const who of relic) {
    for (const act of relicActs) {
      for (const tb of ["全程四十五秒收束", "九分鐘內要有發送或呼叫紀錄"]) {
        add(`針對「${who}」：${act}；${tb}；${AGREED}`);
      }
    }
  }

  // ---（5）朋友見證型 --- 
  const friendHooks = [
    "打給最挺你的摯友並開擴音：請對這桌講一句替你護航的祝福話並乾杯口吻收尾",
    "請自選在座朋友幫你把一句話轉傳給你的曖昧或心動對象（對方不接就秀出已送出訊息的截圖）",
    "與朋友在場對看三十秒，輪流向對方講一件今年真心謝對方的小事（不提第三個真名）",
    "互換手機：各自挑一張最能代表近來感情狀態的相簿，交換口述十五秒，不得直指第三者真名",
    "手拉手或隔空對空氣練「若你接受告白會怎麼回應」正反兩段各七秒，並一起笑出聲收尾",
  ];
  for (const h of friendHooks) {
    for (const d of D) {
      add(`${h}；限時約${d}；${AGREED}`);
    }
  }

  // ---（6）限動／私訊勇者 --- 
  const onlineBodies = ["此刻最常聊到睡不著的那位", "你心裡藏著名字的那位"];
  const onlineActs = [
    "限對象私訊或限動發「救我正在大冒險」並附馬賽克合照",
    "十個繁體字內講撩或講謝（句式由鄰桌指定）並秀已傳紀錄",
    "對上一則對方貼文用語音複述二十五秒並外放這桌全部聽得見",
  ];
  for (const body of onlineBodies) {
    for (const act of onlineActs) {
      add(`針對「${body}」：${act}；九分鐘內完成；${AGREED}`);
      add(`針對「${body}」：${act}；二十一分鐘內完成並秀截圖；${AGREED}`);
    }
  }

  // ---（7）相簿口述（量少） ---
  const tones = ["八點檔旁白", "罪案懸疑片旁白"];
  const idx = [2, 3, 6, 7, 9, 10];
  for (const n of idx) {
    for (const t of tones) {
      for (const d of D.slice(1, 5)) {
        add(`翻相簿第 ${n} 張（過敏請換下一張）：用「${t}」講三十秒那張相片與感情史的聯想，不提真名；${d} 內講完；${AGREED}`);
      }
    }
  }

  // ---（8）雙人張力 ---
  const pairBrave = [
    "背靠背各講最近一次心碎的瞬間並互道辛苦，不提姓名",
    "對視二十五秒並互講對方「最不該被你嘲笑的一個優點」",
    "互看對方手機備註暱稱並截圖打馬賽克，口述誰的備註比較敢放閃",
    "同時撥號給一位共同熟人並開擴音：請對方用二十秒猜你倆像哪種戀愛喜劇角色搭配的現場評語",
  ];
  for (const pb of pairBrave) {
    for (const d of D.slice(0, 6)) {
      add(`與自選現場同伴：${pb}；約${d}；${AGREED}`);
    }
  }

  // ---（9）單人情緒復盤 --- 
  const soloBrave = [
    "對這桌講四十秒為何你仍相信被愛值得（可冷笑話結尾）",
    "對自己發語音三十秒，講對未來另一半的三條底線（不可指名第三者）",
    "閉眼三十秒口述最怕在感情裡重蹈覆轍的一件事",
    "向空杯乾杯，對某位已離開的人講一句謝謝再喝一口飲料",
    "秀出鬧鐘備註裡跟感情相關的提醒字卡並馬賽克截圖交差",
  ];
  for (const s of soloBrave) {
    for (const d of D.slice(0, 4)) {
      add(`${s}；限時約${d}；做不完喝啤酒；${AGREED}`);
    }
  }

  // ---（10）舊電話網——保留適度複合變化 --- 
  const targets = [
    "此刻最想念的那位異性（非直系親屬）",
    "其中一位前任／前女友／前男友（自行選號）",
    "目前正曖昧、這週私訊最常往來的那位對象",
    "曾經最認真喜歡、但沒能在一起的那位",
    "久未聯絡、但今天抽題第一個想到的那位",
  ];
  const schemes = [
    ["打電話並開免持／擴音（或戴耳機讓旁人聽）", "接通後只許說現場指定的一句話就掛斷（由下一位玩家指定八字內中性台詞）"],
    ["打電話（可開擴音）", "接通後講今晚續攤在玩真心話並問對方一句近況，二十秒內道謝掛線"],
    ["打視訊或語音電話（由對方決定接通方式）", "接通後讓對方看一眼現場並說「你猜猜我在做什麼」就掛；不接改信箱"],
    ["打電話", "對方不接就語音信箱二十秒內：自述大冒險＋祝福或調侃；不用真名可用代號"],
    ["打電話", "對方若接請一句話評價以前的你並十秒謝謝掛線"],
  ];
  const tBudget = [
    "四十五秒收束",
    "九十秒包含留言紀錄",
    "耐性版九分鐘內要有發送紀錄",
    "兩分鐘內交卷（接通或紀錄）",
    "五分鐘內完成並秀已撥截圖",
    "對方若在忙就只留三十秒信箱不要狂撥超過三通",
    "若深夜時段對方明示睡覺就改天亮前傳早安訊息截圖",
    "對方若在聚會就只傳無聲貼圖直到對方有空回撥為止",
    "對方若在開車就只留語音並不可要求秒回（安全優先）",
  ];
  for (const who of targets) {
    for (const [open, rule] of schemes) {
      for (const tb of tBudget) {
        add(`${open}給「${who}」：${rule}；${tb}；${AGREED}`);
      }
    }
  }

  const msgHooks = ["五個繁體字的玩笑起手", "冷笑話起手＋一張貼圖", "梗圖＋求救文字"];
  for (const who of targets.slice(0, 4)) {
    for (const mh of msgHooks) {
      add(`私訊「${who}」：${mh}；四十五秒至兩分鐘內送出並秀截圖馬賽克；${AGREED}`);
      add(`私訊「${who}」：${mh}；要有已讀或未讀截圖紀錄；${AGREED}`);
    }
  }

  const hotOneOff = [
    "打給白月光／朱砂痣任一：接通就講「今天抽到就想聽你聲音」馬上掛；未接改短訊；九分鐘內；對方須事前肯玩不然改喝啤酒。",
    "打電話請一位異性親友開擴音對全桌講護航祝福语；對方不配合就喝；須對方同意。",
  ];
  for (const h of hotOneOff) {
    add(`${h}；${AGREED}`);
  }

  /** 補滿張力模版：對象／起手／語氣的微變體 --- */
  const pinchWho = ["最欠一句道歉的那位", "最欠一句謝謝的那位", "你覺得最懂你的異性友人一位"];
  const pinchOpen = ["只講來意十秒並掛線", "只問對方今天心情一句並謝謝", "請對方幫這桌起哄喊一句愛情金句並掛線"];
  for (const w of pinchWho) {
    for (const op of pinchOpen) {
      for (const tk of ["六十分鐘內一次完成", "當輪九分鐘內完成並秀紀錄"]) {
        add(`打給「${w}」：${op}；${tk}；${AGREED}`);
      }
    }
  }

  if (out.length < 500) {
    throw new Error(`dare underflow: ${out.length}, tweak templates`);
  }
  return out.slice(0, 500);
}

const truthHeadPath = new URL("./question-truth-head.txt", import.meta.url);
/** 去掉最後一題結尾逗號，避免與下方銜接時變成 ",," 產生空元素 */
const truthHeadRaw = readFileSync(truthHeadPath, "utf8").trimEnd().replace(/,\s*$/, "");
const truthHeadQs = extractQuestionsFromSource(readFileSync(truthHeadPath, "utf8"));

const truthTail = buildTruthTail();
const dareList = buildDareQuestions();

if (truthTail.length !== 275) {
  throw new Error(`truth tail expected 275, got ${truthTail.length}`);
}
if (dareList.length !== 500) {
  throw new Error(`dare expected 500, got ${dareList.length}`);
}

const truthFull = truthHeadQs.concat(truthTail);
if (truthFull.length !== 500) {
  throw new Error(`truth full expected 500, got ${truthFull.length}`);
}

const truthQuestionLevels = truthFull.map(inferTruthLevel);
const dareQuestionLevels = dareList.map(inferDareLevel);
const truthQuestionDirs = truthFull.map((q) => (inferTruthDirectionAB(q) === "B" ? 1 : 0));
const dareQuestionDirs = dareList.map((q) => (inferDareDirectionAB(q) === "B" ? 1 : 0));

function formatArray(name, items) {
  const lines = items.map((q) => "    " + JSON.stringify(q));
  return `const ${name} = [\n${lines.join(",\n")}\n];`;
}

function formatNumArray(name, items) {
  const lines = items.map((n) => "    " + n);
  return `const ${name} = [\n${lines.join(",\n")}\n];`;
}

const META_HEADER = `/**
 * NightBox 題目 meta（與 question.js 題序對應）
 * truthQuestionLevels / dareQuestionLevels：數字 1–3（建置推斷的尺度標記；備份用，前端不顯示）
 * truthQuestionDirs / dareQuestionDirs：0=方向A 1=方向B（關鍵字啟發式，可手動編輯）
 *   真心話 A≈關係／故事／價值；B≈身體／親密向
 *   大冒險 A≈單人表演／口才；B≈與現場互動／相簿等
 */
`;

const metaBody =
  META_HEADER +
  formatNumArray("truthQuestionLevels", truthQuestionLevels) +
  "\n" +
  formatNumArray("dareQuestionLevels", dareQuestionLevels) +
  "\n" +
  formatNumArray("truthQuestionDirs", truthQuestionDirs) +
  "\n" +
  formatNumArray("dareQuestionDirs", dareQuestionDirs) +
  "\n";

writeFileSync(new URL("./question-meta.js", import.meta.url), metaBody, "utf8");

const body = [
  truthHeadRaw + ",",
  "    // --- 真心話補充：熟人／想變熟；具體情境、故事、好玩（請在彼此同意下遊玩） ---",
  ...truthTail.map((q) => "    " + JSON.stringify(q) + ","),
  "];",
  "",
  formatArray("dareQuestions", dareList),
  "",
].join("\n");

writeFileSync(new URL("./question.js", import.meta.url), HEADER + body + "\n", "utf8");
console.log("Wrote question.js + question-meta.js", {
  truth: truthFull.length,
  dare: dareList.length,
});
