"use strict";

/* ==================== EXAM ==================== */
var examLevel = "ALL", examState = null, examTimer = null;
function renderExamIntro(){
  if (!currentUser) return;
  var p = prog();
  $("examChips").innerHTML = chipsHTML(examLevel, "Tất cả cấp độ");
  var card = $("examIntro").querySelector(".card") || $("examIntro");
  if (card) card.classList.add("exam-intro");
  $("exPlays").textContent = p.examPlays || 0;
  $("exBest").textContent = p.examPlays ? p.examBest + "/15" : "—";
  $("exLast").textContent = p.examLast ? p.examLast.score + "/15 · " + (p.examLast.pass ? "Đạt" : "Chưa đạt") : "—";
}
document.addEventListener("click", function(e){
  var c = e.target.closest("#examChips [data-chip]");
  if (c) { examLevel = c.getAttribute("data-chip"); renderExamIntro(); }
});
function buildExamQs(){
  var pool = VOCAB.filter(function(w){ return examLevel === "ALL" || w[4] === examLevel; });
  var qs = [];
  var words = shuffle(pool).slice(0, 10);
  words.forEach(function(w){
    if (w[1] && Math.random() < 0.3) {
      qs.push({ type: "Ngữ pháp · Mạo từ", ref: { kind: "vocab", idx: VOCAB.indexOf(w) }, qHTML: 'Mạo từ đúng của <span class="de">' + esc(w[0].replace(/^(der|die|das)\s+/, "")) + '</span> là gì?', opts: shuffle(["der", "die", "das"]), aText: w[1], why: w[0] + " — " + w[3] + "." });
    } else {
      var others = shuffle(pool.filter(function(x){ return x !== w; })).slice(0, 3);
      var opts = shuffle([w].concat(others));
      qs.push({ type: "Từ vựng", ref: { kind: "vocab", idx: VOCAB.indexOf(w) }, qHTML: '<span class="de">' + esc(w[0]) + '</span> nghĩa là gì?', opts: opts.map(function(x){ return x[3]; }), aText: w[3], why: w[0] + " = " + w[3] + "." });
    }
  });
  shuffle(GRAMMAR_QUIZ).slice(0, 5).forEach(function(g){
    qs.push({ type: "Ngữ pháp", ref: { kind: "grammar", idx: GRAMMAR_QUIZ.indexOf(g) }, qHTML: esc(g.q), opts: shuffle(g.opts.slice()), aText: g.opts[g.a], why: g.why });
  });
  return shuffle(qs).slice(0, 15);
}
function fmtTime(s){ var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r; }
function showExamQ(){
  var st = examState;
  var q = st.qs[st.idx];
  $("exProg").textContent = "Câu " + (st.idx + 1) + "/" + st.qs.length;
  $("exBar").style.width = (st.idx / st.qs.length * 100) + "%";
  $("exType").textContent = q.type;
  $("exText").innerHTML = q.qHTML;
  $("exOpts").innerHTML = q.opts.map(function(o){
    return '<button class="quiz-opt' + (st.answers[st.idx] === o ? " sel" : "") + '" data-ex-opt="' + esc(o) + '">' + esc(o) + "</button>";
  }).join("");
  $("btnExNext").textContent = st.idx === st.qs.length - 1 ? "Câu cuối — bấm Nộp bài" : "Câu tiếp theo →";
}
function startExam(){
  if (!canExam()) {
    toast("Thi thử cần gói Plus trở lên. Xem gói nâng cấp nhé.");
    pendingBuy = { type: "plan", id: "plus" };
    navTo("store");
    return;
  }
  examState = { qs: buildExamQs(), idx: 0, answers: [], secs: 600, playing: true };
  $("examIntro").classList.add("hidden");
  $("examResult").classList.add("hidden");
  $("examPlay").classList.remove("hidden");
  $("exTimer").textContent = fmtTime(examState.secs);
  showExamQ();
  if (examTimer) clearInterval(examTimer);
  examTimer = setInterval(function(){
    if (!examState || !examState.playing) { clearInterval(examTimer); examTimer = null; return; }
    examState.secs--;
    if (examState.secs <= 0) { finishExam(); return; }
    $("exTimer").textContent = fmtTime(examState.secs);
  }, 1000);
}
$("btnStartExam").addEventListener("click", startExam);
$("exOpts").addEventListener("click", function(e){
  var b = e.target.closest("[data-ex-opt]");
  if (!b || !examState) return;
  var v = b.getAttribute("data-ex-opt");
  var st = examState;
  st.answers[st.idx] = v;
  $("exOpts").querySelectorAll(".quiz-opt").forEach(function(x){ x.classList.toggle("sel", x.getAttribute("data-ex-opt") === v); });
});
$("btnExPrev").addEventListener("click", function(){ if (!examState || examState.idx <= 0) return; examState.idx--; showExamQ(); });
$("btnExNext").addEventListener("click", function(){ if (!examState) return; var st = examState; if (st.idx + 1 < st.qs.length) { st.idx++; showExamQ(); } else finishExam(); });
$("btnExSubmit").addEventListener("click", finishExam);
$("btnRetryExam").addEventListener("click", function(){ $("examResult").classList.add("hidden"); navTo("exam"); renderExamIntro(); });
function finishExam(){
  if (!examState || examState.playing === false) return;
  examState.playing = false;
  if (examTimer) clearInterval(examTimer);
  examTimer = null;
  var st = examState;
  var score = 0;
  st.qs.forEach(function(q, i){ if (st.answers[i] && st.answers[i] === q.aText) score++; });
  var pass = score >= 11;
  var p = prog();
  p.examPlays = (p.examPlays || 0) + 1;
  p.examBest = Math.max(p.examBest || 0, score);
  p.examLast = { score: score, pass: pass };
  p.xp += score * 2;
  var t = ensureToday(p);
  t.quiz++;
  t.xp += score * 2;
  st.qs.forEach(function(q){
    if (st.answers[st.qs.indexOf(q)] !== q.aText) addMistake(q.ref);
  });
  sbSaveUser(currentUser);
  refreshStats();
  $("examPlay").classList.add("hidden");
  $("examResult").classList.remove("hidden");
  var scoreEl = $("exrScore");
  scoreEl.innerHTML = score + '<small>/' + st.qs.length + '</small>';
  scoreEl.classList.add("exam-score");
  $("exrVerdict").textContent = pass ? "Đạt! ✔" : "Chưa đạt";
  $("exrVerdict").style.color = pass ? "var(--ok)" : "var(--bad)";
  $("exrMsg").textContent = pass ? "Đạt từ 11/15. Chúc mừng! Bạn được cộng " + (score * 2) + " XP." : "Cần 11/15 để đạt. Bạn được cộng " + (score * 2) + " XP. Xem phân tích từng câu bên dưới và ôn lại các câu sai nhé.";
  var wrongCount = st.qs.length - score;
  $("exReview").innerHTML = '<div class="df-kicker">Phân tích từng câu</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 12px"><span class="pill ok">✓ Đúng ' + score + '/' + st.qs.length + '</span><span class="pill hot">✕ Sai ' + wrongCount + '/' + st.qs.length + '</span><span class="pill">Ngưỡng đạt: 11/15</span></div>' + st.qs.map(function(q, i){
    var ok = st.answers[i] && st.answers[i] === q.aText;
    return '<div class="ex-review-item ' + (ok ? "ok" : "bad") + '"><div class="q">Câu ' + (i + 1) + ' · ' + q.type + ' — ' + (ok ? "Đúng ✓" : "Sai") + '</div><div class="a">' + q.qHTML.replace(/<[^>]+>/g, "") + '<br>Bạn chọn: ' + esc(st.answers[i] || "(chưa trả lời)") + ' · Đáp án đúng: <b>' + esc(q.aText) + '</b>' + (q.why ? '<br>' + esc(q.why) : "") + '</div>' + (ok ? "" : '<div class="ua">Câu này đã được đưa vào danh sách Ôn tập.</div>') + '</div>';
  }).join("");
  navTo("exam");
  var rb = $("btnRetryExam");
  rb.textContent = "Thi lại 15 câu khác";
  refreshStats();
}
