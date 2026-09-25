import bpy,json,math,hashlib,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'selected-review';OUT.mkdir(exist_ok=True)
source=ROOT/'models/Yui-Selected-Source.glb'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(source))
body=next(o for o in bpy.context.scene.objects if o.type=='MESH')
pts=[body.matrix_world@Vector(v) for v in body.bound_box]
lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)])
scale=1.6/(hi.z-lo.z);center=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z));turn=Matrix.Rotation(math.pi,3,'Z')
world=body.matrix_world.copy()
for v in body.data.vertices:v.co=(turn@(world@v.co-center))*scale
body.matrix_world=Matrix.Identity(4);body.name='Yui Selected Original Surface'
vs=np.empty(len(body.data.vertices)*3,np.float32);body.data.vertices.foreach_get('co',vs);vs=vs.reshape(-1,3)
uv=np.empty(len(body.data.uv_layers.active.data)*2,np.float32);body.data.uv_layers.active.data.foreach_get('uv',uv)
report={'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'vertices':len(vs),'triangles':len(body.data.polygons),'normalized_position_hash':hashlib.sha256(vs.tobytes()).hexdigest(),'uv_hash':hashlib.sha256(uv.tobytes()).hexdigest(),'slices':[]}
for z in [.15,.25,.40,.55,.70,.80,.90,1.05,1.20,1.40]:
 for sign in [-1,1]:
  p=vs[(np.abs(vs[:,2]-z)<.015)&(vs[:,0]*sign>.005)&(vs[:,0]*sign<.19)&(vs[:,1]<.04)]
  if len(p):report['slices'].append({'z':z,'side':sign,'n':len(p),'median':np.median(p,axis=0).tolist(),'min':p.min(0).tolist(),'max':p.max(0).tolist()})
(OUT/'source-inspection.json').write_text(json.dumps(report,indent=2))
for im in bpy.data.images:
 if im.source=='FILE':im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/Yui-Selected-Source.blend'),compress=True)
print(json.dumps(report,indent=2))
