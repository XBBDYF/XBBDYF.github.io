#!/usr/bin/env python3
"""Regenerate image assets with Pillow: python scripts/optimize-images.py.

Requires Pillow with WebP support. This is an optional asset preparation step;
Node builds consume assets/image-manifest.json and do not need Python.
Original images and older generated assets are never deleted or modified.
"""

from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageOps, features

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "assets/images"
MANIFEST = ROOT / "assets/image-manifest.json"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff", ".avif"}
QUALITY = 78


def encode_webp(image: Image.Image, bounds: tuple[int, int]) -> bytes:
    """Encode a single frame, fitting bounds without enlarging the image."""
    result = image.copy()
    result.thumbnail(bounds, Image.Resampling.LANCZOS)
    has_alpha = "A" in result.getbands() or "transparency" in result.info
    result = result.convert("RGBA" if has_alpha else "RGB")
    buffer = io.BytesIO()
    result.save(buffer, "WEBP", quality=QUALITY, method=6)
    return buffer.getvalue()


def save_asset(name: str, content: bytes) -> str:
    """Write a generated WebP only when bytes change, and check readability."""
    destination = OUTPUT / name
    with Image.open(io.BytesIO(content)) as check:
        check.load()
        if check.format != "WEBP" or check.n_frames != 1:
            raise ValueError(f"Expected a static WebP: {name}")
    if not destination.exists() or destination.read_bytes() != content:
        destination.write_bytes(content)
    return destination.relative_to(ROOT).as_posix()


def main() -> None:
    """Generate the avatar, article covers, JPEG body images, and manifest."""
    if not features.check("webp"):
        raise RuntimeError("Pillow requires WebP support")
    sources = sorted(
        path for path in (ROOT / "articles/images").rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )
    originals = [ROOT / "tx.png", *sources]
    original_hashes = {path: hashlib.sha256(path.read_bytes()).digest() for path in originals}
    OUTPUT.mkdir(parents=True, exist_ok=True)
    rows = []

    with Image.open(ROOT / "tx.png") as original:
        original.load()
        avatar = ImageOps.fit(
            ImageOps.exif_transpose(original), (192, 192), method=Image.Resampling.LANCZOS
        )
        content = encode_webp(avatar, (192, 192))
        avatar_src = save_asset("avatar.webp", content)
        rows.append({"source": "tx.png", "original_bytes": (ROOT / "tx.png").stat().st_size,
                     "avatar_bytes": len(content)})

    images = {}
    for source in sources:
        key = source.relative_to(ROOT).as_posix()
        # Content changes produce new article asset URLs, avoiding stale browser caches.
        identifier = original_hashes[source].hex()[:20]
        with Image.open(source) as original:
            original.seek(0)
            original.load()
            frame = ImageOps.exif_transpose(original).copy()
            content = encode_webp(frame, (640, 480))
            static_webp = original.format == "WEBP" and original.n_frames == 1
            fits_cover = frame.width <= 640 and frame.height <= 480
            reuse_original = static_webp and fits_cover and len(content) >= source.stat().st_size
            thumbnail = key if reuse_original else save_asset(f"article-{identifier}-thumb.webp", content)
            entry = {"thumbnail": thumbnail, "width": original.width, "height": original.height}
            row = {"source": key, "original_bytes": source.stat().st_size,
                   "thumbnail_bytes": source.stat().st_size if reuse_original else len(content),
                   "reused_original": reuse_original}
            if original.format == "JPEG" and getattr(original, "n_frames", 1) == 1:
                content = encode_webp(frame, (1280, frame.height))
                entry["optimized"] = save_asset(f"article-{identifier}-body.webp", content)
                row["optimized_bytes"] = len(content)
            images[key] = entry
            rows.append(row)

    if any(hashlib.sha256(path.read_bytes()).digest() != digest for path, digest in original_hashes.items()):
        raise RuntimeError("An original image changed while generating assets")
    manifest = {"avatar": {"src": avatar_src, "width": 192, "height": 192}, "images": images}
    text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    if not MANIFEST.exists() or MANIFEST.read_text(encoding="utf-8") != text:
        MANIFEST.write_text(text, encoding="utf-8")
    print(json.dumps({"images": rows, "originals_unchanged": True}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
