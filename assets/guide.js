window.makeGuide = function (spec) {
  const paras = (v) => {
    if (v == null) return "";
    if (Array.isArray(v)) return v.map((t) => (String(t).trimStart().startsWith("<") ? t : `<p>${t}</p>`)).join("");
    const s = String(v);
    return s.trimStart().startsWith("<") ? s : `<p>${s}</p>`;
  };
  const list = (v) => {
    if (v == null) return "";
    if (typeof v === "string" && v.trimStart().startsWith("<")) return v;
    const items = Array.isArray(v) ? v : [v];
    return `<ul>${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;
  };
  const sections = spec.sections
    ? spec.sections
    : [
        { h: "问题在哪", html: paras(spec.problem) },
        { h: "关键认识", html: paras(spec.insight) },
        { h: "可以怎么做", html: list(spec.action) },
        { h: spec.clinicTitle || "何时就诊", html: paras(spec.clinic) },
      ];
  return {
    id: spec.id,
    num: spec.num,
    title: spec.title,
    kicker: spec.kicker,
    lead: spec.lead,
    sections,
  };
};

window.BOOK_PARTS = [
  { id: "c1", num: "第一章", title: "男人带来的性问题", key: "CHAPTER1", first: "s01" },
  { id: "c2", num: "第二章", title: "女人带来的性问题", key: "CHAPTER2", first: "c2s01" },
  { id: "c3", num: "第三章", title: "夫妻双方共有的性问题", key: "CHAPTER3", first: "c3s01" },
  { id: "c4", num: "第四章", title: "女人在男人“性”与“不性”中的作用", key: "CHAPTER4", first: "c4s01" },
  { id: "c5", num: "第五章", title: "安全性生活的保障：避孕", key: "CHAPTER5", first: "c5s01" },
  { id: "app", num: "附录", title: "考考你对性了解多少", key: "APPENDIX", first: "app01" },
];
