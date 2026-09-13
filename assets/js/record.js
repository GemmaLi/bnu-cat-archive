const recordParams = new URLSearchParams(location.search);
const recordId = recordParams.get("id");
let currentRecord = null;
let currentCats = [];

function renderRecordInterface(record) {
  const language = window.archiveLanguage || "zh";
  const en = language === "en";
  const isMemorial = record.category === "讣告";
  document.querySelector("#record-kicker").textContent = isMemorial ? (en ? "MEMORIAL RECORD" : "纪念档案") : (en ? "PUBLIC RECORD" : "公开记录");
  document.querySelector("#record-id").textContent = `${en ? "RECORD" : "序号"} / ${record.id.replace("POST-", "")}`;
  document.querySelector("#record-category").textContent = `${en ? "CATEGORY" : "分类"} / ${en ? record.categoryEn : record.category}`;
  document.querySelector("#record-date").textContent = `${en ? "PUBLISHED" : "发布时间"} / ${record.publishDate.replaceAll("-", ".")}`;
  document.querySelector("#record-author").textContent = `${en ? "AUTHOR" : "发布人"} / ${record.author}`;
  renderRecordMedia(record);
  renderRelatedArchives(record, currentCats);
}

function renderRecordMedia(record) {
  const mediaRoot = document.querySelector("#record-media");
  const en = (window.archiveLanguage || "zh") === "en";
  const cover = record.media.find((item) => item.isCover && item.type === "image");
  if (cover) {
    const feature = document.querySelector("#record-cover-feature");
    const image = document.querySelector("#record-cover-image");
    image.src = `./${encodeURI(cover.src)}`;
    image.alt = `${record.title}封面照片`;
    feature.hidden = false;
  }
  if (record.media.length) {
    mediaRoot.dataset.count = Math.min(record.media.length, 6);
    mediaRoot.innerHTML = record.media.map((media, index) => media.type === "video"
      ? `<figure><video controls preload="metadata"${cover ? ` poster="./${encodeURI(cover.src)}"` : ""}><source src="./${encodeURI(media.src)}"></video><figcaption>${en ? "VIDEO" : "视频"} / ${record.id}-V${String(index + 1).padStart(2, "0")}</figcaption></figure>`
      : `<figure><img src="./${encodeURI(media.src)}" alt="${record.title}的照片 ${index + 1}" loading="lazy"><figcaption>${en ? "PHOTO" : "照片"} / ${record.id}-P${String(index + 1).padStart(2, "0")}</figcaption></figure>`
    ).join("");
  } else document.querySelector("#record-media-section").hidden = true;
}

function renderRelatedArchives(record, cats) {
  const relatedCats = cats.filter((cat) => record.catIds.includes(cat.id));
  const relatedRoot = document.querySelector("#related-archives-list");
  if (relatedCats.length) {
    relatedRoot.innerHTML = relatedCats.map((cat) => `<a href="./cat.html?id=${cat.id}"><span>${cat.id}</span><strong>${window.archiveLanguage === "en" ? cat.romanizedName : cat.name}</strong><b>→</b></a>`).join("");
  } else relatedRoot.innerHTML = `<p class="empty-records">${window.archiveLanguage === "en" ? "No cat archive is linked to this record." : "此记录尚未关联到具体猫咪档案。"}</p>`;
}

document.addEventListener("archive-language-change", () => {
  if (currentRecord) renderRecordInterface(currentRecord);
});

Promise.all([
  fetch("./data/records.json").then((response) => response.json()),
  fetch("./data/cats.json").then((response) => response.json()),
]).then(([records, cats]) => {
  const record = records.find((item) => item.id === recordId) || records[0];
  if (!record) return;
  currentRecord = record;
  currentCats = cats;
  const isMemorial = record.category === "讣告";
  document.body.classList.toggle("memorial-record", isMemorial);
  document.title = `${record.title} | 北师育荣猫咪档案`;
  document.querySelector("meta[name='description']").content = `${record.category}：${record.title}`;
  document.querySelector("#record-title").textContent = `【${record.category}】${record.title}`;
  document.querySelector("#record-body").textContent = record.body;
  renderRecordInterface(record);

  const original = document.querySelector("#original-record");
  if (record.originalUrl) {
    original.href = record.originalUrl;
    original.hidden = false;
  }
});
