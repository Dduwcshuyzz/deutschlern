
    "use strict";
    
    function enterApp(user){
      currentUser = user;
      var initial = user.name.trim().charAt(0).toUpperCase() || "?";
      $("sbAvatar").textContent = initial;
      $("topAvatar").textContent = initial;
      $("pfAvatar").textContent = initial;
      $("sbName").textContent = user.name;
      $("sbEmail").textContent = user.email || user.username || "";
      $("helloName").textContent = user.name;
      $("helloSub").textContent = "Cấp độ mục tiêu của bạn: " + user.target + ". Hôm nay học tiếp một bài nhé!";
      showScreen("app");
      buildFilters();
      resetFc("ALL");
      navTo("dashboard");
    }
