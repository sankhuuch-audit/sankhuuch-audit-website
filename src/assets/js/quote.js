/* Үнийн санал авах маягт
   EmailJS тохируулсан үед: компанид мэдэгдэл + үйлчлүүлэгчид автомат хариу имэйл илгээнэ.
   Тохируулаагүй үед: имэйл програмаар дамжуулан info@ хаяг руу илгээнэ. */
(function () {
  "use strict";
  var form = document.getElementById("quote-form");
  if (!form) return;

  var cfg = {
    key: form.getAttribute("data-emailjs-key"),
    service: form.getAttribute("data-emailjs-service"),
    template: form.getAttribute("data-emailjs-template"),
    to: form.getAttribute("data-company-email")
  };
  var useEmailJS = !!(cfg.key && cfg.service && cfg.template);
  var pricing = null;
  try { pricing = JSON.parse(form.getAttribute("data-pricing") || "null"); } catch (e) { pricing = null; }

  /* Урьдчилсан үнийн тооцоо: хэмжээ = нийт хөрөнгө, орлого, зардлын хамгийн их нь (сая ₮).
     tiers: [{ "max": 500, "from": 1500000, "to": 2500000 }, ..., { "max": null, "from": ..., "to": ... }] */
  function estimate(data) {
    if (!pricing || !pricing.tiers || !pricing.tiers.length) return null;
    var size = Math.max(Number(data.total_assets) || 0, Number(data.revenue) || 0, Number(data.total_expenses) || 0);
    var tier = pricing.tiers.filter(function (t) { return t.max === null || t.max === undefined || size <= Number(t.max); })[0];
    if (!tier) return null;
    var f = function (n) { return Math.round(Number(n)).toLocaleString("en-US") + "₮"; };
    return tier.to && Number(tier.to) !== Number(tier.from) ? f(tier.from) + " – " + f(tier.to) : f(tier.from);
  }

  var LABELS = [
    ["company", "Байгууллагын нэр"],
    ["entity", "Байгууллагын хэлбэр"],
    ["industry", "Үйл ажиллагааны чиглэл"],
    ["services", "Шаардлагатай үйлчилгээ"],
    ["period", "Тайлант хугацаа"],
    ["standard", "Тайлагналын стандарт"],
    ["prior_audit", "Өмнө аудит хийлгэсэн эсэх"],
    ["deadline", "Дуусгах хүсэлтэй хугацаа"],
    ["total_assets", "Нийт хөрөнгө (сая ₮)"],
    ["revenue", "Борлуулалтын орлого (сая ₮)"],
    ["total_expenses", "Нийт зардал (сая ₮)"],
    ["employees", "Ажилтны тоо"],
    ["branches", "Салбар, охин компани"],
    ["contact_name", "Холбоо барих хүн"],
    ["position", "Албан тушаал"],
    ["phone", "Утас"],
    ["email", "Имэйл"],
    ["notes", "Нэмэлт мэдээлэл"],
    ["newsletter", "Сар бүрийн мэдээллийн имэйл"]
  ];

  var errBox = document.getElementById("q-error");
  var srvErr = document.getElementById("q-services-error");
  var btn = document.getElementById("q-submit");

  function collect() {
    var fd = new FormData(form), data = {};
    LABELS.forEach(function (l) {
      var v = l[0] === "services" ? fd.getAll("services").join(", ") : (fd.get(l[0]) || "");
      data[l[0]] = String(v).trim();
    });
    if (!data.newsletter) data.newsletter = "Үгүй";
    return data;
  }

  function fmtNum(v) {
    var n = Number(v);
    return isFinite(n) && v !== "" ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : v;
  }

  function details(data) {
    var rows = LABELS.filter(function (l) { return data[l[0]]; }).map(function (l) {
      var v = (l[0] === "total_assets" || l[0] === "revenue" || l[0] === "total_expenses") ? fmtNum(data[l[0]]) : data[l[0]];
      return [l[1], v];
    });
    var text = rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n");
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var html = '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
      rows.map(function (r) {
        return '<tr><td style="border:1px solid #dde3ee;background:#f2f5fa;font-weight:bold;vertical-align:top">' + esc(r[0]) +
          '</td><td style="border:1px solid #dde3ee;white-space:pre-line">' + esc(r[1]) + "</td></tr>";
      }).join("") + "</table>";
    return { text: text, html: html };
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
      if (!bad && el.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      el.closest(".q-field, .q-check") && el.closest(".q-field, .q-check").classList.toggle("is-invalid", bad);
      if (bad) { ok = false; first = first || el; }
    });
    var anyService = form.querySelectorAll('input[name="services"]:checked').length > 0;
    srvErr.hidden = anyService;
    if (!anyService) { ok = false; first = first || form.querySelector('input[name="services"]'); }
    if (!ok) {
      showError("Одоор (*) тэмдэглэсэн талбаруудыг бөглөнө үү. Имэйл хаягаа зөв оруулсан эсэхээ шалгана уу.");
      if (first) first.focus({ preventScroll: true });
    }
    return ok;
  }

  function done(email, viaMail) {
    form.hidden = true;
    var box = document.getElementById("quote-done");
    var t = document.getElementById("quote-done-text");
    if (viaMail) {
      t.textContent = "Таны имэйл програм нээгдэж, хүсэлтийн мэдээлэл бүхий имэйл бэлэн болсон. Тэр имэйлийг илгээснээр хүсэлт бидэнд хүрнэ.";
    } else {
      var s = box.querySelector("[data-done-email]");
      if (s) s.textContent = email;
    }
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
    if (form.elements.website && form.elements.website.value) return; // spam
    if (!validate()) return;
    var data = collect(), d = details(data), est = estimate(data);
    var subject = "Үнийн санал авах хүсэлт: " + data.company;

    if (!useEmailJS || !window.emailjs) {
      var body = subject + "\n\n" + d.text;
      window.location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      done(data.email, true);
      return;
    }

    btn.disabled = true;
    var label = btn.textContent;
    btn.textContent = "Илгээж байна…";
    var params = Object.assign({}, data, {
      subject: subject,
      details_text: d.text,
      details_html: d.html,
      reply_to: data.email,
      to_email: cfg.to,
      submitted_at: new Date().toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" }),
      estimate: est || "Урьдчилсан үнийн саналыг манай мэргэжилтэн тооцоолж, тантай холбогдоно.",
      estimate_note: "Урьдчилсан үнийн санал нь эцсийн үнэ биш. Аудитын тухай хуульд заасны дагуу үйлчилгээний хөлсийг талууд харилцан тохиролцож, гэрээгээр тогтооно."
    });
    window.emailjs.send(cfg.service, cfg.template, params, { publicKey: cfg.key }).then(function () {
      done(data.email, false);
    }, function () {
      btn.disabled = false;
      btn.textContent = label;
      showError("Хүсэлтийг илгээж чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу. Асуудал давтагдвал " + cfg.to + " хаяг руу имэйл бичих эсвэл утсаар холбогдоно уу.");
    });
  });
})();
