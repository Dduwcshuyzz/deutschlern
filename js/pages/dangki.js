
    "use strict";
    
    function finishRegisterLocal(name, username, email, pass, target){
      if (usernameTaken(username)) { fieldErr("rgUser", "eRgUser", "Tên đăng nhập này đã có người dùng. Thử tên khác nhé."); return; }
      accounts[email] = { name:name, username:username, email:email, pass:pass, target:target, plan:"free", owned:[], orders:[], progress:newProgress() };
      lastLoginId = email;
      pendingLevel = null;
      $("rgLevelNote").classList.add("hidden");
      enterApp(accounts[email]);
      toast("Đăng ký thành công! Chào mừng " + name + " đến với DeutschFlow.");
    }
    /* Đăng ký: kiểm tra dữ liệu, đăng ký qua Supabase Auth bằng email thật, tạo hồ sơ rồi vào học (khôi phục sau khi tách file). */ $("formReg").addEventListener("submit", function(e){   e.preventDefault();   clearFieldErrs();   if(!validateRegister()) return;   var name = $("rgName").value.trim();   var username = $("rgUser").value.trim().toLowerCase();   var email = $("rgEmail").value.trim().toLowerCase();   var pass = $("rgPass").value;   var target = $("rgLevel").value;   sbWhenReady(function(){     if(!sb){ finishRegisterLocal(name, username, email, pass, target); return; }     sb.auth.signUp({email: email, password: pass, options: {data: {full_name: name, username: username, target_level: target}}}).then(function(res){       if(res.error || !res.data || !res.data.user || (res.data.user.identities && res.data.user.identities.length === 0)){         if(!res.error && res.data && res.data.user && res.data.user.identities && res.data.user.identities.length === 0){ fieldErr("rgEmail", "eRgEmail", "Email này đã được đăng ký. Hãy dùng email khác hoặc Đăng nhập nhé."); return; }         if(res.error){ authErr(sbAuthErrVi(res.error)); return; }         authErr("Không tạo được tài khoản. Hãy thử lại nhé.");         return;       }       var session = res.data.session;       var done = function(sessUser){         sbLoadAuthAccount(sessUser, function(acc){           if(!acc){ authErr("Đã tạo tài khoản nhưng chưa tải được hồ sơ. Hãy thử Đăng nhập lại nhé."); return; }           acc.name = name; acc.username = username; acc.email = email; acc.target = target;           accounts[username] = acc;           sbSaveUser(acc);           lastLoginId = email;           pendingLevel = null;           $("rgLevelNote").classList.add("hidden");           enterApp(acc);           toast("Đăng ký thành công! Chào mừng " + name + " đến với DeutschFlow.");         });       };       if(session && session.user){ done(session.user); return; }       sb.auth.signInWithPassword({email: email, password: pass}).then(function(r2){         if(r2.data && r2.data.user){ done(r2.data.user); return; }         authErr("Đã tạo tài khoản. " + sbAuthErrVi(r2.error));       }, function(){ authErr("Đã tạo tài khoản nhưng chưa đăng nhập được ngay. Hãy thử Đăng nhập lại nhé."); });     }, function(){ finishRegisterLocal(name, username, email, pass, target); });   }); }); $("formLogin").addEventListener("submit", function(e){
      e.preventDefault();
      clearFieldErrs();
      var idf = $("liEmail").value.trim();
      var pass = $("liPass").value;
      if (!idf) { fieldErr("liEmail", "eLiId", "Vui lòng nhập email đã đăng ký."); return; }
      var low = idf.toLowerCase();
      /* Tài khoản demo chạy local hoàn toàn, không qua Supabase Auth:
         gõ "demo" hoặc email của tài khoản demo đều vào được bằng demo123 */
      if (low === "demo" || low === "demo@deutschflow.vn") { finishLogin(idf, pass); return; }
      if (!validEmail(low)) { fieldErr("liEmail", "eLiId", "Email chưa đúng định dạng. Kiểm tra lại nhé."); return; }
      sbWhenReady(function(){
        if (!sb) { finishLogin(idf, pass); return; }
        sb.auth.signInWithPassword({ email: low, password: pass }).then(function(res){
          if (res.error || !res.data || !res.data.user) {
            /* Dự phòng: tài khoản local tạo trong phiên này (lúc Supabase
               không khả dụng) vẫn đăng nhập được bằng mật khẩu giữ trong phiên */
            var acc = findAccount(idf);
            if (acc && acc.pass && acc.pass === pass) { lastLoginId = acc.email || idf; enterApp(acc); toast("Xin chào quay lại, " + acc.name + "!"); return; }
            fieldErr("liPass", "eLiPass", sbAuthErrVi(res.error));
            return;
          }
          sbLoadAuthAccount(res.data.user, function(acc){
            if (!acc) { authErr("Đã đăng nhập nhưng chưa tải được hồ sơ từ Supabase. Thử lại sau nhé."); return; }
            lastLoginId = acc.email || acc.username;
            enterApp(acc);
            toast("Xin chào quay lại, " + acc.name + "!");
          });
        }, function(){ finishLogin(idf, pass); });
      });
    });
    /* Đăng nhập local: tài khoản demo và tài khoản tạo trong phiên khi
       Supabase không khả dụng */
