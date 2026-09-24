# 素材與回復記錄

- 唯一角色設定基準：使用者提供的「月白結 / Tsukishiro Yui」設定圖，`dist/yui-setting.png`。
- 啟用模型：從 `1bc2847` 原封不動回復 `dist/yui-canonical.glb` 及 `models/Yui-Canonical.blend`。原始幾何來自使用者提供的 `partpacker_20260913_171952.glb`，已於舊版減面、蒙皮及加入配件。
- 外觀：重用舊版嵌入的 `front`、`back`、`side`、`left` 四張插畫投影圖及原投影參數；此次沒有生成、重畫或解讀一張新臉。
- 動作：保留 Canonical 的 17 骨、Idle / Run / Jump 原始資料。Jump 是固定空中姿勢。控制器保留單次跳躍、重新起跳、過渡及時間步長保護。
- 備份：`yui-rebuilt.glb` 與 `Yui-Rebuilt.blend` 維持 `301b2bb` 的內容。其程序化頭部及 `Yui-Face-BaseColor-v1` 生成臉部貼圖不再用於本分支遊戲。
- 已知限制：Canonical 的投影斜角接縫、頸部缺口及小幅跑步仍存在。美術身份回復與完整模型修復是不同驗收結果。
- 場景及音樂：保留原程式環境和使用者提供的 `Sunny_Hillside_Dash.mp3`。
- Three.js、GLTFLoader、BufferGeometryUtils：r170，MIT，見 `dist/THREE-LICENSE.txt`。

角色美術及音樂保留原有權利；本專案未另行授予這些素材開源授權。
