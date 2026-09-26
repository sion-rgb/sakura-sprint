import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as THREE from './dist/three.module.js';
import {GLTFLoader} from './dist/GLTFLoader.js';
import {applyFaceDetail,noseRepair} from './dist/face-detail.js';
const root=new URL('./',import.meta.url);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const base=await fs.readFile(new URL('dist/yui-selected.glb',root));
assert.equal(hash(base),'3f6ff47b618c04c8282a20702d323f5fa4f1eec6ac55bed9c188bab606c6a2b2');
assert.equal(hash(await fs.readFile(new URL('dist/yui-eye-detail.glb',root))),'8b391270ac38191884268f9940783b7f9c82d54770481a7c0ee5ab5bf1f4a5c3');
const loader=new GLTFLoader();loader.register(()=>({name:'CPU',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
const gltf=await loader.parseAsync(base.buffer.slice(base.byteOffset,base.byteOffset+base.byteLength),'');
const body=gltf.scene.getObjectByName('Yui_Selected_Original_Surface');
const signature=()=>Object.fromEntries(Object.entries(body.geometry.attributes).map(([key,a])=>[key,hash(Buffer.from(a.array.buffer))]));
const before=signature(),material=body.material;applyFaceDetail(body);
assert.deepEqual(signature(),before,'Geometry, UV, normals or rig weights changed');
assert.equal(body.material.map,material.map,'Original base image replaced');
assert.equal(body.material.metalnessMap,material.metalnessMap,'Original metalness replaced');
assert.equal(body.material.roughnessMap,material.roughnessMap,'Original roughness replaced');
const shader={vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
body.material.onBeforeCompile(shader);
assert(shader.vertexShader.includes('vYuiRestPosition = position;'));
assert(shader.fragmentShader.includes('localSkin * diffuse, noseMask'));
let affected=0;
const pos=body.geometry.attributes.position,indices=body.geometry.attributes.skinIndex,weights=body.geometry.attributes.skinWeight;
function mask(x,y,z){const d=[x,y,z].map((v,i)=>(v-noseRepair.center[i])/noseRepair.radius[i]);return Math.hypot(...d)<1;}
for(let i=0;i<pos.count;i++)if(mask(pos.getX(i),pos.getY(i),pos.getZ(i))){
  affected++;
  for(let j=0;j<4;j++)if(weights.array[i*4+j]>0)assert.equal(body.skeleton.bones[indices.array[i*4+j]].name,'Head','Mask can drift with animation');
}
assert(affected>0&&affected<pos.count*.001,'Repair exceeded the tiny nose region');
for(const point of [[-.0485,1.410,.19],[.040,1.410,.19],[-.0075,1.370,.20],[0,1.50,.23]])assert(!mask(...point),'Repair touches eye, mouth or bangs');
const report={date:new Date().toISOString(),baseSha256:hash(base),baseAndEyeGlbUnchanged:true,allGeometryAttributesUnchanged:true,originalMaterialMapsUnchanged:true,affectedVertices:affected,totalVertices:pos.count,affectedPercent:100*affected/pos.count,allAffectedVerticesBoundRigidlyToHead:true,eyeMouthAndBangsOutsideMask:true,passed:true};
await fs.writeFile(new URL('repair-review/technical-validation.json',root),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
