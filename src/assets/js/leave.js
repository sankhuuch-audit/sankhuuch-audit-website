/* Ээлжийн амралтын тооцоолуур */
(function () {
  "use strict";
  var form = document.getElementById("leave-form"), dataEl = document.getElementById("leave-data");
  if (!form || !dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var $ = function (id) { return document.getElementById(id); };
  var num = function (s) { var n = Number(String(s).replace(/[^\d.]/g, "")); return isFinite(n) ? n : 0; };
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US") + "₮"; };
  function extraDays(y) {
    var d = 0;
    D.extra_normal.forEach(function (r) { if (y >= r.from) d = r.days; });
    return d;
  }
  function fmtInput(el) {
    var raw = el.value, fromEnd = raw.length - (el.selectionStart == null ? raw.length : el.selectionStart);
    var out = raw.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (out !== raw) { el.value = out; var p = Math.max(0, out.length - fromEnd); try { el.setSelectionRange(p, p); } catch (e) {} }
  }
  function render() {
    var years = Math.floor(num($("lv-years").value)), pay = num($("lv-pay").value), worked = num($("lv-days").value);
    var ex = extraDays(years), all = D.base_days + ex;
    var daily = worked > 0 ? pay / worked : 0, out = daily * all;
    $("lv-base").textContent = D.base_days + " өдөр";
    $("lv-extra").textContent = ex + " өдөр";
    $("lv-all").textContent = all + " ажлын өдөр";
    $("lv-daily").textContent = worked > 0 ? fmt(daily) : "—";
    $("lv-pay-out").textContent = worked > 0 ? fmt(out) : "—";
    $("lv-total").textContent = worked > 0 && pay > 0 ? fmt(out) : "—";
    $("lv-days-sum").textContent = all + " ажлын өдөр (үндсэн " + D.base_days + " + нэмэлт " + ex + ")";
    $("lv-net-link").href = "/tootsooluur/" + (out > 0 ? "?amount=" + Math.round(out) : "");
  }
  ["lv-years", "lv-pay", "lv-days"].forEach(function (id) {
    var el = $(id);
    el.addEventListener("input", function () { if (id !== "lv-years") fmtInput(el); else el.value = el.value.replace(/[^\d]/g, ""); render(); });
  });
  render();
})();
