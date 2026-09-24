import * as THREE from '../dist/three.module.js';
import { GLTFLoader } from '../dist/GLTFLoader.js';

export function createYui() {
  const root = new THREE.Group();
  root.name = 'Tsukishiro Yui — Canonical identity recovery';
  let mixer, model, current, isReady = false, failed = false;
  const actions = {};
  const viewWeights = { value: new THREE.Vector4(1,0,0,0) };
  const localCamera = new THREE.Vector3();
  const info = { source: 'Canonical identity recovery / unchanged 1bc2847 mesh and paint', asset: 'yui-canonical.glb', identityCommit: '1bc2847', projection: 'historical four-view illustration; oblique seams remain', ready: false, meshes: 0, triangles: 0, bones: 0, clips: [] };
  const ready = Promise.all([
    new GLTFLoader().loadAsync('../dist/yui-canonical.glb?v=8ca10b33'),
    fetch('../dist/projection.json?v=1bc2847').then(r => { if(!r.ok)throw new Error('Missing character projections');return r.json(); })
  ]).then(([gltf, projections]) => {
    model = gltf.scene;
    for (const name of ['Idle', 'Run', 'Jump']) {
      if (!gltf.animations.some(clip => clip.name === name)) throw new Error(`Missing canonical clip: ${name}`);
    }
    const converted=new Map();
    model.traverse(o=>{if(!o.isMesh)return;const convert=m=>{
      if(!m.name.startsWith('Yui illustration |'))return m;
      if(!converted.has(m))converted.set(m,new THREE.MeshBasicMaterial({name:m.name,map:m.map||m.emissiveMap,side:THREE.DoubleSide,toneMapped:false}));
      return converted.get(m);
    };o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);});
    const painted = new Set();
    model.traverse(o => { if(o.isMesh) for(const m of (Array.isArray(o.material)?o.material:[o.material])) if(m.name.startsWith('Yui illustration |'))painted.add(m); });
    const maps = ['front','back','side','left'].map(name => [...painted].find(m=>m.name.endsWith(name))?.map);
    if(maps.some(m=>!m))throw new Error('Incomplete character paint');
    // Rest-space projection follows the skeleton, keeping painted linework on the moving surface.
    for(const material of painted) {
      material.onBeforeCompile = shader => {
        shader.uniforms.yuiViewWeights=viewWeights;
        let declarations='varying vec3 yuiRestPosition;\nuniform vec4 yuiViewWeights;\n';
        let samples='vec4 yuiPaint=vec4(0.0);\nvec4 yuiP=vec4(yuiRestPosition,1.0);\n';
        for(let i=0;i<4;i++) {
          shader.uniforms['yuiPaint'+i]={value:maps[i]};
          shader.uniforms['yuiU'+i]={value:new THREE.Vector4(...projections[i].u)};
          shader.uniforms['yuiV'+i]={value:new THREE.Vector4(...projections[i].v)};
          declarations+=`uniform sampler2D yuiPaint${i};\nuniform vec4 yuiU${i};\nuniform vec4 yuiV${i};\n`;
          samples+=`vec2 yuiUv${i}=vec2(dot(yuiP,yuiU${i}),dot(yuiP,yuiV${i}));\n`;
          if(i>1)samples+=`yuiUv${i}.x=0.5+(yuiUv${i}.x-0.5)*0.94;\n`;
          if(i===0)samples+='if(yuiUv0.y>0.80){yuiUv0.y=yuiUv0.y<0.885?mix(0.80,0.91,(yuiUv0.y-0.80)/0.085):mix(0.91,1.0,(yuiUv0.y-0.885)/0.115);}\n';
          if(i===3)samples+='yuiUv3.x=mix(yuiUv3.x,0.45+(yuiUv3.x-0.45)*0.80,smoothstep(1.38,1.52,yuiRestPosition.y));\n';
          if(i===2)samples+='yuiUv2.x=mix(yuiUv2.x,0.55+(yuiUv2.x-0.55)*0.84,smoothstep(1.38,1.52,yuiRestPosition.y));\n';
          samples+=`yuiPaint+=texture2D(yuiPaint${i},yuiUv${i})*yuiViewWeights[${i}];\n`;
        }
        shader.vertexShader='varying vec3 yuiRestPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nyuiRestPosition=position;');
        shader.fragmentShader=declarations+shader.fragmentShader.replace('#include <map_fragment>',samples+'diffuseColor*=yuiPaint;');
      };
      material.customProgramCacheKey=()=> 'yui-multiview-v1';
    }
    // Blender's Z-up is converted to glTF Y-up by the exporter; front is +Z.
    model.scale.setScalar(2.47);
    model.traverse(o => {
      o.layers.enable(1);
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = false;
      o.frustumCulled = false;
      info.meshes++;
      info.triangles += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
      if (o.skeleton) info.bones = Math.max(info.bones,o.skeleton.bones.length);
      for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
        for (const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap']) {
          if (m[key]) m[key].anisotropy = 8;
        }
        if(m.isMeshBasicMaterial) {
          m.color.set('#ffffff');m.toneMapped=false;
        } else {
          m.roughness=Math.max(.65,m.roughness);
          m.envMapIntensity=.25;
        }
      }
    });
    root.add(model);
    mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
    // Keep the non-artistic playback fixes from 301b2bb. The original skeleton
    // and animation tracks are preserved; no weights or rest pose are replaced.
    actions.Jump.setLoop(THREE.LoopOnce, 1);
    actions.Jump.clampWhenFinished = true;
    info.clips = Object.keys(actions);
    isReady = info.ready = true;
    play('Idle');
    return info;
  }).catch(error => { failed = true; console.error('Character load failed:',error);throw error; });
  function play(name) {
    const next = actions[name];
    if (!next || current === next) return;
    const rate = name === 'Jump' ? next.getClip().duration / .78 : 1;
    next.reset().setEffectiveTimeScale(rate).setEffectiveWeight(1).play();
    if (current) next.crossFadeFrom(current,.16,false);
    current = next;info.animation = name;
  }
  return {
    root, ready, info,
    updateView(camera) {
      if(!isReady)return;
      root.updateWorldMatrix(true,false);
      localCamera.copy(camera.position);root.worldToLocal(localCamera);
      const x=localCamera.x,z=localCamera.z;
      const weights=[Math.max(z,0),Math.max(-z,0),Math.max(x,0),Math.max(-x,0)].map(v=>Math.pow(v,16));
      const sum=weights.reduce((a,b)=>a+b,0)||1;
      viewWeights.value.set(...weights.map(v=>v/sum));
    },
    update(dt,time,running,jumping) {
      if(!isReady || failed)return;
      play(jumping ? 'Jump' : running ? 'Run' : 'Idle');
      mixer.update(Math.min(Math.max(dt, 0), .1));
    }
  };
}
