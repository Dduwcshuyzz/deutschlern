
    "use strict";
    
    /* ==================== REVIEW ==================== */
    function qFromMistake(ref){
      if (!ref) return null;
      if (ref.kind === "vocab") {
        var w = VOCAB[ref.idx];
        if (!w) return null;
        if (w[1] && ref.idx % 2 === 0) {
          return { ref: ref, type:"Mạo từ", qHTML:'Mạo từ đúng của <span class="de">' + esc(w[0].replace(/^(der|die|das)\s+/, "")) + '</span> là gì?', opts: shuffle(["der", "die", "das"]), aText: w[1], why: w[0] + " — " + w[3] + "." };
        }
        var others = shuffle(VOCAB.filter(function(x){ return x !== w && x[4] === w[4]; })).slice(0, 3);
        if (others.length < 3) others = shuffle(VOCAB.filter(function(x){ return x !== w; })).slice(0, 3);
        var opts = shuffle([w].concat(others));
        return { ref: ref, type:"Từ vựng", qHTML:'<span class="de">' + esc(w[0]) + '</span> nghĩa là gì?', opts: opts.map(function(x){ return x[3]; }), aText: w[3], why: w[0] + " = " + w[3] + ". Ví dụ: " + w[6] };
      }
      var g = GRAMMAR_QUIZ[ref.idx];
      if (!g) return null;
      var gopts = shuffle(g.opts.slice());
      return { ref: ref, type:"Ngữ pháp", qHTML: esc(g.q), opts: gopts, aText: g.opts[g.a], why: g.why };
    }
    function mistakeLabel(ref){
      if (ref.kind === "vocab") { var w = VOCAB[ref.idx]; return w ? w[0] + " — " + w[3] : "Từ vựng"; }
      var g = GRAMMAR_QUIZ[ref.idx];
      return g ? g.q : "Ngữ pháp";
    }
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
        $("rvMistakeList").innerHTML = p.mistakes.map(function(m){
          return '<div class="phrase-row"><div style="flex:1; min-width:0"><div class="de" style="font-size:.93rem">' + esc(mistakeLabel(m)) + '</div><div class="vi">' + (m.kind === "vocab" ? "Từ vựng" : "Ngữ pháp") + " · trả lời đúng khi ôn để gạch khỏi danh sách</div></div></div>";
        }).join("");
      } else {
        startBtn.disabled = true;
        startBtn.textContent = "Chưa có câu sai nào cần ôn";
        $("rvMistakeList").innerHTML = '<p style="color:var(--ink2)">Hiện chưa có câu sai nào. Khi bạn trả lời sai trong bài học, trắc nghiệm hoặc thi thử, câu đó sẽ xuất hiện ở đây để ôn lại.</p>';
      }
      $("rvKnownGrid").innerHTML = p.known.length ? p.known.map(function(i){ return wordCardHTML(VOCAB[i], true); }).join("") : '<p style="color:var(--ink2)">Chưa có từ nào được đánh dấu đã thuộc. Hãy bắt đầu ở mục Từ vựng hoặc Flashcard.</p>';
      var unknownTarget = VOCAB.filter(function(w){ return w[4] === currentUser.target && p.known.indexOf(VOCAB.indexOf(w)) < 0; }).slice(0, 6);
      $("rvUnknownGrid").innerHTML = unknownTarget.length ? unknownTarget.map(function(w){ return wordCardHTML(w, true); }).join("") : '<p style="color:var(--ink2)">Bạn đã thuộc hết từ ở cấp ' + currentUser.target + " rồi. Tuyệt vời!</p>";
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
      rvQs = [];
      prog().mistakes.slice().forEach(function(m){ var q = qFromMistake(m); if (q) rvQs.push(q); });
      rvQs = shuffle(rvQs);
      if (!rvQs.length) { toast("Chưa có câu sai nào cần ôn."); return; }
      rvIdx = 0; rvScore = 0;
      $("rvDone").classList.add("hidden");
      $("rvQuiz").classList.remove("hidden");
      $("btnStartRv").classList.add("hidden");
      showRvQuestion();
    }
    $("btnStartRv").addEventListener("click", startRv);
    $("btnRvAgain").addEventListener("click", function(){ renderReview(); if (prog().mistakes.length) startRv(); });
    $("rvOpts").addEventListener("click", function(e){
      var b = e.target.closest("[data-rv-opt]");
      if (!b || rvAnswered) return;
      rvAnswered = true;
      var q = rvQs[rvIdx];
      var right = b.getAttribute("data-rv-opt") === q.aText;
      document.querySelectorAll("#rvOpts .quiz-opt").forEach(function(o){
        o.disabled = true;
        if (o.getAttribute("data-rv-opt") === q.aText) o.classList.add("right");
      });
      if (right) {
        rvScore++;
        removeMistake(q.ref);
        $("rvFeedback").textContent = "Đúng rồi! Câu này đã được gạch khỏi danh sách lỗi sai. " + q.why;
        $("rvFeedback").style.color = "var(--ok)";
      } else {
        b.classList.add("wrong");
        $("rvFeedback").textContent = "Vẫn chưa đúng — câu này ở lại danh sách để ôn tiếp. " + q.why;
        $("rvFeedback").style.color = "var(--bad)";
      }
      $("rvScore").textContent = "Đúng: " + rvScore;
      var nb = $("btnNextRv");
      nb.textContent = rvIdx === rvQs.length - 1 ? "Xem kết quả ôn →" : "Câu tiếp theo →";
      nb.classList.remove("hidden");
    });
    $("btnNextRv").addEventListener("click", function(){
      rvIdx++;
      if (rvIdx >= rvQs.length) {
        $("rvQuiz").classList.add("hidden");
        $("rvDone").classList.remove("hidden");
        $("btnStartRv").classList.remove("hidden");
        $("rvDoneScore").textContent = rvScore + "/" + rvQs.length;
        var left = prog().mistakes.length;
        $("rvDoneMsg").textContent = left === 0 ? "Sạch lỗi sai rồi! Bạn đã ôn đúng toàn bộ danh sách." : "Còn " + left + " câu sai trong danh sách — ôn tiếp bất cứ lúc nào.";
        $("rvMistakes").textContent = left;
        $("rvMistakeList").innerHTML = left ? prog().mistakes.map(function(m){
          return '<div class="phrase-row"><div style="flex:1; min-width:0"><div class="de" style="font-size:.93rem">' + esc(mistakeLabel(m)) + '</div><div class="vi">' + (m.kind === "vocab" ? "Từ vựng" : "Ngữ pháp") + "</div></div></div>";
        }).join("") : '<p style="color:var(--ink2)">Danh sách lỗi sai đã trống.</p>';
        var sb2 = $("btnStartRv");
        sb2.disabled = left === 0;
        sb2.textContent = left ? "Bắt đầu ôn " + left + " câu sai" : "Chưa có câu sai nào cần ôn";
      } else showRvQuestion();
    });
