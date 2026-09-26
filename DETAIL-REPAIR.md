# Local detail repair — 2026-09-26

Checkpoint: `f411fe13e76d37e7ef857256e40f1fd5f304a01e`, the published user-selected historical mesh. Changes are isolated on `codex/yui-detail-repair-20260926`. The earlier selected-model worktree and Blender files remain available.

## Exact defect and minimum repair

The existing `dist/yui-selected.glb`, mesh `Yui_Selected_Original_Surface`, material `Material_0`, contains a grey nose mark in its original base-colour atlas. Ray sampling found approximately RGB (199,188,182) at the mark and (248,227,214)/(247,225,213) on the adjacent cheeks. Its sampled metalness is zero: changing global metallic/roughness settings would not address the cause.

`dist/face-detail.js` blends only this small region toward those two existing cheek samples using a feathered mask in the mesh's rest coordinates. It changes the fragment colour, not mesh positions, normals, UVs, source images, eye shape, mouth, silhouette, lighting or animation. All 108 vertices inside the mask have rigid Head weights, so the correction remains attached during animation. `?detail=published` disables it.

The model's slightly protruding nose geometry remains visible. This patch reduces the grey blemish; it is not a new nose, a reconstructed face or a claim of complete facial fidelity.

## Other repairs

- Model URLs resolve relative to the character module, allowing a comparison page to reuse the actual game loader without copying or replacing assets.
- The optional eye overlay may fail to download without making the preserved base character unplayable. The model status explicitly records the fallback.
- The inspection camera reserves space for controls. It now fits the full model, including boots, in portrait and landscape viewports, with a direct button for each side.
- `repair-review/` displays the published appearance and candidate under identical lights/cameras/animation beside the authoritative setting sheet. Original-source comparison remains in `selected-review/`.

## Verification and remaining limits

`node verify-detail.mjs` verifies byte-identical base and eye GLBs, unchanged geometry attributes and material maps, the tiny mask boundary, and its Head-only binding. The original base SHA-256 remains `3f6ff47b618c04c8282a20702d323f5fa4f1eec6ac55bed9c188bab606c6a2b2`.

`node verify-detail-browser.mjs` uses Playwright with Edge. Install Playwright or set `PLAYWRIGHT_MODULE` to its `index.mjs`; set `YUI_URL` when serving from another URL. It checks actual rendered pixel differences, front/quarter/both-side/run screenshots, portrait/landscape controls, jump/lane/pause/resume/music, the repair-off query and a deliberately unavailable optional eye GLB. Reports and screenshots are in `repair-review/`.

The rendered front-face, close-up and quarter view have been visually compared against the authoritative setting image and the published baseline. The change is confined to the nose mark; the selected facial identity and existing expression remain. Full illustration-level expression, hair and garment surface refinement is still **PARTIAL**. No mobile-device performance acceptance is claimed.
