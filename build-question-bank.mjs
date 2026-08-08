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
 * 大冒險：以自願的現場互動為主，透過感謝、修復、傾聽、界線與承諾推進關係
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
    /邀請一位自願者|與一位朋友|一位朋友|擊掌|合照|對視|相簿第|採訪一位朋友|背靠背|輪流.*朋友|旁邊的人/.test(
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
  const SOLO_RULE =
    "不點名、不要求任何在座者回應；你可無條件換題。";
  const VOLUNTEER_RULE =
    "邀請一位自願者；對方可拒絕或隨時停止，彼此沒有適合情境就換題；你也可無條件換題。";

  // 每個核心描述不同的關係事件與代價；不以時間、對象或道具序號製造變體。
  const categories = [
    {
      label: "感謝落地",
      prompts: [
        ["對方曾在你低潮時仍願意留下來的一次支持", "說清楚對方做了什麼、那件事如何影響你，以及你因此想回報什麼"],
        ["對方替你守住一個尷尬或脆弱時刻的體貼", "指出那份體貼替你保住了什麼，也說出你當時沒說出口的謝意"],
        ["對方曾提醒你一件難聽但有用的事", "承認你起初的反應、後來得到的改變，以及對方為誠實承受的風險"],
        ["對方在小事上長期照顧你的習慣", "舉出一個具體細節，說明你以前如何視為理所當然，現在準備怎樣回應"],
        ["對方曾替你扛下一部分責任的時刻", "講明對方付出的成本、你獲得的喘息，以及你願意補回的責任"],
        ["對方讓你在群體裡感到被接住的一個舉動", "重現那個舉動的關鍵細節，並說明它改變了你當下哪個感受"],
        ["對方曾尊重你一個不容易被理解的選擇", "說明那份尊重讓你得到什麼勇氣，以及你願意如何尊重對方的選擇"],
        ["對方曾在你犯錯後仍給你一次機會", "承認你造成的影響、那次機會的價值，以及你後來有沒有真的改變"],
        ["對方帶給你一項至今仍在使用的能力或觀念", "說出你在哪個真實場景用上它，並把功勞明確還給對方"],
        ["對方曾用一個平凡舉動讓你覺得自己值得被愛", "描述那個舉動、它碰到你的哪個缺口，以及你想把這份感受如何傳回去"],
      ],
    },
    {
      label: "道歉修復",
      prompts: [
        ["你曾用玩笑帶過、其實可能刺傷對方的一次互動", "直接承認是哪句或哪個動作、可能造成什麼感受，不用自己的本意抵銷影響"],
        ["你曾答應卻沒有做到的一件小事", "說明失信讓對方多付出什麼、你當時逃避了什麼，以及你願意怎樣補救"],
        ["你曾在對方需要被聽見時急著給建議", "承認你打斷了什麼需求，先問對方現在想被理解還是想一起想辦法"],
        ["你曾把自己的壓力轉成對對方的不耐煩", "指出壓力來源但不拿它當藉口，並提出一個下次能及時停住的做法"],
        ["你曾在群體裡忽略對方或讓對方難堪", "說清楚你的行為如何改變現場氣氛，並由對方決定需要私下還是當場修復"],
        ["你曾替對方做決定，卻沒有先詢問", "承認你奪走了哪部分選擇權，並把那個選擇權清楚交還"],
        ["你曾因為害怕衝突而隱瞞重要感受", "說明沉默如何累積距離、你保護了自己什麼，又讓關係失去什麼"],
        ["你曾翻舊帳來贏一場爭執", "承認那個策略帶來的傷害，將真正想處理的當下需求重新說一次"],
        ["你曾接受對方的付出卻沒有回應", "指出對方可能承受的失落，並提出一件不是口頭保證的補償行動"],
        ["你曾誤解對方後太晚澄清", "說出誤解如何形成、你因此做錯了什麼，並請對方修正你仍沒看懂的部分"],
      ],
    },
    {
      label: "具體肯定",
      prompts: [
        ["對方一項常被低估的可靠特質", "用你親眼見過的一次行為作證，不只給形容詞，也說那份可靠幫到了什麼"],
        ["對方面對壓力時仍保有的一種善意", "指出壓力與選擇各是什麼，讓肯定落在對方真正付出的代價上"],
        ["對方一次有勇氣改變立場的表現", "說明改變前後的差異，以及這份彈性如何影響你對對方的看法"],
        ["對方在關係裡很會照顧人的一個細節", "舉出具體場景，也提醒對方不必靠一直照顧別人才能有價值"],
        ["對方曾保護自己界線的一次選擇", "說出那個選擇為何不容易，以及它讓你學到什麼"],
        ["對方願意承認不知道或做不到的一次坦白", "指出這份坦白避免了什麼後果，也表達你對這種誠實的尊重"],
        ["對方在沒有人注意時仍做對的一件事", "還原你看見的細節，讓對方知道那個沒被表揚的選擇確實留下影響"],
        ["對方讓別人有空間發光的一次退讓", "說明對方放下了什麼機會，以及那份成全帶來的正面改變"],
        ["對方處理失敗時展現的一種成熟", "說出失敗造成什麼損失，以及對方哪個後續行動真正值得佩服"],
        ["對方現在比過去更好的某個具體改變", "用前後可觀察的差異表達肯定，不拿對方和第三人比較"],
      ],
    },
    {
      label: "界線協商",
      prompts: [
        ["你在疲憊時需要安靜、不適合立刻回應的界線", "說明你會發出什麼訊號、需要多少空間，以及何時會主動回來面對"],
        ["你不希望自己的脆弱被當成玩笑的界線", "舉出能接受與不能接受的差別，並讓對方提出不確定時的確認方式"],
        ["你願意幫忙但不願獨自扛完的界線", "清楚分開你能承擔、需要共同承擔與必須拒絕的部分"],
        ["衝突升高時你需要暫停的界線", "提出一個不等於消失的暫停方法，也承諾如何重新開始對話"],
        ["你對肢體距離與接觸的界線", "只描述自己的舒適範圍與詢問方式，不要求對方解釋或配合"],
        ["你對借用物品與歸還方式的界線", "說出一條可執行規則，也承認自己過去是否曾表達得不清楚"],
        ["你對被追問私人經歷的界線", "示範一句溫和而明確的拒絕，並提供一個你願意談的替代方向"],
        ["你對臨時改約或遲到的界線", "說出真正受影響的是什麼，以及雙方下次可採取的通知方式"],
        ["你對建議、安慰與陪伴方式的界線", "讓對方知道你難受時希望先被問哪個問題，也詢問對方的偏好"],
        ["你對關係中保有個人空間的界線", "說清楚獨處替你恢復了什麼，並提出不讓對方被晾著的連結方式"],
      ],
    },
    {
      label: "求助承擔",
      prompts: [
        ["一件你最近一直假裝能獨自處理的壓力", "提出一個範圍明確的小請求，也說清楚仍由你自己負責的部分"],
        ["一個你需要別人提醒才不會逃避的習慣", "請對方和你設計不帶羞辱的提醒方式，並允許對方拒絕這份責任"],
        ["一項你卡住但不想讓人替你做完的任務", "只請對方協助釐清第一步，你要當場完成那一步並回報結果"],
        ["一個你很難開口的情緒需求", "把需要翻成具體可做的請求，不把猜中你的心情當成對方義務"],
        ["一件你需要陪伴而不是答案的困難", "明說你希望對方如何陪，也詢問對方此刻有沒有餘裕"],
        ["一個你因害怕丟臉而拖延的決定", "請對方只問你一個最關鍵的問題，答案與後果仍由你承擔"],
        ["一項你想學會但起步很笨拙的能力", "請對方給一個可立即練習的回饋，你要在現場依回饋修正一次"],
        ["一個你需要有人制止的自我消耗模式", "共同訂出明確警訊與停止語，但不把管理你變成對方長期義務"],
        ["一件你需要被誠實挑戰的盲點", "請對方針對行為而非人格給回饋，你先復述再決定一個改變"],
        ["一項你想完成卻缺少見證的承諾", "把承諾縮成可驗證的下一步，並讓對方決定是否願意做一次見證"],
      ],
    },
    {
      label: "傾聽理解",
      prompts: [
        ["對方最近反覆提起、你卻沒有真正聽懂的一件事", "只問澄清問題，不搶著分享自己的類似經驗，最後復述你新理解的重點"],
        ["對方做過一個你原本不認同的選擇", "先請對方說明當時承受的限制，再說你哪個判斷因此需要修正"],
        ["對方一次看似生氣、底下可能有別種感受的時刻", "讓對方自己命名感受，不替對方分析，並確認當時真正需要什麼"],
        ["對方目前很在意但你不熟悉的一個興趣", "請對方教你一個入門重點，你要用自己的話講回來並接受糾正"],
        ["對方曾被你一句話誤會的經驗", "請對方還原原意與影響，你只負責聽懂，不爭論哪個版本比較合理"],
        ["對方最近一次感到驕傲的努力", "追問努力中最不被看見的部分，並說出你原本漏看了什麼"],
        ["對方最近一次失望但沒有怪任何人的經歷", "聽完後分開事件、感受與需要，請對方確認你是否理解正確"],
        ["對方和你價值觀不同的一個安全議題", "找出差異背後各自在保護的東西，不說服對方改站你這邊"],
        ["對方希望別人停止對自己做的一件小事", "請對方說明累積影響，你復述並提出自己能立即停止或調整的行為"],
        ["對方希望被怎樣支持的一個近期目標", "問出支持與干涉的分界，最後只承諾一件你確實做得到的事"],
      ],
    },
    {
      label: "影響盤點",
      prompts: [
        ["你們共同經歷過的一次計畫失敗", "一起指出各自做了什麼、影響了彼此什麼、各自得到與失去什麼"],
        ["你們曾一起完成的一件不容易的事", "分別說出對方的關鍵貢獻、成功的代價，以及這件事改變了哪種信任"],
        ["你們之間一次沒有說開便過去的尷尬", "把事實與猜測分開，確認它留下的影響，再共同決定是否需要收尾"],
        ["你們關係中一次意外變親近的轉折", "找出促成轉折的具體行動，也說明靠近後各自承擔了什麼風險"],
        ["你們曾因期待不同而卡住的一件事", "各自說出原本期待、落差造成的損失，以及現在願意放下哪一部分"],
        ["你們曾互相救場的一個混亂時刻", "還原彼此做的選擇、避免的後果，以及下次不該再讓一人獨自承擔什麼"],
        ["你們曾經疏遠又重新連上的一段變化", "說出疏遠時失去了什麼、重連靠哪個行動，以及如今最需要保護什麼"],
        ["你們曾對彼此留下錯誤第一印象的地方", "各自用一個後來看見的事實修正印象，禁止用外貌或群體評價作答案"],
        ["你們一段看似平常但其實重要的共同記憶", "指出當時一個具體行動如何影響關係，以及今天想保留哪個部分"],
        ["你們曾共同面對的一次取捨", "說清楚最後得到、失去與由誰承擔較多，並補上一句遲來的承認"],
      ],
    },
    {
      label: "信任坦白",
      prompts: [
        ["一件你常用沒事帶過、其實會讓你不安的事", "說出不安會使你做出什麼反應，並給對方一個不必猜測的回應方式"],
        ["一個你害怕被誤解所以很少承認的需求", "直接提出需求，也說明若對方無法滿足，你會怎樣照顧自己"],
        ["一件你表面不在乎、其實很希望被看見的努力", "拿出一個具體成果或行動作證，再請對方只給真實而非討好的回饋"],
        ["一個你在關係裡容易吃醋或比較的觸發點", "只談自己的反應與責任，不要求對方證明忠誠，也提出自我調節方法"],
        ["一種你在靠近別人時會突然退縮的模式", "說出它曾保護你什麼、現在又讓你失去什麼，並約定一個可辨認的訊號"],
        ["一件你怕麻煩別人而不肯開口的事", "當場練習提出最小請求，讓對方自由答應、修改或拒絕"],
        ["一個你被稱讚時反而想否認的部分", "接受對方給的一項具體肯定，只能先道謝，再說明為何接受它有難度"],
        ["一項你對這段關係抱有但沒確認過的期待", "把期待改寫成可協商的邀請，並真正接住對方不同的答案"],
        ["一個你犯錯後容易自我懲罰的習慣", "請對方協助區分負責與羞辱，接著選一個修復行動取代責罵自己"],
        ["一件你很想被原諒但不能要求原諒的事", "承認造成的影響與自己失去的東西，把原諒與否完整留給對方"],
      ],
    },
    {
      label: "合作互惠",
      prompts: [
        ["你們常遇到的一項分工不均", "把隱形工作也列入，重新分配一個當下能交接的部分並確認雙方負荷"],
        ["一個雙方都想改善的相處小麻煩", "各提一個解法，合併成可立即試行的版本，完成第一步後交換感受"],
        ["一項你們能互相教會對方的小能力", "各示範一個關鍵技巧，再讓彼此實作並給一條具體回饋"],
        ["一個需要共同做決定但偏好不同的情境", "先各自說不可退讓與可交換的部分，再完成一份雙方都能接受的方案"],
        ["一件總是由某一方主動維持的關係工作", "辨認那份工作的成本，當場把下一次主動權明確交接"],
        ["一個你們可以一起減少的生活負擔", "拆成兩個互相接得上的動作，現場各完成自己能做的第一個動作"],
        ["一場小衝突後適合你們的收尾方式", "共同設計一句確認、一個空間安排與一個重談時機，並實際演練一次"],
        ["一個你們合作時容易搶控制權的環節", "由平常較常主導的人先交出一項決定，另一方說明如何承接責任"],
        ["一項需要互相提醒但不想變成管教的約定", "一起設計尊重的提醒語與拒絕方式，並各自試說一次確認語氣"],
        ["一件能讓現場更舒服的共同小事", "先詢問彼此需求，再分工完成，不把服務其他人當成討好或懲罰"],
      ],
    },
    {
      label: "關係推進",
      prompts: [
        ["一件你希望和對方共同累積的新回憶", "提出包含目的與投入的具體邀請，讓對方修改內容而不是只能答應或拒絕"],
        ["一種你希望關係裡增加的真誠習慣", "當場先做一次，詢問它帶來靠近還是壓力，再依答案調整"],
        ["一件你願意為改善相處先停止做的事", "說出停止它會讓你失去什麼便利，以及你準備用哪個新行為取代"],
        ["一項你希望更了解對方的生活面向", "提出尊重隱私的邀請，由對方決定能分享的範圍，再確認你沒有越界"],
        ["一個你希望未來衝突時仍能守住的原則", "說明原則保護的是什麼，和對方共同寫出一個可觀察的行為版本"],
        ["一件你們一直說改天、現在能踏出第一步的事", "把第一步縮到現場可完成，由你先投入實際行動而非只催對方"],
        ["一個能讓彼此更有安全感的固定確認", "共同設計內容與停止條件，立即做第一次並交換真實感受"],
        ["一項你希望對方未來能提醒你的成長目標", "先賦予對方提醒權，也訂出你若防衛時要怎樣暫停並回來回應"],
        ["一個值得重新談而不是照舊的關係默契", "各自說出舊默契帶來的好處與代價，再共同改寫其中一條"],
        ["一句你希望離開現場後仍有效的關係承諾", "讓承諾包含具體行動、可能成本與做不到時的告知方式，並接受對方修訂"],
      ],
    },
  ];

  const soloForms = [
    {
      label: "全場直說",
      build: (topic, proof) =>
        `面對全場，就「${topic}」完成一次真實表達；${proof}；不能只講結論，必須補上行為、影響與後果。`,
    },
    {
      label: "不寄短箋",
      build: (topic, proof) =>
        `把「${topic}」寫成一張不送出的短箋，再向全場讀出最關鍵的一句；${proof}；不得透露當事人姓名或可辨識資訊。`,
    },
    {
      label: "代價盤點",
      build: (topic, proof) =>
        `針對「${topic}」，依序說出你做了什麼、影響了誰、得到什麼、又失去什麼；${proof}。`,
    },
    {
      label: "行動兌現",
      build: (topic, proof) =>
        `把「${topic}」轉成一個只由你負責、離場後仍能兌現的具體行動；${proof}；向全場說明完成條件與做不到時如何負責。`,
    },
  ];

  const volunteerForms = [
    {
      label: "自願對談",
      build: (topic, proof) =>
        `和自願者就「${topic}」各說一次自己的經驗；${proof}；雙方只能追問一題，不替對方下結論。`,
    },
    {
      label: "自願見證",
      build: (topic, proof) =>
        `請自願者只擔任傾聽與見證者；你就「${topic}」完成表達；${proof}；最後由自願者確認是否聽見行為、影響與後果，不評判內容。`,
    },
  ];

  if (
    categories.length !== 10 ||
    categories.some((category) => category.prompts.length !== 10) ||
    soloForms.length !== 4 ||
    volunteerForms.length !== 2
  ) {
    throw new Error(
      "dare source must contain 10 categories × 10 prompts, 4 solo forms and 2 volunteer forms",
    );
  }

  const promptKeys = categories.flatMap((category) =>
    category.prompts.map(([topic]) => topic),
  );
  if (new Set(promptKeys).size !== promptKeys.length) {
    throw new Error("dare interaction cores must be unique");
  }

  const out = [];
  for (const category of categories) {
    category.prompts.forEach(([topic, proof], promptIndex) => {
      // 前半核心採 4 單人＋1 自願，後半採 3 單人＋2 自願：
      // 全庫精確為 350 題不指定玩家、150 題自願互動。
      const forms =
        promptIndex < 5
          ? soloForms.concat(volunteerForms.slice(0, 1))
          : soloForms.slice(0, 3).concat(volunteerForms);
      for (const form of forms) {
        const isVolunteer = form.label.startsWith("自願");
        const rule = isVolunteer ? VOLUNTEER_RULE : SOLO_RULE;
        out.push(
          `【${category.label}／${form.label}】${rule} ${form.build(topic, proof)}`,
        );
      }
    });
  }

  const bannedDarePatterns = [
    /打給|電話|私訊|限動|未接|開擴音|擴音|截圖/,
    /喝酒|喝一口/,
    /同步拍手|抖音|跳舞|模仿/,
    /選在座誰|選.*異性|哪位異性/,
    /公開.*(?:聊天|照片)|強迫點名|點名一位|評選|排名/,
    /相簿第|照片第|限時.*(?:秒|分鐘)/,
  ];
  const rejected = out.filter((question) =>
    bannedDarePatterns.some((pattern) => pattern.test(question)),
  );
  if (rejected.length > 0) {
    throw new Error(
      `dare quality gate rejected ${rejected.length} questions: ${rejected[0]}`,
    );
  }

  if (out.length !== 500 || new Set(out).size !== 500) {
    throw new Error(`dare expected 500 unique questions, got ${out.length}/${new Set(out).size}`);
  }
  const volunteerCount = out.filter((question) =>
    question.includes("邀請一位自願者"),
  ).length;
  if (volunteerCount !== 150 || out.length - volunteerCount !== 350) {
    throw new Error(
      `dare mix expected 350 solo + 150 volunteer, got ${out.length - volunteerCount} + ${volunteerCount}`,
    );
  }
  return out;
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
