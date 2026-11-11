
    "use strict";
    
    /* ==================== DIALOGUES ==================== */
    function renderDialogues(){
      $("dlgList").innerHTML = DIALOGUES.map(function(d, i){
        return '<button class="lesson-row" data-dialogue="' + d.id + '"><span class="lesson-num">' + (i + 1) + '</span><span style="flex:1; min-width:0"><b>' + esc(d.title) + "</b><span>" + d.lv + " · " + esc(d.scene) + "</span></span></button>";
      }).join("");
    }
    function openDialogue(id){
      var d = null;
      DIALOGUES.forEach(function(x){ if (x.id === id) d = x; });
      if (!d) return;
      if (!requireAccess(d.lv)) return;
      currentDialogue = d;
      $("dgLv").textContent = d.lv;
      $("dgTitle").textContent = d.title;
      $("dgScene").textContent = d.scene;
      $("dgLines").innerHTML = d.lines.map(function(ln){
        return '<div class="dlg-line"><span class="dlg-who">' + esc(ln[0]) + '</span><div style="flex:1; min-width:0"><div class="de">' + esc(ln[1]) + '</div><div class="vi">' + esc(ln[2]) + '</div></div><button class="icon-btn" data-speak="' + esc(ln[1]) + '" title="Nghe câu này">' + SPEAK_SVG + "</button></div>";
      }).join("");
      navTo("dialogue-detail");
    }
    $("btnPlayAll").addEventListener("click", function(){
      if (!currentDialogue) return;
      var lines = currentDialogue.lines.map(function(l){ return l[1]; });
      var i = 0;
      (function next(){
        if (i >= lines.length) return;
        speakText(lines[i], function(){ i++; setTimeout(next, 250); });
      })();
    });
