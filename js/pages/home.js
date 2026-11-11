
    "use strict";
    
    function refreshStats(){
      if (!currentUser) return;
      sbSaveUser(currentUser);
      var p = prog();
      $("xpVal").textContent = p.xp + " XP";
      $("stXp").textContent = p.xp;
      $("stLessons").textContent = p.lessons.length + "/" + LESSONS.length;
      $("stWords").textContent = p.known.length;
      $("stQuiz").textContent = p.quizPlays ? p.quizBest + "/10" : "—";
    }
    function renderDashboard(){
      refreshStats();
      var p = prog();
      var next = null;
      for (var i = 0; i < LESSONS.length; i++){ if (p.lessons.indexOf(LESSONS[i].id) < 0) { next = LESSONS[i]; break; } }
      currentLesson = next ? next.id : null;
      if (next) {
        $("contTitle").textContent = next.lv + " · " + next.title;
        $("contSub").textContent = next.goal;
        $("btnContinue").textContent = "Học bài này";
      } else {
        $("contTitle").textContent = "Bạn đã học hết 18 bài!";
        $("contSub").textContent = "Tuyệt vời. Hãy ôn flashcard hoặc làm trắc nghiệm để giữ phong độ nhé.";
        $("btnContinue").textContent = "Ôn tập ngay";
        currentLesson = null;
        $("btnContinue").onclick = function(){ navTo("flashcards"); };
      }
      if (next) $("btnContinue").onclick = function(){ openLesson(next.id); };
      $("lvlRows").innerHTML = LEVELS.map(function(l){
        var total = LESSONS.filter(function(x){ return x.lv === l.id; }).length;
        var done = LESSONS.filter(function(x){ return x.lv === l.id && p.lessons.indexOf(x.id) >= 0; }).length;
        var pct = total ? Math.round(done / total * 100) : 0;
        return '<div class="lvl-row"><span class="lv">' + l.id + '</span><div class="bar-wrap"><span>' + done + "/" + total + " bài · " + esc(l.name) + '</span><div class="progress"><i data-w="' + pct + '" style="width:0%"></i></div></div><span class="pct">' + pct + "%</span></div>";
      }).join("");
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        document.querySelectorAll("#lvlRows .progress i").forEach(function(b){ b.style.width = b.getAttribute("data-w") + "%"; });
      }); });
      renderToday();
      renderDashExtras();
    }
    /* ==================== DASHBOARD EXTRAS ==================== */
    function dayIndex(){ return Math.floor(Date.now() / 86400000); }
    function renderToday(){
      if (!currentUser) return;
      var p = prog();
      var t = ensureToday(p);
      var d = new Date();
      try { $("todayDate").textContent = d.toLocaleDateString("vi-VN", { weekday:"long", day:"numeric", month:"numeric", year:"numeric" }); }
      catch (e) { $("todayDate").textContent = d.toLocaleDateString(); }
      var items = [
        { label:"Hoàn thành 1 bài học", hint:"Vào mục Khóa học và học xong 1 bài bất kỳ", cur: Math.min(t.lessons, 1), max: 1, unit:"bài" },
        { label:"Thuộc thêm 5 từ vựng", hint:"Đánh dấu đã thuộc ở Từ vựng hoặc Flashcard", cur: Math.min(t.words, 5), max: 5, unit:"từ" },
        { label:"Làm 1 lượt trắc nghiệm hoặc thi thử", hint:"Vào mục Trắc nghiệm và làm hết 1 lượt", cur: Math.min(t.quiz, 1), max: 1, unit:"lượt" }
      ];
      var pct = Math.round((items[0].cur / 1 + items[1].cur / 5 + items[2].cur / 1) / 3 * 100);
      $("todayPct").textContent = pct + "%";
      $("planList").innerHTML = items.map(function(it, i){
        var done = it.cur >= it.max;
        return '<li class="plan-item' + (done ? " done" : "") + '"><span class="plan-ic">' + (done ? CHECK_SVG : String(i + 1)) + '</span><span class="tx"><b>' + it.label + "</b><span>" + it.hint + '</span></span><span class="plan-n">' + it.cur + "/" + it.max + " " + it.unit + "</span></li>";
      }).join("");
      $("todayMsg").textContent = pct >= 100 ? "Hoàn thành kế hoạch hôm nay rồi — giỏi lắm! Mai quay lại giữ nhịp nhé." : pct >= 50 ? "Đang đi được hơn nửa đường rồi, cố thêm chút nữa là xong kế hoạch hôm nay." : "Bắt đầu bằng một việc nhỏ thôi: học 1 bài hoặc thuộc 5 từ là đã tiến bộ rồi.";
      var bar = $("todayBar");
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ bar.style.width = pct + "%"; }); });
    }
    function renderDashExtras(){
      if (!currentUser) return;
      var p = prog();
      /* Word of the day: from the user's target level when possible */
      var pool = VOCAB.filter(function(w){ return w[4] === currentUser.target; });
      if (!pool.length) pool = VOCAB;
      var w = pool[dayIndex() % pool.length];
      var wIdx = VOCAB.indexOf(w);
      var wKnown = p.known.indexOf(wIdx) >= 0;
      $("wotdBody").innerHTML =
        '<div class="wotd-word">' + wordDisplay(w) + "</div>" +
        (w[2] ? '<p class="wotd-pl">Số nhiều: ' + esc(w[2]) + "</p>" : "") +
        '<p class="wotd-vi">' + esc(w[3]) + ' <span class="tag" style="margin-left:.3rem">' + w[4] + "</span></p>" +
        '<p class="wotd-ex"><b>' + esc(w[6]) + "</b><br>" + esc(w[7]) + "</p>" +
        '<div class="wotd-actions"><button class="icon-btn" data-speak="' + esc(w[0]) + '" title="Nghe phát âm">' + SPEAK_SVG + '</button>' +
        '<button class="btn btn-sm ' + (wKnown ? "btn-gold" : "btn-ghost") + '" data-known="' + wIdx + '">' + (wKnown ? "Đã thuộc ✓" : "Đánh dấu đã thuộc") + '</button>' +
        '<button class="btn btn-sm btn-ghost" data-nav="vocab">Mở kho từ vựng</button></div>';
      /* Grammar spotlight of the day */
      var g = GRAMMAR[dayIndex() % GRAMMAR.length];
      $("spotBody").innerHTML =
        '<p class="spot-title">' + esc(g.title) + ' <span class="tag" style="margin-left:.3rem">' + g.lv + "</span></p>" +
        '<p class="spot-intro">' + esc(g.intro) + "</p>" +
        (g.ex && g.ex[0] ? '<div class="spot-ex"><b>' + esc(g.ex[0][0]) + "</b><span>" + esc(g.ex[0][1]) + "</span></div>" : "") +
        '<button class="btn btn-sm btn-red" style="margin-top:.8rem" data-grammar="' + g.id + '">Học chủ điểm này →</button>';
      /* Next lessons in the path */
      var rest = LESSONS.filter(function(l){ return p.lessons.indexOf(l.id) < 0; }).slice(0, 3);
      $("nextList").innerHTML = rest.length ? rest.map(function(l){
        var num = LESSONS.indexOf(l) + 1;
        var locked = !canAccess(l.lv);
        return '<button class="next-item" data-lesson="' + l.id + '"><span class="next-num">' + num + '</span><span class="tx"><b>' + esc(l.title) + "</b><span>" + l.lv + " · " + esc(l.goal) + (locked ? " · Chưa mở khóa" : "") + '</span></span><span class="arr">→</span></button>';
      }).join("") : '<p class="next-empty">Bạn đã hoàn thành toàn bộ 18 bài trong lộ trình. Hãy chuyển sang ôn tập và thi thử để giữ phong độ nhé.</p>';
    }
