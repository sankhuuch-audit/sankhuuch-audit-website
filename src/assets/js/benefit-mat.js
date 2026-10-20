/* Жирэмсний болон амаржсаны тэтгэмжийн тооцоолуур: НДСОТТХ 6, 7; НДЕГ «Тэтгэмж бодох заавар» 5-р бүлэг */
(function () {
  "use strict";
  var form = document.getElementById("mb-form"), dataEl = document.getElementById("benefit-data");
  if (!form || !dataEl) return;
  var B = JSON.parse(dataEl.textContent), M = B.maternity, DAY = 86400000;
  var WD = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
  var HOL = {}, PROV = {};
  B.holidays.forEach(function (d) { HOL[d] = 1; });
  B.holidays_provisional.forEach(function (d) { PROV[d] = 1; });
  var $ = function (id) { return document.getElementById(id); };
  function num(s) { var n = Number(String(s).replace(/,/g, "").replace(/[^\d.]/g, "")); return isFinite(n) ? n : 0; }
  function money(n, d) { d = d && Math.abs(n - Math.round(n)) >= 0.005 ? d : 0; return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) + "₮"; }
  function radio(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ""; }
  function parse(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function dot(t) { return iso(t).replace(/-/g, "."); }
  function minWage(dateStr) { var w = B.min_wage[0].amount; B.min_wage.forEach(function (m) { if (dateStr >= m.from) w = m.amount; }); return w; }
  function isHoliday(s) {
    var y = Number(s.slice(0, 4));
    return B.holiday_years.indexOf(y) >= 0 ? !!HOL[s] : B.fixed_holidays.indexOf(s.slice(5)) >= 0;
  }
  // Хуанлийн n хоногийн доторх ажлын өдөр: Да–Ба, мөн бямба, ням гарагт таарсан баярын өдөр (хуулийн 7.2, санамж 15)
  function countWork(t0, n) {
    var c = 0, extra = [], prov = [], unknown = {};
    for (var i = 0; i < n; i++) {
      var t = t0 + i * DAY, s = iso(t), wd = new Date(t).getUTCDay(), y = Number(s.slice(0, 4));
      if (B.holiday_years.indexOf(y) < 0) unknown[y] = 1;
      if (PROV[s]) prov.push(t);
      if (wd >= 1 && wd <= 5) c++;
      else if (isHoliday(s)) { c++; extra.push(t); }
    }
    return { days: c, extra: extra, prov: prov, unknown: Object.keys(unknown) };
  }
  function fmtMoney(el) {
    var raw = el.value, fromEnd = raw.length - (el.selectionStart == null ? raw.length : el.selectionStart);
    var out = raw.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (out !== raw) { el.value = out; var p = Math.max(0, out.length - fromEnd); try { el.setSelectionRange(p, p); } catch (e) {} }
  }
  function short(t) { var s = iso(t); return s.slice(5).replace("-", ".") + " (" + WD[new Date(t).getUTCDay()] + ")"; }

  function render() {
    var vol = radio("itype") === "voluntary", byMonths = radio("wmode") === "months", twins = $("mb-twins").checked;
    var t0 = parse($("mb-start").value);
    $("mb-avg-field").hidden = byMonths;
    $("mb-months-field").hidden = !byMonths;
    var mw = minWage(t0 != null ? iso(t0) : "2026-01-01"), capX = vol ? B.cap_x.voluntary : B.cap_x.compulsory, cap = mw * capX;
    $("mb-wage-hint").textContent = "Жирэмсний амралт эхлэхээс өмнөх шимтгэл төлсөн сүүлийн " + M.avg_months + " сарын цалин хөлс. Бүтэн ажиллаагүй сартай байсан ч " + M.avg_months + "-т хуваана. Нэг сарын дээд хэмжээ " + money(cap) + " (ХХДХ " + money(mw) + " × " + capX + ").";

    var avg, sum = 0, capped = false;
    if (byMonths) {
      Array.prototype.forEach.call(form.querySelectorAll("#mb-mgrid input"), function (i) { var v = num(i.value); if (v > cap) { v = cap; capped = true; } sum += v; });
      avg = sum / M.avg_months;
    } else {
      avg = num($("mb-avg").value);
      if (avg > cap) { avg = cap; capped = true; }
    }
    var daily = avg / B.days_per_month * M.rate;
    $("mb-row-sum").hidden = !byMonths;
    $("mb-r-sum").textContent = money(sum);
    $("mb-r-avg-label").textContent = "Сарын дундаж цалин" + (byMonths ? " (÷ " + M.avg_months + ")" : "");
    $("mb-r-avg").textContent = avg > 0 ? money(avg) + (capped ? " (дээд хэмжээ)" : "") : "—";
    $("mb-r-daily").textContent = avg > 0 ? money(daily, 2) : "—";

    var warn = $("mb-warn");
    if (t0 == null) {
      ["mb-r-pre", "mb-r-post", "mb-r-all", "mb-total"].forEach(function (id) { $(id).textContent = "—"; });
      ["mb-r-pre-label", "mb-r-post-label", "mb-r-all-label", "mb-sub", "mb-hol"].forEach(function (id) { $(id).textContent = ""; });
      warn.textContent = "Жирэмсний амралт эхлэх өдрийг оруулна уу."; warn.hidden = false;
      return;
    }
    warn.hidden = true;
    var postN = twins ? M.post_days_twins : M.post_days, allN = M.pre_days + postN;
    var pre = countWork(t0, M.pre_days), post = countWork(t0 + M.pre_days * DAY, postN);
    var t1 = t0 + (M.pre_days - 1) * DAY, t2 = t0 + M.pre_days * DAY, t3 = t0 + (allN - 1) * DAY;
    var preAmt = daily * pre.days, postAmt = daily * post.days, days = pre.days + post.days, total = preAmt + postAmt;
    var ok = avg > 0;
    $("mb-r-pre-label").textContent = dot(t0) + "–" + dot(t1) + ", " + M.pre_days + " хоног, " + pre.days + " ажлын өдөр";
    $("mb-r-post-label").textContent = dot(t2) + "–" + dot(t3) + ", " + postN + " хоног, " + post.days + " ажлын өдөр";
    $("mb-r-all-label").textContent = allN + " хоног, " + days + " ажлын өдөр";
    $("mb-r-pre").textContent = ok ? money(preAmt) : "—";
    $("mb-r-post").textContent = ok ? money(postAmt) : "—";
    $("mb-r-all").textContent = ok ? money(total) : "—";
    $("mb-total").textContent = ok ? money(total) : "—";
    $("mb-sub").textContent = days + " ажлын өдөр" + (ok ? " × " + money(daily, 2) : "");

    var extra = pre.extra.concat(post.extra), prov = pre.prov.concat(post.prov), unknown = {};
    pre.unknown.concat(post.unknown).forEach(function (y) { unknown[y] = 1; });
    var notes = [];
    notes.push(extra.length
      ? "Бямба, ням гарагт таарсан баярын өдрийг ажлын өдөрт оруулав: " + extra.map(short).join(", ") + " (хуулийн 7.2, зааврын санамж 15)."
      : "Энэ хугацаанд бямба, ням гарагт таарсан баярын өдөр байхгүй. Ажлын өдөрт таарсан баярын өдөр ажлын өдөрт тооцогдсон (7.2).");
    if (prov.length) notes.push("2027 оны билгийн тооллын баярын өдрийг (" + prov.map(short).join(", ") + ") цаг тооны бичгээр урьдчилан тооцов. Засгийн газар баталсан огноогоор тулгана уу.");
    var uk = Object.keys(unknown);
    if (uk.length) notes.push(uk.join(", ") + " оны Цагаан сар, Их дүйчин, Чингис хааны өдрийг тусгаагүй; зөвхөн тогтмол огноотой баярын өдрийг тооцов.");
    $("mb-hol").textContent = notes.join(" ");
  }

  form.addEventListener("input", function (e) { var el = e.target; if (el.id === "mb-avg" || el.hasAttribute("data-m")) fmtMoney(el); render(); });
  form.addEventListener("change", render);
  render();
})();
