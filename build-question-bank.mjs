/**
 * 產生 question.js：保留前段經典真心話 + 全新辛辣真心話尾段 + 全新大冒險 500 題
 * 執行：node build-question-bank.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const HEADER = `/**
 * NightBox 題庫
 * 題目總數：1000 題（真心話 500、大冒險 500）
 * 語言：繁體中文
 * 尺度：每題 1（輕鬆）／2（一般）／3（辛辣），見 question-meta.js；抽題時可篩選
 * 風格：熟人或想變熟；2.0 篩選：前段約半數改為「說一個…」故事題，尾段為 tail-manual-pool 人工池
 * 大冒險：電話／前任／想念線優先入庫（500）；其餘相簿／雙人任務／單人口才／舞步；口吻網格僅小部分補位；須同意、可換題
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
  const C = "須取得對方／現場參與者同意；不接、不回可改語音／截圖已傳、喝酒或改題；不得騷擾、不得逼人接";
  /** 口吻網格只留一小塊尾巴補數，勿再塞滿前 500 題（舊版問題） */

  const D = ["18 秒", "22 秒", "25 秒", "30 秒", "35 秒", "40 秒", "45 秒", "50 秒", "55 秒", "1 分鐘"];
  const Dfast = ["20 秒", "30 秒", "40 秒", "50 秒", "1 分鐘"];

  // ---（1）高張力連線類：電話／視訊／私訊，優先入庫 ---
  const targets = [
    "此刻最想念的那位異性（非直系親屬）",
    "其中一位前任／前女友／前男友（自行選號）",
    "目前正在曖昧、或這週私訊最常往來的那位對象",
    "曾經最認真喜歡、但沒能在一起的那位",
    "久未聯絡、但今天抽題第一個想到的那位",
  ];
  const schemes = [
    ["打電話並開免持／擴音（或戴耳機讓旁人聽）", "接通後只許說現場指定的一句話就掛斷（由下一位玩家指定八字內中性台詞）"],
    ["打電話（可開擴音）", "接通後老實說你在喝酒續攤玩到什麼，再問對方一句近況並道謝掛線（全程勿超過約二十秒對話輪到你）"],
    ["打視訊或語音電話（由對方決定接通方式）", "接通後對鏡頭揮手讓對方看一眼現場起哄並說一句『你現在猜我在幹嘛』就掛；對方不接改語音信箱"],
    ["打電話", "對方不接就留語音信箱 28 秒內：自述在玩大冒險＋一句祝福或調侃；不可公開真名，可用代稱"],
    ["打電話", "對方若接：請對方用一句話評價『以前認識的你』；對方講完你十秒內說謝謝並掛斷"],
  ];
  const tBudget = ["全程約四十五秒內搞定", "約九十秒含無人接聽改用留言／訊息", "耐性版：二分鐘內要有結論（接通、留言或放棄改喝酒）"];

  for (const who of targets) {
    for (const [open, rule] of schemes) {
      for (const tb of tBudget) {
        add(`${open}給「${who}」：${rule}；${tb}；${C}。`);
      }
    }
  }

  const msgHooks = ["五個繁體字以內的玩笑起手", "一句冷笑話起手＋一個搞怪貼圖", "只傳 meme 梗圖一張並附『救我被大冒險』"];
  const msgBodies = targets.slice(0, 4);
  for (const who of msgBodies) {
    for (const mh of msgHooks) {
      for (const wait of ["四十五秒內送出", "九十秒內要有已讀或未讀截圖"]) {
        add(`私訊或限動私訊「${who}」：${mh}；${wait}，並秀出已送出截圖（暱稱與頭像打碼）；${C}。`);
      }
    }
  }

  const hotOneOff = [
    "打給你敢說出口的『白月光／朱砂痣』任一：對方接了只說一句『今天聚會抽到就想聽聽你聲音』並掛；不接改為傳同款文字；一分半內；須對方事前願接此玩法；可改題。",
    "打電話給異性親友（非直系）：請對方在線上對全場喊出一句替你解圍的祝福或幹話；對方不配合就改喝啤酒半杯；須對方知情同意；可改題。",
    "同時傳三位朋友的限動或直接訊息各一則三字救難詞（詞由左右兩鄰決定），截圖合併打碼交差；對方不一定要回；須對方不是你的雷點；可改題。",
    "用外語或台語對現場任一異性朋友朗讀三行情書梗（可超好笑版）；對方只要不翻臉就算你過；限時四十五秒；可改題喝一口。",
    "請現場票選一位異性／朋友，對他／她來一段三十秒獨舞或地板動作對嘴；對方笑得最大聲的人有權要你加碼深蹲十下；須對方同意；可改題。",
  ];
  for (const h of hotOneOff) {
    add(h);
  }

  // ---（2）兩人一組：張力適中 ---
  const pairActs = [
    "擊掌後對視不笑場直到有人投降",
    "背靠背輪流一句『戀愛裡最常踩雷的小事』（不可直指姓名）",
    "同步拍手節奏加倍速直到失手",
    "模仿情侶合照 pose 三連拍但不碰敏感部位（保持荒謬感）",
    "輪流用八點檔反派語氣互送一句『你好壞』直至其中一人破功",
    "對方閉眼你指揮走三步摸到桌角或杯緣都算過（安全第一）",
  ];
  for (const act of pairActs) {
    for (const d of D.slice(0, 8)) {
      add(`與自選的一位朋友現場組隊「${act}」，限時 ${d}；${C}。`);
    }
  }

  // ---（3）單人表演：略瘋但不要低幼 ---
  const solo = [
    "假裝接到心儀對象來電：全程只能用語助詞哼唱與誇張表情接完",
    "饒舌自爆戀愛黑歷史二十秒收尾一定要喊 Peace（不指名）",
    "慢動作演『看到已讀不回』三段情緒轉折",
    "購物台語氣把身上一件衣服喊到像限量聯名最後三件",
    "用新聞跑馬燈唸出自己最後一則限動第一句（可改梗）",
    "從下一句話開始到再下一題止：每句句尾自動加同一只動物的鳴叫擬聲（選定後沿用，煩到死也要撐）",
    "用電影反派嗓音念『我現在超想回家但我更想贏這局』並定格三秒",
    "對空氣三十秒兜售『戀愛代操副業』（純搞笑）並收假想客戶一聲冷笑當結案",
  ];
  for (const sAct of solo) {
    for (const d of Dfast) {
      add(`${sAct}，限時 ${d}；失敗喝啤酒一口或深蹲十下任選。`);
    }
  }

  // ---（4）相簿故事線 ---
  const photos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const tones = ["懸疑片旁白", "愛情片旁白", "紀錄片旁白", "美食節目旁白"];
  for (const n of photos) {
    for (const t of tones) {
      for (const d of D.slice(0, 6)) {
        add(`打開相簿第 ${n} 張（敏感換下一張）：用「${t}」講三十秒八卦式故事不提真名；${d} 內講完。`);
      }
    }
  }

  // ---（5）舞步 × 道具（偏體育課不是幼兒園） ---
  const dances = ["抖音熱門片段", "KPOP 副歌", "健身操口令版", "天鵝湖崩壞版", "機器人舞步"];
  const props = ["手機當麥克風", "外套披肩", "空杯當高腳杯", "雙手遮臉peekaboo"];
  for (const dance of dances) {
    for (const p of props) {
      for (const d of D.slice(0, 10)) {
        add(`套用「${dance}」，全程手拿「${p}」不放，搞笑也要做完；${d}；旁人投票過半就算過不了喝一口。`);
      }
    }
  }

  // ---（6）口吻網格：補尾部（舊有大量乏味的元凶，縮水了） ---
  const Vlite = ["綜藝旁白", "戀綜旁白", "新聞播報員", "股市名嘴"];
  const Alite = [
    "誇張稱讚一位朋友三大優點並結尾「以上不代表本桌立場」",
    "三段式幫朋友征偶：地雷一句、優點一句、理想約會一句",
    "頒一座自創獎並二十秒致謝詞",
    "採訪一位朋友的戀愛雷點、理想型、最瞎約會實錄各一題並硬接梗",
  ];
  for (const v of Vlite) {
    for (const a of Alite) {
      for (const d of Dfast) {
        add(`模仿「${v}」口吻：${a}；限時 ${d}；${C}。`);
      }
    }
  }

  if (out.length < 500) {
    throw new Error(`dare underflow: need 500+, got ${out.length}`);
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
 * truthQuestionLevels / dareQuestionLevels：1=輕鬆 2=一般 3=辛辣
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
