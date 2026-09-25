from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parent
digest=hashlib.sha256((root/'dist/yui-selected.glb').read_bytes()).hexdigest()
detail=root/'dist/yui-eye-detail.glb';detail_hash=hashlib.sha256(detail.read_bytes()).hexdigest() if detail.exists() else None
version='selected-'+digest[:10]+('-'+detail_hash[:8] if detail_hash else '')
p=root/'dist/character.js';s=p.read_text(encoding='utf8')
s=s.replace("source: 'Canonical design / fixed UV mesh'", "source: 'User-selected historical 3D surface / preserved original mesh and UV', asset: 'yui-selected.glb', faceReplaced: false")
s=re.sub(r'\./yui-(?:rebuilt|selected)\.glb\?v=[^\x27]+','./yui-selected.glb?v='+version,s)
if detail_hash:s=re.sub(r'\./yui-eye-detail\.glb\?v=[^\x27]+','./yui-eye-detail.glb?v=reference-'+detail_hash[:10],s)
p.write_text(s,encoding='utf8')
for f in ['dist/game.js','dist/index.html']:
 p=root/f;p.write_text(re.sub(r'(?:20260918-67934e9e|selected-[0-9a-f-]+)',version,p.read_text(encoding='utf8')),encoding='utf8')
(root/'selected-review/asset.json').write_text(json.dumps({'candidate_sha256':digest,'reference_detail_sha256':detail_hash,'historical_source':'Yui-Generated-Unreviewed.glb','source_sha256':'f73c2e1d6b009ac5fdbb53f6a623a81485d16c3b8517b15378ef4e9051567d18','matched_screenshot':'Generated-Review/view-180.png','screenshot_rgba_sha256':'833bc6cd9319fda4affe1c8f83944275df15b88a9631f9618b3688e22691a0af','face_regenerated':False},indent=2))
