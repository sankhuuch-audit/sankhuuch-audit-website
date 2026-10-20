import { slugify } from "../../../eleventy.config.js";

const PREVIEW = process.env.PREVIEW_DRAFTS === "1";

export default {
  layout: "layouts/article.njk",
  eleventyComputed: {
    // Ноорог (draft) нийтлэлийг вэбсайт дээр гаргахгүй
    permalink: (data) => {
      if (data.draft && !PREVIEW) return false;
      const slug = data.slug ? slugify(data.slug) : slugify(data.title);
      return `/zuvlugu/${slug}/`;
    }
  }
};
