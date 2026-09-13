const params = new URLSearchParams(location.search);
const requestedId = params.get("id");
let currentCat = null;
let allCats = [];

const catFieldLabels = {
  zh: { name: "姓名", sex: "性别", age: "年龄", neutered: "是否绝育", personality: "性格" },
  en: { name: "NAME", sex: "SEX", age: "AGE", neutered: "NEUTERED", personality: "PERSONALITY" },
};

function translateCatValue(key, value, language) {
  if (language !== "en") return value;
  const values = {
    sex: { "公": "Male", "母": "Female", "未知": "Unknown" },
    age: { "未知": "Unknown" },
    neutered: { "是": "Yes", "否": "No", "未知": "Unknown" },
  };
  return values[key]?.[value] || value;
}

function renderIdentification(cat) {
  const language = window.archiveLanguage || "zh";
  const fields = document.querySelector("#identification-fields");
  fields.replaceChildren(...["name", "sex", "age", "neutered", "personality"].filter((key) => key === "name" || cat[key]).map((key) => {
    const item = document.createElement("div");
    const localized = language === "en" && cat[`${key}En`] ? cat[`${key}En`] : cat[key];
    const value = key === "name" ? (language === "en" ? cat.romanizedName : cat.name) : translateCatValue(key, localized, language);
    item.innerHTML = `<dt>${catFieldLabels[language][key]}</dt><dd>${value}</dd>`;
    return item;
  }));
}

function renderCatLanguage(cat) {
  const en = window.archiveLanguage === "en";
  document.querySelector("#cat-name").textContent = en ? cat.romanizedName : cat.name;
  document.querySelector("#cat-description").textContent = en
    ? (cat.descriptionEn || cat.personalityEn || "")
    : (cat.description || (cat.personality ? `${cat.name}的性格记录：${cat.personality}。` : ""));
  renderIdentification(cat);
  const friends = document.querySelector("#cat-friends");
  if (cat.friends?.length) {
    friends.querySelector("div").innerHTML = cat.friends.map((name) => {
      const friend = allCats.find((item) => item.name === name);
      const label = en && friend ? friend.romanizedName : name;
      return friend ? `<a href="./cat.html?id=${friend.id}">${label} →</a>` : `<span>${label}</span>`;
    }).join("");
  }
  const index = allCats.findIndex((item) => item.id === cat.id);
  if (index >= 0) {
    const previous = allCats[(index - 1 + allCats.length) % allCats.length];
    const next = allCats[(index + 1) % allCats.length];
    document.querySelector("#previous-file strong").textContent = en ? previous.romanizedName : previous.name;
    document.querySelector("#next-file strong").textContent = en ? next.romanizedName : next.name;
  }
}

document.addEventListener("archive-language-change", () => {
  if (currentCat) {
    renderCatLanguage(currentCat);
    document.querySelector("#cat-file-number").textContent = `${window.archiveLanguage === "en" ? "FILE NO." : "档案编号"} ${currentCat.id}`;
    document.querySelectorAll("#photo-gallery button span").forEach((node, index) => {
      node.textContent = `${window.archiveLanguage === "en" ? "PHOTO" : "照片"} / ${currentCat.id}-P${String(index + 1).padStart(2, "0")}`;
    });
  }
});

Promise.all([
  fetch("./data/cats.json").then((response) => response.json()),
  fetch("./data/records.json").then((response) => response.json()),
]).then(([cats, records]) => {
  const cat = cats.find((item) => item.id === requestedId) || cats[0];
  if (!cat) return;
  currentCat = cat;
  allCats = cats;
  document.title = `${cat.name} | 北师育荣猫咪档案`;
  document.querySelector("meta[name='description']").content = `${cat.name}的北师大校园猫数字档案与影像记录。`;
  document.querySelector("#cat-file-number").textContent = `${window.archiveLanguage === "en" ? "FILE NO." : "档案编号"} ${cat.id}`;
  document.querySelector("#cat-name").textContent = cat.name;
  const hero = document.querySelector("#cat-cover");
  hero.src = `./${encodeURI(cat.cover)}`;
  hero.alt = `${cat.name}的档案封面照片`;

  renderIdentification(cat);

  const friends = document.querySelector("#cat-friends");
  if (cat.friends?.length) {
    friends.hidden = false;
    friends.querySelector("div").innerHTML = cat.friends.map((name) => {
      const friend = cats.find((item) => item.name === name);
      return friend ? `<a href="./cat.html?id=${friend.id}">${name} →</a>` : `<span>${name}</span>`;
    }).join("");
  }

  const description = document.querySelector("#cat-description");
  if (cat.description) description.textContent = cat.description;
  else if (cat.personality) description.textContent = `${cat.name}的性格记录：${cat.personality}。`;
  else document.querySelector("#cat-about").hidden = true;

  const gallery = document.querySelector("#photo-gallery");
  const photos = cat.photos || [];
  if (photos.length) {
    gallery.dataset.count = Math.min(photos.length, 6);
    gallery.replaceChildren(...photos.map((src, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<img src="./${encodeURI(src)}" alt="${cat.name}的影像档案照片 ${index + 1}" loading="lazy"><span>${window.archiveLanguage === "en" ? "PHOTO" : "照片"} / ${cat.id}-P${String(index + 1).padStart(2, "0")}</span>`;
      button.addEventListener("click", () => openLightbox(src, `${cat.name}的影像档案照片 ${index + 1}`));
      return button;
    }));
  } else document.querySelector("#cat-photos").hidden = true;

  const related = records.filter((record) => record.catIds.includes(cat.id));
  const relatedRoot = document.querySelector("#related-records-list");
  if (related.length) {
    relatedRoot.innerHTML = related.map((record) => `<a href="./record.html?id=${record.id}"><time>${record.publishDate.replaceAll("-", " / ")}</time><span>【${record.category}】${record.title}</span><b>→</b></a>`).join("");
  } else relatedRoot.innerHTML = `<p class="empty-records">${window.archiveLanguage === "en" ? "No public records are linked to this archive." : "暂无与这份档案关联的公开记录。"}</p>`;

  const catIndex = cats.findIndex((item) => item.id === cat.id);
  const previous = cats[(catIndex - 1 + cats.length) % cats.length];
  const next = cats[(catIndex + 1) % cats.length];
  document.querySelector("#previous-file").href = `./cat.html?id=${previous.id}`;
  document.querySelector("#previous-file strong").textContent = previous.name;
  document.querySelector("#next-file").href = `./cat.html?id=${next.id}`;
  document.querySelector("#next-file strong").textContent = next.name;
  renderCatLanguage(cat);
});

const lightbox = document.querySelector("#lightbox");
function openLightbox(src, alt) {
  const image = lightbox.querySelector("img");
  image.src = `./${encodeURI(src)}`;
  image.alt = alt;
  lightbox.showModal();
}
lightbox.querySelector("button").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });
