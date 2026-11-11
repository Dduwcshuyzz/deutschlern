
    "use strict";
    
    function sbSaveUser(user){
      if (!user || !user.username || user.username === "demo" || !user.authUid) return;
      if (!sb) {
        if (!sbReady) sbWhenReady(function(){ sbSaveUser(user); });
        return;
      }
      if (sbSaveTimer) clearTimeout(sbSaveTimer);
      sbSaveTimer = setTimeout(function(){ sbPushUser(user); }, 500);
    }
    function sbPushUser(user){
      if (!sb || !user || !user.authUid) return;
      var uid = user.authUid;
      var p = user.progress || {};
      try {
        sb.from("profiles").upsert({
          id: uid, username: user.username, display_name: user.name || user.username,
          level: user.target || "A1", plan: user.plan || "free", xp: p.xp || 0
        }, { onConflict: "id" }).then(sbIgnored, sbIgnored);
      } catch (e) {}
      (p.lessons || []).forEach(function(lessonId){
        user._sbProg = user._sbProg || {};
        if (user._sbProg[lessonId]) return;
        user._sbProg[lessonId] = true;
        try {
          sb.from("progress").upsert({
            user_id: uid, lesson_id: lessonId, completed: true,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id,lesson_id" }).then(sbIgnored, function(){ delete user._sbProg[lessonId]; });
        } catch (e) { delete user._sbProg[lessonId]; }
      });
      (user.orders || []).forEach(function(o){
        try {
          if (!o.dbId && !o._sbPosting) {
            o._sbPosting = true;
            sb.from("purchases").insert({
              user_id: uid, item_id: o.refId, item_type: o.kind,
              amount: o.price, status: o.status || "pending"
            }).select().then(function(res){
              o._sbPosting = false;
              var row = res && res.data && res.data[0];
              if (row && row.id) { o.dbId = row.id; o._sbStatus = row.status; }
            }, function(){ o._sbPosting = false; });
          } else if (o.dbId && o._sbStatus !== o.status) {
            var prev = o._sbStatus; o._sbStatus = o.status;
            sb.from("purchases").update({ status: o.status }).eq("id", o.dbId)
              .then(sbIgnored, function(){ o._sbStatus = prev; });
          }
        } catch (e) { o._sbPosting = false; }
      });
      /* Trạng thái học còn lại -> bảng user_state (chưa có bảng thì lỗi bị bỏ qua) */
      try {
        sb.from("user_state").upsert({
          user_id: uid,
          known: p.known || [], mistakes: p.mistakes || [],
          quiz_best: p.quizBest || 0, quiz_plays: p.quizPlays || 0,
          exam_plays: p.examPlays || 0, exam_best: p.examBest || 0,
          exam_last: p.examLast || null, speak: p.speak || 0,
          today: p.today || null, updated_at: new Date().toISOString()
        }, { onConflict: "user_id" }).then(sbIgnored, sbIgnored);
      } catch (e) {}
    }
    /* Kiểm tra tên đăng nhập đã tồn tại trên Supabase chưa (bảng profiles) */
    function sbCheckUsername(username, cb){
      if (!sbReady) { sbWhenReady(function(){ sbCheckUsername(username, cb); }); return; }
      if (!sb || !username) { cb(false); return; }
      try {
        sb.from("profiles").select("id").eq("username", username).limit(1)
          .then(function(res){ cb(!!(res && res.data && res.data.length)); }, function(){ cb(false); });
      } catch (e) { cb(false); }
    }
    /* Tải hồ sơ thật của một phiên Auth: lấy từ bảng profiles (plans cũng
       được tính lại thành khoản cao nhất mà người dùng sở hữu, và các trường
       được gộp vào đối tượng acc trước khi gọi cb. */
    function sbLoadAuthAccount(au, cb){
      if (!sb || !au || !au.id) { cb(null); return; }
      var uid = au.id;
      sbUid = uid;
      var meta = au.user_metadata || {};
      var acc = {
        authUid: uid, sid: uid, authUser: true, sbRemote: true, pass: null,
        name: meta.display_name || meta.username || "Học viên",
        username: meta.username || String(au.email || "").split("@")[0],
        email: au.email || "",
        target: meta.target_level || "A1", plan: "free",
        owned: [], orders: [], progress: newProgress()
      };
      var pending = 4;
      var finished = false;
      function step(){ if (!finished && --pending <= 0) { finished = true; accounts[acc.username] = acc; cb(acc); } }
      try {
        sb.from("profiles").select("level,plan,xp").eq("id", uid).limit(1)
          .then(function(r1){
            try {
              var row = r1 && r1.data && r1.data[0];
              if (row) {
                if (row.level) acc.target = row.level;
                if (row.plan) acc.plan = row.plan;
                acc.progress.xp = row.xp || 0;
              }
            } catch (e) {}
            step();
          }, step);
        sb.from("progress").select("lesson_id").eq("user_id", uid)
          .then(function(r2){
            try {
              ((r2 && r2.data) || []).forEach(function(pr){
                if (pr.lesson_id && acc.progress.lessons.indexOf(pr.lesson_id) < 0) acc.progress.lessons.push(pr.lesson_id);
              });
              acc._sbProg = {};
              acc.progress.lessons.forEach(function(id){ acc._sbProg[id] = true; });
            } catch (e) {}
            step();
          }, step);
        sb.from("purchases").select("*").eq("user_id", uid).order("created_at", { ascending: true })
          .then(function(r3){
            try {
              ((r3 && r3.data) || []).forEach(function(pu){
                var kind = pu.item_type === "plan" ? "plan" : "course";
                acc.orders.push({
                  dbId: pu.id, _sbStatus: pu.status,
                  label: buyLabel({ type: kind, id: pu.item_id }),
                  price: pu.amount || 0, kind: kind, refId: pu.item_id,
                  status: pu.status || "pending"
                });
                if (kind === "course" && pu.status === "active" && acc.owned.indexOf(pu.item_id) < 0) acc.owned.push(pu.item_id);
                if (kind === "plan" && pu.status === "active" && planRank(pu.item_id) > planRank(acc.plan)) acc.plan = pu.item_id;
              });
            } catch (e) {}
            step();
          }, step);
        sb.from("user_state").select("*").eq("user_id", uid).limit(1)
          .then(function(r4){
            try {
              var st = r4 && r4.data && r4.data[0];
              if (st) {
                var pr = acc.progress;
                if (Array.isArray(st.known)) pr.known = st.known.filter(function(x){ return typeof x === "number"; });
                if (Array.isArray(st.mistakes)) pr.mistakes = st.mistakes.filter(function(x){ return x && (x.kind === "vocab" || x.kind === "grammar") && typeof x.idx === "number"; });
                pr.quizBest = st.quiz_best || 0;
                pr.quizPlays = st.quiz_plays || 0;
                pr.examPlays = st.exam_plays || 0;
                pr.examBest = st.exam_best || 0;
                pr.examLast = st.exam_last || null;
                pr.speak = st.speak || 0;
                if (st.today && st.today.key) pr.today = st.today;
              }
            } catch (e) {}
            step();
          }, step);
      } catch (e) { if (!finished) { finished = true; accounts[acc.username] = acc; cb(acc); } }
    }
    /* Khôi phục phiên đăng nhập khi mở lại web: Supabase JS tự giữ phiên,
       getSession() trả lại phiên còn hiệu lực -> nạp dữ liệu và vào thẳng app */
    var sbRestoreStarted = false;
    function sbRestoreSession(){
      if (!sb || sbRestoreStarted) return;
      sbRestoreStarted = true;
      try {
        sb.auth.onAuthStateChange(function(ev, sess){
          sbUid = sess && sess.user ? sess.user.id : null;
          if (ev === "PASSWORD_RECOVERY") {
            sbRecoveryLink = true;
            if (!currentUser) showAuth("reset");
          }
        });
        sb.auth.getSession().then(function(res){
          var sess = res && res.data && res.data.session;
          if (sess && sess.user && sbRecoveryLink && !currentUser) {
            showAuth("reset");
            return;
          }
          if (sess && sess.user && !currentUser) {
            sbLoadAuthAccount(sess.user, function(acc){
              if (acc && !currentUser) {
                lastLoginId = acc.username;
                enterApp(acc);
                toast("Đã khôi phục phiên đăng nhập. Xin chào, " + acc.name + "!");
              }
            });
          }
        }, sbIgnored);
      } catch (e) {}
    }
