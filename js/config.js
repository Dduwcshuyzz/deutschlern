
    "use strict";
    
    /* ==================== SUPABASE — AUTH + DỮ LIỆU NGƯỜI DÙNG ====================
       Đăng nhập / đăng ký dùng Supabase Auth thật của project "deutschflow"
       bằng EMAIL THẬT của người dùng: form đăng ký thu email thật và gọi
       sb.auth.signUp bằng đúng email đó, kèm metadata
       { username, display_name, target_level } — tên đăng nhập chỉ dùng
       làm tên hiển thị trong app và trong bảng profiles. Đăng nhập gọi
       sb.auth.signInWithPassword bằng email thật + mật khẩu. Quên mật khẩu
       gọi sb.auth.resetPasswordForEmail: Supabase gửi mail đặt lại tới
       đúng email đã đăng ký, người dùng bấm liên kết trong mail quay lại
       web (redirectTo) và đặt mật khẩu mới qua sb.auth.updateUser.
       Mật khẩu chỉ được gửi
       thẳng tới Supabase Auth (Supabase tự băm và giữ), KHÔNG lưu dạng thô
       vào bất kỳ bảng nào, KHÔNG ghi vào profiles. Phiên đăng nhập do
       Supabase JS tự giữ (persistSession) và được khôi phục khi mở lại web
       qua sb.auth.getSession() — đăng nhập máy khác vẫn lấy lại đúng dữ
       liệu vì mọi lần đọc/ghi đều dùng id của phiên Auth: auth.uid().

       Các bảng dữ liệu người dùng (mỗi bảng bật RLS, chính sách chỉ cho
       chủ sở hữu đọc/ghi dòng của mình: id / user_id = auth.uid()):
         profiles(id, username, display_name, level, plan, xp, created_at)
           — id CHÍNH LÀ auth.uid() của phiên đăng nhập.
         progress(user_id, lesson_id, completed, score, updated_at)
           — user_id = auth.uid(); một dòng mỗi bài đã hoàn thành.
         purchases(id, user_id, item_type, item_id, amount, status, created_at)
           — user_id = auth.uid(); một dòng mỗi đơn mua gói / khóa học.

       BẢNG MỚI cần tạo thêm trong Supabase (SQL Editor) để đồng bộ nốt các
       dữ liệu người dùng còn lại — web đã sẵn sàng ghi/đọc bảng này, nếu
       bảng chưa tồn tại thì các lần ghi/đọc lỗi sẽ bị bỏ qua lặng lẽ và web
       vẫn chạy bằng dữ liệu trong phiên như cũ:

         create table if not exists public.user_state (
           user_id    uuid primary key references auth.users(id) on delete cascade,
           known      jsonb not null default '[]'::jsonb,   -- chỉ số các từ đã thuộc (theo VOCAB)
           mistakes   jsonb not null default '[]'::jsonb,   -- lỗi sai cần ôn: [{kind:"vocab"|"grammar", idx}]
           quiz_best  int  not null default 0,              -- điểm trắc nghiệm cao nhất (/10)
           quiz_plays int  not null default 0,              -- số lượt làm trắc nghiệm
           exam_plays int  not null default 0,              -- số lượt thi thử
           exam_best  int  not null default 0,              -- điểm thi thử cao nhất (/15)
           exam_last  jsonb,                                -- kết quả thi gần nhất {score,total,pass}
           speak      int  not null default 0,              -- số lần nghe phát âm
           today      jsonb,                                -- kế hoạch hôm nay {key,lessons,words,quiz}
           updated_at timestamptz not null default now()
         );
         alter table public.user_state enable row level security;
         create policy "user_state_select_own" on public.user_state
           for select using (auth.uid() = user_id);
         create policy "user_state_insert_own" on public.user_state
           for insert with check (auth.uid() = user_id);
         create policy "user_state_update_own" on public.user_state
           for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
         create policy "user_state_delete_own" on public.user_state
           for delete using (auth.uid() = user_id);

       Bảo mật:
         - Client chỉ dùng anon key công khai bên dưới (không phải secret);
           không bao giờ đặt service_role key hay secret nào vào file này.
           Mọi quyền truy cập do RLS quyết định theo auth.uid().
         - Chỉ đồng bộ đúng dữ liệu cần thiết ở trên; mật khẩu không bao
           giờ được ghi vào các bảng dữ liệu.
         - Tài khoản demo (demo/demo123) chỉ chạy local trong phiên, không
           đăng ký Auth và không đồng bộ lên Supabase.
         - Nội dung học (bài học, từ vựng, ngữ pháp, hội thoại) đi kèm sẵn
           trong trang, không phải dữ liệu người dùng nên không qua Supabase.
         - Mất mạng / Supabase lỗi / bảng mới chưa tạo: web tự chạy bằng dữ
           liệu trong phiên, không văng lỗi ra giao diện. */
    var SUPABASE_URL = "https://trticnmlaujbtavfgoym.supabase.co";
    var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydGljbm1sYXVqYnRhdmZnb3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNjgxMjksImV4cCI6MjEwOTk0NDEyOX0.D6vnJBRAS2L-lM7uGQyInzSqDFz57fHz3Gm109D5_Zo";
    var sb = null;
    var sbUid = null; /* auth.uid() của phiên đăng nhập hiện tại, null nếu chưa đăng nhập Auth */
    /* SDK Supabase được nạp bất đồng bộ và chỉ khi đã điền URL + key,
       để trang không bao giờ bị kẹt chờ CDN: chưa cấu hình thì web chạy
       bằng dữ liệu trong phiên như cũ; cấu hình rồi thì các luồng đăng
       nhập / lưu tiến độ tự chờ SDK sẵn sàng qua sbWhenReady(). */
    var sbReady = false;
    var sbWaiters = [];
    function sbFlush(){
      var w = sbWaiters; sbWaiters = [];
      for (var i = 0; i < w.length; i++) { try { w[i](); } catch (e) {} }
    }
    function sbWhenReady(cb){
      if (sbReady || !SUPABASE_URL || !SUPABASE_ANON_KEY) { cb(); return; }
      sbWaiters.push(cb);
    }
    function sbCreate(){
      try {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true }
        });
      } catch (e) { sb = null; }
      sbReady = true;
      sbFlush();
    }
    (function sbBoot(){
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { sbReady = true; return; }
      if (window.supabase) { sbCreate(); return; }
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.async = true;
      s.onload = function(){ sbCreate(); };
      s.onerror = function(){ sb = null; sbReady = true; sbFlush(); };
      document.head.appendChild(s);
    })();
    function sbUuid(){
      try {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c){
          var r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      } catch (e) { return "u" + Date.now() + "-" + Math.floor(Math.random() * 1e9); }
    }
    function sbIgnored(){}
    /* Đường dẫn quay lại web để Supabase gắn vào mail đặt lại mật khẩu:
       người dùng bấm liên kết trong mail sẽ trở lại đúng trang này, phiên
       khôi phục (PASSWORD_RECOVERY) mở form đặt mật khẩu mới. */
    function sbResetRedirect(){
      try { return window.location.origin + window.location.pathname; } catch (e) { return undefined; }
    }
    /* Người dùng có đang mở web từ liên kết đặt lại mật khẩu trong mail? */
    var sbRecoveryLink = false;
    try { sbRecoveryLink = /type=recovery/.test(window.location.hash || ""); } catch (e) {}
    function sbAuthErrVi(err){
      var m = (err && err.message) || "";
      if (/invalid login credentials/i.test(m)) return "Email hoặc mật khẩu chưa đúng. Thử lại nhé.";
      if (/email not confirmed/i.test(m)) return "Tài khoản chưa được xác thực trên Supabase. Chủ web cần tắt yêu cầu xác thực email trong cài đặt Auth của project rồi thử lại.";
      if (/already registered|already exists/i.test(m)) return "Tên đăng nhập này đã có người dùng. Thử tên khác nhé.";
      if (/password should be/i.test(m)) return "Mật khẩu chưa đạt yêu cầu của Supabase (cần ít nhất 6 ký tự).";
      if (/rate limit|too many/i.test(m)) return "Thử lại quá nhiều lần. Chờ một lát rồi thử lại nhé.";
      return "Không kết nối được tới Supabase lúc này. Kiểm tra mạng rồi thử lại nhé.";
    }
    /* Đồng bộ hồ sơ + tiến độ + đơn + trạng thái học của tài khoản Auth lên
       Supabase, luôn dùng đúng auth.uid() làm khóa. Tài khoản local/demo
       (không có phiên Auth) không đồng bộ. Mọi lỗi (RLS, bảng user_state
       chưa tạo, mất mạng) đều bị bỏ qua lặng lẽ — dữ liệu trong phiên vẫn
       là nguồn chạy chính của giao diện. */
    var sbSaveTimer = null;
