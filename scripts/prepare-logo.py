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


# Matches --background in globals.css — keeps the mark visible on browser tabs.
FAVICON_BG = (243, 238, 236, 255)


def build_square_icon(
    mark: Image.Image,
    size: int,
    *,
    padding_ratio: float = 0.1,
) -> Image.Image:
    """Center the mark on a square canvas sized for favicons."""
    mark = mark.convert("RGBA")
    cropped = trim_transparent(mark, padding=0)
    bbox = cropped.getbbox()
    if not bbox:
        cropped = mark
    else:
        cropped = cropped.crop(bbox)

    canvas = Image.new("RGBA", (size, size), FAVICON_BG)
    pad = max(1, int(size * padding_ratio))
    inner = size - 2 * pad
    mw, mh = cropped.size
    scale = min(inner / mw, inner / mh)
    nw, nh = max(1, int(mw * scale)), max(1, int(mh * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def write_favicon_assets(mark: Image.Image, root: Path) -> None:
    app = root / "app"
    app.mkdir(parents=True, exist_ok=True)

    icon_512 = build_square_icon(mark, 512, padding_ratio=0.08)
    icon_512.save(app / "icon.png", "PNG", optimize=True)
    print(f"Wrote {app / 'icon.png'} (512x512)")

    apple = build_square_icon(mark, 180, padding_ratio=0.1)
    apple.save(app / "apple-icon.png", "PNG", optimize=True)
    print(f"Wrote {app / 'apple-icon.png'} (180x180)")

    favicon_32 = build_square_icon(mark, 32, padding_ratio=0.06)
    favicon_48 = build_square_icon(mark, 48, padding_ratio=0.06)
    favicon_16 = build_square_icon(mark, 16, padding_ratio=0.05)
    favicon_32.save(
        app / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[favicon_16, favicon_48],
    )
    print(f"Wrote {app / 'favicon.ico'}")


def main() -> None:
    src = Path(sys.argv[1])
    if not src.is_file():
        print(f"Source not found: {src}", file=sys.stderr)
        sys.exit(1)

    processed = trim_transparent(remove_paper_background(Image.open(src)))

    for dest in (
        ROOT / "app" / "logo.png",
        ROOT / "public" / "logo.png",
    ):
        dest.parent.mkdir(parents=True, exist_ok=True)
        processed.save(dest, "PNG", optimize=True)
        print(f"Wrote {dest} ({processed.width}x{processed.height})")

    write_favicon_assets(processed, ROOT)


if __name__ == "__main__":
    main()
