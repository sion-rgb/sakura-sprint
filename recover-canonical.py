"""Identity recovery: restore historical bytes, keep Rebuilt as an untouched checkpoint."""
from pathlib import Path
import subprocess
root=Path(__file__).resolve().parent
branch=subprocess.check_output(['git','branch','--show-current'],cwd=root,text=True).strip()
if not branch.startswith('codex/yui-identity-recovery'):
    raise SystemExit('Run only inside the isolated identity recovery branch. Current working model is protected.')
for relative in ['dist/yui-canonical.glb','dist/projection.json','models/Yui-Canonical.blend','models/Yui-Canonical-preview.png','models/Yui-Canonical-info.json']:
    (root/relative).write_bytes(subprocess.check_output(['git','show','1bc2847:'+relative],cwd=root))
code=subprocess.check_output(['git','show','1bc2847:dist/character.js'],cwd=root).decode('utf8')
code=code.replace("root.name = 'Tsukishiro Yui — Blender model';", "root.name = 'Tsukishiro Yui — Canonical identity recovery';")
code=code.replace("source: 'Original Yui setting / retextured reference mesh'", "source: 'Canonical identity recovery / unchanged 1bc2847 mesh and paint', asset: 'yui-canonical.glb', identityCommit: '1bc2847', projection: 'historical four-view illustration; oblique seams remain'")
code=code.replace('./yui-canonical.glb?v=10','./yui-canonical.glb?v=8ca10b33').replace("fetch('./projection.json')","fetch('./projection.json?v=1bc2847')")
code=code.replace('    model = gltf.scene;', '''    model = gltf.scene;
    for (const name of ['Idle', 'Run', 'Jump']) {
      if (!gltf.animations.some(clip => clip.name === name)) throw new Error(`Missing canonical clip: ${name}`);
    }''')
code=code.replace('    info.clips = Object.keys(actions);', '''    // Keep the non-artistic playback fixes from 301b2bb. The original skeleton
    // and animation tracks are preserved; no weights or rest pose are replaced.
    actions.Jump.setLoop(THREE.LoopOnce, 1);
    actions.Jump.clampWhenFinished = true;
    info.clips = Object.keys(actions);''')
code=code.replace('next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();', "const rate = name === 'Jump' ? next.getClip().duration / .78 : 1;\n    next.reset().setEffectiveTimeScale(rate).setEffectiveWeight(1).play();")
code=code.replace('next.crossFadeFrom(current,.18,true)','next.crossFadeFrom(current,.16,false)')
code=code.replace('mixer.update(dt);','mixer.update(Math.min(Math.max(dt, 0), .1));')
(root/'dist/character.js').write_text(code,encoding='utf8')
game=(root/'dist/game.js').read_text(encoding='utf8')
game=game.replace('20260918-67934e9e','20260924-canonical-recovery').replace('zoom>1?2.72','zoom>1?3.08').replace('zoom>1?2.77','zoom>1?3.14').replace('showcase?8.1','showcase?8.8')
(root/'dist/game.js').write_text(game,encoding='utf8')
index=(root/'dist/index.html').read_text(encoding='utf8').replace('20260918-67934e9e','20260924-canonical-recovery')
(root/'dist/index.html').write_text(index,encoding='utf8')
print('Recovered Canonical assets byte-for-byte. Rebuilt files untouched.')
