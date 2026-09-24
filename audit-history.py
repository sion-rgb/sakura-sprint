"""Read historical GLBs, record immutable checkpoints, create a comparison harness.
Never modifies either character asset.
"""
from pathlib import Path
import json, struct, hashlib, subprocess

root=Path(__file__).resolve().parent
audit=root/'recovery-review';audit.mkdir(exist_ok=True)
report={}
for key,commit,file in [('canonical','1bc2847','yui-canonical.glb'),('rebuilt','301b2bb','yui-rebuilt.glb')]:
    blob=subprocess.check_output(['git','show',f'{commit}:dist/{file}'],cwd=root)
    n=struct.unpack_from('<I',blob,12)[0];g=json.loads(blob[20:20+n])
    report[key]={'file':file,'sha256':hashlib.sha256(blob).hexdigest(),
        'meshes':[{'name':m.get('name'),'materials':[g['materials'][p['material']]['name'] for p in m['primitives']]} for m in g['meshes']],
        'materials':[m.get('name') for m in g['materials']],
        'images':[i.get('name') for i in g.get('images',[])],
        'bones':len(g['skins'][0]['joints']),'clips':[a['name'] for a in g['animations']]}
    code=subprocess.check_output(['git','show',f'{commit}:dist/character.js'],cwd=root).decode('utf8')
    prefix='../dist/'
    for name in ['three.module.js','GLTFLoader.js','projection.json',file]:
        code=code.replace('./'+name,prefix+name)
    (audit/(key+'.js')).write_text(code,encoding='utf8')
code=(root/'dist/character.js').read_text(encoding='utf8')
for name in ['three.module.js','GLTFLoader.js','projection.json','yui-canonical.glb']:
    code=code.replace('./'+name,'../dist/'+name)
(audit/'recovered.js').write_text(code,encoding='utf8')
(audit/'history.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report,indent=2))
