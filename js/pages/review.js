"use strict";

/* ==================== REVIEW ==================== */
function qFromMistake(ref){
  if (!ref) return null;
  if (ref.kind === "vocab") {
    var w = VOCAB[ref.idx];
    if (!w) return null;
    if (w[1] && ref.idx % 2 === 0) {
      return { ref: ref, type: "Mạo từ", qHTML: 'Mạo từ đúng của <span class="de">' + esc(w[0].replace(/^(der|die|das)\s+/, "")) + '</span> là gì?', opts: shuffle(["der", "die", "das"]), aText: w[1], why: w[0] + " — " + w[3] + "." };
    }
    var others = shuffle(VOCAB.filter(function(x){ return x !== w && x[4] === w[4]; })).slice(0, 3);
    if (others.length < 3) others = shuffle(VOCAB.filter(function(x){ return x !== w; })).slice(0, 3);
    var opts = shuffle([w].concat(others));
    return { ref: ref, type: "Từ vựng", qHTML: '<span class="de">' + esc(w[0]) + '</span> nghĩa là gì?', opts: opts.map(function(x){ return x[3]; }), aText: w[3], why: w[0] + " = " + w[3] + ". Ví dụ: " + w[6] };
  }
  var g = GRAMMAR_QUIZ[ref.idx];
  if (!g) return null;
  var gopts = shuffle(g.opts.slice());
  return { ref: ref, type: "Ngữ pháp", qHTML: esc(g.q), opts: gopts, aText: g.opts[g.a], why: g.why };
}
function mistakeLabel(ref){
  if (ref.kind === "vocab") { var w = VOCAB[ref.idx]; return w ? w[0] + " — " + w[3] : "Từ vựng"; }
  var g = GRAMMAR_QUIZ[ref.idx];
  return g ? g.q : "Ngữ pháp";
}
/* Đáp án đúng của một lỗi sai (dữ liệu thật của câu đó). */
function mistakeAnswer(m){
  var q = qFromMistake(m); if (!q) return "";
  if (m.kind === "vocab") {
    var w = VOCAB[m.idx]; if (!w) return "";
    if (q.type === "Mạo từ") return "Đáp án đúng: " + w[1] + " · " + w[0] + " — " + w[3];
    return "Đáp án đúng: " + w[0] + " — " + w[3];
  }
  return "Đáp án đúng: " + q.aText;
}
function mistakeItemHTML(m, i){
  return '<div class="mistake-item"><div class="m-word">' + esc(mistakeLabel(m)) + '</div><div class="m-vi">' + (m.kind === "vocab" ? "Từ vựng" : "Ngữ pháp") + ' · trả lời đúng khi ôn để gạch khỏi danh sách</div><div class="m-ans">' + esc(mistakeAnswer(m)) + '</div><button class="btn btn-sm btn-red" data-rv-one="' + i + '" style="margin-top:8px">Ôn lại câu này</button></div>';
}
function renderRvProg(){
  var host = $("rvMistakeList");
  if (!host || !host.parentNode) return;
  var old = $("rvProgWrap"); if (old) old.remove();
  var p = prog();
  var pct = VOCAB.length ? Math.round(p.known.length / VOCAB.length * 100) : 0;
  var d = document.createElement("div");
  d.id = "rvProgWrap";
  d.innerHTML = '<div class="df-kicker">Tiến độ ôn</div><div style="display:flex;justify-content:space-between;gap:8px"><b style="color:#0D1524">Đã thuộc ' + p.known.length + '/' + VOCAB.length + ' từ</b><span style="color:#4D5B73">' + pct + '%</span></div><div class="rv-prog"><i style="width:' + pct + '%"></i></div>';
  host.parentNode.insertBefore(d, host);
}
function startRvOne(i){
  var m = prog().mistakes[i]; if (!m) return;
  var q = qFromMistake(m);
  if (!q) { toast("Không tạo được câu ôn cho mục này."); return; }
  rvQs = [q]; rvIdx = 0; rvScore = 0;
  $("rvDone").classList.add("hidden");
  $("rvQuiz").classList.remove("hidden");
  showRvQuestion();
  var el = $("rvQuiz");
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-rv-one]");
  if (b) startRvOne(parseInt(b.getAttribute("data-rv-one"), 10));
});
var rvQs = [], rvIdx = 0, rvScore = 0, rvAnswered = false;
function renderReview(){
  if (!currentUser) return;
  var p = prog();
  $("rvKnown").textContent = p.known.length;
  $("rvUnknown").textContent = VOCAB.length - p.known.length;
  $("rvMistakes").textContent = p.mistakes.length;
  $("rvLessons").textContent = p.lessons.length + "/" + LESSONS.length;
  $("rvQuiz").classList.add("hidden");
  $("rvDone").classList.add("hidden");
  var startBtn = $("btnStartRv");
  if (p.mistakes.length) {
    startBtn.disabled = false;
    startBtn.textContent = "Bắt đầu ôn " + p.mistakes.length + " câu sai";
    $("rvMistakeList").innerHTML = p.mistakes.map(function(m, i){ return mistakeItemHTML(m, i); }).join("");
  } else {
    startBtn.disabled = true;
    startBtn.textContent = "Chưa có câu sai nào cần ôn";
    $("rvMistakeList").innerHTML = '<p style="color:var(--ink2)">Hiện chưa có câu sai nào. Khi bạn trả lời sai ở bài học, trắc nghiệm hoặc thi thử, câu đó sẽ xuất hiện ở đây để ôn lại.</p>';
  }
  renderRvProg();
  $("rvKnownGrid").innerHTML = p.known.length ? p.known.map(function(i){ return wordCardHTML(VOCAB[i], true); }).join("") : '<p style="color:var(--ink2)">Chưa có từ thuộc nào.</p>';
  var unknownTarget = VOCAB.filter(function(w){ return currentUser.target && w[4] === currentUser.target && p.known.indexOf(VOCAB.indexOf(w)) < 0; }).slice(0, 6);
  $("rvUnknownGrid").innerHTML = unknownTarget.map(function(w){ return wordCardHTML(w, true); }).join("");
}
function showRvQuestion(){
  rvAnswered = false;
  var q = rvQs[rvIdx];
  $("rvProg").textContent = "Câu " + (rvIdx + 1) + "/" + rvQs.length;
  $("rvScore").textContent = "Đúng: " + rvScore;
  $("rvBar").style.width = (rvIdx / rvQs.length * 100) + "%";
  $("rvType").textContent = q.type;
  $("rvText").innerHTML = q.qHTML;
  $("rvFeedback").textContent = "";
  $("btnNextRv").classList.add("hidden");
  $("rvOpts").innerHTML = q.opts.map(function(o){ return '<button class="quiz-opt" data-rv-opt="' + esc(o) + '">' + esc(o) + "</button>"; }).join("");
}
function startRv(){
  var qs = prog().mistakes.map(function(m){ return qFromMistake(m); }).filter(function(q){ return q; });
  if (!qs.length) { toast("Hiện không có câu sai nào để ôn."); return; }
  rvQs = shuffle(qs); rvIdx = 0; rvScore = 0;
  $("rvDone").classList.add("hidden");
  $("rvQuiz").classList.remove("hidden");
  $("btnStartRv").classList.add("hidden");
  showRvQuestion();
}
$("btnStartRv").addEventListener("click", startRv);
$("btnRvAgain").addEventListener("click", function(){
  renderReview();
  if (prog().mistakes.length) startRv();
});
$("rvOpts").addEventListener("click", function(e){
  var b = e.target.closest("[data-rv-opt]");
  if (!b || rvAnswered) return;
  rvAnswered = true;
  var q = rvQs[rvIdx];
  var val = b.getAttribute("data-rv-opt");
  var isRight = val === q.aText;
  var btns = $("rvOpts").querySelectorAll(".quiz-opt");
  if (isRight) {
    rvScore++;
    b.classList.add("right");
    $("rvFeedback").textContent = "Đúng rồi ✓ " + q.why;
    removeMistake(q.ref);
  } else {
    b.classList.add("wrong");
    btns.forEach(function(x){ if (x.getAttribute("data-rv-opt") === q.aText) x.classList.add("right"); });
    $("rvFeedback").textContent = "Chưa đúng. " + q.why;
  }
  $("rvScore").textContent = "Đúng: " + rvScore;
  var nb = $("btnNextRv");
  nb.classList.remove("hidden");
  nb.textContent = rvIdx + 1 >= rvQs.length ? "Hiển thị kết quả" : "Câu tiếp theo →";
});
$("btnNextRv").addEventListener("click", function(){
  if (rvIdx + 1 < rvQs.length) { rvIdx++; showRvQuestion(); return; }
  $("rvBar").style.width = "100%";
  $("rvQuiz").classList.add("hidden");
  $("rvDone").classList.remove("hidden");
  $("rvDoneScore").textContent = rvScore + "/" + rvQs.length;
  $("rvDoneMsg").textContent = rvScore === rvQs.length ? "Hoàn hảo — đã ôn sạch toàn bộ lỗi sai trong lượt này!" : rvScore > 0 ? "Đã ôn được " + rvScore + " câu, những câu còn sai vẫn ở lại danh sách để tự ôn lại." : "Chưa có câu nào trả lời đúng — các lỗi vẫn còn ở danh sách, hãy thử lại từng câu bằng nút “Ôn lại câu này”.";
  var mistakes = prog().mistakes;
  $("rvMistakeList").innerHTML = mistakes.length ? mistakes.map(function(m, i){ return mistakeItemHTML(m, i); }).join("") : '<p style="color:var(--ink2)">Hết lỗi sai rồi — giỏi lắm!</p>';
  $("btnStartRv").classList.remove("hidden");
  var has = mistakes.length > 0;
  $("btnStartRv").disabled = !has;
  $("btnStartRv").textContent = has ? "Bắt đầu ôn " + mistakes.length + " câu sai" : "Chưa có câu sai nào cần ôn";
  $("rvMistakes").textContent = mistakes.length;
});
