
    "use strict";
    
    /* ==================== EXAM ==================== */
    var examLevel = "ALL", examState = null, examTimer = null;
    function renderExamIntro(){
      if (!currentUser) return;
      var p = prog();
      $("examChips").innerHTML = chipsHTML(examLevel, "Tất cả cấp độ");
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
          qs.push({ type:"Ngữ pháp · Mạo từ", ref:{ kind:"vocab", idx: VOCAB.indexOf(w) }, qHTML:'Mạo từ đúng của <span class="de">' + esc(w[0].replace(/^(der|die|das)\s+/, "")) + '</span> là gì?', opts: shuffle(["der", "die", "das"]), aText: w[1], why: w[0] + " — " + w[3] + "." });
        } else {
          var others = shuffle(pool.filter(function(x){ return x !== w; })).slice(0, 3);
          var opts = shuffle([w].concat(others));
          qs.push({ type:"Từ vựng", ref:{ kind:"vocab", idx: VOCAB.indexOf(w) }, qHTML:'<span class="de">' + esc(w[0]) + '</span> nghĩa là gì?', opts: opts.map(function(x){ return x[3]; }), aText: w[3], why: w[0] + " = " + w[3] + ". Ví dụ: " + w[6] });
        }
      });
      shuffle(GRAMMAR_QUIZ).slice(0, 5).forEach(function(g){
        qs.push({ type:"Ngữ pháp", ref:{ kind:"grammar", idx: GRAMMAR_QUIZ.indexOf(g) }, qHTML: esc(g.q), opts: shuffle(g.opts.slice()), aText: g.opts[g.a], why: g.why });
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
        pendingBuy = { type:"plan", id:"plus" };
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
        $("exTimer").textContent = fmtTime(Math.max(examState.secs, 0));
        if (examState.secs <= 0) { toast("Hết giờ! Bài thi được nộp tự động."); finishExam(); }
      }, 1000);
    }
    function finishExam(){
      if (!examState) return;
      if (examTimer) { clearInterval(examTimer); examTimer = null; }
      examState.playing = false;
      var st = examState;
      var p = prog();
      var score = 0;
      st.qs.forEach(function(q, i){
        if (st.answers[i] === q.aText) score++;
        else addMistake(q.ref);
      });
      var pass = score >= 11;
      p.examPlays = (p.examPlays || 0) + 1;
      if (score > (p.examBest || 0)) p.examBest = score;
      p.examLast = { score: score, total: st.qs.length, pass: pass };
      ensureToday(p).quiz++;
      $("examPlay").classList.add("hidden");
      $("examResult").classList.remove("hidden");
      $("exrScore").textContent = score + "/" + st.qs.length;
      $("exrVerdict").textContent = pass ? "ĐẠT — Chúc mừng bạn!" : "CHƯA ĐẠT — Ôn lại một chút rồi thi lại nhé.";
      $("exrVerdict").style.color = pass ? "var(--ok)" : "var(--bad)";
      $("exrMsg").textContent = "Mức đạt là 11/15. " + (pass ? "Bạn đã vượt qua bài thi thử cấp " + (examLevel === "ALL" ? "tổng hợp" : examLevel) + "." : "Các câu sai đã được đưa vào mục Ôn tập → Ôn lỗi sai để bạn ôn đúng chỗ hổng.");
      $("exReview").innerHTML = st.qs.map(function(q, i){
        var mine = st.answers[i];
        var ok = mine === q.aText;
        return '<div class="phrase-row"><div style="flex:1; min-width:0"><div class="de" style="font-size:.95rem">Câu ' + (i + 1) + ": " + q.qHTML.replace(/<[^>]+>/g, "") + '</div><div class="vi">Bạn chọn: <b style="color:' + (ok ? "var(--ok)" : "var(--bad)") + '">' + esc(mine || "(bỏ trống)") + "</b> · Đáp án đúng: <b>" + esc(q.aText) + "</b><br>" + esc(q.why) + "</div></div>" + (ok ? '<span class="done-badge">Đúng</span>' : '<span class="lock-note">Sai</span>') + "</div>";
      }).join("");
      refreshStats();
    }
    $("btnStartExam").addEventListener("click", startExam);
    $("btnRetryExam").addEventListener("click", startExam);
    $("btnExSubmit").addEventListener("click", finishExam);
    $("exOpts").addEventListener("click", function(e){
      var b = e.target.closest("[data-ex-opt]");
      if (!b || !examState) return;
      examState.answers[examState.idx] = b.getAttribute("data-ex-opt");
      document.querySelectorAll("#exOpts .quiz-opt").forEach(function(o){ o.classList.toggle("sel", o === b); });
    });
    $("btnExPrev").addEventListener("click", function(){ if (examState && examState.idx > 0) { examState.idx--; showExamQ(); } });
    $("btnExNext").addEventListener("click", function(){ if (examState && examState.idx < examState.qs.length - 1) { examState.idx++; showExamQ(); } });
