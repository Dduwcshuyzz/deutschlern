
    "use strict";
    
    /* ==================== VOCAB ==================== */
    function buildFilters(){
      $("vocabLevel").innerHTML = '<option value="ALL">Tất cả cấp độ</option>' + LEVEL_IDS.map(function(lv){ return '<option value="' + lv + '">' + lv + "</option>"; }).join("");
      $("vocabTopic").innerHTML = '<option value="ALL">Tất cả chủ đề</option>' + Object.keys(TOPICS).map(function(k){ return '<option value="' + k + '">' + esc(TOPICS[k]) + "</option>"; }).join("");
      renderCourses();
      renderVocab();
      renderGrammar();
      renderDialogues();
      $("quizChips").innerHTML = chipsHTML(quizLevel, "Tất cả cấp độ");
      $("examChips").innerHTML = chipsHTML(examLevel, "Tất cả cấp độ");
    }
    function renderVocab(){
      var q = $("vocabSearch").value.trim().toLowerCase();
      var lv = $("vocabLevel").value, tp = $("vocabTopic").value;
      var list = VOCAB.filter(function(w){
        if (lv !== "ALL" && w[4] !== lv) return false;
        if (tp !== "ALL" && w[5] !== tp) return false;
        if (q && w[0].toLowerCase().indexOf(q) < 0 && w[3].toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
      $("vocabMeta").textContent = "Tìm thấy " + list.length + " từ" + (lv !== "ALL" ? " ở cấp " + lv : "") + ". Đã thuộc " + prog().known.length + "/" + VOCAB.length + " từ trong toàn bộ kho.";
      $("vocabGrid").innerHTML = list.length ? list.map(function(w){ return wordCardHTML(w, true); }).join("") : '<p style="color:var(--ink2)">Không có từ nào khớp bộ lọc. Thử từ khóa khác nhé.</p>';
    }
    $("vocabSearch").addEventListener("input", renderVocab);
    $("vocabLevel").addEventListener("change", renderVocab);
    $("vocabTopic").addEventListener("change", renderVocab);
