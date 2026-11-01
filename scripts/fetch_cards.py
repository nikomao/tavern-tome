#!/usr/bin/env python3
"""重新抓取 cards.js 中引用到的卡牌原画，并转换为 240x240 WebP。

用法:
    pip install -r requirements.txt
    python scripts/fetch_cards.py
"""

from __future__ import annotations

import re
import sys
import urllib.request
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("缺少 Pillow，请先运行: pip install -r requirements.txt")

ROOT = Path(__file__).resolve().parent.parent
CARDS_JS = ROOT / "cards.js"
OUT_DIR = ROOT / "cards"
CDN = "https://static.zerotoheroes.com/hearthstone/cardart/256x/{card_id}.jpg"
SIZE = 240
QUALITY = 84


def card_ids() -> list[str]:
    text = CARDS_JS.read_text(encoding="utf-8")
    return sorted(set(re.findall(r"cards/([A-Za-z0-9_]+)\.webp", text)))


def download(card_id: str) -> bytes:
    req = urllib.request.Request(
        CDN.format(card_id=card_id),
        headers={"User-Agent": "Mozilla/5.0 (tavern-tome card fetcher)"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def main() -> None:
    ids = card_ids()
    if not ids:
        sys.exit("cards.js 中没有找到卡图路径")

    OUT_DIR.mkdir(exist_ok=True)
    ok, fail = 0, []

    for i, card_id in enumerate(ids, 1):
        target = OUT_DIR / f"{card_id}.webp"
        try:
            raw = download(card_id)
            image = Image.open(BytesIO(raw)).convert("RGB").resize(
                (SIZE, SIZE), Image.LANCZOS
            )
            image.save(target, "WEBP", quality=QUALITY, method=6)
            ok += 1
            print(f"[{i}/{len(ids)}] {card_id} -> {target.name}")
        except Exception as exc:  # noqa: BLE001 - 单张失败不应中断整体
            fail.append(card_id)
            print(f"[{i}/{len(ids)}] {card_id} 失败: {exc}", file=sys.stderr)

    print(f"\n完成: {ok} 张成功, {len(fail)} 张失败")
    if fail:
        print("失败列表: " + ", ".join(fail))
        sys.exit(1)


if __name__ == "__main__":
    main()
