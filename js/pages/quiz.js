
    "use strict";
    
    /* ==================== QUIZ ==================== */
    var quizLevel = "ALL", quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;
    function buildQuiz(){
      var pool = VOCAB.filter(function(w){ return quizLevel === "ALL" || w[4] === quizLevel; });
      var qs = [];
      var words = shuffle(pool).slice(0, 7);
      words.forEach(function(w){
        var nouns = pool.filter(function(x){ return x[1]; });
        if (w[1] && Math.random() < 0.35) {
          qs.push({ type:"Ngữ pháp · Mạo từ", ref:{ kind:"vocab", idx: VOCAB.indexOf(w) },
qHTML:'Mạo từ đúng của <span class="de">' + esc(w[0].replace(/^(der|die|das)\s+/, "")) + '</span> là gì?', opts: shuffle(["der","die","das"]), aText: w[1], why: w[0] + " — " + w[3] + "." });
        } else {
          var others = shuffle(pool.filter(function(x){ return x !== w; })).slice(0, 3);
          var opts = shuffle([w].concat(others));
          qs.push({ type:"Từ vựng", ref:{ kind:"vocab", idx: VOCAB.indexOf(w) }, qHTML:'<span class="de">' + esc(w[0]) + '</span> nghĩa là gì?', opts: opts.map(function(o){ return o[3]; }), aText: w[3], why: w[0] + " — " + w[3] + "." });
        }
      });
      var gq = shuffle(GRAMMAR_QUIZ).slice(0, 3);
      gq.forEach(function(g){
        var opts = shuffle(g.opts.map(function(o, i){ return { t:o, ok: i === g.a }; }));
        qs.push({ type:"Ngữ pháp", ref:{ kind:"grammar", idx: GRAMMAR_QUIZ.indexOf(g) }, qHTML: esc(g.q), opts: opts.map(function(o){ return o.t; }), aText: g.opts[g.a], why: g.why });
      });
      return shuffle(qs).slice(0, 10);
    }
    function startQuiz(){
      quizQs = buildQuiz(); quizIdx = 0; quizScore = 0;
      $("quizIntro").classList.add("hidden");
      $("quizResult").classList.add("hidden");
      $("quizPlay").classList.remove("hidden");
      showQuestion();
    }
    function showQuestion(){
      quizAnswered = false;
      var q = quizQs[quizIdx];
      $("qProg").textContent = "Câu " + (quizIdx + 1) + "/" + quizQs.length;
      $("qScore").textContent = "Đúng: " + quizScore;
      $("qBar").style.width = (quizIdx / quizQs.length * 100) + "%";
      $("qType").textContent = q.type;
      $("qText").innerHTML = q.qHTML;
      $("qFeedback").textContent = "";
      $("btnNextQ").classList.add("hidden");
      $("qOpts").innerHTML = q.opts.map(function(o){
        return '<button class="quiz-opt" data-opt="' + esc(o) + '">' + esc(o) + "</button>";
      }).join("");
    }
    $("qOpts").addEventListener("click", function(e){
      var b = e.target.closest("[data-opt]");
      if (!b || quizAnswered) return;
      quizAnswered = true;
      var q = quizQs[quizIdx];
      var chosen = b.getAttribute("data-opt");
      var right = chosen === q.aText;
      document.querySelectorAll("#qOpts .quiz-opt").forEach(function(o){
        o.disabled = true;
        if (o.getAttribute("data-opt") === q.aText) o.classList.add("right");
      });
      if (right) { quizScore++; prog().xp += 5; $("qFeedback").textContent = "Đúng rồi! +5 XP. " + q.why; $("qFeedback").style.color = "var(--ok)"; }
      else { b.classList.add("wrong"); addMistake(q.ref); $("qFeedback").textContent = "Chưa đúng. Câu này đã được lưu vào mục Ôn lỗi sai. " + q.why; $("qFeedback").style.color = "var(--bad)"; }
      $("qScore").textContent = "Đúng: " + quizScore;
      refreshStats();
      var nb = $("btnNextQ");
      nb.textContent = quizIdx === quizQs.length - 1 ? "Xem kết quả →" : "Câu tiếp theo →";
      nb.classList.remove("hidden");
    });
    $("btnNextQ").addEventListener("click", function(){
      quizIdx++;
      if (quizIdx >= quizQs.length) {
        var p = prog();
        p.quizPlays++;
        ensureToday(p).quiz++;
        if (quizScore > p.quizBest) p.quizBest = quizScore;
        $("quizPlay").classList.add("hidden");
        $("quizResult").classList.remove("hidden");
        $("qrScore").textContent = quizScore + "/" + quizQs.length;
        $("qrMsg").textContent = quizScore >= 9 ? "Xuất sắc! Bạn nắm rất chắc phần này." : quizScore >= 7 ? "Tốt lắm! Ôn vài câu sai là hoàn hảo." : quizScore >= 5 ? "Khá ổn. Học thêm bài học rồi quay lại nhé." : "Đừng nản — học lại bài học và từ vựng của cấp này rồi thử lại nhé.";
        refreshStats();
      } else showQuestion();
    });
    $("btnStartQuiz").addEventListener("click", startQuiz);
    $("btnRetryQuiz").addEventListener("click", startQuiz);
