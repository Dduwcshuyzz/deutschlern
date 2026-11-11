
    "use strict";
    
    /* ==================== NAVIGATION ==================== */
    var TITLES = { dashboard:"Trang chủ", courses:"Khóa học", lesson:"Bài học", vocab:"Từ vựng", flashcards:"Flashcard", grammar:"Ngữ pháp", "grammar-detail":"Ngữ pháp", dialogues:"Hội thoại", "dialogue-detail":"Hội thoại", quiz:"Trắc nghiệm", review:"Ôn tập", exam:"Thi thử", store:"Nâng cấp & khóa học", profile:"Cá nhân" };
    var NAV_OF = { lesson:"courses", "grammar-detail":"grammar", "dialogue-detail":"dialogues" };
    var currentView = "dashboard";
    var currentLesson = null, currentDialogue = null;
    function navTo(view){
      currentView = view;
      document.querySelectorAll(".view").forEach(function(v){ v.classList.add("hidden"); });
      var sec = $("view-" + view);
      if (sec) sec.classList.remove("hidden");
      $("topTitle").textContent = TITLES[view] || "DeutschFlow";
      var active = NAV_OF[view] || view;
      document.querySelectorAll("[data-nav]").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-nav") === active); });
      $("moreSheet").classList.add("hidden");
      window.scrollTo(0, 0);
      if (view !== "exam" && typeof examTimer !== "undefined" && examTimer) { clearInterval(examTimer); examTimer = null; if (typeof examState !== "undefined" && examState && examState.playing) { examState.playing = false; var ei = $("examIntro"), ep = $("examPlay"), er = $("examResult"); if (ei && ep && er) { ei.classList.remove("hidden"); ep.classList.add("hidden"); er.classList.add("hidden"); } } }
      if (view === "dashboard") renderDashboard();
      if (view === "profile") renderProfile();
      if (view === "review" && typeof renderReview === "function") renderReview();
      if (view === "exam" && typeof renderExamIntro === "function") renderExamIntro();
      if (view === "store" && typeof renderStore === "function") renderStore();
      if (view === "flashcards" && typeof showFc === "function") showFc();
      if (view === "courses" && typeof renderCourses === "function") renderCourses();
    }
    document.addEventListener("click", function(e){
      var n = e.target.closest("[data-nav]");
      if (n && currentUser) { navTo(n.getAttribute("data-nav")); return; }
      var bk = e.target.closest("[data-back]");
      if (bk) navTo(bk.getAttribute("data-back"));
    });
    $("btnMore").addEventListener("click", function(){ $("moreSheet").classList.remove("hidden"); });
    $("btnCloseSheet").addEventListener("click", function(){ $("moreSheet").classList.add("hidden"); });
    $("moreSheet").addEventListener("click", function(e){ if (e.target === $("moreSheet")) $("moreSheet").classList.add("hidden"); });
    $("topAvatar").addEventListener("click", function(){ navTo("profile"); });
    $("btnContinue").addEventListener("click", function(){ if (currentLesson) openLesson(currentLesson); });
