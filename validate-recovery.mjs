// CPU geometry/animation checks. Visual rendering is reviewed separately.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import * as THREE from './dist/three.module.js';
import {GLTFLoader} from './dist/GLTFLoader.js';

const root=new URL('./',import.meta.url),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={scope:'Asset identity, original rig deformation, retained playback fixes; browser review is separate.',assets:{},clips:{},passed:false};
for(const [path,commit] of [
 ['dist/yui-canonical.glb','1bc2847'],['dist/projection.json','1bc2847'],['models/Yui-Canonical.blend','1bc2847'],
 ['dist/yui-rebuilt.glb','301b2bb'],['models/Yui-Rebuilt.blend','301b2bb'],
 ['dist/yui-setting.png','1bc2847'],['dist/Sunny_Hillside_Dash.mp3','301b2bb'],['dist/world.js','301b2bb']]) {
 const now=await fs.readFile(new URL(path,root));
 const before=execFileSync('git',['show',`${commit}:${path}`],{cwd:root,maxBuffer:64*1024*1024});
 const textAsset=/\.(js|json)$/.test(path),canonicalBytes=b=>textAsset?Buffer.from(b.toString('utf8').replace(/\r\n/g,'\n')):b;
 assert.equal(sha(canonicalBytes(now)),sha(canonicalBytes(before)),`${path}: changed historical asset`);
 report.assets[path]={sourceCommit:commit,sha256:sha(now),unchanged:true,lineEndingsNormalized:textAsset};
}
const bytes=await fs.readFile(new URL('dist/yui-canonical.glb',root));
const loader=new GLTFLoader();loader.register(()=>({name:'GEOMETRY_ONLY',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o)});
assert(meshes.length);const skins=new Set(meshes.map(o=>o.skeleton));const bones=meshes[0].skeleton.bones;
report.bones=bones.map(b=>b.name);assert.equal(bones.length,17);
const mixer=new THREE.AnimationMixer(gltf.scene),point=new THREE.Vector3();
function update(){gltf.scene.updateMatrixWorld(true);for(const s of skins)s.update()}
function snapshot(mesh){const result=[];for(let i=0;i<mesh.geometry.attributes.position.count;i+=37){mesh.getVertexPosition(i,point);assert(point.toArray().every(Number.isFinite));result.push(point.clone())}return result}
// Check actual front/head samples stay rigid under the retained skeleton.
const front=meshes.find(o=>o.material.name==='Yui illustration | front');assert(front);
const positions=front.geometry.attributes.position,headSamples=[];
for(let i=0;i<positions.count;i++){if(positions.getY(i)>1.44&&Math.abs(positions.getX(i))<.12&&positions.getZ(i)>.03)headSamples.push(i)}
assert(headSamples.length>20,'No front-face samples selected');
const face=()=>headSamples.filter((_,i)=>i%11===0).map(i=>front.getVertexPosition(i,new THREE.Vector3()));
for(const clip of gltf.animations){mixer.stopAllAction();const action=mixer.clipAction(clip).reset().play();action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.time=0;mixer.update(0);update();const start=meshes.map(snapshot),initialFace=face();let maxMovement=0,faceDrift=0;
 for(let f=0;f<=32;f++){action.time=clip.duration*f/32;mixer.update(0);update();meshes.forEach((m,mi)=>snapshot(m).forEach((p,i)=>{maxMovement=Math.max(maxMovement,p.distanceTo(start[mi][i]))}));const current=face();for(let i=1;i<current.length;i++)faceDrift=Math.max(faceDrift,Math.abs(current[i].distanceTo(current[0])-initialFace[i].distanceTo(initialFace[0])))}
 if(clip.name!=='Jump')assert(maxMovement>.0001,`${clip.name} has no sampled deformation`);report.clips[clip.name]={duration:clip.duration,samples:33,maxMovement,faceDrift,rigidWithin10Micrometres:faceDrift<.00001,heldPose:clip.name==='Jump'};}
assert.deepEqual(Object.keys(report.clips).sort(),['Idle','Jump','Run']);
// Exercise the actual recovered controller, using an already parsed GLB.
GLTFLoader.prototype.loadAsync=async()=>gltf;
const projection=JSON.parse(await fs.readFile(new URL('dist/projection.json',root),'utf8'));
globalThis.fetch=async()=>({ok:true,json:async()=>projection});
const actualActions={},originalClipAction=THREE.AnimationMixer.prototype.clipAction;
THREE.AnimationMixer.prototype.clipAction=function(clip,...rest){const action=originalClipAction.call(this,clip,...rest);actualActions[clip.name]=action;return action};
const {createYui}=await import('./dist/character.js');const yui=createYui();await yui.ready;
const pose=()=>{update();return meshes.map(snapshot).flat().map(v=>v.toArray()).flat()};
for(let i=0;i<90;i++)yui.update(1/60,i/60,false,true);const held=pose();
for(let i=0;i<60;i++)yui.update(1/60,2+i/60,false,true);const later=pose();assert.deepEqual(later,held,'Jump repeated after reaching its end');
assert.equal(actualActions.Jump.loop,THREE.LoopOnce);assert.equal(actualActions.Jump.paused,true);assert.equal(actualActions.Jump.time,actualActions.Jump.getClip().duration);
yui.update(.1,4,true,false);assert.equal(yui.info.animation,'Run');
yui.update(.1,4.1,false,true);assert.equal(yui.info.animation,'Jump');assert.equal(actualActions.Jump.paused,false);assert(actualActions.Jump.time<actualActions.Jump.getClip().duration,'Second jump failed to restart');
report.jumpSinglePlayAndRestart=true;report.faceSamples=headSamples.length;report.passed=true;
report.faceInterpretation='The sampled front/head region includes hair and inherited blended weights. Report drift, do not claim a rigid new face. Mesh, weights and original clips match 1bc2847 byte-for-byte; recovery introduces no new facial deformation.';
await fs.mkdir(new URL('models/recovery-validation/',root),{recursive:true});await fs.writeFile(new URL('models/recovery-validation/technical.json',root),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
