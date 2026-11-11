
    "use strict";
    
    function renderProfile(){
      var p = prog();
      $("pfName").textContent = currentUser.name;
      $("pfEmail").textContent = currentUser.email || currentUser.username || "—";
      $("pfUser").textContent = currentUser.username ? "@" + currentUser.username : "—";
      $("pfLevel").textContent = currentUser.target;
      $("pfType").textContent = "Thành viên";
      $("pfXp").textContent = p.xp + " XP";
      $("pfLessons").textContent = p.lessons.length + "/" + LESSONS.length;
      $("pfWords").textContent = p.known.length + " từ";
      $("pfQuizPlays").textContent = p.quizPlays + " lượt";
      $("pfQuizBest").textContent = p.quizPlays ? p.quizBest + "/10" : "—";
      $("pfSpeak").textContent = p.speak + " lần";
      var planObj = PLANS[currentUser.plan || "free"];
      $("pfPlan").textContent = planObj ? planObj.name : "Miễn phí";
      $("pfOwned").textContent = currentUser.owned && currentUser.owned.length ? currentUser.owned.join(", ") : "—";
      $("pfExamPlays").textContent = (p.examPlays || 0) + " lượt";
      $("pfExamBest").textContent = p.examPlays ? p.examBest + "/15" : "—";
      $("pfMistakes").textContent = (p.mistakes || []).length + " câu";
      $("achList").innerHTML = ACHIEVEMENTS.map(function(a){
        var got = a.test(p);
        return '<div class="ach-row' + (got ? " got" : "") + '"><div class="ach-ic">' + ACH_ICONS[a.icon] + "</div><div><b>" + esc(a.name) + "</b><span>" + esc(a.desc) + '</span></div><span class="st">' + (got ? "Đã đạt" : "Chưa đạt") + "</span></div>";
      }).join("");
      refreshStats();
    }
