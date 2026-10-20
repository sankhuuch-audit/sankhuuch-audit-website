/* “Санхүүч-Аудит” ХХК — вэбсайтын жижиг скрипт (гадны сан ашиглаагүй) */
(function () {
  "use strict";

  /* 1. Гар утасны цэс */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      document.body.classList.toggle("nav-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
        toggle.focus();
      }
    });
  }

  /* 2. YouTube бичлэг: товшсон үед л тоглуулагч ачаална (хуудас хурдан ачаалагдана) */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".yt-btn");
    if (!btn) return;
    var box = btn.closest(".yt");
    var id = box && box.getAttribute("data-yt");
    if (!id) return;
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
    iframe.title = btn.getAttribute("aria-label") || "YouTube бичлэг";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    box.innerHTML = "";
    box.appendChild(iframe);
    box.classList.add("is-playing");
  });

  /* 3. Ангилал болон хайлтаар шүүх */
  document.querySelectorAll("[data-filter-root]").forEach(function (root) {
    var items = Array.prototype.slice.call(root.querySelectorAll("[data-item]"));
    if (!items.length) return;
    var chips = Array.prototype.slice.call(root.querySelectorAll("button[data-filter]"));
    var input = root.querySelector("[data-search]");
    var count = root.querySelector("[data-count]");
    var empty = root.querySelector("[data-empty]");
    var unit = count ? count.textContent.replace(/^[\d\s]+/, "") : "";
    var active = "";

    function apply() {
      var q = input ? input.value.trim().toLowerCase() : "";
      var words = q ? q.split(/\s+/) : [];
      var shown = 0;
      items.forEach(function (el) {
        var text = el.getAttribute("data-text") || "";
        var topic = el.getAttribute("data-topic") || "";
        var ok = (!active || topic === active) && words.every(function (w) { return text.indexOf(w) !== -1; });
        el.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = shown + " " + unit;
      if (empty) empty.hidden = shown !== 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        active = chip.getAttribute("data-filter") || "";
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", String(on));
        });
        apply();
      });
    });
    if (input) input.addEventListener("input", apply);
  });

  /* 4. Хууль тогтоомжийн эх сурвалжийг 12 сараас дээш шалгаагүй бол анхааруулна */
  document.querySelectorAll("[data-checked]").forEach(function (el) {
    var d = new Date(el.getAttribute("data-checked") + "T00:00:00");
    if (isNaN(d)) return;
    var days = (Date.now() - d.getTime()) / 86400000;
    if (days > 365) el.hidden = false;
  });

  /* 5. Имэйл хаяг хуулах */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var label = btn.textContent;
      function done(msg) {
        btn.textContent = msg;
        setTimeout(function () { btn.textContent = label; }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done("Хуулагдлаа"); }, function () { done(text); });
      } else {
        done(text);
      }
    });
  });
})();
