
    "use strict";
    
    /* ==================== AUTH VIEWS ==================== */
    function showAuth(mode){
      var login = mode === "login", reg = mode === "register", forgot = mode === "forgot", reset = mode === "reset";
      showScreen("auth");
      $("authTabs").classList.toggle("hidden", forgot || reset); $("tabLogin").classList.toggle("on", login); $("tabReg").classList.toggle("on", reg); $("formLogin").classList.toggle("hidden", !login); $("formReg").classList.toggle("hidden", !reg); $("formForgot").classList.toggle("hidden", !forgot); $("formReset").classList.toggle("hidden", !reset);
      var lvMeta = LEVELS.filter(function(x){ return x.id === pendingLevel; })[0]; $("rgLevelNote").textContent = "Bạn vừa chọn cấp " + pendingLevel + (lvMeta ? " — " + lvMeta.name : "") + ".";
      $("authTitle").textContent = login ? "Đăng nhập" : reg ? "Đăng ký" : reset ? "Đặt mật khẩu mới" : "Quên mật khẩu";
      $("authSub").textContent = login ? "Tiếp tục hành trình học ngôn ngữ của bạn." : reg ? "Tạo tài khoản để lưu tiến độ học của bạn." : reset ? "Nhập mật khẩu mới cho tài khoản của bạn." : "Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.";
      $("swLoginText").textContent = login ? "Chưa có tài khoản?" : "Đã có tài khoản?";
      var formsByMode = { login: $("formLogin"), register: $("formReg"), forgot: $("formForgot"), reset: $("formReset") };
      var activeForm = formsByMode[mode];
      if (activeForm) { activeForm.classList.remove("form-pop"); void activeForm.offsetWidth; activeForm.classList.add("form-pop"); }
      document.querySelectorAll(".field-err").forEach(function(e){ e.textContent = ""; e.classList.add("hidden"); });
      document.querySelectorAll(".field input, .field select").forEach(function(i){ i.classList.remove("invalid"); });
      authErr("");
      if (typeof ga === "function") ga("auth", mode);
      if (login) { $("liEmail").focus(); }
      if (reg) { $("rgName").focus(); }
      if (forgot) { $("fgId").focus(); }
      if (reset) { $("rpPass").focus(); }
      window.scrollTo(0, 0);
    }
    function setAuthTab(mode){
      $("tabLogin").classList.toggle("on", mode === "login"); $("tabReg").classList.toggle("on", mode === "register");
      showAuth(mode);
    }
    ["tabLogin","tabReg"].forEach(function(id, i){
      $(id).addEventListener("click", function(){ setAuthTab(i === 0 ? "login" : "register"); });
    });
    function fieldErr(inputId, errId, msg){
      var el = $(errId);
      if (el) { el.textContent = msg; el.classList.remove("hidden"); }
      var inp = $(inputId);
      if (inp) inp.classList.add("invalid");
      if (inp && typeof inp.focus === "function") inp.focus();
      return false;
    }
    function clearFieldErrs(){
      document.querySelectorAll(".field-err").forEach(function(e){ e.textContent = ""; e.classList.add("hidden"); });
      document.querySelectorAll(".field input, .field select").forEach(function(i){ i.classList.remove("invalid"); });
    }
    function findAccount(idf){
      idf = String(idf).trim().toLowerCase();
      if (accounts[idf]) return accounts[idf];
      for (var k in accounts) { if (accounts[k].username && accounts[k].username.toLowerCase() === idf) return accounts[k]; }
      return null;
    }
    function usernameTaken(un){
      un = String(un).trim().toLowerCase();
      for (var k in accounts) { if (accounts[k].username && accounts[k].username.toLowerCase() === un) return true; }
      return false;
    }
    document.querySelectorAll("[data-pw]").forEach(function(w){
      w.addEventListener("click", function(){
        var inp = $(w.getAttribute("data-pw"));
        if (!inp) return;
        inp.type = inp.type === "password" ? "text" : "password";
        w.classList.toggle("on", inp.type === "text");
      });
    });
    function pwScore(p){
      var s = 0;
      if (p.length >= 6) s++;
      if (p.length >= 10) s++;
      if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
      if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) s++;
      return s;
    }
    $("rgPass").addEventListener("input", function(){
      var p = $("rgPass").value;
      var s = pwScore(p);
      var labels = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh"];
      var colors = ["var(--bad)", "var(--bad)", "#D9930D", "var(--ok)", "var(--ok)"];
      $("pwBar").style.width = p ? Math.max(s, 1) * 25 + "%" : "0";
      $("pwBar").style.background = colors[s];
      $("pwLabel").textContent = p ? "Độ mạnh mật khẩu: " + labels[s] : "";
    });
    function authErr(msg){
      var el = $("authErr");
      el.textContent = msg;
      el.classList.toggle("hidden", !msg);
    }
    document.querySelectorAll("[data-auth]").forEach(function(b){ b.addEventListener("click", function(){ showAuth(b.getAttribute("data-auth")); }); });
    if (typeof showScreen === "function") showAuth("login");
    document.querySelectorAll("[data-quit]").forEach(function(b){ b.addEventListener("click", function(){ showScreen("landing"); }); });

    /* Đăng nhập local: tài khoản demo và tài khoản tạo trong phiên khi Supabase không khả dụng */
    function finishLogin(acc){
      currentUser = acc;
      localStorage.setItem(storageKey("lastLogin"), acc.username);
      if (typeof sbSaveUser === "function") try { sbSaveUser(); } catch (e) { }
      enterApp(acc);
      toast("Xin chào " + acc.name + ", chúc bạn học tốt!");
    }
    function validateRegister(){
      var ok = true;
      var name = $("rgName").value.trim();
      var username = $("rgUser").value.trim().toLowerCase();
      var email = $("rgEmail").value.trim().toLowerCase();
      var pass = $("rgPass").value;
      var pw2 = $("rgPass2").value;
      if (name.length < 2) ok = fieldErr("rgName", "eRgName", "Vui lòng nhập họ và tên (ít nhất 2 ký tự).") && ok;
      if (!/^[a-z0-9_.]{3,20}$/.test(username)) ok = fieldErr("rgUser", "eRgUser", "Tên đăng nhập cần 3–20 ký tự, chỉ gồm chữ thường, số, _ và .") && ok;
      else if (usernameTaken(username)) ok = fieldErr("rgUser", "eRgUser", "Tên đăng nhập này đã có người dùng. Thử tên khác nhé.") && ok;
      if (!validEmail(email)) ok = fieldErr("rgEmail", "eRgEmail", "Email chưa đúng định dạng. Kiểm tra lại nhé.") && ok;
      else if (accounts[email]) ok = fieldErr("rgEmail", "eRgEmail", "Email này đã được đăng ký. Hãy đăng nhập nhé.") && ok;
      if (pass.length < 6) ok = fieldErr("rgPass", "eRgPass", "Mật khẩu cần ít nhất 6 ký tự.") && ok;
      if (pwScore(pass) < 2) ok = fieldErr("rgPass", "eRgPass", "Mật khẩu chưa đủ mạnh. Thử thêm chữ hoa, số hoặc ký tự đặc biệt nhé.") && ok;
      if (pass !== pw2) ok = fieldErr("rgPass2", "eRgPass2", "Mật khẩu nhập lại chưa khớp.") && ok;
      if ($("rgAgree")&&!$("rgAgree").checked) ok = fieldErr("rgAgree", "eRgAgree", "Bạn cần đồng ý với điều khoản để tiếp tục.") && ok;
      return ok;
    }
    function localRegister(name, username, email, pass, target){
      return { name: name, username: username, email: email, pass: pass, target: target, plan:"free", owned:[], orders:[], progress:newProgress() };
    }
    /* Dự phòng khi Supabase không khả dụng: tài khoản chỉ sống trong phiên này */
    function finishLogin(idf, pass){
      var acc = findAccount(idf);
      if (!acc) { fieldErr("liEmail", "eLiId", "Chưa có tài khoản này. Kiểm tra lại hoặc đăng ký mới nhé."); return; }
      if (acc.pass !== pass) { fieldErr("liPass", "eLiPass", "Mật khẩu chưa đúng. Thử lại nhé."); return; }
      lastLoginId = idf;
      enterApp(acc);
      toast("Xin chào quay lại, " + acc.name + "!");
    }
    var fgAccount = null;
    $("linkForgot").addEventListener("click", function(){
      fgAccount = null;
      $("fgStep1").classList.remove("hidden");
      $("fgStep2").classList.add("hidden");
      $("fgId").value = ""; $("fgPass").value = ""; $("fgPass2").value = "";
      $("fgSent").textContent = ""; $("fgSent").classList.add("hidden");
      setAuthTab("forgot");
    });
    $("fgBack").addEventListener("click", function(){ setAuthTab("login"); });
    $("formForgot").addEventListener("submit", function(e){
      e.preventDefault();
      clearFieldErrs();
      if (fgAccount && !$("fgStep2").classList.contains("hidden")) {
        var p1 = $("fgPass").value, p2 = $("fgPass2").value;
        var ok = true;
        if (p1.length < 6) ok = fieldErr("fgPass", "eFgPass", "Mật khẩu mới cần ít nhất 6 ký tự.") && ok;
        if (p2 !== p1) ok = fieldErr("fgPass2", "eFgPass2", "Mật khẩu nhập lại chưa khớp.") && ok;
        if (!ok) return;
        /* Chỉ tài khoản local mới tới được bước này — mật khẩu của chúng chỉ
           ở trên thiết bị. Tài khoản Supabase Auth không đặt lại tại đây. */
        fgAccount.pass = p1;
        lastLoginId = fgAccount.email || fgAccount.username;
        fgAccount = null;
        setAuthTab("login");
        toast("Đã đặt lại mật khẩu. Đăng nhập bằng mật khẩu mới nhé!");
        return;
      }
      var idf = $("fgId").value.trim().toLowerCase();
      if (!idf) { fieldErr("fgId", "eFgId", "Vui lòng nhập email đã đăng ký."); return; }
      /* Tài khoản local trong phiên này (gồm demo và tài khoản tạo lúc
         Supabase không khả dụng): mật khẩu chỉ ở trên thiết bị nên đặt lại
         ngay tại đây, không qua email */
      var acc = findAccount(idf);
      if (acc && acc.pass) {
          fgAccount = acc;
          $("fgFound").textContent = "Tìm thấy tài khoản: " + acc.name + " (" + (acc.email || acc.username) + "). Đặt mật khẩu mới bên dưới.";
          $("fgStep1").classList.add("hidden");
          $("fgStep2").classList.remove("hidden");
          return;
        }
        if (!validEmail(idf)) { fieldErr("fgId", "eFgId", "Email chưa đúng định dạng. Kiểm tra lại nhé."); return; }
        /* Tài khoản Supabase Auth: gửi mail đặt lại mật khẩu tới đúng email
           thật đã đăng ký, kèm đường dẫn quay lại trang này để đặt mật khẩu mới */
        sbWhenReady(function(){
          if (!sb) { fieldErr("fgId", "eFgId", "Không tìm thấy tài khoản này. Kiểm tra lại nhé."); return; }
          sb.auth.resetPasswordForEmail(idf, { redirectTo: sbResetRedirect() }).then(function(res){
            if (res && res.error) { authErr(sbAuthErrVi(res.error)); return; }
            var sent = $("fgSent");
            sent.textContent = "Đã gửi email đặt lại mật khẩu tới " + idf + ". Mở mail, bấm vào liên kết trong mail để quay lại trang này và đặt mật khẩu mới. Chưa thấy mail thì kiểm tra hộp thư rác (Spam) nhé.";
            sent.classList.remove("hidden");
          }, function(){ authErr("Không gửi được email lúc này. Kiểm tra mạng rồi thử lại nhé."); });
        });
      });
      /* Đặt mật khẩu mới sau khi bấm liên kết trong mail đặt lại: phiên khôi
         phục của Supabase đang hiệu lực nên updateUser đổi mật khẩu cho đúng
         tài khoản đó, xong vào thẳng app bằng phiên vừa khôi phục */
      $("rpBack").addEventListener("click", function(){ setAuthTab("login"); });
      $("formReset").addEventListener("submit", function(e){
        e.preventDefault();
        clearFieldErrs();
        var p1 = $("rpPass").value, p2 = $("rpPass2").value;
        var ok = true;
        if (p1.length < 6) ok = fieldErr("rpPass", "eRpPass", "Mật khẩu mới cần ít nhất 6 ký tự.") && ok;
        if (p2 !== p1) ok = fieldErr("rpPass2", "eRpPass2", "Mật khẩu nhập lại chưa khớp.") && ok;
        if (!ok) return;
        if (!sb) { authErr("Chưa kết nối được tới Supabase. Kiểm tra mạng rồi thử lại nhé."); return; }
        sb.auth.updateUser({ password: p1 }).then(function(res){
          if (res && res.error) { authErr(sbAuthErrVi(res.error)); return; }
          sbRecoveryLink = false;
          try { history.replaceState(null, "", window.location.pathname); } catch (e2) {}
          var au = res && res.data && res.data.user;
          if (au) {
            sbLoadAuthAccount(au, function(acc){
              if (acc) { lastLoginId = acc.email || acc.username; enterApp(acc); toast("Đã đặt mật khẩu mới. Chào mừng bạn quay lại!"); return; }
              setAuthTab("login");
              toast("Đã đặt mật khẩu mới. Đăng nhập lại nhé!");
            });
          } else {
            setAuthTab("login");
            toast("Đã đặt mật khẩu mới. Đăng nhập lại nhé!");
          }
        }, function(){ authErr("Không đặt lại được mật khẩu lúc này. Thử lại sau nhé."); });
      });
      function logout(){
        var wasAuth = !!(currentUser && currentUser.authUser);
        currentUser = null;
        if ("speechSynthesis" in window) { try { window.speechSynthesis.cancel(); } catch(e){} }
        /* Đăng xuất khỏi Supabase Auth để phiên không tự khôi phục lần mở sau */
        if (wasAuth && sb) { try { sb.auth.signOut().then(sbIgnored, sbIgnored); } catch (e) {} sbUid = null; }
        showScreen("landing");
        toast("Đã đăng xuất. Hẹn gặp lại bạn!");
      }
      ["btnLogout","btnLogout2","btnLogout3"].forEach(function(id){ $(id).addEventListener("click", logout); });

/* validEmail: khôi phục — từng có trong file đơn gốc (a6f447a), bị rơi khi tách file; đăng ký/đăng nhập/quên mật khẩu đều gọi nó. */
function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
