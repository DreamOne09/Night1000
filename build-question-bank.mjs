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
 * 大冒險：多組口吻×任務×秒數組合去重；須同意、可換人改題
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
  if (/相簿第|私密|親吻|接吻|摸|脫|裸|舌吻|吻痕|餵食|情侶合照|擊掌後對視|對視/.test(s)) return 3;
  if (/成語|動物叫|拍手|走秀|誇張稱讚|頒獎|征友|新聞跑馬燈|購物台/.test(s)) return 1;
  return 2;
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
  const C = "須取得對方同意；可換人、改喝一口或改題";
  const D = ["12 秒", "15 秒", "18 秒", "20 秒", "22 秒", "25 秒", "28 秒", "30 秒", "32 秒", "35 秒", "38 秒", "40 秒", "45 秒", "50 秒", "55 秒", "1 分鐘"];
  const V = [
    "綜藝旁白",
    "八點檔反派",
    "新聞播報",
    "戀綜旁白",
    "電影預告",
    "Podcast 主持人",
    "導航語音",
    "客服專員",
    "電競賽評",
    "體育播報",
    "股市名嘴",
    "美食節目旁白",
  ];
  const A = [
    "誇張稱讚一位朋友三個優點，結尾「以上言論不代表本台立場」",
    "用三句話幫一位朋友征友：優點、地雷、理想約會行程各一句",
    "用三個成語形容一位朋友（可搞笑）",
    "頒一個自訂獎項給一位朋友並發表 25 秒頒獎感言",
    "採訪一位朋友：戀愛雷點、理想型、最瞎約會各問一句並接梗",
  ];
  for (const v of V) {
    for (const a of A) {
      for (const d of D) {
        add(`用「${v}」口吻：${a}，限時 ${d}；${C}。`);
      }
    }
  }

  const dances = ["抖音熱門舞", "KPOP 副歌", "健身操", "天鵝湖選段", "機器人走路"];
  const props = ["手機當麥克風", "外套當披風", "空杯子當酒杯", "雙手當望遠鏡"];
  for (const dance of dances) {
    for (const p of props) {
      for (const d of D.slice(0, 10)) {
        add(`模仿「${dance}」，全程拿「${p}」當道具，${d}；全場投票，失敗喝一口或深蹲 5 下。`);
      }
    }
  }

  const photos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const tones = ["懸疑片旁白", "愛情片旁白", "紀錄片旁白", "美食節目旁白"];
  for (const n of photos) {
    for (const t of tones) {
      for (const d of D.slice(0, 5)) {
        add(`打開相簿第 ${n} 張（敏感可跳一張），用「${t}」講 30 秒故事，不可提真名；${d} 內講完。`);
      }
    }
  }

  const pairActs = [
    "擊掌後對視不笑場",
    "背靠背輪流一句「戀愛最雷的事」（不可指名）",
    "同步拍手節奏加速直到失敗",
    "輪流用娃娃音說「你好壞」",
    "模仿情侶合照 pose 三連拍（不碰觸敏感部位）",
  ];
  for (const act of pairActs) {
    for (const d of D.slice(0, 10)) {
      add(`與一位朋友「${act}」，限時 ${d}；${C}。`);
    }
  }

  const solo = [
    "繞場走秀展示穿搭，最後定格超模 pose",
    "用三種情緒念「我今晚玩得很開心」：害羞、憤怒、開心",
    "假裝接到心儀對象電話，全程只用語氣詞＋表情",
    "饒舌吐槽自己的戀愛黑歷史 20 秒，不指名，最後喊 Peace",
    "閉眼原地轉三圈後走直線五步，走歪就拍手三下",
    "慢動作表演「看到已讀不回」內心戲",
    "用購物台語氣推銷身上一件單品，最後喊「現在下單」",
    "學三種動物叫聲並搭配動作",
    "用新聞跑馬燈唸出上一則限動第一句（可改寫）",
  ];
  for (const s of solo) {
    for (const d of D.slice(0, 6)) {
      add(`${s}，限時 ${d}。`);
    }
  }

  if (out.length < 500) {
    throw new Error(`dare underflow: ${out.length}`);
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

function formatArray(name, items) {
  const lines = items.map((q) => "    " + JSON.stringify(q));
  return `const ${name} = [\n${lines.join(",\n")}\n];`;
}

function formatNumArray(name, items) {
  const lines = items.map((n) => "    " + n);
  return `const ${name} = [\n${lines.join(",\n")}\n];`;
}

const META_HEADER = `/**
 * NightBox 題目尺度（與 question.js 題序對應）
 * 1=輕鬆 2=一般 3=辛辣；由建置腳本推斷，可手動編輯此檔後不需改題文
 */
`;

const metaBody =
  META_HEADER +
  formatNumArray("truthQuestionLevels", truthQuestionLevels) +
  "\n" +
  formatNumArray("dareQuestionLevels", dareQuestionLevels) +
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
