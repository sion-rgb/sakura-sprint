"""Reversible eye-detail study, using pixels from the supplied setting sheet.
Never edits the selected mesh, UVs, source images, or saved baseline model.
"""
import bpy,math,json,numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent; OUT=ROOT/'selected-review'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'models/Yui-Selected-Rigged.blend'))
scene=bpy.context.scene;scene.frame_set(1)
body=bpy.data.objects['Yui Selected Original Surface'];rig=bpy.data.objects['YuiSelectedRig']
im=bpy.data.images.load(str(ROOT/'dist/yui-setting.png'),check_existing=True)
material=bpy.data.materials.new('Original setting iris detail - optional');material.use_nodes=True
bsdf=material.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.9;bsdf.inputs['Metallic'].default_value=0
tex=material.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;tex.interpolation='Linear'
material.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
material.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Emission Color']);bsdf.inputs['Emission Strength'].default_value=.2
samples=[];accents=[]
for name,cx,cz,refx,refy,ref_rx,ref_ry in [('R',-.0485,1.410,864.5,122.0,12.5,8.0),('L',.040,1.410,910.5,101.0,14.0,8.0),('Mouth',-.0075,1.370,894.8,143.2,4.1,1.2)]:
 vertices=[];uv=[];faces=[];rx=.017;rz=.009
 if name=='Mouth':rx=.006;rz=.0018
 for ring in range(7):
  r=ring/6
  for n in range(48):
   a=n*math.tau/48;xx=cx+rx*r*math.cos(a);zz=cz+rz*r*math.sin(a)
   hit,point,normal,index=body.ray_cast(Vector((xx,-2,zz)),Vector((0,1,0)))
   assert hit
   # Stop the patch at the eye surface when the ray encounters overhanging bangs.
   py=max(point.y,-.197) if name!='Mouth' else point.y
   tx=ref_rx*r*math.cos(a);ty=-ref_ry*r*math.sin(a);tilt=math.radians(-23)
   vertices.append((xx,py-.0006,zz));uv.append(((refx+tx*math.cos(tilt)-ty*math.sin(tilt))/im.size[0],1-(refy+tx*math.sin(tilt)+ty*math.cos(tilt))/im.size[1]))
  if ring:
   for n in range(48):
    a=(ring-1)*48+n;b=(ring-1)*48+(n+1)%48;c=ring*48+(n+1)%48;d=ring*48+n
    faces.append((a,d,c,b))
 mesh=bpy.data.meshes.new('Original iris accent '+name);mesh.from_pydata(vertices,[],faces);mesh.update()
 obj=bpy.data.objects.new('Original reference iris '+name,mesh);scene.collection.objects.link(obj);mesh.materials.append(material)
 layer=mesh.uv_layers.new(name='Fixed reference UV')
 for poly in mesh.polygons:
  poly.use_smooth=True
  for li in poly.loop_indices:layer.data[li].uv=uv[mesh.loops[li].vertex_index]
 group=obj.vertex_groups.new(name='Head');group.add(list(range(len(vertices))),1,'REPLACE');obj.parent=rig
 mod=obj.modifiers.new('Iris follows original head','ARMATURE');mod.object=rig
 accents.append(obj)
 samples.append({'eye':name,'center':[cx,cz],'y_min':min(v[1] for v in vertices),'y_max':max(v[1] for v in vertices),'reference_center':[refx,refy]})
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=720;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.34,.35,.39,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
for loc,power,size in [((-2,-3,4),150,4),((2,2,3),100,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.size=size;aim(l,(0,0,.9))
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';scene.camera=camera
for name,angle in [('eye-study-full-front',0),('eye-study-full-quarter',35)]:
 camera.location=(3.5*math.sin(math.radians(angle)),-3.5*math.cos(math.radians(angle)),1.455);aim(camera,(0,-.10,1.415));camera.data.ortho_scale=.45
 scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
camera.location=(0,-3.5,.88);aim(camera,(0,0,.84));camera.data.ortho_scale=1.95
scene.render.filepath=str(OUT/'detail-front.png');bpy.ops.render.render(write_still=True)
# Separate additive asset. The selected GLB and its original surfaces stay byte-identical.
copies=[];bpy.ops.object.select_all(action='DESELECT')
for obj in accents:
 copy=obj.copy();copy.data=obj.data.copy();copy.parent=None;copy.matrix_world=obj.matrix_world.copy();copy.modifiers.clear()
 scene.collection.objects.link(copy);copy.select_set(True);copies.append(copy)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'dist/yui-eye-detail.glb'),export_format='GLB',use_selection=True,export_animations=False,export_skins=False)
for copy in copies:bpy.data.objects.remove(copy,do_unlink=True)
im.pack();bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/Yui-Selected-Eye-Study.blend'),compress=True)
(OUT/'eye-study-sampling.json').write_text(json.dumps(samples,indent=2))
print('EYE_STUDY_COMPLETE',flush=True)
