const categoryOrder = ["猫咪日常", "猫咪救助", "找领养", "绝育申请及公示", "财务及捐赠公示", "讣告"];
const categoryEnglish = {
  "财务及捐赠公示": "FINANCE & DONATIONS", "讣告": "MEMORIAL", "绝育申请及公示": "TNR RECORDS",
  "猫咪救助": "RESCUE", "猫咪日常": "CAT DAILY", "找领养": "ADOPTION",
};

let allRecords = [];
let activeCategory = "全部";
const categoryLabel = (category) => window.archiveLanguage === "en" ? (category === "全部" ? "ALL" : categoryEnglish[category]) : category;

function renderRecordDirectory(records) {
  const root = document.querySelector("#records-directory");
  const visible = activeCategory === "全部" ? records : records.filter((record) => record.category === activeCategory);
  root.replaceChildren(...visible.map((record, index) => {
    const item = document.createElement("a");
    item.className = `chronology-record${record.category === "讣告" ? " chronology-memorial" : ""}`;
    item.href = `./record.html?id=${encodeURIComponent(record.id)}`;
    item.innerHTML = `
      <span class="chronology-index">${String(index + 1).padStart(2, "0")}</span>
      <time datetime="${record.publishDate}"><strong>${record.publishDate.slice(0, 4)}</strong>${record.publishDate.slice(5).replace("-", " / ")}</time>
      <span class="chronology-copy"><strong>【${record.category}】${record.title}</strong><em>${record.author}</em></span>
      <span class="directory-arrow">→</span>`;
    return item;
  }));
}

function renderFilters() {
  const filters = document.querySelector("#record-filter-buttons");
  const options = ["全部", ...categoryOrder];
  filters.replaceChildren(...options.map((category, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = category === activeCategory ? "active" : "";
    button.dataset.category = category;
    const count = category === "全部" ? allRecords.length : allRecords.filter((record) => record.category === category).length;
    button.innerHTML = `<span>${categoryLabel(category)}</span><b>${String(count).padStart(2, "0")}</b>`;
    button.addEventListener("click", () => {
      activeCategory = category;
      renderFilters();
      renderRecordDirectory(allRecords);
    });
    return button;
  }));
}

fetch("./data/records.json").then((response) => response.json()).then((records) => {
  allRecords = records;
  renderFilters();
  renderRecordDirectory(records);
});

document.addEventListener("archive-language-change", () => {
  if (allRecords.length) {
    renderFilters();
    renderRecordDirectory(allRecords);
  }
});
