/**
 * 合併 question-truth-head：以規則標記「低好玩度」題位，替換為 head-new-lines（114 題）
 */
import { readFileSync, writeFileSync } from "fs";

function extractQuestions(path) {
  const raw = readFileSync(path, "utf8");
  const re = /^\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/gm;
  const out = [];
  let m;
  while ((m = re.exec(raw))) {
    out.push(JSON.parse('"' + m[1].replace(/\\"/g, '"') + '"'));
  }
  return out;
}

function boringScore(q) {
  let s = 0;
  if (/^(你認為|世上真的有|如果有一天|如果你生命中|世界末日|用四個字|你最想要的五樣|你最喜歡的食物|你相信有鬼|你心中誰最可信|你希望誰得到|你覺得自己放的屁|廁紙用完|講述未來五年|男的是不是天生|你會為了愛自殺|世界上最大的悲劇)/.test(q))
    s += 5;
  if (/(你相信愛情嗎|真愛真的存在嗎|你最喜歡的書|你最喜歡的季節|你最喜歡的電影是哪一部|心情不好的時候會做什麼|你最喜歡的三個顏色)/.test(q)) s += 4;
  if (/^(愛情、事業和家庭|面對和他人產生的矛盾|認為自己和哪種動物|如果讓你形容自己會用哪三個詞)/.test(q)) s += 4;
  if (/(關於未來你可能怎麼死|你現在最想放棄|怎麼對付身邊的小人)/.test(q)) s += 3;
  if (s === 0 && q.length < 18) s += 2;
  return s;
}

const oldPath = new URL("./question-truth-head.txt", import.meta.url);
const oldArr = extractQuestions(oldPath);
if (oldArr.length !== 225) {
  throw new Error(`expected 225 old questions, got ${oldArr.length}`);
}

const newLines = readFileSync(new URL("./head-new-lines.txt", import.meta.url), "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);
if (newLines.length !== 114) {
  throw new Error(`expected 114 head-new-lines, got ${newLines.length}`);
}

const ranked = oldArr.map((q, i) => ({ i, q, sc: boringScore(q) }));
ranked.sort((a, b) => b.sc - a.sc);
const replaceIdx = [];
const seen = new Set();
for (const row of ranked) {
  if (row.sc < 2) continue;
  if (replaceIdx.length >= 114) break;
  if (!seen.has(row.i)) {
    seen.add(row.i);
    replaceIdx.push(row.i);
  }
}
for (const row of ranked) {
  if (replaceIdx.length >= 114) break;
  if (!seen.has(row.i)) {
    seen.add(row.i);
    replaceIdx.push(row.i);
  }
}
replaceIdx.sort((a, b) => a - b);
if (replaceIdx.length !== 114) {
  throw new Error(`replaceIdx length ${replaceIdx.length}`);
}

const repMap = new Map();
replaceIdx.forEach((idx, j) => repMap.set(idx, newLines[j]));

const merged = oldArr.map((q, i) => (repMap.has(i) ? repMap.get(i) : q));

const headBody =
  "const truthQuestions = [\n" +
  merged.map((q) => "    " + JSON.stringify(q) + ",").join("\n") +
  "\n";

writeFileSync(oldPath, headBody, "utf8");
console.log("Wrote question-truth-head.txt", {
  replaced: replaceIdx.length,
  sampleReplacedIdx: replaceIdx.slice(0, 8),
});
