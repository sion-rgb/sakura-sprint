# Selected historical Yui recovery

Status: **technical recovery candidate; full artistic fidelity remains partial**.

## Exact source

The user's chosen second screenshot is pixel-identical to historical `Generated-Review/view-180.png`. It is not the Canonical camera-projected model or the procedural Rebuilt model.

| Evidence | SHA-256 |
| --- | --- |
| Screenshot decoded RGBA pixels | `833bc6cd9319fda4affe1c8f83944275df15b88a9631f9618b3688e22691a0af` |
| Original selected GLB | `f73c2e1d6b009ac5fdbb53f6a623a81485d16c3b8517b15378ef4e9051567d18` |
| Mesh positions before/after rigging | `d324ab5823daf96022c4b18383d51684666e775c6d57b3b0b11162cff12f861f` |
| Source UVs before/after rigging | `d5f8226fffacf4c59754e88bbdbe440d208b35bc125261d737b5a9614b82355e` |

## History and cause

`1bc2847` used Canonical camera projection, with angle-dependent seams. A rollback to it does not recover the user's chosen real 3D source. `301b2bb` introduced the procedural Rebuilt replacement and fixed UVs.

The local historical pipeline pinpoints the facial replacement: `repair-face-study.py` removed the selected original face, then introduced a procedural head and `Yui-Face-BaseColor-v1.png`. `build-head-rebuild.py` and `build-outfit-rebuild.py` subsequently replaced hair, clothes, legs and footwear. These replacement scripts are not used here.

Protected branch `codex/yui-selected-base-20260924` starts at `301b2bb`, preserving the old Rebuilt files. The earlier Canonical rollback in PR #1 is superseded by the user's latest selection and should not be merged as the solution.

## Minimum-change repair

1. Preserve the exact source; normalize only orientation and scale in a derived file.
2. Fit bones to the actual leg centers. Connected legs/boots get leg weights; coat and long hair do not. Original head vertices are rigidly assigned to Head.
3. Attach separate case, straps and cat.
4. Keep current animation mixer, fixed UV loading, one-shot Jump timing, scene and music.
5. Original source eyes are grey and lack readable iris detail. Add only two fitted eye surfaces and a short mouth-line surface using pixels from the authoritative sheet, without replacing face geometry or original images. This separate asset is independently reversible via `?eyes=original`.

Base export: `3f6ff47b618c04c8282a20702d323f5fa4f1eec6ac55bed9c188bab606c6a2b2`. The source has 1,013,358 triangles; case/cat/straps bring it to 1,029,872. Original two embedded texture images are byte-identical in the base export.

## Visual regression assessment

Front and close-up were directly compared with the exact chosen historical render and `dist/yui-setting.png`. Images are in `selected-review/`.

- Head silhouette, face volume, bangs, long hair, garments and legs: preserved. Position/UV hashes support this.
- Canonical projection tearing: not observed in checked front/side/run views. No camera-dependent projection exists in this candidate.
- Eye study: `eye-study-full-front.png` / `eye-study-full-quarter.png` reuse original eye artwork on small additional surfaces. The earlier iris-only experiment was not selected.
- Facial identity relative to the chosen model is preserved; resemblance and gentle/reserved expression relative to the illustration remain **partial**, not an artistic approval.
- Large source mesh retained deliberately. No unsupported mobile performance claim.

`node validate-selected.mjs` loads the actual GLB with Three.js r170 and samples 33 points per animation, checking source texture bytes, UVs, finite skinning, rigid face distances and ground clearance. Browser observations and screenshots are separate evidence.
