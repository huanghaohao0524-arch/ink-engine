import argparse
import json
import os
import re
import shutil
import tempfile
import warnings
from pathlib import Path

from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
from ebooklib import ITEM_DOCUMENT, epub
import mobi

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)


def safe_name(value: str) -> str:
    text = (value or "").strip()
    text = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "-", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" .") or "untitled"


def extract_txt_text(source: Path) -> str:
    raw = source.read_bytes()
    for encoding in ("utf-8", "utf-8-sig", "gb18030", "gbk", "big5"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="ignore")


def copy_to_ascii_temp(source: Path, suffix: str) -> tuple[Path, Path]:
    temp_dir = Path(tempfile.mkdtemp(prefix="novel-source-"))
    temp_source = temp_dir / f"source{suffix}"
    shutil.copy2(source, temp_source)
    return temp_dir, temp_source


def extract_epub_text(source: Path) -> str:
    temp_dir, temp_source = copy_to_ascii_temp(source, ".epub")
    try:
        book = epub.read_epub(str(temp_source), options={"ignore_ncx": True})
        parts = []
        for item in book.get_items():
            if item.get_type() != ITEM_DOCUMENT:
                continue
            soup = BeautifulSoup(item.get_content(), "xml")
            text = soup.get_text("\n", strip=True)
            if text:
                parts.append(text)
        return "\n\n".join(parts)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def extract_mobi_text(source: Path) -> str:
    original_cwd = Path.cwd()
    temp_dir, temp_source = copy_to_ascii_temp(source, ".mobi")
    try:
        os.chdir(temp_dir)
        mobi.extract(str(temp_source))
        roots = [candidate for candidate in temp_dir.iterdir() if candidate.is_dir()]
        root = roots[0] if roots else temp_dir
        html_files = list(root.rglob("*.html")) + list(root.rglob("*.htm")) + list(root.rglob("*.xhtml"))
        parts = []
        for html_file in html_files:
            try:
                soup = BeautifulSoup(html_file.read_text("utf-8", errors="ignore"), "lxml")
            except Exception:
                continue
            text = soup.get_text("\n", strip=True)
            if text:
                parts.append(text)
        return "\n\n".join(parts)
    finally:
        os.chdir(original_cwd)
        shutil.rmtree(temp_dir, ignore_errors=True)


def extract_text(source: Path) -> str:
    suffix = source.suffix.lower()
    if suffix == ".txt":
        return extract_txt_text(source)
    if suffix == ".epub":
        return extract_epub_text(source)
    if suffix == ".mobi":
        return extract_mobi_text(source)
    raise ValueError(f"unsupported suffix: {suffix}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--library", required=True)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()

    manifest = json.loads(Path(args.manifest).read_text("utf-8"))
    items = manifest.get("items", [])
    if args.limit > 0:
        items = items[: args.limit]

    library_root = Path(args.library)
    raw_root = library_root / "原文样本"
    raw_root.mkdir(parents=True, exist_ok=True)

    report = {
        "generatedAt": manifest.get("generatedAt"),
        "manifestPath": args.manifest,
        "library": args.library,
        "total": len(items),
        "processed": [],
    }

    for item in items:
        source_path = Path(item["sourcePath"])
        genre = item["genre"]
        title = item["title"]
        author = item.get("author", "")
        genre_dir = raw_root / genre
        genre_dir.mkdir(parents=True, exist_ok=True)

        base_name = f"{safe_name(title)}({safe_name(author)})" if author else safe_name(title)
        target_path = genre_dir / f"{base_name}.txt"

        if target_path.exists():
            report["processed"].append(
                {
                    "sourcePath": str(source_path),
                    "genre": genre,
                    "status": "skipped-existing",
                    "targetPath": str(target_path),
                }
            )
            continue

        try:
            text = extract_text(source_path)
            if not text or len(text.strip()) < 1000:
                raise ValueError("extracted text too short")
            target_path.write_text(text, encoding="utf-8")
            report["processed"].append(
                {
                    "sourcePath": str(source_path),
                    "genre": genre,
                    "status": "imported",
                    "targetPath": str(target_path),
                    "chars": len(text),
                }
            )
        except Exception as exc:
            report["processed"].append(
                {
                    "sourcePath": str(source_path),
                    "genre": genre,
                    "status": "error",
                    "error": str(exc),
                }
            )

    Path(args.report).write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "manifestPath": args.manifest,
                "total": report["total"],
                "imported": sum(1 for item in report["processed"] if item["status"] == "imported"),
                "skippedExisting": sum(1 for item in report["processed"] if item["status"] == "skipped-existing"),
                "errors": sum(1 for item in report["processed"] if item["status"] == "error"),
                "reportPath": args.report,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
