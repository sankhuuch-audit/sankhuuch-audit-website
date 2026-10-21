/* Үнийн санал авах маягт
   Бөглөсөн мэдээллийг FormSubmit (formsubmit.co) үйлчилгээгээр компанийн имэйл (info@) руу илгээнэ.
   Компани хариуг гараар өгнө. Имэйлийн «Reply» дарахад шууд үйлчлүүлэгч рүү хариу бичигдэнэ. */
(function () {
  "use strict";
  var form = document.getElementById("quote-form");
  if (!form) return;

  var to = form.getAttribute("data-company-email");
  var isEn = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
  var T = isEn ? {
    labels: { company: "Organisation name", entity: "Type of organisation", services: "Service required", total_assets: "Total assets (MNT million)", revenue: "Sales revenue (MNT million)", total_expenses: "Total expenses (MNT million)", contact_name: "Contact person", phone: "Phone", email: "Email", notes: "Additional information" },
    subject: "Quote request (English site): ",
    sending: "Sending…",
    submit: "Send request",
    invalid: "Please complete the fields marked with an asterisk (*) and check that your email address is correct.",
    failed: function (to) { return "We could not send your request. Please try again in a moment. If the problem persists, email " + to + " or call us."; }
  } : {
    labels: { company: "Байгууллагын нэр", entity: "Байгууллагын хэлбэр", services: "Шаардлагатай үйлчилгээ", total_assets: "Нийт хөрөнгө (сая ₮)", revenue: "Борлуулалтын орлого (сая ₮)", total_expenses: "Нийт зардал (сая ₮)", contact_name: "Холбоо барих хүн", phone: "Утас", email: "Имэйл", notes: "Нэмэлт мэдээлэл" },
    subject: "Үнийн санал авах хүсэлт: ",
    sending: "Илгээж байна…",
    submit: "Хүсэлт илгээх",
    invalid: "Одоор (*) тэмдэглэсэн талбаруудыг бөглөнө үү. Имэйл хаягаа зөв оруулсан эсэхээ шалгана уу.",
    failed: function (to) { return "Хүсэлтийг илгээж чадсангүй. Хэсэг хугацааны дараа дахин оролдоно уу. Асуудал давтагдвал " + to + " хаяг руу имэйл бичих эсвэл утсаар холбогдоно уу."; }
  };

  var KEYS = ["company", "entity", "services", "total_assets", "revenue", "total_expenses", "contact_name", "phone", "email", "notes"];
  var NUMERIC = { total_assets: 1, revenue: 1, total_expenses: 1 };

  var errBox = document.getElementById("q-error");
  var srvErr = document.getElementById("q-services-error");
  var btn = document.getElementById("q-submit");

  function collect() {
    var fd = new FormData(form), data = {};
    KEYS.forEach(function (k) {
      var v = k === "services" ? fd.getAll("services").join(", ") : (fd.get(k) || "");
      v = String(v).trim();
      if (NUMERIC[k]) v = v.replace(/,/g, "");
      data[k] = v;
    });
    return data;
  }

  /* Тоо бичих үед мянгатыг «,»-аар, бутархайг «.»-аар автоматаар ялгана: 454534653.5 → 454,534,653.5 */
  function formatNumInput(el) {
    var raw = el.value;
    var fromEnd = raw.length - (el.selectionStart == null ? raw.length : el.selectionStart);
    var cleaned = raw.replace(/[^\d.]/g, "");
    var dot = cleaned.indexOf(".");
    var intPart = (dot >= 0 ? cleaned.slice(0, dot) : cleaned).replace(/^0+(?=\d)/, "");
    var decPart = dot >= 0 ? cleaned.slice(dot + 1).replace(/\./g, "").slice(0, 3) : "";
    if (dot === 0) intPart = "0";
    var out = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dot >= 0 ? "." + decPart : "");
    if (out !== raw) {
      el.value = out;
      var pos = Math.max(0, out.length - fromEnd);
      try { el.setSelectionRange(pos, pos); } catch (e) {}
    }
  }
  form.querySelectorAll("[data-num]").forEach(function (el) {
    el.addEventListener("input", function () { formatNumInput(el); });
  });

  function fmtNum(v) {
    var n = Number(v);
    return isFinite(n) && v !== "" ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : v;
  }

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
    errBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function validate() {
    errBox.hidden = true;
    var ok = true, first = null;
    form.querySelectorAll("[required]").forEach(function (el) {
      var bad = el.type === "checkbox" ? !el.checked : !el.value.trim();
      if (!bad && el.hasAttribute("data-num")) bad = !isFinite(Number(el.value.replace(/,/g, "")));
      if (!bad && el.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      var wrap = el.closest(".q-field, .q-check");
      if (wrap) wrap.classList.toggle("is-invalid", bad);
      if (bad) { ok = false; first = first || el; }
    });
    var anyService = form.querySelectorAll('input[name="services"]:checked').length > 0;
    srvErr.hidden = anyService;
    if (!anyService) { ok = false; first = first || form.querySelector('input[name="services"]'); }
    if (!ok) {
      showError(T.invalid);
      if (first) first.focus({ preventScroll: true });
    }
    return ok;
  }

  function done() {
    if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { form_name: "quote", language: document.documentElement.lang });
    form.hidden = true;
    var box = document.getElementById("quote-done");
    box.hidden = false;
    box.focus();
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("change", function (e) {
    var f = e.target.closest(".q-field, .q-check");
    if (f) f.classList.remove("is-invalid");
    if (e.target.name === "services") srvErr.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements.website && form.elements.website.value) return; // спам
    if (!validate()) return;
    var data = collect();

    var payload = {};
    KEYS.forEach(function (k) {
      if (k === "email" || !data[k]) return;
      payload[T.labels[k]] = NUMERIC[k] ? fmtNum(data[k]) : data[k];
    });
    payload.email = data.email;
    payload._replyto = data.email;
    payload._subject = T.subject + data.company;
    payload._template = "table";
    payload._captcha = "false";

    btn.disabled = true;
    btn.textContent = T.sending;
    var fail = function () {
      btn.disabled = false;
      btn.textContent = T.submit;
      showError(T.failed(to));
    };
    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res && String(res.success) === "true") { done(); }
      else { if (window.console) console.warn("FormSubmit:", res && res.message); fail(); }
    }).catch(fail);
  });
})();
