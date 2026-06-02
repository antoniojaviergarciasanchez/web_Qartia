#!/usr/bin/env python3
import argparse
import json
import os
import posixpath
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from lxml import html


LANGUAGES = {
    "en": "en",
    "de": "de",
}

SKIP_TAGS = {"script", "style", "noscript", "svg", "code", "pre"}
TEXT_ATTRS = {"alt", "aria-label", "placeholder", "title"}
URL_ATTRS = {
    "href",
    "src",
    "poster",
    "data-desktop-src",
    "data-desktop-video-src",
    "data-mobile-src",
}
PUBLIC_EXCLUDES = {"index_old.html", "index_oldv2.html", "page-template.html"}
PROTECTED_TERMS = [
    "Qartia Smart Technologies",
    "QARTIA",
    "Qartia",
    "MEGAMIA",
    "DIPASON",
    "NOISEMENT",
    "AIRSENSE",
    "BIOSENTIA",
    "VIBRASENSE",
    "DECT NR+",
    "DECT-2020 NR",
    "LoRaWAN",
    "LoRa",
    "RAG",
    "IoT",
    "5G",
]


def public_html_files(root: Path):
    files = []
    for path in root.glob("*.html"):
        if path.name not in PUBLIC_EXCLUDES:
            files.append(path)
    files.extend(root.joinpath("sources").glob("*.html"))
    return sorted(files, key=lambda item: item.as_posix())


def should_translate(value: str) -> bool:
    stripped = value.strip()
    if not stripped:
        return False
    if not re.search(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]", stripped):
        return False
    if re.fullmatch(r"[\W\d_]+", stripped):
        return False
    return True


def preserve_whitespace(original: str, translated: str) -> str:
    prefix = original[: len(original) - len(original.lstrip())]
    suffix = original[len(original.rstrip()) :]
    return prefix + translated.strip() + suffix


def protect_terms(text: str):
    protected = {}
    result = text
    for index, term in enumerate(PROTECTED_TERMS):
        token = f"__QARTIA_TERM_{index}__"
        if term in result:
            result = result.replace(term, token)
            protected[token] = term
    return result, protected


def restore_terms(text: str, protected: dict):
    result = text
    for token, term in protected.items():
        result = result.replace(token, term)
        result = result.replace(token.lower(), term)
    return result


def translate_batch(texts, target_lang, cache):
    pending = []
    protected_by_text = {}
    for text in texts:
        key = f"es:{target_lang}:{text}"
        if key in cache:
            continue
        protected_text, protected = protect_terms(text)
        protected_by_text[text] = protected
        pending.append((text, protected_text))

    for start in range(0, len(pending), 35):
        chunk = pending[start : start + 35]
        marked = "\n".join(f"[[[{i}]]] {protected_text}" for i, (_, protected_text) in enumerate(chunk))
        params = urllib.parse.urlencode(
            {
                "client": "gtx",
                "sl": "es",
                "tl": target_lang,
                "dt": "t",
                "q": marked,
            }
        )
        url = "https://translate.googleapis.com/translate_a/single?" + params

        with urllib.request.urlopen(url, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))

        translated_block = "".join(part[0] for part in payload[0])
        matches = list(re.finditer(r"\[\[\[(\d+)\]\]\]\s*", translated_block))
        translated_items = {}
        for index, match in enumerate(matches):
            item_number = int(match.group(1))
            content_start = match.end()
            content_end = matches[index + 1].start() if index + 1 < len(matches) else len(translated_block)
            translated_items[item_number] = translated_block[content_start:content_end].strip()

        for item_index, (original, _) in enumerate(chunk):
            translated = translated_items.get(item_index, original)
            translated = restore_terms(translated, protected_by_text.get(original, {}))
            cache[f"es:{target_lang}:{original}"] = translated

        time.sleep(0.15)


def split_url(value: str):
    if not value:
        return value, "", ""
    match = re.match(r"([^?#]*)(\?[^#]*)?(#.*)?$", value)
    if not match:
        return value, "", ""
    return match.group(1), match.group(2) or "", match.group(3) or ""


def is_external_url(value: str) -> bool:
    stripped = value.strip()
    if (
        not stripped
        or stripped.startswith("#")
        or stripped.startswith("//")
        or re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", stripped)
        or stripped.startswith("/")
    ):
        return True
    return False


def normalize_target(source_rel: str, url_path: str) -> str:
    unquoted = urllib.parse.unquote(url_path)
    current_dir = posixpath.dirname(source_rel)
    target = posixpath.normpath(posixpath.join(current_dir, unquoted))
    return "." if target == "." else target


def relative_from_generated(source_rel: str, target_rel: str, lang: str) -> str:
    generated_source = posixpath.join(lang, source_rel)
    generated_dir = posixpath.dirname(generated_source)
    generated_target = posixpath.join(lang, target_rel)
    rel = posixpath.relpath(generated_target, generated_dir or ".")
    return rel if rel != "." else "index.html"


def relative_asset_from_generated(source_rel: str, target_rel: str, lang: str) -> str:
    generated_source = posixpath.join(lang, source_rel)
    generated_dir = posixpath.dirname(generated_source)
    rel = posixpath.relpath(target_rel, generated_dir or ".")
    return rel


def rewrite_url(value: str, source_rel: str, lang: str) -> str:
    if is_external_url(value):
        return value

    path, query, fragment = split_url(value)
    if not path:
        return value

    target = normalize_target(source_rel, path)
    if target.endswith(".html"):
        rewritten = relative_from_generated(source_rel, target, lang)
    else:
        rewritten = relative_asset_from_generated(source_rel, target, lang)
    return urllib.parse.quote(rewritten, safe="/-_.~() %") + query + fragment


def rewrite_srcset(value: str, source_rel: str, lang: str) -> str:
    parts = []
    for item in value.split(","):
        stripped = item.strip()
        if not stripped:
            continue
        segments = stripped.split()
        segments[0] = rewrite_url(segments[0], source_rel, lang)
        parts.append(" ".join(segments))
    return ", ".join(parts)


URL_RE = re.compile(r"url\((['\"]?)([^)'\"\n]+)\1\)")


def rewrite_css_urls(value: str, source_rel: str, lang: str) -> str:
    def replace(match):
        quote = match.group(1)
        url = match.group(2)
        rewritten = rewrite_url(url, source_rel, lang)
        return f"url({quote}{rewritten}{quote})"

    return URL_RE.sub(replace, value)


def collect_texts(document):
    texts = []
    for element in document.iter():
        tag = (element.tag or "").lower() if isinstance(element.tag, str) else ""
        if tag in SKIP_TAGS:
            continue
        if element.text and should_translate(element.text):
            texts.append(element.text.strip())
        if element.tail and should_translate(element.tail):
            texts.append(element.tail.strip())
        for attr in TEXT_ATTRS:
            value = element.get(attr)
            if value and should_translate(value):
                texts.append(value.strip())
        if tag == "meta":
            name = (element.get("name") or element.get("property") or "").lower()
            if name in {"description", "og:title", "og:description", "twitter:title", "twitter:description"}:
                value = element.get("content")
                if value and should_translate(value):
                    texts.append(value.strip())
        if tag == "input" and (element.get("type") or "").lower() in {"button", "submit", "reset"}:
            value = element.get("value")
            if value and should_translate(value):
                texts.append(value.strip())
    return texts


def apply_translations(document, target_lang, cache):
    def translated(value):
        stripped = value.strip()
        return preserve_whitespace(value, cache.get(f"es:{target_lang}:{stripped}", stripped))

    for element in document.iter():
        tag = (element.tag or "").lower() if isinstance(element.tag, str) else ""
        if tag in SKIP_TAGS:
            continue
        if element.text and should_translate(element.text):
            element.text = translated(element.text)
        if element.tail and should_translate(element.tail):
            element.tail = translated(element.tail)
        for attr in TEXT_ATTRS:
            value = element.get(attr)
            if value and should_translate(value):
                element.set(attr, translated(value))
        if tag == "meta":
            name = (element.get("name") or element.get("property") or "").lower()
            if name in {"description", "og:title", "og:description", "twitter:title", "twitter:description"}:
                value = element.get("content")
                if value and should_translate(value):
                    element.set("content", translated(value))
        if tag == "input" and (element.get("type") or "").lower() in {"button", "submit", "reset"}:
            value = element.get("value")
            if value and should_translate(value):
                element.set("value", translated(value))


def update_urls(document, source_rel: str, lang: str):
    for element in document.iter():
        for attr in URL_ATTRS:
            value = element.get(attr)
            if value:
                element.set(attr, rewrite_url(value, source_rel, lang))
        value = element.get("srcset")
        if value:
            element.set("srcset", rewrite_srcset(value, source_rel, lang))
        style = element.get("style")
        if style:
            element.set("style", rewrite_css_urls(style, source_rel, lang))
        tag = (element.tag or "").lower() if isinstance(element.tag, str) else ""
        if tag == "style" and element.text:
            element.text = rewrite_css_urls(element.text, source_rel, lang)


def ensure_language_script(document, source_rel: str):
    body = document.find("body")
    if body is None:
        return
    existing = document.xpath('//script[contains(@src, "qartia-language-switcher.js")]')
    if existing:
        return
    script = html.Element("script")
    script.set("src", rewrite_url("assets/js/qartia-language-switcher.js", source_rel, ""))
    body.append(script)


def inject_language_script_in_original(path: Path, root: Path):
    text = path.read_text(encoding="utf-8")
    if "qartia-language-switcher.js" in text:
        return False
    source_rel = path.relative_to(root).as_posix()
    script_src = relative_asset_from_generated(source_rel, "assets/js/qartia-language-switcher.js", "")
    script_tag = f'<script src="{script_src}"></script>\n'
    if "</body>" not in text:
        return False
    path.write_text(text.replace("</body>", script_tag + "</body>", 1), encoding="utf-8")
    return True


def write_translation(path: Path, root: Path, lang: str, cache):
    source_rel = path.relative_to(root).as_posix()
    parser = html.HTMLParser(encoding="utf-8")
    document = html.parse(str(path), parser).getroot()
    document.set("lang", "en" if lang == "en" else "de")

    texts = sorted(set(collect_texts(document)))
    translate_batch(texts, LANGUAGES[lang], cache)
    apply_translations(document, LANGUAGES[lang], cache)
    update_urls(document, source_rel, lang)
    ensure_language_script(document, source_rel)

    output = root / lang / source_rel
    output.parent.mkdir(parents=True, exist_ok=True)
    html_text = html.tostring(document, encoding="unicode", method="html", doctype="<!DOCTYPE html>")
    output.write_text(html_text, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--cache", default=".translation-cache.json")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    cache_path = root / args.cache
    cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}

    html_files = public_html_files(root)
    for path in html_files:
        inject_language_script_in_original(path, root)

    for lang in LANGUAGES:
        for path in html_files:
            print(f"{lang}: {path.relative_to(root)}")
            write_translation(path, root, lang, cache)
            cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
