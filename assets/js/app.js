const translations = {
  zh: {
    navArchive: "档案",
    navRecords: "公开记录",
    navAbout: "关于",
    enterArchive: "查看全部档案",
    archiveTitle: "猫咪档案",
    archiveIntro: "以姓名为索引，保存它们在校园里留下的影像与故事。",
    dragHint: "按住并拖动浏览",
    recordsTitle: "公开记录",
    viewAll: "查看全部记录",
    aboutTitle: "关于档案",
    aboutLead: "将散落在校园帖子、照片和同学记忆中的猫咪信息，整理成一套可以持续保存、浏览、关联和查阅的数字档案。",
    aboutBody: "档案以真实照片与公开记录为基础。每一个名字、日期和关联都来自现有资料；缺失的信息保持空白，等待未来被认真补充。",
  },
  en: {
    navArchive: "ARCHIVE",
    navRecords: "RECORDS",
    navAbout: "ABOUT",
    enterArchive: "VIEW ALL ARCHIVES",
    archiveTitle: "CAT ARCHIVE",
    archiveIntro: "An index of the images and stories left by campus cats.",
    dragHint: "CLICK AND DRAG TO EXPLORE",
    recordsTitle: "PUBLIC RECORDS",
    viewAll: "VIEW ALL RECORDS",
    aboutTitle: "ABOUT THE ARCHIVE",
    aboutLead: "Scattered posts, photographs and shared memories are gathered into a lasting digital archive for browsing, reference and connection.",
    aboutBody: "The archive is grounded in real photographs and public records. Names, dates and connections come from existing material; missing information remains open for careful future updates.",
  },
};

const categoryLabels = {
  "财务及捐赠公示": "FINANCE & DONATIONS",
  "讣告": "MEMORIAL",
  "绝育申请及公示": "TNR RECORDS",
  "猫咪救助": "RESCUE",
  "猫咪日常": "CAT DAILY",
  "找领养": "ADOPTION",
};

const state = {
  language: localStorage.getItem("bnu-archive-language") || "zh",
  paused: false,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  cats: [],
  records: [],
  recordCategory: "全部",
};

const formatMeta = (cat) => {
  const sex = cat.sex === "公" ? "♂" : cat.sex === "母" ? "♀" : cat.sex || "";
  const neutered = cat.neutered === "是" ? (state.language === "zh" ? "已绝育" : "NEUTERED") : "";
  return [sex, neutered].filter(Boolean).join(" · ");
};

function catCard(cat, duplicate = false) {
  const article = document.createElement("a");
  article.className = "archive-card";
  article.href = `./cat.html?id=${encodeURIComponent(cat.id)}`;
  article.dataset.catId = cat.id;
  article.setAttribute("aria-label", `查看${cat.name}的猫咪档案`);
  article.title = `查看${cat.name}的猫咪档案`;
  article.draggable = false;
  if (duplicate) {
    article.setAttribute("aria-hidden", "true");
    article.tabIndex = -1;
  }
  article.innerHTML = `
    <p class="file-number">${state.language === "zh" ? "档案编号" : "FILE NO."} ${cat.id}</p>
    <div class="archive-image-wrap">
      <img src="./${encodeURI(cat.cover)}" alt="${cat.name}的校园档案照片" loading="lazy" draggable="false">
    </div>
    <footer>
      <div><span class="cat-name">${state.language === "zh" ? cat.name : cat.romanizedName}</span></div>
      <span class="cat-meta">${formatMeta(cat)}</span>
    </footer>`;
  return article;
}

function renderCats(cats) {
  const track = document.querySelector("#archive-track");
  track.replaceChildren(...cats.map((cat) => catCard(cat)), ...cats.map((cat) => catCard(cat, true)));
  document.querySelector("#archive-count").textContent = state.language === "zh" ? `共 ${cats.length} 份档案` : `${cats.length} ARCHIVES`;
  startArchiveMotion();
}

function renderRecords(records) {
  const list = document.querySelector("#record-list");
  const order = ["猫咪日常", "猫咪救助", "找领养", "绝育申请及公示", "财务及捐赠公示", "讣告"];
  const visible = state.recordCategory === "全部" ? records : records.filter((record) => record.category === state.recordCategory);
  list.replaceChildren(...visible.slice(0, 6).map((record, index) => {
    const item = document.createElement("a");
    item.className = `home-record-row${record.category === "讣告" ? " memorial-row" : ""}`;
    item.href = `./record.html?id=${encodeURIComponent(record.id)}`;
    item.innerHTML = `<span class="home-record-index">${String(index + 1).padStart(2, "0")}</span><time datetime="${record.publishDate}">${record.publishDate.replaceAll("-", ".")}</time><span class="home-record-copy"><strong>【${record.category}】${record.title}</strong><em>${record.author}</em></span><b>→</b>`;
    return item;
  }));

  const filterRoot = document.querySelector("#home-record-filter-buttons");
  filterRoot.replaceChildren(...["全部", ...order].map((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = category === state.recordCategory ? "active" : "";
    button.textContent = state.language === "zh" ? category : (category === "全部" ? "ALL" : categoryLabels[category]);
    button.addEventListener("click", () => {
      state.recordCategory = category;
      renderRecords(state.records);
    });
    return button;
  }));
}

function startArchiveMotion() {
  const rail = document.querySelector("#archive-rail");
  let previous = performance.now();
  function tick(now) {
    const elapsed = Math.min(now - previous, 40);
    previous = now;
    if (!state.reducedMotion && !state.paused) {
      rail.scrollLeft += elapsed * .018;
      if (rail.scrollLeft >= rail.scrollWidth / 2) rail.scrollLeft -= rail.scrollWidth / 2;
    }
    requestAnimationFrame(tick);
  }
  rail.addEventListener("mouseenter", () => { state.paused = true; });
  rail.addEventListener("mouseleave", () => { state.paused = false; });
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  let inertiaFrame = 0;
  let suppressClickUntil = 0;

  const normalizeScroll = () => {
    const midpoint = rail.scrollWidth / 2;
    if (rail.scrollLeft >= midpoint) rail.scrollLeft -= midpoint;
    else if (rail.scrollLeft < 0) rail.scrollLeft += midpoint;
  };

  const stopInertia = () => {
    if (inertiaFrame) cancelAnimationFrame(inertiaFrame);
    inertiaFrame = 0;
  };

  const beginInertia = () => {
    if (state.reducedMotion || Math.abs(velocity) < .035) {
      state.paused = rail.matches(":hover");
      return;
    }
    let previousTime = performance.now();
    const glide = (now) => {
      const elapsed = Math.min(now - previousTime, 32);
      previousTime = now;
      rail.scrollLeft += velocity * elapsed;
      normalizeScroll();
      velocity *= Math.pow(.94, elapsed / 16.67);
      if (Math.abs(velocity) > .012) inertiaFrame = requestAnimationFrame(glide);
      else {
        inertiaFrame = 0;
        state.paused = rail.matches(":hover");
      }
    };
    inertiaFrame = requestAnimationFrame(glide);
  };

  rail.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopInertia();
    dragging = true;
    moved = false;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    lastX = event.clientX;
    lastTime = performance.now();
    velocity = 0;
    state.paused = true;
    rail.classList.add("is-dragging");
  });
  rail.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) > 4 && !moved) {
      moved = true;
      rail.setPointerCapture(event.pointerId);
    }
    rail.scrollLeft = startScroll - distance;
    const now = performance.now();
    const elapsed = Math.max(now - lastTime, 1);
    const instantaneous = -(event.clientX - lastX) / elapsed;
    velocity = velocity * .68 + instantaneous * .32;
    lastX = event.clientX;
    lastTime = now;
  });
  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    rail.classList.remove("is-dragging");
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    if (moved) {
      suppressClickUntil = performance.now() + 260;
      beginInertia();
    }
    else state.paused = rail.matches(":hover");
    moved = false;
  };
  rail.addEventListener("pointerup", endDrag);
  rail.addEventListener("pointercancel", endDrag);
  rail.addEventListener("click", (event) => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const card = event.target.closest(".archive-card");
    if (!card) return;
  }, true);
  requestAnimationFrame(tick);
}

function applyLanguage() {
  document.body.classList.toggle("lang-en", state.language === "en");
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = translations[state.language][node.dataset.i18n];
  });
  document.querySelectorAll("[data-zh][data-en]").forEach((node) => {
    node.textContent = state.language === "zh" ? node.dataset.zh : node.dataset.en;
  });
  document.querySelectorAll("[data-category]").forEach((node) => {
    node.textContent = state.language === "zh" ? node.dataset.category : categoryLabels[node.dataset.category];
  });
  document.querySelectorAll(".archive-card").forEach((card) => {
    const cat = state.cats.find((item) => item.id === card.dataset.catId);
    const meta = card.querySelector(".cat-meta");
    if (cat && meta) meta.textContent = formatMeta(cat);
    const name = card.querySelector(".cat-name");
    if (cat && name) name.textContent = state.language === "zh" ? cat.name : cat.romanizedName;
    const number = card.querySelector(".file-number");
    if (cat && number) number.textContent = `${state.language === "zh" ? "档案编号" : "FILE NO."} ${cat.id}`;
  });
  if (state.cats.length) document.querySelector("#archive-count").textContent = state.language === "zh" ? `共 ${state.cats.length} 份档案` : `${state.cats.length} ARCHIVES`;
  if (state.records.length) renderRecords(state.records);
  const toggle = document.querySelector(".language-toggle");
  toggle.textContent = state.language === "zh" ? "EN" : "中文";
  toggle.setAttribute("aria-label", state.language === "zh" ? "Switch to English" : "切换为中文");
}

document.querySelector(".language-toggle").addEventListener("click", () => {
  state.language = state.language === "zh" ? "en" : "zh";
  localStorage.setItem("bnu-archive-language", state.language);
  applyLanguage();
});

const menu = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");
menu.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
});
navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
}));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach((section) => revealObserver.observe(section));

if (!state.reducedMotion && matchMedia("(min-width: 769px)").matches) {
  addEventListener("scroll", () => {
    document.querySelector(".hero-image").style.transform = `translateY(${Math.min(scrollY * .055, 32)}px)`;
  }, { passive: true });
}

Promise.all([
  fetch("./data/cats.json").then((response) => response.json()),
  fetch("./data/records.json").then((response) => response.json()),
]).then(([cats, records]) => {
  state.cats = cats;
  state.records = records;
  renderCats(cats);
  renderRecords(records);
  applyLanguage();
}).catch(() => {
  document.querySelector("#archive-track").innerHTML = '<p class="loading-note">档案数据加载失败，请通过本地服务器或 GitHub Pages 访问。</p>';
  document.querySelector("#record-list").innerHTML = '<p class="loading-note inverse">公开记录暂时无法加载。</p>';
});

applyLanguage();
