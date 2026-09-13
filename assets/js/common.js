const archiveTranslations = {
  zh: { navArchive: "档案", navRecords: "公开记录", navAbout: "关于", back: "返回" },
  en: { navArchive: "ARCHIVE", navRecords: "RECORDS", navAbout: "ABOUT", back: "BACK" },
};

window.archiveLanguage = localStorage.getItem("bnu-archive-language") || "zh";

window.applyArchiveLanguage = function applyArchiveLanguage() {
  const language = window.archiveLanguage;
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.body.classList.toggle("lang-en", language === "en");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = archiveTranslations[language]?.[node.dataset.i18n];
    if (value) node.textContent = value;
  });
  document.querySelectorAll("[data-zh][data-en]").forEach((node) => {
    node.textContent = language === "zh" ? node.dataset.zh : node.dataset.en;
  });
  const toggle = document.querySelector(".language-toggle");
  if (toggle) {
    toggle.textContent = language === "zh" ? "EN" : "中文";
    toggle.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换为中文");
  }
  document.dispatchEvent(new CustomEvent("archive-language-change", { detail: { language } }));
};

const languageToggle = document.querySelector(".language-toggle");
if (languageToggle) languageToggle.addEventListener("click", () => {
  window.archiveLanguage = window.archiveLanguage === "zh" ? "en" : "zh";
  localStorage.setItem("bnu-archive-language", window.archiveLanguage);
  window.applyArchiveLanguage();
});

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");
const innerNav = document.querySelector(".inner-page .site-nav");
if (innerNav) {
  const backButton = document.createElement("button");
  backButton.className = "page-back-button";
  backButton.type = "button";
  backButton.innerHTML = '<span>←</span><b data-i18n="back">返回</b>';
  backButton.setAttribute("aria-label", "返回上一页");
  backButton.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.href = "./index.html";
  });
  innerNav.insertBefore(backButton, innerNav.firstElementChild);
}
if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
}

window.applyArchiveLanguage();
