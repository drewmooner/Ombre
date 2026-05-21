"""Remove cream paper background from logo; output transparent PNG."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def remove_paper_background(img: Image.Image, threshold: float = 42.0) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    corners = [
        px[0, 0],
        px[w - 1, 0],
        px[0, h - 1],
        px[w - 1, h - 1],
        px[w // 2, 0],
        px[0, h // 2],
    ]
    bg = tuple(sum(c[i] for c in corners) / len(corners) for i in range(3))

    feather = 14.0
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            dist = ((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) ** 0.5
            lum = 0.299 * r + 0.587 * g + 0.114 * b

            if lum < 120:
                alpha = 255
            elif dist >= threshold:
                alpha = 255
            elif dist <= threshold - feather:
                alpha = 0
            else:
                alpha = int((dist - (threshold - feather)) / feather * 255)

            px[x, y] = (r, g, b, alpha)

    return rgba


def trim_transparent(img: Image.Image, padding: int = 8) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(img.width, right + padding)
    bottom = min(img.height, bottom + padding)
    return img.crop((left, top, right, bottom))


def main() -> None:
    src = Path(sys.argv[1])
    if not src.is_file():
        print(f"Source not found: {src}", file=sys.stderr)
        sys.exit(1)

    processed = trim_transparent(remove_paper_background(Image.open(src)))

    for dest in (
        ROOT / "app" / "logo.png",
        ROOT / "public" / "logo.png",
        ROOT / "app" / "icon.png",
    ):
        dest.parent.mkdir(parents=True, exist_ok=True)
        processed.save(dest, "PNG", optimize=True)
        print(f"Wrote {dest} ({processed.width}x{processed.height})")


if __name__ == "__main__":
    main()
