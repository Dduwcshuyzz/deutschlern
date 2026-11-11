
    "use strict";
    
    /* ==================== HELPERS ==================== */
    function $(id){ return document.getElementById(id); }
    function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
    function shuffle(arr){ var a = arr.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    var SPEAK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    var ACH_ICONS = {
      star:'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      book:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>',
      trophy:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0zM7 6H4a2 2 0 0 0 2 4h1M17 6h3a2 2 0 0 1-2 4h-1"/></svg>',
      layers:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
      bolt:'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg>',
      target:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
      volume:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
    };
    var toastTimer = null;
    function toast(msg){
      var t = $("toast"); t.textContent = msg; t.classList.add("show");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 2400);
    }

    /* ==================== STATE (trong phiên, đồng bộ lên Supabase) ==================== */
    function newProgress(){ return { xp:0, lessons:[], known:[], speak:0, quizBest:0, quizPlays:0, today:null,
      mistakes:[], examPlays:0, examBest:0, examLast:null }; }
    var accounts = {};
    accounts["demo@deutschflow.vn"] = { name:"Học viên Demo", username:"demo", email:"demo@deutschflow.vn", pass:"demo123", target:"B1", plan:"free", owned:[], orders:[], progress:newProgress() };
    function todayKey(){ return new Date().toISOString().slice(0, 10); }
    function ensureToday(p){
      var p = prog();
      if (!p.today || p.today.key !== todayKey()) p.today = { key: todayKey(), xp:0, lessons:0, words:0, quiz:0, stripes:0 }; return p.today;
    }
    function addMistake(kind, id, label, level){
      var p = prog();
      p.mistakes = p.mistakes || [];
      if (!p.mistakes.find(function(m){ return m.kind === kind && m.id === id; }))
        p.mistakes.unshift({ kind: kind, id: id, label: label, level: level || "A1" });
      if (p.mistakes.length > 40) p.mistakes.length = 40;
    }
    function removeMistake(kind, id) { var p = prog(); p.mistakes = (p.mistakes || []).filter(function(m){ return !(m.kind === kind && m.id === id); }); }
    var PLANS = {
      free: { name:"Miễn phí", level:0, price:0, tagline:"Lộ trình A1–C2, flashcard, ngữ pháp & hội thoại", feats:["<b>✓</b> 18 bài học A1–C2","<b>✓</b> 164 từ vựng &amp; 12 chủ điểm ngữ pháp","<b>—</b> Thi thử không giới hạn","<b>—</b> Luyện nghe phát âm AI"] },
      plus: { name:"Plus", level:1, price:49000, hot:true, tagline:"Học không giới hạn, không quảng cáo", feats:["<b>✓</b> Mở khóa toàn bộ 18 bài học A1–C2","<b>✓</b> Thi thử không giới hạn, chấm điểm chi tiết","<b>✓</b> Luyện nghe phát âm AI","<b>✓</b> Theo dõi tiến độ nâng cao"] },
      pro: { name:"Pro", level:2, price:99000, tagline:"Toàn bộ tính năng và lộ trình cá nhân", feats:["<b>✓</b> Tất cả quyền lợi của Plus","<b>✓</b> Lộ trình cá nhân hóa theo mục tiêu","<b>✓</b> Trò chuyện AI luyện phản xạ","<b>✓</b> Ưu tiên hỗ trợ"] }
    };
    var COURSE_PRICE = { "A1":0, "A2":0, "B1":149000, "B2":149000, "C1":199000, "C2":199000 };
    function fmtVND(n){ return n.toLocaleString("vi-VN") + " đ"; }
    function planRank(acc){ return (PLANS[acc.plan || "free"] ? PLANS[acc.plan || "free"].level : 0); }
    function userPlan(){ return planRank(currentUser); }
    function canAccess(missing){ if (!currentUser) return false; if (currentUser.owned && currentUser.owned.indexOf(missing) !== -1) return true; if (currentUser.plan) return planRank(currentUser) >= 1; return false; }
    function canExam(){ return !!currentUser && planRank(currentUser) >= 1; }
    function requireAccess(missing, level){ if (!currentUser) return true; if (!missing && planRank(currentUser) >= 1) return false; return !canAccess(missing); }
    var currentUser = null;
    var pendingLevel = null;
    var lastLoginId = "";
    function prog(){ return currentUser.progress; }
    /* ==================== TTS ==================== */
    function speakText(text, lang){
      if (!text) return;
      if (!("speechSynthesis" in window)) { toast("Trình duyệt không hỗ trợ đọc giọng nói."); return; }
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = lang || "de-DE"; u.rate = 0.85;
        window.speechSynthesis.speak(u);
        if (currentUser) prog().speak = (prog().speak || 0) + 1;
        refreshStats();
      } catch (e) { }
    }
    if ("speechSynthesis" in window) {
      try { speechSynthesis.getVoices(); setTimeout(function(){ speechSynthesis.getVoices(); }, 800); } catch (e) { }
    }
    document.addEventListener("click", function(e){
      var t = e.target.closest("[data-speak]");
      if (!t) return;
      speakText(t.getAttribute("data-speak"), t.getAttribute("data-lang") || "de-DE");
    });
    /* ==================== AUTH ==================== */
    function showScreen(name){
      ["landing", "auth", "app"].forEach(function(id){ $(id).classList.toggle("hidden", id !== name); });
      if (name === "app") { window.scrollTo(0, 0); }
      if (name === "landing" || name === "app") { document.body.classList.add("in-app"); } else { document.body.classList.remove("in-app"); }
      document.querySelectorAll(".-screen").forEach(function(s){ s.classList.toggle("active", s.id === name); });
      document.querySelectorAll("[data-nav]").forEach(function(l){ l.classList.toggle("active", l.getAttribute("data-nav") === name); });
    }

    /* ==================== EFFECTS ==================== */
    var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    function countUp(el, target, dur){
      if (reduceMotion || !target) { el.textContent = target; return; }
      var start = null;
      function step(ts){
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function initFx(){
      /* Hero data-count animation */
      var countHosts = document.querySelectorAll("[data-stat]");
      if (!reduceMotion && ("IntersectionObserver" in window)) {
        var cio = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if (!en.isIntersecting) return;
            var h = en.target;
            h.querySelectorAll("[data-count]").forEach(function(el){
              countUp(el, parseInt(el.getAttribute("data-count"), 10) || 0, 1400);
            });
            cio.unobserve(h);
          });
        }, { threshold: .5 });
        countHosts.forEach(function(h){ cio.observe(h); });
      } else {
        countHosts.forEach(function(h){ h.querySelectorAll("[data-count]").forEach(function(el){ el.textContent = el.getAttribute("data-count"); }); });
      }

      /* Scroll reveal on the landing page */
      var revealEls = document.querySelectorAll("#landing .section-head, #levelsGrid .level-card, .step-card, .acct-card, .faq-list details, .feat-row, #sampleGrid .word-card, .cta-band");
      if (reduceMotion || !("IntersectionObserver" in window)) {
        revealEls.forEach(function(el){ el.classList.add("in"); });
      } else {
        revealEls.forEach(function(el, i){ el.classList.add("fx-reveal"); el.style.transitionDelay = (i % 3) * 60 + "ms"; });
        var rio = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if (!en.isIntersecting) return;
            var el = en.target;
            el.classList.add("in");
            rio.unobserve(el);
            setTimeout(function(){ el.style.transitionDelay = ""; }, 750);
          });
        }, { threshold: .05, rootMargin: "1500px 0px 1500px 0px" });
        revealEls.forEach(function(el){ rio.observe(el); });
        /* Safety net: nothing stays hidden if the observer never fires */
        setTimeout(function(){
          revealEls.forEach(function(el){ el.classList.add("in"); el.style.transitionDelay = ""; rio.unobserve(el); });
        }, 1600);
      }

      /* Reading progress bar, landing only */
      var sp = $("scrollProgress");
      function onScroll(){
        if ($("landing").classList.contains("hidden")) { sp.style.width = "0"; return; }
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        sp.style.width = (max > 0 ? Math.min(h.scrollTop / max, 1) * 100 : 0) + "%";
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      /* Shake the auth card when a submit leaves a visible error */
      ["formLogin", "formReg", "formForgot"].forEach(function(id){
        var f = $(id);
        if (!f) return;
        f.addEventListener("submit", function(){
          setTimeout(function(){
            var hasErr = document.querySelector("#auth .field-err:not(.hidden)") || !$("authErr").classList.contains("hidden");
            if (!hasErr || reduceMotion) return;
            var card = document.querySelector(".auth-card");
            card.classList.remove("shake");
            void card.offsetWidth;
            card.classList.add("shake");
            setTimeout(function(){ card.classList.remove("shake"); }, 450);
          }, 0);
        });
      });
    }

    /* ==================== INIT ==================== */
    renderLanding();
    initFx();
    showScreen("landing");
    /* Tự khôi phục phiên Supabase Auth còn hiệu lực (nếu có): người dùng mở
       lại web là vào thẳng app với đúng dữ liệu của mình, khỏi đăng nhập lại */
    sbWhenReady(function(){ sbRestoreSession(); });
