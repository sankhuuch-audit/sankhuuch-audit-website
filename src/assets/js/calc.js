/* Цалингийн тооцоолуур: НДШ, ЭМД, ХХОАТ, гарт олгох цалин, ажил олгогчийн зардал */
(function () {
  "use strict";
  var form = document.getElementById("calc-form");
  var dataEl = document.getElementById("payroll-data");
  if (!form || !dataEl) return;
  var YEARS = JSON.parse(dataEl.textContent);
  var $ = function (id) { return document.getElementById(id); };
  var amount = $("calc-amount"), risk = $("calc-risk");

  function fmt(n) { return Math.round(n).toLocaleString("en-US") + "₮"; }
  function pct(r) { return (Math.round(r * 1000) / 10).toString() + "%"; }
  function num(s) { var n = Number(String(s).replace(/[^\d.]/g, "")); return isFinite(n) ? n : 0; }
  function cfg() {
    var y = Number((form.querySelector('input[name="year"]:checked') || {}).value);
    return YEARS.filter(function (x) { return x.year === y; })[0] || YEARS[0];
  }
  function mode() { return (form.querySelector('input[name="mode"]:checked') || {}).value || "gross"; }

  function pitBrackets(c, taxable) {
    var tax = 0, b = c.pit;
    for (var i = 0; i < b.length; i++) {
      var lo = b[i].from, hi = i + 1 < b.length ? b[i + 1].from : Infinity;
      if (taxable > lo) tax += (Math.min(taxable, hi) - lo) * b[i].rate;
    }
    return tax;
  }
  function credit(c, taxable) {
    var t = c.pit_credit || [];
    for (var i = 0; i < t.length; i++) if (taxable <= t[i].upto) return t[i].amount;
    return 0;
  }

  function calc(c, gross, riskIdx) {
    var ee = c.employee, er = c.employer;
    var eeRate = ee.pension + ee.benefit + ee.unemployment;
    var eeCap = c.min_wage * c.employee_cap_x;
    var base = Math.min(gross, eeCap);
    var eeSS = base * eeRate, eeH = base * ee.health;
    var taxable = Math.max(0, gross - eeSS - eeH);
    var pitG = pitBrackets(c, taxable);
    var cr = Math.min(pitG, credit(c, taxable));
    var pit = Math.max(0, pitG - cr);
    var erRate = er.pension + er.benefit + er.accident[riskIdx] + er.unemployment;
    var erBase = c.employer_cap_x ? Math.min(gross, c.min_wage * c.employer_cap_x) : gross;
    var erSS = erBase * erRate, erH = erBase * er.health;
    return {
      gross: gross, base: base, capped: gross > eeCap, eeRate: eeRate, eeSS: eeSS, eeH: eeH,
      taxable: taxable, pitG: pitG, cr: cr, pit: pit, net: gross - eeSS - eeH - pit,
      erRate: erRate, erSS: erSS, erH: erH, cost: gross + erSS + erH
    };
  }

  // Гарт олгох дүнгээс нийт цалинг олох (хоёртын хайлт)
  function grossFromNet(c, net, riskIdx) {
    var lo = net, hi = net * 2 + 1000000;
    for (var i = 0; i < 80; i++) {
      var mid = (lo + hi) / 2;
      if (calc(c, mid, riskIdx).net < net) lo = mid; else hi = mid;
    }
    return Math.round(hi);
  }

  function formatInput() {
    var raw = amount.value, fromEnd = raw.length - (amount.selectionStart == null ? raw.length : amount.selectionStart);
    var digits = raw.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
    var out = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (out !== raw) { amount.value = out; var p = Math.max(0, out.length - fromEnd); try { amount.setSelectionRange(p, p); } catch (e) {} }
  }

  function render() {
    var c = cfg(), riskIdx = Number(risk.value) || 0, v = num(amount.value), m = mode();
    $("calc-amount-label").textContent = m === "gross" ? "Сарын нийт бодогдсон цалин, ₮" : "Гарт авах цалин, ₮";
    $("calc-net-label").textContent = m === "gross" ? "Гарт олгох цалин" : "Бодох ёстой нийт цалин";
    var acc = c.employer.accident;
    $("calc-risk-hint").textContent = "Үйлдвэрлэлийн осол, мэргэжлээс шалтгаалсан өвчний даатгал: " + pct(acc[0]) + " / " + pct(acc[1]) + " / " + pct(acc[2]);
    $("calc-yearnote").textContent = "ХХДХ " + fmt(c.min_wage) + ". " + (c.note || "");
    var gross = m === "gross" ? v : grossFromNet(c, v, riskIdx);
    var r = calc(c, gross, riskIdx);
    $("calc-net").textContent = v ? fmt(m === "gross" ? r.net : r.gross) : "—";
    $("r-gross").textContent = fmt(r.gross);
    $("r-base").textContent = fmt(r.base) + (r.capped ? " (дээд хэмжээ)" : "");
    $("r-ee-rate").textContent = pct(r.eeRate);
    $("r-ee-h-rate").textContent = pct(c.employee.health);
    $("r-ee-ss").textContent = "−" + fmt(r.eeSS);
    $("r-ee-h").textContent = "−" + fmt(r.eeH);
    $("r-taxable").textContent = fmt(r.taxable);
    $("r-pit-gross").textContent = fmt(r.pitG);
    $("row-credit").hidden = !(c.pit_credit && c.pit_credit.length);
    $("r-credit").textContent = "−" + fmt(r.cr);
    $("r-pit").textContent = "−" + fmt(r.pit);
    $("r-net").textContent = fmt(r.net);
    $("r-er-rate").textContent = pct(r.erRate);
    $("r-er-h-rate").textContent = pct(c.employer.health);
    $("r-er-ss").textContent = fmt(r.erSS);
    $("r-er-h").textContent = fmt(r.erH);
    $("r-cost").textContent = fmt(r.cost);
    var g = r.gross || 1;
    $("bar-net").style.width = (r.net / g * 100) + "%";
    $("bar-ss").style.width = ((r.eeSS + r.eeH) / g * 100) + "%";
    $("bar-pit").style.width = (r.pit / g * 100) + "%";
    var warn = $("calc-warn");
    if (r.gross && r.gross < c.min_wage) {
      warn.textContent = "Цалин хөдөлмөрийн хөлсний доод хэмжээнээс (" + fmt(c.min_wage) + ") бага байна. Бүтэн цагийн ажилтны шимтгэлийг доод хэмжээнээс тооцох шаардлагатай эсэхийг шалгана уу (НДЕХ 19.2).";
      warn.hidden = false;
    } else warn.hidden = true;
  }

  amount.addEventListener("input", function () { formatInput(); render(); });
  form.addEventListener("change", render);
  render();
})();
