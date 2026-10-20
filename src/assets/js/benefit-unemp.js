/* Ажилгүйдлийн тэтгэмжийн тооцоолуур: НДСОТТХ 9–11; НДЕГ «Тэтгэмж бодох заавар» 7-р бүлэг */
(function () {
  "use strict";
  var form = document.getElementById("ub-form"), dataEl = document.getElementById("benefit-data");
  if (!form || !dataEl) return;
  var B = JSON.parse(dataEl.textContent), U = B.unemployment;
  var $ = function (id) { return document.getElementById(id); };
  function num(s) { var n = Number(String(s).replace(/,/g, "").replace(/[^\d.]/g, "")); return isFinite(n) ? n : 0; }
  function money(n, d) { d = d && Math.abs(n - Math.round(n)) >= 0.005 ? d : 0; return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) + "₮"; }
  function radio(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ""; }
  function minWage(dateStr) {
    var w = B.min_wage[0].amount;
    B.min_wage.forEach(function (m) { if (dateStr >= m.from) w = m.amount; });
    return w;
  }
  function rateFor(m) {
    for (var i = 0; i < U.rates.length; i++) { var r = U.rates[i]; if (m >= r.from && (r.to == null || m <= r.to)) return r.rate; }
    return 0;
  }
  function regime() { var k = radio("regime"); return U.regimes.filter(function (r) { return r.key === k; })[0] || U.regimes[0]; }
  function fmtMoney(el) {
    var raw = el.value, fromEnd = raw.length - (el.selectionStart == null ? raw.length : el.selectionStart);
    var out = raw.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (out !== raw) { el.value = out; var p = Math.max(0, out.length - fromEnd); try { el.setSelectionRange(p, p); } catch (e) {} }
  }

  // Сар бүрийн цалингийн нүднүүд (9 эсвэл 12)
  var grid = $("ub-mgrid"), saved = U.example_months.slice();
  function buildGrid(n) {
    var cur = Array.prototype.map.call(grid.querySelectorAll("input"), function (i) { return i.value; });
    cur.forEach(function (v, i) { saved[i] = v === "" ? "" : num(v); });
    if (grid.children.length === n) return;
    grid.innerHTML = "";
    for (var i = 0; i < n; i++) {
      var lab = document.createElement("label"), sp = document.createElement("span"), inp = document.createElement("input");
      lab.className = "calc-month";
      sp.textContent = (i + 1) + "-р сар";
      inp.className = "calc-input"; inp.type = "text"; inp.inputMode = "numeric"; inp.autocomplete = "off";
      inp.setAttribute("data-m", "1");
      var v = saved[i];
      inp.value = v === "" || v == null ? "" : Number(v).toLocaleString("en-US");
      lab.appendChild(sp); lab.appendChild(inp); grid.appendChild(lab);
    }
  }

  function render() {
    var R = regime(), own = radio("reason") === "own", byMonths = radio("wmode") === "months";
    var n = R.avg_months, mw = minWage(R.wage_date), cap = mw * B.cap_x.compulsory;
    buildGrid(n);
    $("ub-regime-hint").textContent = R.key === "2026"
      ? "Одоо мөрдөж буй: сүүлийн 9 сарын дундаж цалин, ажлын 76 өдөр."
      : "2027.01.01-ээс: сүүлийн 12 сарын дундаж цалин, өөрийн хүсэлтээр гарсан бол ажлын 55 өдөр.";
    $("ub-svc-hint").textContent = "24 сараас доошгүй, үүнээс сүүлийн " + R.continuous_months + " сар тасралтгүй байх ёстой (хуулийн 9.1).";
    $("ub-avg-label").textContent = "Сүүлийн " + n + " сарын дундаж цалин, ₮";
    $("ub-mlabel").textContent = "Сүүлийн " + n + " сарын цалин, ₮";
    $("ub-avg-field").hidden = byMonths;
    $("ub-months-field").hidden = !byMonths;
    $("ub-wage-hint").textContent = "Шимтгэл төлсөн сүүлийн дараалсан " + n + " сарын цалин хөлс, түүнтэй адилтгах орлого. Нэг сарын дээд хэмжээ " + money(cap) + " (ХХДХ " + money(mw) + " × " + B.cap_x.compulsory + ", зааврын 3.8).";

    // Дундаж цалин
    var avg, capped = false, sum = 0;
    if (byMonths) {
      Array.prototype.forEach.call(grid.querySelectorAll("input"), function (i) {
        var v = num(i.value); if (v > cap) { v = cap; capped = true; } sum += v;
      });
      avg = sum / n;
    } else {
      avg = num($("ub-avg").value);
      if (avg > cap) { avg = cap; capped = true; }
    }
    var svc = Math.floor(num($("ub-years").value)) * 12 + Math.floor(num($("ub-months").value));
    var eligible = svc >= U.min_months, rate = rateFor(svc);
    var baseDays = own ? R.days_voluntary : R.days, late = Math.floor(num($("ub-late").value));
    var days = Math.max(0, baseDays - late);
    var monthly = avg * rate, daily = monthly / B.days_per_month, total = daily * days;
    var ok = eligible && avg > 0;

    $("ub-row-sum").hidden = !byMonths;
    $("ub-r-sum-label").textContent = "Цалингийн нийлбэр (" + n + " сар)";
    $("ub-r-sum").textContent = money(sum);
    $("ub-r-avg-label").textContent = "Сарын дундаж цалин" + (byMonths ? " (÷ " + n + ")" : "");
    $("ub-r-avg").textContent = avg > 0 ? money(avg) + (capped ? " (дээд хэмжээ)" : "") : "—";
    $("ub-r-rate-label").textContent = "Тэтгэмж бодох хувь (" + svc + " сар)";
    $("ub-r-rate").textContent = eligible ? Math.round(rate * 100) + "%" : "—";
    $("ub-r-month").textContent = ok ? money(monthly) : "—";
    $("ub-r-day").textContent = ok ? money(daily, 2) : "—";
    $("ub-r-days-label").textContent = "Олгох ажлын өдөр" + (late > 0 ? " (" + baseDays + " − " + late + ")" : "");
    $("ub-r-days").textContent = days + " өдөр";
    $("ub-r-total").textContent = ok ? money(total) : "—";
    $("ub-total").textContent = ok ? money(total) : "—";
    $("ub-sub").textContent = ok ? days + " ажлын өдөр × " + money(daily, 2) : (eligible ? "" : "Тэтгэмж авах эрх үүсэхгүй");
    $("ub-elig").textContent = eligible
      ? "Шимтгэл төлсөн " + svc + " сар ≥ 24 сар. Сүүлийн " + R.continuous_months + " сар тасралтгүй шимтгэл төлсөн, хөдөлмөр эрхлэлтийн байгууллагад бүртгүүлсэн байх шаардлагатай (9.1)."
      : "";
    $("ub-elig").hidden = !eligible;
    var warn = $("ub-warn");
    if (!eligible) { warn.textContent = "Шимтгэл төлсөн хугацаа " + svc + " сар буюу 24 сараас бага тул ажилгүйдлийн тэтгэмж авах эрх үүсэхгүй (хуулийн 9.1)."; warn.hidden = false; }
    else warn.hidden = true;

    Array.prototype.forEach.call(document.querySelectorAll("#ub-ref tbody tr"), function (tr) {
      var from = Number(tr.getAttribute("data-from")), to = tr.getAttribute("data-to");
      tr.classList.toggle("is-current", svc >= from && (to === "" || svc <= Number(to)));
    });
  }

  form.addEventListener("input", function (e) {
    var el = e.target;
    if (el.id === "ub-avg" || el.hasAttribute("data-m")) fmtMoney(el);
    else if (el.tagName === "INPUT" && el.type === "text") { var v = el.value.replace(/[^\d]/g, ""); if (v !== el.value) el.value = v; }
    render();
  });
  form.addEventListener("change", render);
  render();
})();
