# 月白花徑 · Sakura Sprint

和月白結一起跑過月光、櫻花、水面倒影與旋律交織的 3D 花徑。

**[直接遊玩](https://sion-rgb.github.io/sakura-sprint/)**

## 遊玩

- 左右方向鍵 / A、D：轉換跑道。
- 空白鍵 / 上方向鍵 / W：跳躍。
- Esc / P：暫停及繼續。
- 手機可滑動或使用畫面下方按鈕。
- 音樂按鈕控制背景音樂與音效；開始旅程後播放《Sunny Hillside Dash》，循環播放並記住靜音選擇。
- 「細看月白結」可旋轉角色、查看臉部特寫及示範跑步。

## 角色與場景

以提供的月白結原始設定圖作為角色設計基準：銀白長髮、淡藍灰眼睛、黑色蝴蝶結、白色寬鬆外套、黑色裙裝、厚底靴、大型琴盒及黑貓吊飾。參考 GLB 經減面、重新上色、增加配件及簡易骨架動畫。

場景包含櫻花樹、月光水道、鐵欄、暖色路燈、石板路、遠景建築、花瓣與音符。

角色使用真正的蒙皮 3D 網格，搭配四個角度的插畫投影材質。這個方式保留插畫細節，但斜角切換及肢體動作仍可能出現局部拉伸。骨架採小幅跑步循環，尚不是經完整重新拓撲及手工權重精修的商用角色。

## 本機啟動

需要 Python 3。於專案目錄執行：

```sh
python -m http.server 5173 --directory dist
```

開啟 `http://localhost:5173`。遊戲無需建置或 API 金鑰。

## 檔案

- `dist/`：完整遊戲，Three.js r170 模組隨專案附上。
- `models/Yui-Canonical.blend`：可編輯 Blender 5.1 專案，包含骨架、動作與四角度材質。
- `dist/yui-canonical.glb`：網頁用模型；單獨開啟時使用靜態分面貼圖，遊戲中的完整材質由 `character.js` 與 `projection.json` 提供。
- `models/Yui-Canonical-preview.png`：Blender 實際渲染預覽。
- `ASSETS.md`：素材來源與製作說明。

GitHub Actions 將 `dist/` 發佈至 GitHub Pages。
