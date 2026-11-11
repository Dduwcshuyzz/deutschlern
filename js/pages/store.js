
    "use strict";
    
    /* ==================== STORE ==================== */
    var pendingBuy = null;
    function buyLabel(item){
      if (!item) return "";
      if (item.type === "plan") { var pl = PLANS.filter(function(x){ return x.id === item.id; })[0]; return pl ? "Gói " + pl.name : ""; }
      var lv = LEVELS.filter(function(x){ return x.id === item.id; })[0];
      return "Khóa " + item.id + (lv ? " — " + lv.name : "");
    }
    function buyPrice(item){
      if (!item) return 0;
      if (item.type === "plan") { var pl = PLANS.filter(function(x){ return x.id === item.id; })[0]; return pl ? pl.price : 0; }
      return COURSE_PRICE[item.id] || 0;
    }
    function renderStore(){
      if (!currentUser) return;
      if (!currentUser.orders) currentUser.orders = [];
      if (!currentUser.owned) currentUser.owned = [];
      var cur = PLANS.filter(function(x){ return x.id === userPlan(); })[0];
      $("storePlanName").textContent = cur ? cur.name : "Miễn phí";
      $("planGrid").innerHTML = PLANS.map(function(pl){
        var isCur = pl.id === userPlan();
        var lower = planRank(pl.id) < planRank(userPlan());
        var btn = isCur ? '<span class="cur-badge">Gói bạn đang dùng</span>'
          : lower ? '<button class="btn btn-ghost" disabled>Gói thấp hơn gói hiện tại</button>'
          : pl.id === "free" ? '<button class="btn btn-ghost" disabled>Gói mặc định</button>'
          : '<button class="btn btn-red" data-buy-plan="' + pl.id + '">Nâng cấp lên ' + pl.name + "</button>";
        return '<div class="plan-card' + (pl.hot ? " hot" : "") + '"><span class="pname">' + pl.name + (pl.hot ? ' <span class="tag red" style="margin-left:.3rem">Phổ biến</span>' : "") + '</span><div class="price">' + (pl.price ? fmtVND(pl.price) : "0đ") + (pl.per ? "<small>" + pl.per + "</small>" : "") + "</div><ul>" + pl.feats.map(function(f){ return "<li>" + f + "</li>"; }).join("") + "</ul>" + btn + "</div>";
      }).join("");
      $("shopGrid").innerHTML = LEVELS.map(function(l){
        var nl = LESSONS.filter(function(x){ return x.lv === l.id; }).length;
        var nw = VOCAB.filter(function(x){ return x[4] === l.id; }).length;
        var ownedIt = currentUser.owned.indexOf(l.id) >= 0;
        var openByPlan = !ownedIt && canAccess(l.id);
        var btn = ownedIt ? '<button class="btn btn-gold" disabled>Đã mua — đã mở khóa</button>'
          : openByPlan ? '<button class="btn btn-ghost" disabled>Đã mở bằng gói ' + (cur ? cur.name : "") + "</button>"
          : '<button class="btn btn-red" data-buy-course="' + l.id + '">Mua khóa ' + l.id + "</button>";
        return '<div class="shop-card"><span class="lv">' + l.id + "<small>" + esc(l.name) + '</small></span><p>' + nl + " bài học · " + nw + ' từ vựng · ngữ pháp &amp; hội thoại cấp ' + l.id + '. ' + esc(l.can) + '</p><div class="price">' + fmtVND(COURSE_PRICE[l.id]) + ' <small>mua một lần, sở hữu trọn đời</small></div>' + btn + "</div>";
      }).join("");
      var ck = $("checkoutCard");
      if (pendingBuy) {
        ck.classList.remove("hidden");
        $("ckTitle").textContent = buyLabel(pendingBuy);
        var pr = buyPrice(pendingBuy);
        $("ckPrice").textContent = fmtVND(pr) + (pendingBuy.type === "plan" ? " / tháng đầu" : " (một lần)");
        var code = pendingBuy.type === "plan" ? "GOI" + pendingBuy.id.toUpperCase() : "KHOA" + pendingBuy.id;
        $("ckNote").textContent = "DF " + (currentUser.username || currentUser.email) + " " + code;
      } else ck.classList.add("hidden");
      var ol = $("orderList");
      if (!currentUser.orders.length) {
        ol.innerHTML = '<p style="color:var(--ink2); margin-top:.4rem">Chưa có đơn nào. Chọn một gói hoặc một khóa học ở trên để bắt đầu.</p>';
      } else {
        ol.innerHTML = currentUser.orders.map(function(o, i){
          var st = o.status === "active" ? '<span class="st" style="color:var(--ok)">Đã kích hoạt</span>' : '<span class="st" style="color:var(--gold)">Chờ xác nhận</span>';
          var confirmBtn = o.status !== "active" ? '<button class="btn btn-sm btn-gold" data-confirm-order="' + i + '">Chủ web: xác nhận đã nhận tiền &amp; kích hoạt</button>' : "";
          return '<div class="order-row"><span><b>' + esc(o.label) + "</b> · " + fmtVND(o.price) + "</span>" + st + confirmBtn + "</div>";
        }).join("");
      }
    }
    document.addEventListener("click", function(e){
      var bp = e.target.closest("[data-buy-plan]");
      if (bp) { pendingBuy = { type:"plan", id: bp.getAttribute("data-buy-plan") }; renderStore(); $("checkoutCard").scrollIntoView({ behavior:"smooth", block:"start" }); return; }
      var bc = e.target.closest("[data-buy-course]");
      if (bc) { pendingBuy = { type:"course", id: bc.getAttribute("data-buy-course") }; renderStore(); $("checkoutCard").scrollIntoView({ behavior:"smooth", block:"start" }); return; }
      var cf = e.target.closest("[data-confirm-order]");
      if (cf && currentUser) {
        var o = currentUser.orders[parseInt(cf.getAttribute("data-confirm-order"), 10)];
        if (o && o.status !== "active") {
          o.status = "active";
          if (o.kind === "plan") currentUser.plan = o.refId;
          else if (currentUser.owned.indexOf(o.refId) < 0) currentUser.owned.push(o.refId);
          toast("Đã kích hoạt: " + o.label + ". Nội dung tương ứng đã mở khóa!");
          refreshStats();
          renderStore();
        }
      }
    });
    $("btnCkCancel").addEventListener("click", function(){ pendingBuy = null; renderStore(); });
    $("btnCkDone").addEventListener("click", function(){
      if (!pendingBuy || !currentUser) return;
      currentUser.orders.push({
        label: buyLabel(pendingBuy), price: buyPrice(pendingBuy),
        kind: pendingBuy.type, refId: pendingBuy.id, status: "pending"
      });
      pendingBuy = null;
      toast("Đã tạo đơn. Gói/khóa sẽ kích hoạt khi chủ web xác nhận đã nhận tiền.");
      refreshStats();
      renderStore();
    });
