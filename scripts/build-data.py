from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from urllib.parse import quote


SOURCE = Path(__file__).resolve().parents[2]
SITE = Path(__file__).resolve().parents[1]
DATA_DIR = SITE / "data"
IMAGE_DIR = SITE / "assets" / "images"
MEDIA_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm"}

ROMANIZED = {
    "八戒": "BAJIE",
    "白虎": "BAIHU",
    "蝙蝠侠": "BIANFUXIA",
    "大耗子": "DAHAOZI",
    "大黄尾巴": "DAHUANGWEIBA",
    "警长": "JINGZHANG",
    "老黑": "LAOHEI",
    "媒婆": "MEIPO",
    "下眼线": "XIAYANXIAN",
    "小白": "XIAOBAI",
    "小虎": "XIAOHU",
    "小梨": "XIAOLI",
}

CATEGORY_EN = {
    "财务及捐赠公示": "FINANCE & DONATIONS",
    "讣告": "MEMORIAL",
    "绝育申请及公示": "TNR RECORDS",
    "猫咪救助": "RESCUE",
    "猫咪日常": "CAT DAILY",
    "找领养": "ADOPTION",
}

CAT_TRANSLATIONS = {
    "下眼线": {
        "age": "1 year",
        "personality": "Wary of people",
        "description": "In November 2025, a tiny calico appeared and moved into a shelter we had just built in the campus garden. She looked about two months old. The white markings beneath her eyes inspired the name Xiayanxian. For her first few months she followed a cross-eyed orange cat everywhere and showed an extraordinary appetite. Later she began staying close to Baihu. Watching Baihu enjoy attention helped her gradually approach people, suggesting that patient affection could help her adapt well to a home.",
    },
    "八戒": {
        "personality": "Relatively comfortable around people",
        "description": "Bajie suddenly appeared at the feeding point one March afternoon, quietly guarding the water bowl. He did not flee when people approached, although he would hiss if they came too close. As a newcomer he was often chased by the orange cat and Baihu, so he appeared early each morning for a full meal and then disappeared. When food was late, he waited on top of the cat shelter—an impressively agile little tuxedo cat.",
    },
    "大耗子": {
        "personality": "Unknown",
        "description": "Dahaozi is a follower of campus cat king Laohei. During mating season he often roamed the campus with Laohei, calling loudly. In winter he liked visiting the garage and leaving paw prints on cars. With patient guidance from two students, he finally climbed into a transfer bag for his trip to care.",
    },
    "大黄尾巴": {
        "personality": "Shy around people, but territorial toward other cats",
        "description": "Dahuangweiba has a large appetite and a strong build, and can be aggressive toward other cats.",
    },
    "媒婆": {"personality": "Wary of people"},
    "小梨": {
        "personality": "Shy",
        "description": "Xiaoli is one of the older stray cats on campus. When first seen, he kept a careful distance and his sex was difficult to determine, earning him an early nickname meaning aloof older brother. He later settled at a regular feeding point with a beautiful calico companion. After she was adopted, Xiaoli searched around campus and disappeared for several days before returning.",
    },
    "小白": {"personality": "Shy but friendly"},
    "小虎": {"personality": "Rather shy"},
    "白虎": {"personality": "Affectionate, food-loving, and one of the friendliest cats on campus"},
    "老黑": {"personality": "Unknown"},
    "蝙蝠侠": {
        "personality": "Rather shy",
        "description": "Bianfuxia is a large white campus cat. Eye discharge and a cautious temperament make close-up photographs rare; from a distance, the markings around the eyes resemble a masked Batman.",
    },
    "警长": {
        "personality": "Shy",
        "description": "This black-and-white cat is known as Jingzhang, or the Inspector. Students joke that he is the most formally dressed cat on campus. Despite the impressive name, he is timid and often disappears at the slightest disturbance.",
    },
}


def read_text(path: Path) -> tuple[str | None, str | None]:
    raw = path.read_bytes()
    for encoding in ("utf-8", "utf-8-sig", "gb18030"):
        try:
            return raw.decode(encoding), None
        except UnicodeDecodeError:
            pass
    return None, f"无法解析文本编码：{path.relative_to(SOURCE)}"


def parse_fields(text: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    current = None
    chunks: list[str] = []
    known_fields = {"姓名", "年龄", "性别", "是否绝育", "性格", "描述", "好友", "状态", "标题", "发布人", "发布时间", "正文", "原文链接"}
    for line in text.replace("\r\n", "\n").split("\n"):
        match = re.match(r"^\s*([^：:\n]+)[：:]\s*(.*)$", line)
        if match and match.group(1).strip() in known_fields:
            if current:
                fields[current] = "\n".join(chunks).strip()
            current = match.group(1).strip()
            chunks = [match.group(2).strip()]
        elif current:
            chunks.append(line.rstrip())
    if current:
        fields[current] = "\n".join(chunks).strip()
    return fields


def copy_media(src: Path, dest: Path) -> str:
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    return dest.relative_to(SITE).as_posix()


def safe_slug(name: str, fallback: str) -> str:
    mapped = ROMANIZED.get(name)
    if mapped:
        return mapped.lower()
    ascii_slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return ascii_slug or fallback


def build() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    warnings: list[str] = []

    hero = SOURCE / "网站封面.jpg"
    if hero.exists():
        copy_media(hero, IMAGE_DIR / "hero.jpg")
    else:
        warnings.append("缺少网站封面.jpg")

    cats: list[dict] = []
    cat_root = SOURCE / "档案"
    cat_dirs = sorted((p for p in cat_root.iterdir() if p.is_dir()), key=lambda p: p.name)
    for index, folder in enumerate(cat_dirs, 1):
        cat_id = f"BNU-CA-{index:03d}"
        txt_files = sorted(folder.glob("*.txt"))
        fields: dict[str, str] = {}
        if txt_files:
            text, error = read_text(txt_files[0])
            if error:
                warnings.append(error)
            elif text is not None:
                fields = parse_fields(text)
        else:
            warnings.append(f"缺少档案文本：{folder.relative_to(SOURCE)}")

        file_name = fields.get("姓名", folder.name)
        if file_name != folder.name:
            warnings.append(
                f"目录与资料姓名不一致：{folder.relative_to(SOURCE)}（目录“{folder.name}”，资料“{file_name}”）"
            )
        name = folder.name
        slug = safe_slug(name, f"cat-{index:03d}")
        media_files = sorted(
            (p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in MEDIA_EXTENSIONS),
            key=lambda p: (p.name.lower() != "cover.jpg", p.name),
        )
        copied_media = []
        for media_index, media in enumerate(media_files, 1):
            extension = media.suffix.lower()
            filename = "cover" + extension if media.name.lower() == "cover.jpg" else f"photo-{media_index:02d}{extension}"
            copied_media.append(copy_media(media, IMAGE_DIR / "cats" / slug / filename))
        cover = next((path for path in copied_media if Path(path).stem == "cover"), copied_media[0] if copied_media else "")
        friends = [item.strip() for item in re.split(r"[，,、\s]+", fields.get("好友", "")) if item.strip()]
        cat = {
            "id": cat_id,
            "name": name,
            "romanizedName": ROMANIZED.get(name, ""),
            "slug": slug,
            "cover": cover,
            "photos": [path for path in copied_media if path != cover],
        }
        for source_key, target_key in (
            ("年龄", "age"),
            ("性别", "sex"),
            ("是否绝育", "neutered"),
            ("性格", "personality"),
            ("描述", "description"),
        ):
            if fields.get(source_key):
                cat[target_key] = fields[source_key]
        translations = CAT_TRANSLATIONS.get(name, {})
        if translations.get("age"):
            cat["ageEn"] = translations["age"]
        if translations.get("personality"):
            cat["personalityEn"] = translations["personality"]
        if translations.get("description"):
            cat["descriptionEn"] = translations["description"]
        if friends:
            cat["friends"] = friends
        cats.append(cat)

    cat_names = {cat["name"] for cat in cats}
    name_to_id = {cat["name"]: cat["id"] for cat in cats}
    records: list[dict] = []
    post_root = SOURCE / "post"
    record_index = 0
    for category in sorted((p for p in post_root.iterdir() if p.is_dir()), key=lambda p: p.name):
        for folder in sorted((p for p in category.iterdir() if p.is_dir()), key=lambda p: p.name):
            record_index += 1
            post_id = f"POST-{record_index:03d}"
            txt_files = sorted(folder.glob("*.txt"))
            fields = {}
            text = None
            if txt_files:
                text, error = read_text(txt_files[0])
                if error:
                    warnings.append(error)
                elif text is not None:
                    fields = parse_fields(text)
            else:
                warnings.append(f"缺少帖子文本：{folder.relative_to(SOURCE)}")

            body = fields.get("正文", "")
            cat_tags = list(dict.fromkeys(re.findall(r"#([^\s#，,。；;！!？?]+)", body)))
            body = re.sub(r"(?m)^\s*(?:#[^\s#，,。；;！!？?]+\s*)+$", "", body).strip()
            for tag in cat_tags:
                if tag not in cat_names:
                    warnings.append(f"帖子标签未找到对应档案：{folder.relative_to(SOURCE)}（#{tag}）")
            url_match = re.search(r"https?://\S+", fields.get("原文链接", ""))
            slug = f"record-{record_index:03d}"
            media_files = sorted(
                (p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in MEDIA_EXTENSIONS),
                key=lambda p: (p.stem.lower() != "cover", p.name),
            )
            media = []
            for media_index, item in enumerate(media_files, 1):
                media_type = "video" if item.suffix.lower() in {".mp4", ".webm"} else "image"
                filename = f"media-{media_index:02d}{item.suffix.lower()}"
                media.append({
                    "type": media_type,
                    "src": copy_media(item, IMAGE_DIR / "records" / slug / filename),
                    "isCover": item.stem.lower() == "cover",
                })
            date = fields.get("发布时间", "").strip()
            date = re.sub(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", lambda m: f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}", date)
            records.append({
                "id": post_id,
                "slug": slug,
                "category": category.name,
                "categoryEn": CATEGORY_EN.get(category.name, category.name),
                "title": fields.get("标题", folder.name),
                "author": fields.get("发布人", ""),
                "publishDate": date,
                "body": body,
                "catTags": cat_tags,
                "catIds": [name_to_id[tag] for tag in cat_tags if tag in name_to_id],
                "originalUrl": url_match.group(0) if url_match else "",
                "media": media,
            })

    for cat in cats:
        cat["relatedRecords"] = [record["id"] for record in records if cat["name"] in record["catTags"]]

    records.sort(key=lambda item: item["publishDate"], reverse=True)
    (DATA_DIR / "cats.json").write_text(json.dumps(cats, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "records.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "cat-name-map.json").write_text(json.dumps(name_to_id, ensure_ascii=False, indent=2), encoding="utf-8")
    report = {
        "cats": len(cats),
        "categories": sorted({record["category"] for record in records}),
        "records": len(records),
        "warnings": warnings,
    }
    (DATA_DIR / "build-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    build()
