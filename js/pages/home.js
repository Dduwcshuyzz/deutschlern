"use strict";

function refreshStats(){
  if (!currentUser) return;
  sbSaveUser(currentUser);
  var p = prog();
  $("xpVal").textContent = p.xp + " XP";
  $("stXp").textContent = p.xp;
  $("stLessons").textContent = p.lessons.length + "/" + LESSONS.length;
  $("stWords").textContent = p.known.length;
  $("stQuiz").textContent = p.quizPlays ? p.quizBest + "/10" : "—";
}
/* Thang XP cho cấp độ (mốc tuyệt đối, XP là dữ liệu thật của người dùng). */
var XP_LEVELS = [0, 100, 250, 450, 700, 1000, 1500];
function xpLevelInfo(xp){
  var i = 0;
  while (i < XP_LEVELS.length - 1 && xp >= XP_LEVELS[i + 1]) i++;
  var cur = XP_LEVELS[i];
  var next = i < XP_LEVELS.length - 1 ? XP_LEVELS[i + 1] : null;
  return { idx: i, name: LEVELS[i].id, cur: cur, next: next, pct: next ? Math.min(100, Math.round((xp - cur) / (next - cur) * 100)) : 100, remain: next ? next - xp : 0 };
}
/* Ghi ngày có hoạt động học thật (XP/bài/từ/trắc nghiệm trong ngày) để tính số ngày đã học và streak.
   Các ngày trước khi có tính năng này chưa được ghi nên hiển thị 0/chưa có, không bịa số liệu. */
function recordActiveDay(p){
  var t = p.today || ensureToday(p);
  if (!t || !(t.xp > 0 || t.lessons > 0 || t.words > 0 || t.quiz > 0)) return;
  var key = t.key;
  if (!key) { var d = new Date(); key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  if (!Array.isArray(p.days)) p.days = [];
  if (p.days.indexOf(key) < 0) { p.days.push(key); if (typeof saveProgress === "function") saveProgress(); }
}
function streakInfo(p){
  var days = (p.days || []).slice().sort();
  var set = {}; days.forEach(function(d){ set[d] = 1; });
  function keyOf(d){ return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  var today = new Date(); var cur = new Date(today);
  if (!set[keyOf(cur)]) cur.setDate(cur.getDate() - 1);
  var streak = 0;
  while (set[keyOf(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }
  var monday = new Date(today); var dow = (monday.getDay() + 6) % 7; monday.setDate(monday.getDate() - dow);
  var weekDays = 0;
  for (var k = 0; k < 7; k++){ var dd = new Date(monday); dd.setDate(monday.getDate() + k); if (set[keyOf(dd)]) weekDays++; }
  return { total: days.length, streak: streak, weekDays: weekDays };
}
function ensureDashHero(){
  if ($("dashHero")) return;
  var st = document.querySelector(".stat-grid");
  if (!st || !st.parentNode) return;
  var d = document.createElement("div");
  d.id = "dashHero"; d.className = "dash-hero";
  d.innerHTML = '<div class="xp-ring"><svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" fill="none" stroke="#DEE7F5" stroke-width="9"/><circle id="xpRingArc" cx="48" cy="48" r="40" fill="none" stroke="#D5001C" stroke-width="9" stroke-linecap="round" stroke-dasharray="251.3" stroke-dashoffset="251.3" transform="rotate(-90 48 48)"/><text id="xpRingPct" x="48" y="46" text-anchor="middle" font-size="16" font-weight="800" fill="#0D1524"></text><text x="48" y="63" text-anchor="middle" font-size="10" fill="#4D5B73">cấp độ</text></svg><div class="xp-lbl" id="xpRingLbl"></div></div><div class="dash-hero-info"><div class="df-kicker">Bảng điều khiển</div><h3 id="dashHeroTitle"></h3><p id="dashHeroSub"></p><div class="pill-row" id="dashPills"></div></div>';
  st.parentNode.insertBefore(d, st);
}
function renderAchStrip(p, st){
  var host = $("lvlRows");
  if (!host) return;
  var card = host.closest ? host.closest(".card") : host.parentNode;
  if (!card || !card.parentNode) return;
  var old = $("achStrip");
  if (old) old.remove();
  var done = p.lessons.length, known = p.known.length, bestQ = p.quizBest || 0, bestE = p.examBest || 0;
  var items = [
    { ic: "📚", v: done + "/" + LESSONS.length, s: done ? "Bài học đã xong" : "Chưa xong bài nào", on: done > 0 },
    { ic: "🧠", v: known + "/" + VOCAB.length, s: known ? "Từ đã thuộc" : "Chưa thuộc từ nào", on: known > 0 },
    { ic: "✏️", v: p.quizPlays ? bestQ + "/10" : "—", s: p.quizPlays ? "Trắc nghiệm cao nhất" : "Chưa làm trắc nghiệm", on: p.quizPlays > 0 },
    { ic: "🏆", v: p.examPlays ? bestE + "/15" : "—", s: p.examPlays ? "Thi thử cao nhất" : "Chưa thi thử", on: p.examPlays > 0 },
    { ic: "🔥", v: st.streak + " ngày", s: st.streak ? "Streak học liên tiếp" : "Chưa có streak", on: st.streak > 0 },
    { ic: "📅", v: st.total + " ngày", s: st.total ? "Ngày đã học" : "Chưa ghi nhận ngày học", on: st.total > 0 }
  ];
  var d = document.createElement("div");
  d.id = "achStrip";
  d.innerHTML = '<div class="df-kicker" style="margin-top:14px">Huy hiệu &amp; thành tích</div><div class="df-title">Thành tích của bạn</div><div class="ach-strip">' + items.map(function(it){
    return '<div class="ach-badge' + (it.on ? "" : " locked") + '"><span class="ic">' + it.ic + '</span><b>' + it.v + '</b><span>' + it.s + '</span></div>';
  }).join("") + '</div>';
  card.parentNode.insertBefore(d, card.nextSibling);
}
function renderWeekRing(st){
  var host = $("todayMsg");
  if (!host) return;
  var old = $("weekRing");
  if (old) old.remove();
  var pct = Math.round(st.weekDays / 7 * 100);
  var d = document.createElement("div");
  d.id = "weekRing"; d.className = "week-ring";
  d.innerHTML = '<div><div class="wr-num">' + st.weekDays + '/7 ngày</div><div class="wr-lbl">Mục tiêu tuần — số ngày đã học trong tuần này</div></div><div style="flex:1;min-width:140px"><div class="mini-prog green"><i style="width:' + pct + '%"></i></div><div class="wr-lbl" style="margin-top:4px">' + (st.weekDays >= 7 ? "Hoàn thành mục tiêu tuần! 🎉" : "Còn " + (7 - st.weekDays) + " ngày nữa để hoàn thành tuần này.") + '</div></div>';
  host.parentNode.insertBefore(d, host.nextSibling);
}
function renderDashboard(){
  refreshStats();
  var p = prog();
  recordActiveDay(p);
  var st = streakInfo(p);
  var xp = p.xp || 0;
  var info = xpLevelInfo(xp);
  ensureDashHero();
  var arc = $("xpRingArc"); if (arc) arc.style.strokeDashoffset = (251.3 * (1 - info.pct / 100)).toFixed(1);
  var pctEl = $("xpRingPct"); if (pctEl) pctEl.textContent = info.pct + "%";
  var lbl = $("xpRingLbl"); if (lbl) lbl.textContent = info.next ? ("Cấp " + info.name + " → " + LEVELS[info.idx + 1].id) : ("Đã đạt " + info.name);
  var ht = $("dashHeroTitle"); if (ht) ht.textContent = info.next ? ("Còn " + info.remain + " XP nữa để lên " + LEVELS[info.idx + 1].id) : ("Bạn đã đạt cấp " + info.name);
  var hs = $("dashHeroSub"); if (hs) hs.textContent = info.next ? ("Bạn đang ở cấp " + info.name + " với " + xp + " XP. Hoàn thành bài học, thẻ học và trắc nghiệm để tích thêm XP.") : ("Bạn đã đạt cấp cao nhất với " + xp + " XP — giữ vững phong độ nhé.");
  var pills = $("dashPills");
  if (pills) pills.innerHTML = '<span class="pill hot">🔥 Streak ' + st.streak + ' ngày</span><span class="pill">📅 Đã học ' + st.total + ' ngày</span><span class="pill ok">🎯 Tuần này: ' + st.weekDays + '/7 ngày</span>';
  var next = null;
  for (var i = 0; i < LESSONS.length; i++){ if (p.lessons.indexOf(LESSONS[i].id) < 0) { next = LESSONS[i]; break; } }
  currentLesson = next ? next.id : null;
  if (next) {
    $("contTitle").textContent = next.lv + " · " + next.title;
    $("contSub").textContent = next.goal + " · Đã xong " + p.lessons.length + "/" + LESSONS.length + " bài học";
    $("btnContinue").textContent = "Học bài này";
  } else {
    $("contTitle").textContent = "Bạn đã học hết 18 bài!";
    $("contSub").textContent = "Tuyệt vời. Hãy ôn flashcard hoặc làm trắc nghiệm để giữ phong độ nhé.";
    $("btnContinue").textContent = "Ôn tập ngay";
    currentLesson = null;
    $("btnContinue").onclick = function(){ navTo("flashcards"); };
  }
  if (next) $("btnContinue").onclick = function(){ openLesson(next.id); };
  $("lvlRows").innerHTML = LEVELS.map(function(l){
    var total = LESSONS.filter(function(x){ return x.lv === l.id; }).length;
    var done = LESSONS.filter(function(x){ return x.lv === l.id && p.lessons.indexOf(x.id) >= 0; }).length;
    var pct = total ? Math.round(done / total * 100) : 0;
    return '<div class="lvl-row"><span class="lv">' + l.id + '</span><div class="bar-wrap"><span>' + done + "/" + total + " bài · " + esc(l.name) + '</span><div class="progress"><i data-w="' + pct + '" style="width:0%"></i></div></div><span class="pct">' + pct + "%</span></div>";
  }).join("");
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    document.querySelectorAll("#lvlRows .progress i").forEach(function(b){ b.style.width = b.getAttribute("data-w") + "%"; });
  }); });
  renderToday();
  renderDashExtras();
  renderAchStrip(p, st);
  renderWeekRing(st);
}
/* ==================== DASHBOARD EXTRAS ==================== */
function dayIndex(){ return Math.floor(Date.now() / 86400000); }
function renderToday(){
  if (!currentUser) return;
  var p = prog();
  var t = ensureToday(p);
  var d = new Date();
  try { $("todayDate").textContent = d.toLocaleDateString("vi-VN", { weekday:"long", day:"numeric", month:"numeric", year:"numeric" }); }
  catch (e) { $("todayDate").textContent = d.toLocaleDateString(); }
  var items = [
    { label:"Hoàn thành 1 bài học", hint:"Vào mục Khóa học và học xong 1 bài bất kỳ", cur: Math.min(t.lessons, 1), max: 1, unit:"bài" },
    { label:"Thuộc thêm 5 từ vựng", hint:"Đánh dấu đã thuộc ở Từ vựng hoặc Flashcard", cur: Math.min(t.words, 5), max: 5, unit:"từ" },
    { label:"Làm 1 lượt trắc nghiệm hoặc thi thử", hint:"Vào mục Trắc nghiệm và làm hết 1 lượt", cur: Math.min(t.quiz, 1), max: 1, unit:"lượt" }
  ];
  var pct = Math.round((items[0].cur / 1 + items[1].cur / 5 + items[2].cur / 1) / 3 * 100);
  $("todayPct").textContent = pct + "%";
  $("planList").innerHTML = items.map(function(it, i){
    var done = it.cur >= it.max;
    return '<li class="plan-item' + (done ? " done" : "") + '"><span class="plan-ic">' + (done ? CHECK_SVG : String(i + 1)) + '</span><span class="tx"><b>' + it.label + "</b><span>" + it.hint + '</span></span><span class="plan-n">' + it.cur + "/" + it.max + " " + it.unit + "</span></li>";
  }).join("");
  $("todayMsg").textContent = pct >= 100 ? "Hoàn thành kế hoạch hôm nay rồi — giỏi lắm! Mai quay lại giữ nhịp nhé." : pct >= 50 ? "Đang đi được hơn nửa đường rồi, cố thêm chút nữa là xong kế hoạch hôm nay." : "Bắt đầu bằng một việc nhỏ thôi: học 1 bài hoặc thuộc 5 từ là đã tiến bộ rồi.";
  var bar = $("todayBar");
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ bar.style.width = pct + "%"; }); });
}
function renderDashExtras(){
  if (!currentUser) return;
  var p = prog();
  /* Word of the day: from the user's target level when possible */
  var pool = VOCAB.filter(function(w){ return w[4] === currentUser.target; });
  if (!pool.length) pool = VOCAB;
  var w = pool[dayIndex() % pool.length];
  var wIdx = VOCAB.indexOf(w);
  var wKnown = p.known.indexOf(wIdx) >= 0;
  $("wotdBody").innerHTML =
    '<div class="wotd-word">' + wordDisplay(w) + "</div>" +
    (w[2] ? '<p class="wotd-pl">Số nhiều: ' + esc(w[2]) + "</p>" : "") +
    '<p class="wotd-vi">' + esc(w[3]) + ' <span class="tag" style="margin-left:.3rem">' + w[4] + "</span></p>" +
    '<p class="wotd-ex"><b>' + esc(w[6]) + "</b><br>" + esc(w[7]) + "</p>" +
    '<div class="wotd-actions"><button class="icon-btn" data-speak="' + esc(w[0]) + '" title="Nghe phát âm">' + SPEAK_SVG + '</button>' +
    '<button class="btn btn-sm ' + (wKnown ? "btn-gold" : "btn-ghost") + '" data-known="' + wIdx + '">' + (wKnown ? "Đã thuộc ✓" : "Đánh dấu đã thuộc") + '</button>' +
    '<button class="btn btn-sm btn-ghost" data-nav="vocab">Mở kho từ vựng</button></div>';
  /* Grammar spotlight of the day */
  var g = GRAMMAR[dayIndex() % GRAMMAR.length];
  $("spotBody").innerHTML =
    '<p class="spot-title">' + esc(g.title) + ' <span class="tag" style="margin-left:.3rem">' + g.lv + "</span></p>" +
    '<p class="spot-intro">' + esc(g.intro) + "</p>" +
    (g.ex && g.ex[0] ? '<div class="spot-ex"><b>' + esc(g.ex[0][0]) + "</b><span>" + esc(g.ex[0][1]) + "</span></div>" : "") +
    '<button class="btn btn-sm btn-red" style="margin-top:.8rem" data-grammar="' + g.id + '">Học chủ điểm này →</button>';
  /* Next lessons in the path */
  var rest = LESSONS.filter(function(l){ return p.lessons.indexOf(l.id) < 0; }).slice(0, 3);
  $("nextList").innerHTML = rest.length ? rest.map(function(l){
    var num = LESSONS.indexOf(l) + 1;
    var locked = !canAccess(l.lv);
    return '<button class="next-item" data-lesson="' + l.id + '"><span class="next-num">' + num + '</span><span class="tx"><b>' + esc(l.title) + "</b><span>" + l.lv + " · " + esc(l.goal) + (locked ? " · Chưa mở khóa" : "") + '</span></span><span class="arr">→</span></button>';
  }).join("") : '<p class="next-empty">Bạn đã hoàn thành toàn bộ 18 bài trong lộ trình. Hãy chuyển sang ôn tập và thi thử để giữ phong độ nhé.</p>';
}
