"""Preserve the user-selected 3D surface; add fitted skinning and separate accessories.
No mesh cuts, remeshing, face replacement, image generation or texture repainting.
"""
import bpy,math,json,hashlib,numpy as np,sys
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
ROOT=Path(__file__).resolve().parent;ORIGINAL=ROOT/'models';OUT=ROOT/'selected-review'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'models/Yui-Selected-Source.blend'))
scene=bpy.context.scene;scene.render.fps=30
body=bpy.data.objects['Yui Selected Original Surface'];m=body.data
def fingerprint():
 v=np.empty(len(m.vertices)*3,np.float32);m.vertices.foreach_get('co',v)
 uv=np.empty(len(m.uv_layers.active.data)*2,np.float32);m.uv_layers.active.data.foreach_get('uv',uv)
 return {'vertices':len(m.vertices),'triangles':len(m.polygons),'positions':hashlib.sha256(v.tobytes()).hexdigest(),'uv':hashlib.sha256(uv.tobytes()).hexdigest()}
before=fingerprint();co=np.empty(len(m.vertices)*3,np.float32);m.vertices.foreach_get('co',co);co=co.reshape(-1,3)
regions=np.load(OUT/'leg-regions.npz');x,y,z=co.T
def smooth(a,b,v):
 t=np.clip((v-a)/(b-a),0,1);return t*t*(3-2*t)
arm=bpy.data.armatures.new('Selected Yui fitted skeleton');rig=bpy.data.objects.new('YuiSelectedRig',arm);scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bones={}
def bone(n,h,t,parent=None):
 b=arm.edit_bones.new(n);b.head=h;b.tail=t
 if parent:b.parent=arm.edit_bones[parent]
 bones[n]=(Vector(h),Vector(t),parent)
bone('Root',(0,0,0),(0,0,.10));bone('Hips',(0,-.145,.88),(0,-.12,1.04),'Root')
bone('Chest',(0,-.12,1.04),(0,-.11,1.28),'Hips');bone('Head',(-.008,-.105,1.285),(-.008,-.105,1.55),'Chest')
bone('Cat',(-.27,-.255,.95),(-.27,-.255,.84),'Chest')
for s,sign in [('L',1),('R',-1)]:
 bone('Thigh.'+s,(sign*.080,-.147,.83),(sign*.085,-.166,.545),'Hips')
 bone('Shin.'+s,(sign*.085,-.166,.545),(sign*.083,-.18,.245),'Thigh.'+s)
 bone('Foot.'+s,(sign*.083,-.18,.245),(sign*.083,-.292,.07),'Shin.'+s)
 bone('Arm.'+s,(sign*.148,-.12,1.238),(sign*.273,-.20,1.04),'Chest')
 bone('Forearm.'+s,(sign*.273,-.20,1.04),(sign*.367,-.20,.865),'Arm.'+s)
 bone('Coat.'+s,(sign*.10,.055,1.03),(sign*.17,.10,.55),'Hips')
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
weights={n:np.zeros(len(co),np.float32) for n in bones}
weights['Chest'][:]=1
# Head and all facial geometry are rigid. The original eye/mouth/UV coordinates stay untouched.
h=smooth(1.25,1.30,z);weights['Head']=h;weights['Chest']-=h
# Garment tails never receive leg weights. Connectivity selects the real leg/boot surfaces.
for s,key,sign in [('L','left',1),('R','right',-1)]:
 mask=regions[key];foot=1-smooth(.285,.345,z);thigh=smooth(.50,.59,z);hip=smooth(.735,.83,z)
 weights['Chest'][mask]=0;weights['Head'][mask]=0
 weights['Hips'][mask]=hip[mask]
 weights['Foot.'+s][mask]=((1-hip)*foot)[mask]
 weights['Thigh.'+s][mask]=((1-hip)*(1-foot)*thigh)[mask]
 weights['Shin.'+s][mask]=((1-hip)*(1-foot)*(1-thigh))[mask]
 # Lower robe / long hair silhouette follows very small coat motion, never the feet.
 coat=(~regions['left'])&(~regions['right'])&(x*sign>0)&(z<1.02)
 t=(1-smooth(.82,1.02,z))*.65;weights['Chest'][coat]-=t[coat];weights['Coat.'+s][coat]+=t[coat]
 # Fit sleeves spatially; keep the back-hair mass outside the arm influence.
 a=smooth(.18,.26,x*sign)*(1-smooth(-.08,.015,y))*(1-smooth(1.22,1.29,z))*smooth(.72,.83,z)
 a*=((~regions['left'])&(~regions['right'])).astype(np.float32)
 available=weights['Chest'].copy();a=np.minimum(a,available);fore=1-smooth(.98,1.105,z)
 weights['Chest']-=a;weights['Arm.'+s]+=a*(1-fore);weights['Forearm.'+s]+=a*fore
total=sum(weights.values());assert np.max(np.abs(total-1))<1e-5
assert min(float(w.min()) for w in weights.values())>=-1e-7
for n,w in weights.items():
 group=body.vertex_groups.new(name=n)
 # Quantized groups batch the assignment without altering vertex data or UVs.
 q=np.rint(w*1024).astype(np.int32)
 for value in np.unique(q[q>0]):group.add(np.flatnonzero(q==value).tolist(),float(value)/1024,'REPLACE')
body.parent=rig;mod=body.modifiers.new('Fitted skin - original surface preserved','ARMATURE');mod.object=rig
mod.use_deform_preserve_volume=False
# Explicit normalization corrects at most rounding noise from batched group assignment.
bpy.context.view_layer.objects.active=body;body.select_set(True);rig.select_set(False)
bpy.ops.object.vertex_group_normalize_all(lock_active=False)
extras=[]
def import_accessory(filename,name,location,scale,tag):
 existing=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ORIGINAL/filename));added=list(set(bpy.data.objects)-existing)
 anchor=bpy.data.objects.new(name,None);scene.collection.objects.link(anchor)
 for o in added:
  if o.parent is None:o.parent=anchor
 anchor.location=location;anchor.scale=(scale,)*3;bpy.context.view_layer.update()
 meshes=[o for o in added if o.type=='MESH'];empties=[o for o in added if o.type=='EMPTY']+[anchor];bpy.ops.object.select_all(action='DESELECT')
 for o in meshes:
  world=o.matrix_world.copy();o.parent=None;o.data.transform(world);o.matrix_world=Matrix.Identity(4);o.select_set(True)
 bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
 group=o.vertex_groups.new(name=tag);group.add(list(range(len(o.data.vertices))),1,'REPLACE')
 o.parent=rig;md=o.modifiers.new('Independent accessory binding','ARMATURE');md.object=rig;extras.append(o)
 for empty in empties:bpy.data.objects.remove(empty,do_unlink=True)
import_accessory('Yui-Instrument-Case.glb','Instrument case - separate attachment',(-.18,.405,1.075),.83,'Chest')
import_accessory('Yui-Black-Cat-Charm.glb','Black cat charm - separate attachment',(-.27,-.27,.975),.90,'Cat')
# A modest shoulder harness connects the case; original jacket decorations remain unchanged.
mat=bpy.data.materials.new('Charcoal case harness');mat.diffuse_color=(.018,.02,.026,1);mat.use_nodes=True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=mat.diffuse_color
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.75
for xx in [-.12,.11]:
 c=bpy.data.curves.new('Case strap','CURVE');c.dimensions='3D';c.bevel_depth=.005;c.bevel_resolution=2
 sp=c.splines.new('POLY');pts=[(xx,-.18,1.20),(xx,-.11,1.277),(xx,.045,1.27),(xx-.03,.24,1.23),(-.18,.345,1.14)]
 sp.points.add(len(pts)-1)
 for p,v in zip(sp.points,pts):p.co=(*v,1)
 o=bpy.data.objects.new('Instrument case strap',c);scene.collection.objects.link(o);o.data.materials.append(mat)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');o=bpy.context.object
 g=o.vertex_groups.new(name='Chest');g.add(list(range(len(o.data.vertices))),1,'REPLACE');o.parent=rig;md=o.modifiers.new('Harness follows torso','ARMATURE');md.object=rig;extras.append(o)
assert fingerprint()==before,'Source geometry or UV changed during rig/accessory work'
print('SOURCE_SURFACE_PRESERVED',before,flush=True)
rest={n:arm.bones[n].matrix_local.to_quaternion() for n in bones}
def rotate(n,x=0,y=0,z=0):
 q=Quaternion((0,0,1),z)@Quaternion((0,1,0),y)@Quaternion((1,0,0),x);b=rig.pose.bones[n];b.rotation_mode='QUATERNION';b.rotation_quaternion=rest[n].inverted()@q@rest[n]
def reset():
 for b in rig.pose.bones:b.location=(0,0,0);b.rotation_mode='QUATERNION';b.rotation_quaternion=(1,0,0,0);b.scale=(1,1,1)
def rootz(z):rig.pose.bones['Root'].location=arm.bones['Root'].matrix_local.to_3x3().inverted()@Vector((0,0,z))
def ik(s,target,offset):
 h,k,_=bones['Thigh.'+s];_,a,_=bones['Shin.'+s];hip=h+Vector((0,0,offset));end=Vector((a.x,*target))
 d=end-hip;dist=min(d.length,(k-h).length+(a-k).length-.00001);unit=d.normalized();l1=(k-h).length;l2=(a-k).length
 along=(l1*l1-l2*l2+dist*dist)/(2*dist);height=math.sqrt(max(0,l1*l1-along*along));knee=hip+unit*along+Vector((0,unit.z,-unit.y))*height
 v1=knee-hip;v2=end-knee;t1=math.atan2(v1.y,-v1.z)-math.atan2((k-h).y,-(k-h).z);t2=math.atan2(v2.y,-v2.z)-math.atan2((a-k).y,-(a-k).z)-t1
 rotate('Thigh.'+s,t1);rotate('Shin.'+s,t2);rotate('Foot.'+s,-t1-t2)
rig.animation_data_create();actions={};floor=[]
for name,duration in [('Idle',2.4),('Run',.86),('Jump',.78)]:
 action=bpy.data.actions.new(name);action.use_fake_user=True;rig.animation_data.action=action;last=round(duration*30)+1
 for frame in range(1,last+1):
  t=(frame-1)/(last-1);phase=t*math.tau;reset()
  if name=='Idle':rootz(.0015*(1-math.cos(phase)))
  elif name=='Run':
   offset=-.030+.004*math.cos(phase*2);rootz(offset)
   for s,shift in [('L',0),('R',.5)]:
    p=(t+shift)%1
    if p<.5:u=p*2;yy=-.18-.10+.20*u;zz=.245
    else:u=(p-.5)*2;yy=-.08-.20*(u*u*(3-2*u));zz=.245+.090*math.sin(math.pi*u)
    ik(s,(yy,zz),offset);swing=math.cos(phase+shift*math.tau)
    rotate('Arm.'+s,.11*swing);rotate('Forearm.'+s,-.10-.03*max(swing,0));rotate('Coat.'+s,.015+.01*math.sin(phase+shift*math.tau))
   rotate('Cat',.08*math.sin(phase-.4))
   bpy.context.view_layer.update()
   bottoms={}
   for s,key in [('L','left'),('R','right')]:
    deform=rig.pose.bones['Foot.'+s].matrix@arm.bones['Foot.'+s].matrix_local.inverted();points=co[regions[key]&(z<.16)]
    transformed=points@np.array(deform)[:3,:3].T+np.array(deform)[:3,3];bottoms[s]=float(transformed[:,2].min())
   correction=.003-min(bottoms.values());rootz(offset+correction);floor.append({s:bottoms[s]+correction for s in bottoms})
  else:
   tuck=math.sin(math.pi*t)**1.5
   for s in ['L','R']:rotate('Thigh.'+s,-.15*tuck);rotate('Shin.'+s,.35*tuck);rotate('Foot.'+s,-.20*tuck);rotate('Arm.'+s,-.1*tuck)
  for b in rig.pose.bones:b.keyframe_insert('location',frame=frame);b.keyframe_insert('rotation_quaternion',frame=frame)
 actions[name]=action;rig.animation_data.action=None
reset();scene.frame_set(1)
for im in bpy.data.images:
 if im.source=='FILE':im.pack()
rig.animation_data.action=actions['Idle'];scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/Yui-Selected-Rigged.blend'),compress=True)
bpy.ops.object.select_all(action='DESELECT')
for o in [rig,body]+extras:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(ROOT/'dist/yui-selected.glb'),use_selection=True,export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_anim_slide_to_zero=True,export_anim_single_armature=True)
report={'source':before,'after':fingerprint(),'source_surface_unchanged':fingerprint()==before,'bones':len(bones),'animations':list(actions),'ground_samples':floor,'face_replaced':False,'projection_shader':False,'status':'candidate pending rendered review'}
(OUT/'build-report.json').write_text(json.dumps(report,indent=2))
print('SELECTED_EXPORT_DONE',flush=True)
# Same restrained lighting for source and candidate evidence.
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.resolution_x=720;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.34,.35,.39,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
for loc,power,size in [((-2,-3,4),150,4),((2,2,3),100,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.size=size;aim(l,(0,0,.9))
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';scene.camera=camera
for name,angle,scale,height in [('front',0,1.95,.84),('three-quarter',45,1.95,.84),('side',90,1.95,.84),('back',180,1.95,.84),('face',0,.45,1.415)]:
 camera.location=(3.5*math.sin(math.radians(angle)),-3.5*math.cos(math.radians(angle)),height+.04);aim(camera,(0,-.10 if name=='face' else 0,height));camera.data.ortho_scale=scale
 scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
rig.animation_data.action=actions['Run'];scene.frame_set(7)
for name,angle in [('run-front',0),('run-side',90)]:
 camera.location=(3.5*math.sin(math.radians(angle)),-3.5*math.cos(math.radians(angle)),.94);aim(camera,(0,0,.84));camera.data.ortho_scale=1.95;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
