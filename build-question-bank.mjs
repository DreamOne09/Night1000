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

  const readQuestionLines = (path) =>
    readFileSync(path, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  // 人工精選題永遠優先進入產出；一般尾池只負責補足 275 題。
  const premiumLines = readQuestionLines(
    new URL("./truth-premium-pool.txt", import.meta.url),
  );
  const manualLines = readQuestionLines(
    new URL("./tail-manual-pool.txt", import.meta.url),
  );
  const lines = premiumLines.concat(manualLines);

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
    "可無條件跳題；涉及他人先取得明確同意，合理時段最多聯絡一次，未接即停止，不公開內容。";

  const D = ["20 秒", "25 秒", "30 秒", "35 秒", "40 秒", "45 秒", "55 秒", "1 分鐘"];

  // ---（1）爸媽：我愛你 --- 
  const elders = ["爸爸", "媽媽"];
  const loveModes = [
    "接通後第一句就打直球說「我愛你」再補一句這週你想到他／她的一刻（可先說在玩大冒險）",
    "接通後先道歉打擾，再謝謝對方平常的照顧，最後補愛你並問夜宵吃了沒",
    "人若在旁：當面說愛你並讓對方講一句回你（可搞笑）；離席就視訊臉對臉講完並揮手給全桌看一眼",
    "如果不適合真的撥出，就對手機錄一段二十秒「我愛你」但不傳送；完成後自行刪除",
  ];
  for (const who of elders) {
    for (const how of loveModes) {
      for (const dl of ["全程六十秒內收束", "耐性版九分鐘內要有語音紀錄或已撥紀錄"]) {
        add(`打給「${who}」（或視訊）：${how}；${dl}；${AGREED}`);
      }
    }
  }

  // ---（2）曖昧對象／直球連線 ---
  const ambiguousTargets = [
    "目前正在曖昧、私訊最勤的那位對象",
    "你想推進但仍卡住的那位曖昧對象",
    "單想好一陣子、但還沒講過喜歡的那位",
    "若心動對象在座可當場；不在座就換電話或視訊",
  ];
  const spamRules = [
    "撥一次電話；接通後直說「今天抽到你，第一個想到你」並聊十五秒近況；未接只留一則相同內容的語音",
    "傳一則自己想的十字內直球訊息；送出後只向現場口頭確認完成，不公開內容、不要求對方立刻回覆",
    "打一次語音電話；接通後問「如果我認真約你一次，你會答應嗎？」聽完答案就道謝收線",
    "傳一則「今晚玩大冒險，但這句是真的：我想更認識你」；若不想真的送出，就對備忘錄念完再換題",
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
    "對「此刻最想認真告白」的對象講出心裡那句結論——人在現場可私下講；缺席可私下通話，但不開擴音、不要求即時回答",
    "十到三十秒內選一句：我很喜歡你／我很想跟你一起走更遠／我很想認真試一次，並各補「因為」一句具體小事，不能全靠搞笑帶過",
    "把你寫好的告白草稿念給對方聽，或私下傳送；完成後只口頭回報，不展示對話；對方若拒收就立刻停",
    "若暫時無法對真人告白：對空氣三十秒講完你要對「某代號對象」說的愛意，再加一句對自己的勇氣承諾",
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
    "對手機錄一段不傳送的語音：向當年不懂事的自己道歉，並祝福對方之後順利",
    "若接通請對方用一句話評價「現在的你」，你道謝十秒後掛線",
    "若平常仍有正常聯絡，可私下傳一則「突然想起你」起手的短訊；否則改寫在備忘錄但不送出",
    "私下通話說「對不起當年沒勇氣」，再補一句近況；不開擴音、不要求原諒",
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
    "私下打給最挺你的摯友：真心謝謝對方曾經替你撐過的一件事；回到現場只說已完成，不公開回覆",
    "請自選在座朋友聽你念一遍準備傳給曖昧或心動對象的話；是否真的送出由你自己決定",
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
    "私下傳「今晚玩大冒險，但第一個想到你」；不發公開限動、不附現場其他人的照片",
    "用十個繁體字內講撩或講謝；內容自己決定，不展示已傳紀錄",
    "對上一則對方貼文錄一段二十五秒回應；是否送出自己決定，不向現場播放",
  ];
  for (const body of onlineBodies) {
    for (const act of onlineActs) {
      add(`針對「${body}」：${act}；九分鐘內完成；${AGREED}`);
      add(`針對「${body}」：${act}；二十一分鐘內完成；${AGREED}`);
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
    "各自口述一個曾給重要對象取過的備註暱稱，不交換手機、不展示截圖",
    "一起想出一位共同熟人會如何形容你們兩個；不真的打擾第三人",
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
    "口述鬧鐘備註裡一則與感情相關的提醒，不展示手機畫面",
  ];
  for (const s of soloBrave) {
    for (const d of D.slice(0, 4)) {
      add(`${s}；限時約${d}；${AGREED}`);
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
    ["私下打一次電話", "接通後用自己想的一句真心話開場，再問對方一句近況；不由現場指定台詞"],
    ["私下打一次電話", "接通後講今晚續攤在玩真心話並問對方一句近況，二十秒內道謝掛線"],
    ["私下打一次視訊或語音電話", "接通後說「今天抽到題目，第一個想到你」；不讓現場入鏡、不開擴音"],
    ["對手機錄音但不傳送", "二十秒內說出想給對方的祝福或道歉；完成後自行決定是否刪除"],
    ["打電話", "對方若接請一句話評價以前的你並十秒謝謝掛線"],
  ];
  const tBudget = [
    "四十五秒收束",
    "九十秒內完成並保留留言紀錄",
    "耐性版九分鐘內要有發送紀錄",
    "兩分鐘內交卷（接通或紀錄）",
    "五分鐘內完成；只口頭回報，不展示通話紀錄",
    "對方若在忙就只留三十秒信箱不要狂撥超過三通",
    "若深夜時段對方明示睡覺就改天亮前傳早安訊息截圖",
    "對方若在聚會就只傳無聲貼圖直到對方有空回撥為止",
    "對方若在開車就只留文字並不可要求秒回（安全優先）",
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
      add(`私訊「${who}」：${mh}；四十五秒至兩分鐘內決定是否送出；不展示截圖；${AGREED}`);
      add(`替「${who}」寫下但不一定送出的訊息：${mh}；念給現場聽時不得透露姓名或私密資訊；${AGREED}`);
    }
  }

  const hotOneOff = [
    "若平常仍正常聯絡，可私下打給白月光式人物：接通就說「今天抽到題目，第一個想到你」並聊一句近況；未接即停止。",
    "私下打給一位信任的異性親友，真心謝謝對方曾經幫過你的一件事；不開擴音、不要求對方配合表演。",
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

  const bannedDarePatterns = [
    /同步拍手/,
    /抖音熱門/,
    /手機當麥克風/,
    /未接.*五通/,
    /連傳五次/,
    /撓癢癢|擦鞋|手上畫.*愛心/,
    /做不完.*喝|不配合.*喝|改喝/,
    /截圖交差|公開.*截圖/,
    /未接.*(?:留言|語音信箱|短訊)/,
  ];
  const rejected = out.filter((question) =>
    bannedDarePatterns.some((pattern) => pattern.test(question)),
  );
  if (rejected.length > 0) {
    throw new Error(`dare quality gate rejected ${rejected.length} questions`);
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
