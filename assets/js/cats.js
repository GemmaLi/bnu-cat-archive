let catsData = [];
const catsGrid = document.querySelector("#cats-grid");

function catalogMeta(cat) {
  if (window.archiveLanguage === "en") {
    const sex = cat.sex === "公" ? "Male" : cat.sex === "母" ? "Female" : cat.sex;
    return [sex, cat.neutered === "是" ? "Neutered" : ""].filter(Boolean).join(" / ");
  }
  return [cat.sex, cat.neutered === "是" ? "已绝育" : ""].filter(Boolean).join(" / ");
}

function renderCatList() {
  catsGrid.replaceChildren(...catsData.map((cat) => {
    const link = document.createElement("a");
    link.className = "catalog-cat";
    link.href = `./cat.html?id=${encodeURIComponent(cat.id)}`;
    link.innerHTML = `
      <span class="catalog-number">${cat.id}</span>
      <span class="catalog-photo"><img src="./${encodeURI(cat.cover)}" alt="${cat.name}的档案照片" loading="lazy"></span>
      <span class="catalog-name">${window.archiveLanguage === "en" ? cat.romanizedName : cat.name}</span>
      <span class="catalog-meta">${catalogMeta(cat)}</span>
      <span class="catalog-arrow">→</span>`;
    return link;
  }));
}

document.addEventListener("archive-language-change", () => {
  if (catsData.length) renderCatList();
});

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
  catsGrid.dataset.view = button.dataset.view;
}));

fetch("./data/cats.json").then((response) => response.json()).then((cats) => {
  catsData = cats;
  renderCatList();
});
