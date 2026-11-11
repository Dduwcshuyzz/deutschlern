"use strict";

/* ==================== COURSES ==================== */
var courseFilter = "ALL";
function chipsHTML(active, allLabel){
  var html = '<button class="chip' + (active === "ALL" ? " on" : "") + '" data-chip="ALL">' + allLabel + "</button>";
  LEVEL_IDS.forEach(function(lv){ html += '<button class="chip' + (active === lv ? " on" : "") + '" data-chip="' + lv + '">' + lv + "</button>"; });
  return html;
}
function ensureLevelProg(){
  if ($("levelProg")) return;
  var host = $("courseMeta");
  if (!host || !host.parentNode) return;
  var d = document.createElement("div");
  d.id = "levelProg";
  host.parentNode.insertBefore(d, host.nextSibling);
}
function renderLevelProg(){
  ensureLevelProg();
  var host = $("levelProg");
  if (!host) return;
  var p = prog();
  host.innerHTML = '<div class="df-kicker" style="margin:12px 0 2px">Tiến độ từng cấp</div>' + LEVEL_IDS.map(function(lv){
    var total = LESSONS.filter(function(x){ return x.lv === lv; }).length;
    var done = LESSONS.filter(function(x){ return x.lv === lv && p.lessons.indexOf(x.id) >= 0; }).length;
    var pct = total ? Math.round(done / total * 100) : 0;
    return '<div class="level-prog-row"><span class="lp-name">' + lv + '</span><div class="mini-prog blue"><i style="width:' + pct + '%"></i></div><span class="lp-num">' + done + "/" + total + " bài · " + pct + "%</span></div>";
  }).join("");
}
function renderCourses(){
  $("courseChips").innerHTML = chipsHTML(courseFilter, "Tất cả cấp độ");
  var list = LESSONS.filter(function(l){ return courseFilter === "ALL" || l.lv === courseFilter; });
  var p = prog();
  var doneCount = list.filter(function(l){ return p.lessons.indexOf(l.id) >= 0; }).length;
  $("courseMeta").textContent = "Đang hiện " + list.length + " bài · đã xong " + doneCount + " bài trong nhóm này.";
  renderLevelProg();
  $("lessonList").innerHTML = list.map(function(l){
    var num = LESSONS.indexOf(l) + 1;
    var done = p.lessons.indexOf(l.id) >= 0;
    var locked = !canAccess(l.lv);
    /* Tiến độ thật của bài: số từ thuộc trong 6 từ vựng của bài (100% khi đã xong bài). */
    var lvWords = VOCAB.filter(function(w){ return w[4] === l.lv; }).slice(0, 6);
    var knownW = lvWords.filter(function(w){ return p.known.indexOf(VOCAB.indexOf(w)) >= 0; }).length;
    var pct = done ? 100 : (lvWords.length ? Math.round(knownW / lvWords.length * 100) : 0);
    var progTxt = done ? "Đã xong · 100%" : (knownW ? "Đã thuộc " + knownW + "/" + lvWords.length + " từ của bài · " + pct + "%" : "Chưa bắt đầu");
    return '<button class="lesson-row' + (done ? " done" : "") + '" data-lesson="' + l.id + '"><span class="lesson-num">' + num + '</span><span style="flex:1; min-width:0"><b>' + esc(l.title) + "</b><span>" + l.lv + " · " + esc(l.goal) + '</span><span class="lesson-prog" style="display:block"><i style="width:' + pct + '%"></i></span><span class="lesson-prog-txt">' + progTxt + "</span></span>" + (done ? '<span class="done-badge">Đã xong ✓</span>' : "") + (locked ? '<span class="lock-note">Chưa mở khóa</span>' : "") + "</button>";
  }).join("");
}
document.addEventListener("click", function(e){
  var c = e.target.closest("#courseChips [data-chip]");
  if (c) { courseFilter = c.getAttribute("data-chip"); renderCourses(); return; }
  var lr = e.target.closest("[data-lesson]");
  if (lr) openLesson(lr.getAttribute("data-lesson"));
});
function phraseRowsHTML(phrases){
  return phrases.map(function(ph){
    return '<div class="phrase-row"><div style="flex:1; min-width:0"><div class="de">' + esc(ph[0]) + '</div><div class="vi">' + esc(ph[1]) + '</div></div><button class="icon-btn" data-speak="' + esc(ph[0]) + '" title="Nghe phát âm">' + SPEAK_SVG + "</button></div>";
  }).join("");
}
function openLesson(id){
  var l = null;
  LESSONS.forEach(function(x){ if (x.id === id) l = x; });
  if (!l) return;
  if (!requireAccess(l.lv)) return;
  currentLesson = id;
  $("lsLevel").textContent = l.lv + " · " + (LEVELS.filter(function(x){ return x.id === l.lv; })[0].name);
  $("lsTitle").textContent = l.title;
  $("lsGoal").textContent = "Mục tiêu: " + l.goal;
  $("lsPhrases").innerHTML = phraseRowsHTML(l.phrases);
  $("lsTip").textContent = l.tip;
  var words = VOCAB.filter(function(w){ return w[4] === l.lv; }).slice(0, 6);
  $("lsVocab").innerHTML = words.map(function(w){
    return '<div class="phrase-row"><div style="flex:1; min-width:0"><div class="de">' + wordDisplay(w) + '</div><div class="vi">' + esc(w[3]) + '</div></div><button class="icon-btn" data-speak="' + esc(w[0]) + '" title="Nghe phát âm">' + SPEAK_SVG + "</button></div>";
  }).join("") + '<button class="btn btn-ghost btn-sm mt-s" data-nav="vocab">Mở toàn bộ từ vựng ' + l.lv + " →</button>";
  var done = prog().lessons.indexOf(id) >= 0;
  var bd = $("btnDone");
  bd.textContent = done ? "Đã học xong bài này ✓ (bấm để bỏ đánh dấu)" : "Đánh dấu đã học xong · +20 XP";
  navTo("lesson");
  buildPractice(l);
}
$("btnDone").addEventListener("click", function(){
  if (!currentLesson) return;
  var p = prog();
  var pos = p.lessons.indexOf(currentLesson);
  var t = ensureToday(p);
  if (pos >= 0) { p.lessons.splice(pos, 1); if (t.lessons > 0) t.lessons--; toast("Đã bỏ đánh dấu hoàn thành."); }
  else { p.lessons.push(currentLesson); p.xp += 20; t.lessons++; toast("Hoàn thành bài học · +20 XP. Giỏi lắm!"); }
  sbSaveUser(currentUser);
  openLesson(currentLesson);
  refreshStats();
});
function buildPractice(l){
  var words = VOCAB.filter(function(w){ return w[4] === l.lv; });
  var done = prog().lessons.indexOf(l.id) >= 0;
  var n = Math.max(1, Math.min(words.length, l.qCount || 3));
  var all = words.map(function(w){ return w; });
  var bx = shuffle(all.slice());
  var pool = bx.slice();
  var list = pool.slice(0, n);
  var lCol = ensureEl($("lsPractice"), "div", { id: "lsPracticeCol" });
  var container = null;
  if (lCol) container = lCol;
  else {
    lCol = document.createElement("div");
    lCol.id = "lsPracticeCol";
    $("lsPractice").before(lCol);
    container = lCol;
  }
  container.innerHTML = '<b>Luyện tập — điền mạo từ của mỗi từ</b><div class="tiny-note">Chọn đúng mạo từ nhé. Mỗi câu nói lên một từ trong bài thật sự.</div>' +
    list.map(function(w, i){
      var art = w[0];
      var word = w[1];
      var vi = w[3];
      var vb = w[6];
      var opts = shuffle(["der", "die", "das"]);
      var isRight = null;
      var label = "";
      var labelColor = "";
      if (l.doneQs && (i in l.doneQs)) {
        var lr = l.doneQs[i];
        isRight = lr && lr.right;
        label = isRight ? "Chính xác! +2 XP" : "Không chính xác";
        labelColor = isRight ? "#1E7A46" : "#C0272D";
      }
      return '<div class="mini-q" data-word="' + word + '" data-vi="' + esc(vi) + '" data-de="' + esc(w[0] + " " + word) + '" data-art="' + art + '" data-i="' + i + '" style="margin-top:.5rem">' +
        '<span class="qn" style="width:22px;height:22px;border-radius:50%;background:var(--surface2);color:var(--ink2);font-size:.8rem;font-weight:700;display:flex;align-items:center;justify-content:center">' + (i + 1) + "</span>" +
        '<span style="flex:1; min-width:0">' + esc(word) + '<span style="color:var(--ink2);font-size:.9rem"> (' + esc(vi) + ")</span>" +
        (label ? '<div style="color:' + labelColor + ';font-weight:700;margin-top:.1rem">' + label + "</div>" : "") +
        '</span><span class="art-group" role="group" aria-label="Chọn mạo từ">' +
        opts.map(function(o){
          return '<button class="btn btn-sm ' + (isRight && o === art ? "btn-gold" : isRight === false && o === art ? "btn-gold" : "btn-ghost") + '" data-practice-opt="' + o + '" data-art="' + art + '">' + o + "</button>";
        }).join("") +
        "</span></div>";
    }).join("") +
    '<p class="muted" style="margin-top:.6rem">' + (words.length ? "Hiển thị từ của cấp " + l.lv + " · " + words.length + " từ." : ("Trắc nghiệm của bài (" + l.title + ") chưa có vì chưa có từ của cấp " + l.lv + ".")) + "</p>";
  var scoreCol = $("lsPracticeScore");
  if (scoreCol) scoreCol.innerHTML = '';
  var ex = $("btnAnswerPractice");
  if (ex) ex.remove();
}
$("lsPractice").addEventListener("click", function(e){
  var b = e.target.closest("[data-practice-opt]");
  if (!b) return;
  var q = b.closest(".mini-q");
  var l = LESSONS.filter(function(x){ return x.id === currentLesson; })[0];
  if (!l) return;
  if (!l.doneQs) l.doneQs = {};
  var isRight = b.getAttribute("data-practice-opt") === b.getAttribute("data-art");
  var idx = parseInt(q.getAttribute("data-i") || "0", 10);
  var old = l.doneQs[idx];
  var p = prog();
  var t = null;
  if (!old) { l.doneQs[idx] = { right: isRight }; t = ensureToday(p); }
  else if (old.right && !isRight) l.doneQs[idx] = { right: isRight };
  else if (!old.right && isRight) l.doneQs[idx] = { right: isRight };
  else l.doneQs[idx] = { right: isRight };
  var vIdx = VOCAB.indexOf(VOCAB.filter(function(w){ return w[4] === l.lv && w[1] === q.getAttribute("data-word"); })[0]);
  if (isRight) {
    if (old && old.right === true) { toast("Đúng rồi — câu này bạn đã làm đúng trước đó."); }
    else {
      p.xp += 2;
      removeMistake({ kind: "vocab", idx: vIdx });
      toast("Chính xác! +2 XP");
    }
  } else {
    addMistake({ kind: "vocab", idx: vIdx });
    toast("Chưa chính xác. Mạo từ của từ này là " + b.getAttribute("data-art") + ".");
  }
  sbSaveUser(currentUser);
  refreshStats();
  buildPractice(l);
});
