(function () {
  const parts = (window.BOOK_PARTS || []).map((p) => ({
    ...p,
    items: window[p.key] || [],
  }));
  const chapters = parts.flatMap((p) =>
    p.items.map((item) => ({
      ...item,
      partId: p.id,
      partNum: p.num,
      partTitle: p.title,
    }))
  );
  const byId = Object.fromEntries(chapters.map((c) => [c.id, c]));

  const homeView = document.getElementById("homeView");
  const readView = document.getElementById("readView");
  const articleEl = document.getElementById("article");
  const sideList = document.getElementById("sideList");
  const outlineEl = document.getElementById("outline");
  const app = document.getElementById("app");
  const menuBtn = document.getElementById("menuBtn");
  const backdrop = document.getElementById("backdrop");
  const backTop = document.getElementById("backTop");
  const themeToggle = document.getElementById("themeToggle");

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function applyTheme(theme) {
    const dark =
      theme === "dark" ||
      (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    themeToggle.setAttribute("aria-checked", dark ? "true" : "false");
    localStorage.setItem("reader-theme", theme === "light" || theme === "dark" ? theme : "auto");
  }

  const params = new URLSearchParams(location.search);
  const saved = params.get("theme") || localStorage.getItem("reader-theme") || "auto";
  applyTheme(saved);
  if (params.get("menu") === "1") app.classList.add("sidebar-open");

  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");
    applyTheme(isDark ? "light" : "dark");
  });

  sideList.innerHTML = parts
    .map((p) => {
      const items = p.items
        .map(
          (c) => `
            <div class="VPSidebarItem level-1 is-link" data-id="${esc(c.id)}">
              <div class="item">
                <div class="indicator"></div>
                <a class="link" href="#/${esc(c.id)}">
                  <p class="text">${esc(c.title)}</p>
                </a>
              </div>
            </div>`
        )
        .join("");
      return `
        <div class="group">
          <section class="VPSidebarItem level-0" data-part="${esc(p.id)}">
            <div class="item">
              <div class="indicator"></div>
              <h2 class="text">${esc(p.num)}　${esc(p.title)}</h2>
            </div>
            <div class="items">${items}</div>
          </section>
        </div>`;
    })
    .join("");

  function scrollActiveIntoSidebar() {
    const activeItem = sideList.querySelector(".VPSidebarItem.level-1.is-active");
    const sidebar = document.getElementById("sidebar");
    if (!activeItem || !sidebar) return;
    const group = activeItem.closest(".group");
    const indexInGroup = group
      ? [...group.querySelectorAll(".VPSidebarItem.level-1")].indexOf(activeItem)
      : 0;
    const target = group && indexInGroup === 0 ? group : activeItem;
    const top =
      target.getBoundingClientRect().top -
      sidebar.getBoundingClientRect().top +
      sidebar.scrollTop -
      (target === group ? 8 : 72);
    sidebar.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }

  function scheduleSidebarScroll() {
    requestAnimationFrame(() => {
      scrollActiveIntoSidebar();
      requestAnimationFrame(scrollActiveIntoSidebar);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scrollActiveIntoSidebar);
    }
  }

  function closeSidebar() {
    app.classList.remove("sidebar-open");
  }

  menuBtn.addEventListener("click", () => app.classList.toggle("sidebar-open"));
  backdrop.addEventListener("click", closeSidebar);

  function resolveId(raw) {
    if (!raw || raw === "home") return null;
    if (byId[raw]) return raw;
    const part = parts.find((p) => p.id === raw || p.first === raw);
    if (part && part.items[0]) return part.items[0].id;
    return chapters[0] ? chapters[0].id : null;
  }

  function currentId() {
    return resolveId(location.hash.replace(/^#\/?/, ""));
  }

  function hashFor(id) {
    return id ? "#/" + id : "#/";
  }

  function isCurrentHash(id) {
    const target = hashFor(id);
    const cur = location.hash;
    if (target === "#/") return !cur || cur === "#" || cur === "#/";
    return cur === target;
  }

  function navigate(raw) {
    const id = resolveId(raw);
    if (isCurrentHash(id)) {
      render(id);
      return;
    }
    location.hash = hashFor(id);
  }

  function render(id) {
    const isHome = !id;
    homeView.hidden = !isHome;
    readView.hidden = isHome;
    document.body.classList.toggle("is-home", isHome);
    const partId = isHome ? "" : byId[id].partId;
    document.querySelectorAll(".VPNavBarMenuLink").forEach((el) => {
      const nav = el.dataset.nav;
      if (nav === "home") el.classList.toggle("active", isHome);
      else if (nav === "app") el.classList.toggle("active", partId === "app");
      else if (nav === "read") el.classList.toggle("active", !isHome && partId !== "app");
    });
    document.title = isHome ? "夫妻性生活内参" : `${byId[id].title} | 夫妻性生活内参`;
    if (params.get("menu") !== "1") closeSidebar();
    window.scrollTo(0, 0);
    backTop.classList.remove("show");
    if (isHome) return;

    const idx = chapters.findIndex((c) => c.id === id);
    const item = chapters[idx];
    const prev = chapters[idx - 1];
    const next = chapters[idx + 1];

    sideList.querySelectorAll(".VPSidebarItem.level-1").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.id === id);
    });
    sideList.querySelectorAll(".VPSidebarItem.level-0").forEach((el) => {
      el.classList.toggle("has-active", el.dataset.part === item.partId);
    });
    scheduleSidebarScroll();

    const body = item.sections.map((s, i) => `<h2 id="h${i + 1}">${s.h}</h2>${s.html}`).join("");

    articleEl.innerHTML = `
      <div class="kicker">${item.kicker}</div>
      <h1>${item.num}　${item.title}</h1>
      <blockquote class="notice">
        <p>本节为${item.partNum}导读整理，对应原书问答主题。原文版权归中国协和医科大学出版社与编著者李宏军所有。医学内容供科普参考，不能替代面诊。</p>
      </blockquote>
      <p class="lead">${item.lead}</p>
      ${body}
      <nav class="doc-footer">
        <a class="${prev ? "" : "disabled"}" href="${prev ? "#/" + prev.id : "#/"}">
          <span class="label">上一章</span>
          <span class="title">${prev ? prev.num + "　" + prev.title : ""}</span>
        </a>
        <a class="${next ? "" : "disabled"}" href="${next ? "#/" + next.id : "#/"}" style="text-align:right">
          <span class="label">下一章</span>
          <span class="title">${next ? next.num + "　" + next.title : ""}</span>
        </a>
      </nav>
    `;

    outlineEl.innerHTML = item.sections
      .map((s, i) => `<button type="button" class="outline-link" data-target="h${i + 1}">${s.h}</button>`)
      .join("");
    outlineEl.querySelectorAll(".outline-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById(btn.dataset.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a || a.classList.contains("disabled")) return;
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#/")) return;
    e.preventDefault();
    navigate(href.slice(2));
    if (window.matchMedia("(max-width: 960px)").matches) closeSidebar();
  });

  window.addEventListener("hashchange", () => render(currentId()));
  render(currentId());

  window.addEventListener("scroll", () => {
    backTop.classList.toggle("show", window.scrollY > 480);
    const heads = [...document.querySelectorAll(".vp-doc h2")];
    if (!heads.length) return;
    let current = heads[0];
    for (const h of heads) {
      if (h.getBoundingClientRect().top <= 96) current = h;
    }
    outlineEl.querySelectorAll(".outline-link").forEach((a) => {
      a.classList.toggle("active", a.dataset.target === current.id);
    });
  });

  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  document.addEventListener("keydown", (e) => {
    if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
    const id = currentId();
    if (!id) return;
    const idx = chapters.findIndex((c) => c.id === id);
    if (e.key === "ArrowRight" && chapters[idx + 1]) navigate(chapters[idx + 1].id);
    if (e.key === "ArrowLeft" && chapters[idx - 1]) navigate(chapters[idx - 1].id);
  });
})();
