// Eleventy тохиргоо: “Санхүүч-Аудит” ХХК-ийн вэбсайт
// Энэ файлыг ихэвчлэн өөрчлөх шаардлагагүй. Агуулгыг src/content болон src/_data хавтсаас засна.

import { HtmlBasePlugin } from "@11ty/eleventy";

const PREVIEW = process.env.PREVIEW_DRAFTS === "1";

const MN_MONTHS = [
  "1 дүгээр сар", "2 дугаар сар", "3 дугаар сар", "4 дүгээр сар", "5 дугаар сар", "6 дугаар сар",
  "7 дугаар сар", "8 дугаар сар", "9 дүгээр сар", "10 дугаар сар", "11 дүгээр сар", "12 дугаар сар"
];

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u",
  ү: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "i", э: "e",
  ю: "yu", я: "ya"
};

export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "niitlel";
}

// Огноог YYYY-MM-DD хэлбэрээр (UTC) буцаана
function toISODate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return "";
  return d.toISOString().slice(0, 10);
}

function mnDate(value) {
  const iso = toISODate(value);
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${y} оны ${MN_MONTHS[m - 1]}ын ${d}`;
}

// YouTube холбоосоос видеоны ID-г ялгана
export function youtubeId(url) {
  if (!url) return "";
  const s = String(url).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return "";
}

const isPublished = (item) => PREVIEW || !item.data.draft;
const byDateDesc = (a, b) => (b.date || 0) - (a.date || 0);

export default function (eleventyConfig) {
  // GitHub-ийн түр хаяг (username.github.io/repo/) дээр ч зөв ажиллуулахын тулд
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.png": "favicon.png" });

  eleventyConfig.addWatchTarget("src/assets/");

  // ---- Цуглуулгууд ----
  eleventyConfig.addCollection("articles", (api) =>
    api.getFilteredByGlob("src/content/articles/*.md").filter(isPublished).sort(byDateDesc)
  );
  eleventyConfig.addCollection("videos", (api) =>
    api.getFilteredByGlob("src/content/videos/*.md")
      .filter(isPublished)
      .filter((v) => youtubeId(v.data.url))
      .sort(byDateDesc)
  );
  eleventyConfig.addCollection("materials", (api) =>
    api.getFilteredByGlob("src/content/materials/*.md").filter(isPublished).sort(byDateDesc)
  );
  eleventyConfig.addCollection("services", (api) =>
    api.getFilteredByGlob("src/content/services/*.md")
      .filter(isPublished)
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99))
  );

  // ---- Шүүлтүүрүүд ----
  eleventyConfig.addFilter("mnDate", mnDate);
  eleventyConfig.addFilter("isoDate", toISODate);
  eleventyConfig.addFilter("slugify", slugify);
  eleventyConfig.addFilter("youtubeId", youtubeId);
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  // Google Analytics ID: зөвхөн G-XXXXXXX хэлбэрийг зөвшөөрнө
  eleventyConfig.addFilter("gaId", (v) => { const id = String(v || "").trim().toUpperCase(); return /^G-[A-Z0-9]{4,20}$/.test(id) ? id : ""; });
  eleventyConfig.addFilter("limit", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []));
  eleventyConfig.addFilter("whereData", (arr, key, value) =>
    (arr || []).filter((item) => item.data && item.data[key] === value)
  );
  eleventyConfig.addFilter("exceptUrl", (arr, url) => (arr || []).filter((i) => i.url !== url));
  eleventyConfig.addFilter("findBy", (arr, key, value) => (arr || []).find((x) => x && x[key] === value));
  eleventyConfig.addFilter("where", (arr, key, value) => (arr || []).filter((x) => x && x[key] === value));
  eleventyConfig.addFilter("absUrl", (path, base) => {
    try { return new URL(path, base).href; } catch { return path; }
  });
  eleventyConfig.addFilter("telHref", (phone) => "tel:" + String(phone).replace(/[^\d+]/g, ""));
  eleventyConfig.addFilter("hostname", (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  });
  eleventyConfig.addFilter("fileExt", (path) => {
    const m = String(path || "").match(/\.([a-z0-9]+)(?:\?.*)?$/i);
    return m ? m[1].toUpperCase() : "";
  });
  // Дугуй диаграммын хэсгүүдийг тооцоолно (SVG stroke-dasharray)
  eleventyConfig.addFilter("donutSegments", (items, total, r) => {
    const C = 2 * Math.PI * r;
    const colors = ["#16264a", "#5b7ed8", "#2fb3bb", "#b9c4d8"];
    let offset = 0;
    return (items || []).map((it, i) => {
      const len = (Number(it.count) / Number(total || 1)) * C;
      const seg = { ...it, dash: (len - 2).toFixed(2), gap: (C - len + 2).toFixed(2), offset: (-offset).toFixed(2), color: colors[i % colors.length] };
      offset += len;
      return seg;
    });
  });
  // Зөвхөн бичлэгтэй сэдвүүдийг шүүлтүүрт харуулна
  eleventyConfig.addFilter("usedBy", (topics, items, field) =>
    (topics || []).filter((t) => (items || []).some((i) => i.data[field] === t.key))
  );
  eleventyConfig.addFilter("usedTopics", (topics, videos) =>
    (topics || []).filter((t) => (videos || []).some((v) => v.data.topic === t.key))
  );
  eleventyConfig.addFilter("maxOf", (arr, key) => Math.max(...(arr || []).map((x) => Number(x[key]) || 0), 1));
  eleventyConfig.addFilter("searchText", (parts) =>
    (Array.isArray(parts) ? parts : [parts]).filter(Boolean).join(" ").toLowerCase().replace(/\s+/g, " ").trim()
  );

  eleventyConfig.addGlobalData("build", () => ({
    year: new Date().getFullYear(),
    date: new Date().toISOString(),
    preview: PREVIEW
  }));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk"
  };
}
