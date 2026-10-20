/* Ээлжийн амралтын тооцоолуур: Хөдөлмөрийн тухай хууль 99, 110; ХНХ сайдын А/191 журам */
(function () {
  "use strict";
  var form = document.getElementById("leave-form"), dataEl = document.getElementById("leave-data");
  if (!form || !dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var $ = function (id) { return document.getElementById(id); };
  function num(s) { var n = Number(String(s).replace(/,/g, "").replace(/[^\d.]/g, "")); return isFinite(n) ? n : 0; }
  function money(n) { return Math.round(n).toLocaleString("en-US") + "₮"; }
  function dec(n, p) { p = p == null ? 2 : p; var f = Math.pow(10, p); return (Math.round(n * f) / f).toLocaleString("en-US", { maximumFractionDigits: p }); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function radio(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ""; }
  function days(n) { return dec(n) + " өдөр"; }

  // Журмын 2.13: нийт ажилласан сараар
  function extraRow(m) {
    for (var i = 0; i < D.extra.length; i++) {
      var r = D.extra[i];
      if (m >= r.from && (r.to == null || m <= r.to)) return r;
    }
    return null;
  }
  function serviceText(m) {
    var y = Math.floor(m / 12), mo = m % 12;
    return (y ? y + " жил" : "") + (y && mo ? " " : "") + (mo || !y ? mo + " сар" : "");
  }

  var PERIOD_HINT = {
    year: "Ажлын нэг жилээр бүтэн тооцно (журмын 2.9).",
    months: "Ажлаас гарах, гэрээ дуусах үед ажилласан сард ногдох хоногийг тооцно (журмын 2.8).",
    days: "Улирлын, ажлын цагийг нэгтгэн боддог, бүтэн бус цагийн ажилтан. Цагийг " + D.day_hours + " цагийн ердийн ажлын өдөрт шилжүүлнэ (журмын 2.3, 2.10)."
  };

  function render() {
    var baseSel = $("lv-base").value, cond = radio("cond") || "normal", period = radio("period") || "year";
    $("lv-minor-field").hidden = baseSel !== "turn18";
    $("lv-pm-field").hidden = period !== "months";
    $("lv-pd-field").hidden = period !== "days";
    $("lv-hours-field").hidden = period === "days";
    $("lv-period-hint").textContent = PERIOD_HINT[period];

    // Үндсэн амралт (ХТХ 99.3, 99.4; журмын 2.4)
    var base, baseLabel = "Үндсэн амралт";
    if (baseSel === "turn18") {
      var mm = clamp(Math.floor(num($("lv-minor-months").value)), 0, 12);
      base = (D.base_special * mm + D.base_days * (12 - mm)) / 12;
      baseLabel = "Үндсэн амралт (" + D.base_special + "/12×" + mm + " + " + D.base_days + "/12×" + (12 - mm) + ")";
    } else base = Number(baseSel);

    // Нэмэгдэл амралт (ХТХ 99.5, 99.6; журмын 2.13)
    var svc = Math.floor(num($("lv-years").value)) * 12 + Math.floor(num($("lv-months").value));
    var row = extraRow(svc), extra = row ? row[cond] : 0;
    var annual = base + extra;

    // Тооцох хугацаа (журмын 2.8–2.10)
    var factor = 1, pLabel = "", pVal = "";
    if (period === "months") {
      var pm = clamp(Math.floor(num($("lv-pmonths").value)), 0, 12);
      factor = pm / 12;
      pLabel = "Ажилласан " + pm + " сард ногдох";
      pVal = "× " + pm + "/12";
    } else if (period === "days") {
      var q = num($("lv-pdays").value), byHours = $("lv-punit").value === "hours";
      var wd = byHours ? q / D.day_hours : q;
      factor = Math.min(1, wd / D.year_work_days);
      pLabel = byHours ? "Ажилласан " + dec(q) + " цаг = " + dec(wd) + " ажлын өдөр" : "Ажилласан " + dec(wd) + " ажлын өдөр";
      pVal = "× " + dec(wd) + "/" + D.year_work_days;
    }
    // Бүтэн бус цаг (журмын 2.3)
    var ratio = 1, h = num($("lv-hours").value);
    if (period !== "days" && h > 0 && h < D.day_hours) ratio = h / D.day_hours;

    var total = Math.round(annual * factor * ratio * 100) / 100;

    $("lv-r-base-label").textContent = baseLabel;
    $("lv-r-base").textContent = days(base);
    $("lv-r-extra-label").textContent = "Нэмэгдэл амралт (" + (cond === "abnormal" ? "хэвийн бус" : "хэвийн") + ", " + serviceText(svc) + ")";
    $("lv-r-extra").textContent = days(extra);
    $("lv-r-annual").textContent = days(annual);
    $("lv-row-period").hidden = period === "year";
    $("lv-r-period-label").textContent = pLabel;
    $("lv-r-period").textContent = pVal;
    $("lv-row-pt").hidden = ratio === 1;
    $("lv-r-pt-label").textContent = "Бүтэн бус цаг (" + dec(h) + "/" + D.day_hours + " цаг)";
    $("lv-r-pt").textContent = "× " + dec(ratio, 4);
    $("lv-r-all").textContent = dec(total) + " ажлын өдөр";
    $("lv-rate").textContent = "Ажлын бүтэн жилд " + dec(annual) + " өдөр: сард " + dec(annual / 12) + ", ажлын нэг өдөрт " + dec(annual / D.year_work_days, 4) + " өдөр ногдоно (журмын 2.11, 12 сар × 21 өдөр).";

    // Амралтын цалин (журмын 3.4; ХТХ 110.2)
    var pay = num($("lv-pay").value), worked = num($("lv-days").value), x = $("lv-nottaken").checked;
    var daily = worked > 0 ? pay / worked : 0, leavePay = daily * total, out = x ? leavePay * D.not_taken_x : leavePay;
    var ok = daily > 0;
    $("lv-r-daily").textContent = ok ? money(daily) : "—";
    $("lv-r-pay").textContent = ok ? money(leavePay) : "—";
    $("lv-row-x").hidden = !x;
    $("lv-r-x").textContent = ok ? "× " + D.not_taken_x : "—";
    $("lv-r-out").textContent = ok ? money(out) : "—";
    $("lv-total").textContent = ok && total > 0 ? money(out) : "—";
    $("lv-days-sum").textContent = dec(total) + " ажлын өдөр" + (ok ? " × " + money(daily) + (x ? " × " + D.not_taken_x : "") : "");
    $("lv-net-link").href = "/tootsooluur/" + (ok && out > 0 ? "?amount=" + Math.round(out) : "");

    // Лавлах хүснэгтэд тухайн мөрийг тодруулах
    var col = cond === "abnormal" ? 2 : 1;
    Array.prototype.forEach.call(document.querySelectorAll("#lv-ref tbody tr"), function (tr) {
      var from = Number(tr.getAttribute("data-from")), to = tr.getAttribute("data-to");
      var on = svc >= from && (to === "" || svc <= Number(to));
      tr.classList.toggle("is-current", on);
      Array.prototype.forEach.call(tr.children, function (td, i) { td.classList.toggle("is-cell", on && i === col); });
    });
  }

  function fmtMoney(el) {
    var raw = el.value, fromEnd = raw.length - (el.selectionStart == null ? raw.length : el.selectionStart);
    var out = raw.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (out !== raw) { el.value = out; var p = Math.max(0, out.length - fromEnd); try { el.setSelectionRange(p, p); } catch (e) {} }
  }
  function keep(el, re) { var v = el.value.replace(re, ""); if (v !== el.value) el.value = v; }

  form.addEventListener("input", function (e) {
    var el = e.target;
    if (el.id === "lv-pay") fmtMoney(el);
    else if (el.id === "lv-hours" || el.id === "lv-pdays") keep(el, /[^\d.]/g);
    else if (el.tagName === "INPUT" && el.type === "text") keep(el, /[^\d]/g);
    render();
  });
  form.addEventListener("change", render);
  render();
})();
