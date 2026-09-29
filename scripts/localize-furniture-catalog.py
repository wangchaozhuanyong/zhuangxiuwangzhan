"""Build the reviewed Chinese furniture copy from public source catalog text.

This is a one-time editorial helper. The website only reads the generated JSON;
it never calls a translation service at runtime.
"""

import argparse
import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src/data/furnitureCatalog.json"
CACHE = ROOT / "audits/furniture-showcase-20260929/translation-cache.json"
OUTPUT = ROOT / "src/data/furnitureCatalogZh.json"
EN_CACHE = ROOT / "audits/furniture-showcase-20260929/translation-cache-en.json"
EN_OUTPUT = ROOT / "src/data/furnitureCatalogEn.json"
CURATED_NAMES = ROOT / "src/data/furnitureNamesZh.json"
LATIN_WORD = re.compile(r"[A-Za-z]{3,}")
CHINESE = re.compile(r"[\u3400-\u9fff]")


def translate(text, contact_email, language_pair):
    query = urllib.parse.urlencode({
        "q": text,
        "langpair": language_pair,
        "de": contact_email,
    })
    request = urllib.request.Request(
        "https://api.mymemory.translated.net/get?" + query,
        headers={"User-Agent": "FLASH-CAST-furniture-localization/1.0"},
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = json.load(response)
    if payload.get("responseStatus") != 200:
        raise RuntimeError(str(payload.get("responseDetails") or payload))
    result = html.unescape(payload["responseData"]["translatedText"]).strip()
    if not result or "QUERY LENGTH LIMIT" in result.upper() or "DAILY LIMIT" in result.upper():
        raise RuntimeError("Translation service returned no usable text")
    return result


def batches(values, limit=420):
    current = []
    size = 0
    for value in values:
        length = len(value.encode("utf-8")) + 1
        if length > limit:
            if current:
                yield current
                current, size = [], 0
            yield [value]
            continue
        if current and size + length > limit:
            yield current
            current, size = [], 0
        current.append(value)
        size += length
    if current:
        yield current


def fill_cache(values, cache, contact_email, language_pair, cache_path):
    missing = [value for value in values if value not in cache]
    completed = 0
    for index, group in enumerate(batches(missing), 1):
        if len(group) == 1:
            cache[group[0]] = translate(group[0], contact_email, language_pair)
        else:
            translated = translate("\n".join(group), contact_email, language_pair).splitlines()
            if len(translated) != len(group):
                translated = [translate(value, contact_email, language_pair) for value in group]
            cache.update(zip(group, (value.strip() for value in translated)))
        cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n")
        completed += len(group)
        if index % 10 == 0:
            print(f"Translated {completed}/{len(missing)} segments for {language_pair}", flush=True)
        time.sleep(0.15)


def localize_lines(value, cache):
    lines = []
    for line in value.split("\n"):
        prefix = "* " if line.lstrip().startswith("*") else ""
        source = re.sub(r"^\*\s*", "", line.strip())
        lines.append(prefix + cache.get(source, source) if source else "")
    return "\n".join(lines)


def polish_chinese(value):
    replacements = {
        "自组装要求": "需自行组装",
        "产品准备就绪组装": "需自行组装",
        "双层双层床": "双层床",
        "全实木橡胶木": "橡胶木实木",
        "超大单人床": "加宽单人床",
        "奶油色": "米白色",
        "木炭": "炭灰色",
        "左侧或右侧抽屉存放可逆": "抽屉可安装于左侧或右侧",
        "单人单人拉出床": "单人抽拉床",
        "拉出床": "抽拉床",
        "可调节双脚": "可调节桌脚",
        "烧结石": "岩板",
        "餐具套装": "餐桌椅套装",
        "研究台": "书桌",
        "可携带宠物入住": "宠物友好",
        "允许携带宠物入住": "宠物友好",
        "灰木": "白蜡木",
        "全实心": "全实木",
        "实心橡胶木": "橡胶木实木",
        "实心灰木": "白蜡木实木",
        "高密度泡沫": "高密度海绵",
        "可逆梯子": "可左右安装的梯子",
        "标准双人床尺寸": "标准双人床",
        "单&超级单": "单人及加宽单人",
        "超级单人": "加宽单人",
        "DIVAN": "软包床",
        "Divan": "软包床",
        "Pegboard": "洞洞板",
        "Lazy Susan": "转盘",
        "Hutch-Natural": "桌上书架（原木色）",
        "Hutch": "桌上书架",
        "Wenge": "鸡翅木色",
        "Plint": "底座",
        "Easy Clean Fabric": "易清洁面料",
        "Hello Kitty": "凯蒂猫",
        "SHAUN The Sheep": "小羊肖恩",
        "Flexi Sleep": "舒适睡眠",
        "Soldi rood": "实木",
        "Adjustable Level for Bed Base Height": "床板高度可调",
        "Full Solid Ash Wood": "白蜡木实木",
        "Full Solid Rubberwood Bed Frame": "橡胶木实木床架",
        "Full Solid Wood Bed Base": "实木床底座",
        "PU Cushion Headboard": "仿皮软包床头",
        "Natural Color": "原木色",
        "Platform Bed": "地台床",
        "Queen Size": "标准双人",
        "King Size": "特大双人",
        "Sintered Stone": "岩板",
        "Gold Frame": "金色边框",
        "Fully Removable": "全拆洗",
        "Zero Formaldehyde": "零甲醛",
        "3 Zone Hardness": "三区硬度",
        "Roll Pack": "卷包",
        "Dressing Stool": "梳妆凳",
        "Touch Sensor LED Mirror": "触控灯光镜",
        "Soft Closing Glass Door": "缓闭玻璃门",
        "7pcs support rail + 13pcs bed slats": "7 根承重梁及 13 根床板条",
        "Name of Commodity": "商品名称",
        "Dimensions": "尺寸",
        "Art Nova Curve": "弧线造型",
        "Rodolfo Dordoni": "鲁道夫·多尔多尼",
        "co cun 异型沙发": "异形沙发",
        "Easy Clean": "易清洁",
        "PU室内装潢": "仿皮包覆",
        "PU皮革": "仿皮",
        "PU坐垫": "仿皮坐垫",
        "LED镜": "灯光镜",
        "LED学习灯": "照明学习灯",
        "LED灯": "照明灯",
        "LED化妆镜": "灯光化妆镜",
        "PU垫床头板": "仿皮软包床头",
        "软包床床架": "软包床架",
        "加大双人床和加大双人床": "双人及特大双人床",
        "马来西亚标准大号床垫": "马来西亚标准双人床垫",
        "中等膜感": "中等硬度",
        "关闭按钮上的触摸传感器中的敷料镜": "梳妆镜配触控开关",
        "亚麻面料实木相框": "亚麻面料包覆实木框架",
        "USB": "充电接口",
        "LVL": "层压木",
        "MDF": "中密度纤维板",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    value = re.sub(r"(?<=\d)\s*kgs?(?![A-Za-z])", " 公斤", value, flags=re.I)
    value = re.sub(r"(?<=\d)\s*cm(?![A-Za-z])", " 厘米", value, flags=re.I)
    value = re.sub(r"(?<=\d)\s*inc(?![A-Za-z])", " 英寸", value, flags=re.I)
    value = re.sub(r"(?<=\d)\s*pcs(?![A-Za-z])", " 件", value, flags=re.I)
    value = re.sub(r"(?<=\d)\s*m(?![A-Za-z])", " 米", value)
    value = value.replace("W*D*H(mm)", "宽×深×高（毫米）")
    for code, label in (("W", "宽"), ("L", "长"), ("H", "高"), ("D", "深")):
        value = re.sub(rf"(?<![A-Za-z]){code}(?=\d)", label, value)
    value = re.sub(r"(?<=\d)\s*x\s*(?=[\d宽长高深])", " × ", value)
    value = re.sub(r"PU(?![A-Za-z])", "仿皮", value)
    value = re.sub(r"LED(?![A-Za-z])", "灯光", value)
    return value


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--contact-email", required=True)
    args = parser.parse_args()
    catalog = json.loads(CATALOG.read_text())
    products = catalog["products"]
    english_products = [product for product in products if not CHINESE.search(product["name"])]
    values = []
    for product in english_products:
        values.append(product["name"])
        fields = ("shortDescription",) if CHINESE.search(product["description"]) else ("description", "shortDescription")
        for field in fields:
            values.extend(re.sub(r"^\*\s*", "", line.strip()) for line in product[field].split("\n") if line.strip())
    unique_values = list(dict.fromkeys(value for value in values if LATIN_WORD.search(value)))
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    curated_names = json.loads(CURATED_NAMES.read_text())
    print(f"Products: {len(english_products)}, segments: {len(unique_values)}, cached: {len(cache)}", flush=True)
    fill_cache(unique_values, cache, args.contact_email, "en|zh-CN", CACHE)
    localized = {}
    for product in products:
        if product in english_products:
            translated_description = localize_lines(product["description"], cache)
            if CHINESE.search(product["description"]):
                chinese_paragraphs = [line.strip() for line in product["description"].split("\n") if CHINESE.search(line)]
                translated_description = "\n".join(chinese_paragraphs + [localize_lines(product["shortDescription"], cache)])
            localized[product["slug"]] = {
                "name": curated_names[product["slug"]],
                "description": polish_chinese(translated_description),
                "shortDescription": polish_chinese(localize_lines(product["shortDescription"], cache)),
            }
        else:
            localized[product["slug"]] = {
                "name": polish_chinese(product["name"]),
                "description": polish_chinese(product["description"]),
                "shortDescription": polish_chinese(product["shortDescription"]),
            }
    OUTPUT.write_text(json.dumps(localized, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(localized)} products to {OUTPUT}", flush=True)

    chinese_products = [product for product in products if CHINESE.search(product["name"])]
    english_values = list(dict.fromkeys(
        value for product in chinese_products
        for value in [product["name"], *(
            line.strip() for field in ("description", "shortDescription")
            for line in product[field].split("\n") if line.strip()
        )]
        if CHINESE.search(value)
    ))
    english_cache = json.loads(EN_CACHE.read_text()) if EN_CACHE.exists() else {}
    print(f"English products: {len(chinese_products)}, segments: {len(english_values)}, cached: {len(english_cache)}", flush=True)
    fill_cache(english_values, english_cache, args.contact_email, "zh-CN|en", EN_CACHE)
    english_localized = {
        product["slug"]: {
            "name": english_cache[product["name"]],
            "description": localize_lines(product["description"], english_cache),
            "shortDescription": localize_lines(product["shortDescription"], english_cache),
        }
        for product in chinese_products
    }
    for product in english_products:
        if CHINESE.search(product["description"]):
            english_intro = product["description"].split("\n", 1)[0].strip()
            english_localized[product["slug"]] = {
                "name": product["name"],
                "description": "\n".join([english_intro, product["shortDescription"]]),
                "shortDescription": product["shortDescription"],
            }
    EN_OUTPUT.write_text(json.dumps(english_localized, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(english_localized)} products to {EN_OUTPUT}", flush=True)


if __name__ == "__main__":
    main()
