# 素材與製作記錄

- 角色設定：專案持有人提供的月白結原設定圖，唯一角色設計基準。
- 目前角色：使用者選中的歷史生成模型 `Yui-Generated-Unreviewed.glb`，原樣保存為 `models/Yui-Selected-Source.glb`。本輪沒有呼叫影像或角色生成。
- 原臉、頭髮、服裝、UV 與原贴圖保留；17 根骨骼針對此來源重新適配。
- 琴盒、黑貓：重用專案既有獨立配件；新增簡單背帶，未切除或合併原身體表面。
- 五官細節：只借用 `dist/yui-setting.png` 原眼睛和短嘴線的像素，建立貼合原眼窩與嘴部、固定 UV 的獨立小表面。原頭部不變。可用 `?eyes=original` 關閉補層。
- 舊 Rebuilt 資產：作為可恢復檢查點保留，含過去生成的臉貼圖；目前分支遊戲不載入它。
- 音樂：使用者提供的 `Sunny_Hillside_Dash.mp3`，175.26 秒，音訊未改動。
- 環境：既有櫻花、水道、建築、欄杆、石板路、路燈及粒子，本輪未改。
- Three.js、GLTFLoader、BufferGeometryUtils：r170，MIT，見 `dist/THREE-LICENSE.txt`。
- 字體：Noto Sans TC 與 Noto Serif TC，離線時使用系統字體。

原美術、模型與音樂保留既有權利；未另授素材開源授權。技術驗證不等同於美術還原度獲得認可。
