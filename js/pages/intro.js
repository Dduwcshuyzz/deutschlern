
    "use strict";
    
    /* ==================== WORD CARDS ==================== */
    function wordDisplay(w){
      return w[1] ? '<span class="art ' + w[1] + '">' + w[1] + "</span> " + esc(w[0].replace(/^(der|die|das)\s+/, "")) : esc(w[0]);
    }
    function wordCardHTML(w, showKnown){
      var idx = VOCAB.indexOf(w);
      var known = currentUser && prog().known.indexOf(idx) >= 0;
      var html = '<div class="word-card"><div class="word-top"><div><div class="word-de">' + wordDisplay(w) + "</div>";
      if (w[2]) html += '<div class="word-pl">Số nhiều: ' + esc(w[2]) + "</div>";
      html += '<div class="word-vi">' + esc(w[3]) + '</div></div><span class="spacer"></span>';
      html += '<button class="icon-btn" data-speak="' + esc(w[0]) + '" title="Nghe phát âm">' + SPEAK_SVG + "</button>";
      if (showKnown) html += '<button class="icon-btn' + (known ? " known" : "") + '" data-known="' + idx + '" title="Đánh dấu đã thuộc">' + CHECK_SVG + "</button>";
      html += '</div><p class="word-ex"><b>' + esc(w[6]) + "</b><br>" + esc(w[7]) + "</p>";
      html += '<p style="margin-top:.55rem"><span class="tag">' + w[4] + '</span> <span style="color:var(--ink2); font-size:.8rem; font-weight:600">' + esc(TOPICS[w[5]]) + "</span></p></div>";
      return html;
    }
    document.addEventListener("click", function(e){
      var b = e.target.closest("[data-known]");
      if (!b || !currentUser) return;
      var idx = parseInt(b.getAttribute("data-known"), 10);
      var p = prog();
      var pos = p.known.indexOf(idx);
      var t = ensureToday(p);
      if (pos >= 0) { p.known.splice(pos, 1); if (t.words > 0) t.words--; b.classList.remove("known"); toast("Đã bỏ đánh dấu thuộc từ này."); }
      else { p.known.push(idx); p.xp += 1; t.words++; b.classList.add("known"); toast("Đã thuộc thêm 1 từ · +1 XP"); }
      refreshStats();
      if (currentView === "dashboard") renderToday();
      if (currentView === "review") renderReview();
    });

    /* ==================== LANDING ==================== */
    /* Bấm thẻ cấp độ: mở form Đăng ký với cấp đã chọn (khôi phục sau khi tách file). */ document.addEventListener("click", function(e){   var lc = e.target.closest("[data-level-card]");   if(lc){     pendingLevel = lc.getAttribute("data-level-card");     showAuth("register");     var rg = $("rgLevel");     if(rg) rg.value = pendingLevel;     var nt = $("rgLevelNote");     if(nt) nt.classList.remove("hidden");   } }); document.addEventListener("keydown", function(e){   if((e.key === "Enter" || e.key === " ") && e.target.matches("[data-level-card]")){     e.preventDefault();     pendingLevel = e.target.getAttribute("data-level-card");     showAuth("register");     var rg2 = $("rgLevel");     if(rg2) rg2.value = pendingLevel;     var nt2 = $("rgLevelNote");     if(nt2) nt2.classList.remove("hidden");   } }); function renderLanding(){
      ["vocab", "lessons", "grammar"].forEach(function(key){
        var val = key === "vocab" ? VOCAB.length : key === "lessons" ? LESSONS.length : GRAMMAR.length;
        document.querySelectorAll('[data-stat="' + key + '"]').forEach(function(el){ el.textContent = val; });
      });
      $("levelsGrid").innerHTML = LEVELS.map(function(l){
        var nl = LESSONS.filter(function(x){ return x.lv === l.id; }).length;
        var nw = VOCAB.filter(function(x){ return x[4] === l.id; }).length;
        return '<div class="level-card clickable" data-level-card="' + l.id + '" role="button" tabindex="0" title="Đăng ký với mục tiêu ' + l.id + '"><div class="lv">' + l.id + "<small>" + esc(l.name) + '</small></div><p>' + esc(l.can) + '</p><div class="meta">' + nl + " bài học · " + nw + ' từ vựng<br><span class="go">Bấm để đăng ký với mục tiêu ' + l.id + " →</span></div></div>";
      }).join("");
      var sampleIdx = [0, 24, 8, 16, 28, 40];
      $("sampleGrid").innerHTML = sampleIdx.map(function(i){ return wordCardHTML(VOCAB[i], false); }).join("");
    }

    /* ==================== APP RENDER ==================== */
