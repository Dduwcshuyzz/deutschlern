"use strict";

/* ==================== VOCAB ==================== */
function buildFilters(){
  $("vocabLevel").innerHTML = '<option value="ALL">Tất cả cấp độ</option>' + LEVEL_IDS.map(function(lv){ return '<option value="' + lv + '">' + lv + "</option>"; }).join("");
  $("vocabTopic").innerHTML = '<option value="ALL">Tất cả chủ đề</option>' + Object.keys(TOPICS).map(function(k){ return '<option value="' + k + '">' + esc(TOPICS[k]) + "</option>"; }).join("");
  buildStatusFilter();
  renderCourses();
  renderVocab();
  renderGrammar();
  renderDialogues();
  $("quizChips").innerHTML = chipsHTML(quizLevel, "Tất cả cấp độ");
  $("examChips").innerHTML = chipsHTML(examLevel, "Tất cả cấp độ");
}
/* Lọc theo trạng thái thật của người dùng:
   - Đã nhớ: có trong danh sách known thật.
   - Đang học: từng làm sai (danh sách lỗi sai thật) và chưa thuộc.
   - Mới: chưa thuộc và chưa từng làm sai. */
function vocabSets(){
  var p = prog();
  var knownSet = {}, learnSet = {};
  (p.known || []).forEach(function(i){ knownSet[i] = 1; });
  (p.mistakes || []).forEach(function(m){ if (m.kind === "vocab" && !knownSet[m.idx]) learnSet[m.idx] = 1; });
  return { known: knownSet, learning: learnSet };
}
function buildStatusFilter(){
  if ($("vocabStatus")) return;
  var lv = $("vocabLevel");
  if (!lv || !lv.parentNode || !lv.parentNode.parentNode) return;
  var wrap = document.createElement("div");
  wrap.className = "sel";
  wrap.innerHTML = '<select id="vocabStatus"><option value="ALL">Trạng thái: Tất cả</option><option value="known">Đã nhớ</option><option value="learning">Đang học</option><option value="new">Mới</option></select>';
  lv.parentNode.parentNode.appendChild(wrap);
  $("vocabStatus").addEventListener("change", renderVocab);
}
function ensureVocabCounts(){
  if ($("vocabCounts")) return;
  var host = $("vocabGrid");
  if (!host || !host.parentNode) return;
  var d = document.createElement("div");
  d.id = "vocabCounts"; d.className = "v-counts";
  host.parentNode.insertBefore(d, host);
}
function renderVocab(){
  var q = $("vocabSearch").value.trim().toLowerCase();
  var lv = $("vocabLevel").value, tp = $("vocabTopic").value;
  var st = $("vocabStatus") ? $("vocabStatus").value : "ALL";
  var sets = vocabSets();
  var list = VOCAB.filter(function(w, idx){
    if (lv !== "ALL" && w[4] !== lv) return false;
    if (tp !== "ALL" && w[5] !== tp) return false;
    if (q && w[0].toLowerCase().indexOf(q) < 0 && w[1].toLowerCase().indexOf(q) < 0 && (w[2] || "").toLowerCase().indexOf(q) < 0 && w[3].toLowerCase().indexOf(q) < 0) return false;
    if (st === "known" && !sets.known[idx]) return false;
    if (st === "learning" && !sets.learning[idx]) return false;
    if (st === "new" && (sets.known[idx] || sets.learning[idx])) return false;
    return true;
  });
  $("vocabMeta").textContent = "Tìm thấy " + list.length + " từ" + (lv !== "ALL" ? " ở cấp " + lv : "") + ". Đã thuộc " + prog().known.length + "/" + VOCAB.length + " từ trong toàn bộ kho.";
  ensureVocabCounts();
  var kc = Object.keys(sets.known).length, lc = Object.keys(sets.learning).length;
  var nc = VOCAB.length - kc - lc;
  var vc = $("vocabCounts");
  if (vc) vc.innerHTML = '<span class="v-count">Tất cả <b>' + VOCAB.length + '</b></span><span class="v-count">Đã nhớ <b>' + kc + '</b></span><span class="v-count">Đang học <b>' + lc + '</b></span><span class="v-count">Mới <b>' + nc + '</b></span><span class="v-count">Đang hiển thị <b>' + list.length + '</b></span>';
  $("vocabGrid").innerHTML = list.length ? list.map(function(w){ return wordCardHTML(w, true); }).join("") : '<p style="color:var(--ink2)">Không có từ nào khớp bộ lọc. Thử từ khóa khác nhé.</p>';
}
$("vocabSearch").addEventListener("input", renderVocab);
$("vocabLevel").addEventListener("change", renderVocab);
$("vocabTopic").addEventListener("change", renderVocab);
