# 月白花徑 · Sakura Sprint

## 2026-09-24 — Canonical identity recovery

`301b2bb` replaced Yui's illustrated Canonical mesh and face treatment with a different head, face texture, hair and clothing. That change was an artistic regression against the original setting sheet.

This branch restores `1bc2847`'s `yui-canonical.glb`, projection data and packed Blender source **byte-for-byte**. No face was regenerated, repainted or redesigned. The original 17-bone rig, posed geometry and four illustration images are retained. `Yui-Rebuilt.blend` and `yui-rebuilt.glb` remain untouched checkpoints.

The controller keeps the later single-play Jump, restart, cross-fade and bounded timestep fixes. It does not force the 28-bone Rebuilt rig onto the differently posed Canonical geometry. The environment and `Sunny_Hillside_Dash.mp3` are unchanged.

**Known limits:** Canonical still has neck/cheek gaps, oblique projection seams and a conservative running gait. Its Jump clip is a held airborne pose. Recovery does not mean these older defects or full illustration fidelity have been solved.

## Review and run

Serve the repository root with `python -m http.server 5173`.

- `/recovery-review/` compares the setting, `1bc2847` and `301b2bb`.
- `/recovery-review/?recovered` compares the setting, Canonical baseline and recovery.
- `/dist/` plays the recovered game.

See [the regression report](RECOVERY.md) for affected assets and visual evidence. This branch does not change the existing public Pages release.

## Controls

- 左右方向鍵 / A、D：換跑道。
- 空白鍵 / 上方向鍵 / W：跳躍。
- Esc / P：暫停及繼續。
- 手機可滑動或使用畫面按鈕。
- 音樂按鈕控制《Sunny Hillside Dash》及音效。
- 「細看月白結」提供正面、側面、背面、近鏡及跑步展示。

## Validation

`node validate-recovery.mjs` checks historical asset hashes, actual Three.js GLTFLoader/AnimationMixer CPU deformation at 33 time samples per clip, and the recovered controller's single-play/restart behavior. It does not simulate texture decoding or visual acceptance.

The final front and close-up are also reviewed in a real browser against the setting. Reports are in `models/recovery-validation/`; older `models/validation/` records describe Rebuilt only.

GitHub Actions publishes `dist/` on pushes to `main`. This recovery branch leaves `main` and the published model unchanged.
