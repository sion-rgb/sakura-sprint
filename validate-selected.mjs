import fs from 'node:fs/promises';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import * as THREE from './dist/three.module.js';import {GLTFLoader} from './dist/GLTFLoader.js';
const root=new URL('./',import.meta.url),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=await fs.readFile(new URL('models/Yui-Selected-Source.glb',root));const bytes=await fs.readFile(new URL('dist/yui-selected.glb',root));
assert.equal(sha(source),'f73c2e1d6b009ac5fdbb53f6a623a81485d16c3b8517b15378ef4e9051567d18');
function parse(b){const n=b.readUInt32LE(12);return {json:JSON.parse(b.subarray(20,20+n)),bin:b.subarray(28+n)}}
function images(b){const {json:g,bin}=parse(b);return g.images.map(im=>{const v=g.bufferViews[im.bufferView];return sha(bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength))})}
const sourceImages=images(source),candidateImages=images(bytes);for(const hash of sourceImages)assert(candidateImages.includes(hash),'Original texture image was replaced or re-encoded');
const loader=new GLTFLoader();loader.register(()=>({name:'CPU_ONLY',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o)});const body=meshes.find(o=>o.name.startsWith('Yui_Selected_Original_Surface'));assert(body,meshes.map(o=>o.name).join(','));
const originalUV=sha(Buffer.from(body.geometry.attributes.uv.array.buffer));const positions=body.geometry.attributes.position;
const detailBytes=await fs.readFile(new URL('dist/yui-eye-detail.glb',root));
const detail=await loader.parseAsync(detailBytes.buffer.slice(detailBytes.byteOffset,detailBytes.byteOffset+detailBytes.byteLength),'');
const head=gltf.scene.getObjectByName('Head');assert(head?.isBone);gltf.scene.add(detail.scene);gltf.scene.updateMatrixWorld(true);head.attach(detail.scene);
const eyeMeshes=[];detail.scene.traverse(o=>{if(o.isMesh)eyeMeshes.push(o)});assert.equal(eyeMeshes.length,3);
const eyeImageHashes=images(detailBytes);const referenceHash=sha(await fs.readFile(new URL('dist/yui-setting.png',root)));
assert(eyeImageHashes.includes(referenceHash),'Eye artwork must reuse the original setting image bytes');
const faceIds=[];for(let i=0;i<positions.count;i+=37)if(positions.getY(i)>1.31)faceIds.push(i);assert(faceIds.length>100);
const skins=new Set(meshes.map(m=>m.skeleton)),mixer=new THREE.AnimationMixer(gltf.scene);function update(){gltf.scene.updateMatrixWorld(true);for(const s of skins)s.update()}
const footIds={L:[],R:[]};for(let i=0;i<positions.count;i+=23)if(positions.getY(i)<.12)footIds[positions.getX(i)>0?'L':'R'].push(i);
const report={sourceSha256:sha(source),candidateSha256:sha(bytes),eyeDetailSha256:sha(detailBytes),eyeSourceImageUnchanged:true,embeddedOriginalImagesUnchanged:true,bones:body.skeleton.bones.length,sourceFaceReplaced:false,clips:{},browserRenderingTested:false,passed:false};
for(const clip of gltf.animations){mixer.stopAllAction();const action=mixer.clipAction(clip).reset().play();action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.time=0;mixer.update(0);update();const first=faceIds.map(i=>body.getVertexPosition(i,new THREE.Vector3()));let maxFaceDrift=0,minFootY=Infinity,maxLift=0;
 const eyeWorld=()=>eyeMeshes.map(o=>o.localToWorld(new THREE.Vector3().fromBufferAttribute(o.geometry.attributes.position,100)));
 const faceWorld=()=>body.localToWorld(body.getVertexPosition(faceIds[0],new THREE.Vector3()));
 const eyeDistances=eyeWorld().map(p=>p.distanceTo(faceWorld()));let maxEyeAttachmentDrift=0;
 for(let n=0;n<=32;n++){action.time=clip.duration*n/32;mixer.update(0);update();const now=faceIds.map(i=>body.getVertexPosition(i,new THREE.Vector3()));for(let i=1;i<now.length;i++){assert(now[i].toArray().every(Number.isFinite));maxFaceDrift=Math.max(maxFaceDrift,Math.abs(first[i].distanceTo(first[0])-now[i].distanceTo(now[0])))}
 for(const [i,p] of eyeWorld().entries())maxEyeAttachmentDrift=Math.max(maxEyeAttachmentDrift,Math.abs(p.distanceTo(faceWorld())-eyeDistances[i]));
 const bottoms={};for(const s of ['L','R'])bottoms[s]=Math.min(...footIds[s].map(i=>body.getVertexPosition(i,new THREE.Vector3()).y));minFootY=Math.min(minFootY,...Object.values(bottoms));maxLift=Math.max(maxLift,...Object.values(bottoms));
 assert.equal(sha(Buffer.from(body.geometry.attributes.uv.array.buffer)),originalUV,'UV changed during animation');}
 assert(maxFaceDrift<1e-5,`${clip.name} facial geometry changed: ${maxFaceDrift}`);if(clip.name==='Run'){assert(minFootY>-.01,'Feet penetrate ground');assert(maxLift>.04,'No alternating foot lift')}
 assert(maxEyeAttachmentDrift<1e-5,`${clip.name} eye detail drifted from head`);
 report.clips[clip.name]={duration:clip.duration,samples:33,maxFaceDrift,maxEyeAttachmentDrift,minFootY,maxLift};}
assert.deepEqual(Object.keys(report.clips).sort(),['Idle','Jump','Run']);report.passed=true;
await fs.writeFile(new URL('selected-review/technical-validation.json',root),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
