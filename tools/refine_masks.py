"""Snap rough overlay polygons to the painted prop silhouettes with GrabCut.

  python3 tools/refine_masks.py [room]

Reads tools/overlays.json, seeds GrabCut per cut (polygon eroded = sure
foreground, dilated ring = probable background, beyond = sure background),
and writes pixel masks to .cache/masks/<room>-<id>.png (white = keep).
cut-overlays.ts prefers these masks over the polygons when present.
"""

import json
import os
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASKS = os.path.join(ROOT, ".cache", "masks")
os.makedirs(MASKS, exist_ok=True)

spec = json.load(open(os.path.join(ROOT, "tools", "overlays.json")))
only = sys.argv[1] if len(sys.argv) > 1 else None

for room, cuts in spec.items():
    if only and room != only:
        continue
    bgr = cv2.imread(os.path.join(ROOT, f"public/assets/bg/{room}.png"))
    for cut in cuts:
        poly = np.array(cut["polygon"], dtype=np.int32)
        polymask = np.zeros(bgr.shape[:2], np.uint8)
        cv2.fillPoly(polymask, [poly], 255)

        kernel = np.ones((3, 3), np.uint8)
        # Deep erosion for the sure-foreground seed: generous polygons around
        # rounded props contain background in their corners, and anything
        # marked GC_FGD can never be carved away. Fall back shallower for
        # thin props the deep erosion would erase.
        sure_fg = cv2.erode(polymask, kernel, iterations=12)
        if sure_fg.max() == 0:
            sure_fg = cv2.erode(polymask, kernel, iterations=4)
        probable = cv2.dilate(polymask, kernel, iterations=4)

        gc = np.full(bgr.shape[:2], cv2.GC_BGD, np.uint8)
        gc[probable > 0] = cv2.GC_PR_BGD
        gc[polymask > 0] = cv2.GC_PR_FGD
        gc[sure_fg > 0] = cv2.GC_FGD

        bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
        cv2.grabCut(bgr, gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
        mask = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

        # GrabCut may only refine inward: clamp to the hand polygon (+2px),
        # so leaks into similar-colored neighbours can't survive.
        mask = cv2.bitwise_and(mask, cv2.dilate(polymask, kernel, iterations=2))

        # Despeckle: drop islands not connected to the largest component,
        # close pinholes inside the prop.
        n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
        if n > 1:
            big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
            mask = np.where(labels == big, 255, 0).astype(np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        out = os.path.join(MASKS, f"{room}-{cut['id']}.png")
        cv2.imwrite(out, mask)
        frac = mask.mean() / polymask.mean() if polymask.mean() else 0
        print(f"{room}-{cut['id']}: grabcut kept {frac:.2f} of polygon area")
