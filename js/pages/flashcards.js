"use strict";

/* ==================== FLASHCARDS ==================== */
var fcLevel="ALL", fcDeck=[], fcIdx=0, fcSessionKnown=0, fcSessionUnknown=0;
function resetFc(level){
  fcLevel=level; fcIdx=0; fcSessionKnown=0; fcSessionUnknown=0;
  fcDeck=shuffle(VOCAB.filter(function(w){ return level==="ALL" || w[4]===level; }));
  $("fcChips").innerHTML=chipsHTML(level, "Tất cả");
  showFc();
}
function fcProgBar(){
  if($("fcProg")) return;
  var pc=$("fcCount");
  if(!pc || !pc.parentNode) return;
  var d=document.createElement("div");
  d.id="fcProg"; d.className="fc-prog";
  d.innerHTML='<div class="fc-prog-fill" id="fcProgFill"></div>';
  pc.parentNode.insertBefore(d, pc.nextSibling);
}
function showFc(){
  var card=$("fcCard");
  card.classList.remove("flipped");
  fcProgBar();
  if(!fcDeck.length){ $("fcWord").textContent="—"; $("fcCount").textContent="Không có thẻ nào."; var f0=$("fcProgFill"); if(f0) f0.style.width="0%"; return; }
  if(fcIdx>=fcDeck.length) fcIdx=0;
  if(fcIdx<0) fcIdx=fcDeck.length-1;
  var w=fcDeck[fcIdx];
  $("fcLvF").textContent=w[4]+" · "+TOPICS[w[5]];
  $("fcLvB").textContent=w[4]+" · "+TOPICS[w[5]];
  $("fcWord").innerHTML=wordDisplay(w);
  $("fcVi").textContent=w[3]+(w[2]?" · Số nhiều: "+w[2]:"");
  $("fcEx").textContent=w[6];
  $("fcExVi").textContent=w[7];
  var remain=fcDeck.length-fcIdx-1;
  $("fcCount").textContent="Thẻ "+(fcIdx+1)+"/"+fcDeck.length+" · Còn lại "+remain+" thẻ · Đã thuộc trong phiên: "+fcSessionKnown+" · Chưa biết: "+fcSessionUnknown;
  var fill=$("fcProgFill");
  if(fill) fill.style.width=Math.round((fcIdx+1)/fcDeck.length*100)+"%";
}
$("fcCard").addEventListener("click", function(){ $("fcCard").classList.toggle("flipped"); });
$("fcSpeak").addEventListener("click", function(e){ e.stopPropagation(); if(fcDeck.length) speakText(fcDeck[fcIdx][0]+" "+fcDeck[fcIdx][1]); });
$("fcPrev").addEventListener("click", function(){ fcIdx--; showFc(); });
$("fcNext").addEventListener("click", function(){ fcIdx++; showFc(); });
$("fcUnknown").addEventListener("click", function(){ fcSessionUnknown++; fcIdx++; showFc(); });
$("fcKnown").addEventListener("click", function(){
  if(!fcDeck.length) return;
  var idx=VOCAB.indexOf(fcDeck[fcIdx]);
  var p=prog();
  fcSessionKnown++;
  if(p.known.indexOf(idx)<0){ p.known.push(idx); p.xp+=2; ensureToday(p).words++; toast("Đã thuộc từ này · +2 XP"); }
  else toast("Từ này bạn đã thuộc rồi.");
  refreshStats();
  fcIdx++; showFc();
});
document.addEventListener("click", function(e){
  var c=e.target.closest("#fcChips [data-chip]");
  if(c) resetFc(c.getAttribute("data-chip"));
  var qc=e.target.closest("#quizChips [data-chip]");
  if(qc){ quizLevel=qc.getAttribute("data-chip"); $("quizChips").innerHTML=chipsHTML(quizLevel, "Tất cả các cấp độ"); }
});
