# 素材與製作記錄

- 原始角色：專案持有人提供的「月白結 / Tsukishiro Yui」角色設定圖，作為唯一美術設定基準。
- 參考網格：專案持有人提供的 `partpacker_20260913_171952.glb`；原始檔未被覆寫。
- 角色材質：以原始設定圖與參考網格的四方向無材質渲染為依據，使用 OpenAI 內建影像生成製作正、背、左、右插畫材質，再以 Blender 與 Three.js 投影到 3D 表面。
- 材質製作方向：維持無材質視圖的輪廓與姿勢；銀白長髮、細瀏海、半垂藍灰眼睛、黑白花飾與蝴蝶結、刺繡白外套、黑色裙裝、絲帶與厚底靴；柔和低飽和插畫陰影；角色細節以原設定為優先。
- 琴盒及黑貓：新增獨立 3D 配件。
- 動畫：17 根骨骼，Idle、Run、Jump；使用保守的小幅步伐以減少參考網格的變形。
- 背景音樂：專案持有人提供的 `Sunny_Hillside_Dash.mp3`，175.26 秒；原音訊完整保留。
- 環境：程式建立的櫻花、水道、建築、欄杆、石板路、路燈與粒子。
- Three.js、GLTFLoader、BufferGeometryUtils：r170，MIT 授權，全文見 `dist/THREE-LICENSE.txt`。
- 字體：Google Fonts 的 Noto Sans TC 與 Noto Serif TC；無法連線時使用系統字體。

提供的角色美術與音樂保留其原有權利；本專案未另外替這些素材授予開源授權。

材質節點參考：[Blender Texture Coordinate 文件](https://docs.blender.org/manual/en/4.2/render/shader_nodes/input/texture_coordinate.html)。
