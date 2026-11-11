
    "use strict";
    
    /* ==================== GRAMMAR ==================== */
    function renderGrammar(){
      $("grammarGrid").innerHTML = GRAMMAR.map(function(g){
        return '<button class="card clickable" style="text-align:left; color:var(--ink)" data-grammar="' + g.id + '"><span class="tag">' + g.lv + '</span><h3 style="font-weight:800; font-size:1.05rem; margin-top:.55rem">' + esc(g.title) + '</h3><p style="color:var(--ink2); font-size:.92rem; margin-top:.3rem">' + esc(g.intro) + '</p><p style="font-weight:700; color:var(--red); margin-top:.6rem; font-size:.9rem">Xem chi tiết →</p></button>';
      }).join("");
    }
    document.addEventListener("click", function(e){
      var g = e.target.closest("[data-grammar]");
      if (g) openGrammar(g.getAttribute("data-grammar"));
      var d = e.target.closest("[data-dialogue]");
      if (d) openDialogue(d.getAttribute("data-dialogue"));
    });
    function openGrammar(id){
      var g = null;
      GRAMMAR.forEach(function(x){ if (x.id === id) g = x; });
      if (!g) return;
      if (!requireAccess(g.lv)) return;
      $("grLv").textContent = g.lv;
      $("grTitle").textContent = g.title;
      $("grIntro").textContent = g.intro;
      $("grRules").innerHTML = g.rules.map(function(r){ return "<li>" + esc(r) + "</li>"; }).join("");
      $("grExamples").innerHTML = phraseRowsHTML(g.ex);
      navTo("grammar-detail");
    }
