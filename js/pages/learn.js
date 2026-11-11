
    "use strict";
    
    /* ==================== COURSES ==================== */
    var courseFilter = "ALL";
    function chipsHTML(active, allLabel){
      var html = '<button class="chip' + (active === "ALL" ? " on" : "") + '" data-chip="ALL">' + allLabel + "</button>";
      LEVEL_IDS.forEach(function(lv){ html += '<button class="chip' + (active === lv ? " on" : "") + '" data-chip="' + lv + '">' + lv + "</button>"; });
      return html;
    }
    function renderCourses(){
      $("courseChips").innerHTML = chipsHTML(courseFilter, "Tất cả cấp độ");
      var list = LESSONS.filter(function(l){ return courseFilter === "ALL" || l.lv === courseFilter; });
      var p = prog();
      var doneCount = list.filter(function(l){ return p.lessons.indexOf(l.id) >= 0; }).length;
      $("courseMeta").textContent = "Đang hiện " + list.length + " bài · đã xong " + doneCount + " bài trong nhóm này.";
      $("lessonList").innerHTML = list.map(function(l){
        var num = LESSONS.indexOf(l) + 1;
        var done = p.lessons.indexOf(l.id) >= 0;
        var locked = !canAccess(l.lv);
        return '<button class="lesson-row' + (done ? " done" : "") + '" data-lesson="' + l.id + '"><span class="lesson-num">' + num + '</span><span style="flex:1; min-width:0"><b>' + esc(l.title) + "</b><span>" + l.lv + " · " + esc(l.goal) + "</span></span>" + (done ? '<span class="done-badge">Đã xong ✓</span>' : "") + (locked ? '<span class="lock-note">Chưa mở khóa</span>' : "") + "</button>";
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
      }).join("") + '<button class="btn btn-ghost btn-sm mt-s" data-nav="vocab">Mở toàn bộ từ vựng ' + l.lv + "</button>";
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
      openLesson(currentLesson);
      refreshStats();
    });
    
    /* ==================== LESSON PRACTICE ==================== */
    var practiceQs = [], practiceDone = 0, practiceRight = 0;
    function buildPractice(lesson){
      var poolW = VOCAB.filter(function(w){ return w[4] === lesson.lv; });
      var qs = [];
      var words = shuffle(poolW).slice(0, 3);
      words.forEach(function(w){
        var others = shuffle(poolW.filter(function(x){ return x !== w; })).slice(0, 3);
        var opts = shuffle([w].concat(others));
        qs.push({ ref:{ kind:"vocab", idx: VOCAB.indexOf(w) }, qHTML:'Từ <span class="de">' + esc(w[0]) + '</span> nghĩa là gì?', opts: opts.map(function(x){ return x[3]; }), aText: w[3], why: w[0] + " = " + w[3] + "." });
      });
      var nouns = poolW.filter(function(w){ return w[1]; });
      if (nouns.length) {
        var nw = nouns[Math.floor(Math.random() * nouns.length)];
        qs.push({ ref:{ kind:"vocab", idx: VOCAB.indexOf(nw) }, qHTML:'Mạo từ đúng của <span class="de">' + esc(nw[0].replace(/^(der|die|das)\s+/, "")) + '</span> là gì?', opts: shuffle(["der", "die", "das"]), aText: nw[1], why: nw[0] + " — " + nw[3] + "." });
      }
      practiceQs = shuffle(qs);
      practiceDone = 0; practiceRight = 0;
      $("lsPracticeScore").textContent = "";
      $("lsPractice").innerHTML = practiceQs.map(function(q, i){
        return '<div style="margin-top:1rem"><p style="font-weight:700; font-size:.88rem; color:var(--ink2)">Câu ' + (i + 1) + '</p><div class="quiz-q" style="font-size:1.05rem; margin-top:.2rem">' + q.qHTML + "</div>" +
          q.opts.map(function(o){ return '<button class="quiz-opt" data-pq="' + i + '" data-pq-opt="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") +
          '<p class="pq-fb" style="margin-top:.5rem; font-weight:700"></p></div>';
      }).join("");
    }
    $("lsPractice").addEventListener("click", function(e){
      var b = e.target.closest("[data-pq-opt]");
      if (!b || b.disabled) return;
      var qi = parseInt(b.getAttribute("data-pq"), 10);
      var q = practiceQs[qi];
      var wrap = b.parentElement;
      var fb = wrap.querySelector(".pq-fb");
      var chosen = b.getAttribute("data-pq-opt");
      wrap.querySelectorAll(".quiz-opt").forEach(function(o){
        o.disabled = true;
        if (o.getAttribute("data-pq-opt") === q.aText) o.classList.add("right");
      });
      practiceDone++;
      if (chosen === q.aText) {
        practiceRight++;
        prog().xp += 2;
        fb.textContent = "Đúng rồi! +2 XP. " + q.why;
        fb.style.color = "var(--ok)";
      } else {
        b.classList.add("wrong");
        addMistake(q.ref);
        fb.textContent = "Chưa đúng — câu này đã lưu vào mục Ôn lỗi sai. " + q.why;
        fb.style.color = "var(--bad)";
      }
      refreshStats();
      if (practiceDone >= practiceQs.length) {
        $("lsPracticeScore").textContent = "Kết quả luyện tập: " + practiceRight + "/" + practiceQs.length + " câu đúng." + (practiceRight === practiceQs.length ? " Hoàn hảo!" : " Câu sai đã nằm trong mục Ôn tập → Ôn lỗi sai.");
      }
    });
