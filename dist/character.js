import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

// Fixed-UV rigged character. Textures stay attached to the animated surface.
export function createYui() {
  const root = new THREE.Group();
  root.name = 'Tsukishiro Yui';
  let mixer, current;
  const actions = {};
  const info = { source: 'User-selected historical 3D surface / preserved original mesh and UV', asset: 'yui-selected.glb', faceReplaced: false, ready: false,
    meshes: 0, triangles: 0, bones: 0, clips: [] };
  const ready = new GLTFLoader().loadAsync('./yui-selected.glb?v=selected-3f6ff47b61-8b391270').then(async gltf => {
    const model = gltf.scene;
    // Add only the setting sheet's eyes and short mouth line to the original head. The source
    // character, face geometry and original UVs remain untouched and recoverable.
    info.eyeDetail = 'original';
    if (new URLSearchParams(location.search).get('eyes') !== 'original') {
      const eye = await new GLTFLoader().loadAsync('./yui-eye-detail.glb?v=reference-8b391270ac');
      const head = model.getObjectByName('Head');
      if (!head?.isBone) throw new Error('Original head attachment bone missing');
      model.add(eye.scene);
      model.updateMatrixWorld(true);
      head.attach(eye.scene);
      info.eyeDetail = 'original setting sheet / separate fixed-UV eyes and mouth line';
    }
    const clipNames = gltf.animations.map(clip => clip.name);
    for (const name of ['Idle', 'Run', 'Jump']) {
      if (!clipNames.includes(name)) throw new Error(`Incomplete character animation: ${name}`);
    }
    model.traverse(object => {
      object.layers.enable(1);
      if (!object.isMesh) return;
      const materials = [].concat(object.material);
      const textured = materials.some(material => ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap'].some(key => material[key]));
      if (textured && !object.geometry.attributes.uv) throw new Error(`Missing fixed UVs: ${object.name}`);
      object.castShadow = true;
      object.receiveShadow = false;
      object.frustumCulled = false;
      info.meshes++;
      info.triangles += (object.geometry.index?.count || object.geometry.attributes.position.count) / 3;
      if (object.skeleton) info.bones = Math.max(info.bones, object.skeleton.bones.length);
      for (const material of materials) {
        for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) {
          if (material[key]) material[key].anisotropy = 8;
        }
        if (material.isMeshStandardMaterial) material.envMapIntensity = .35;
      }
    });
    if (!info.bones) throw new Error('Character has no deformation rig');
    // The Blender asset uses metres, Z-up; glTF converts that to Y-up.
    model.scale.setScalar(2.47);
    root.add(model);
    mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
    actions.Jump.setLoop(THREE.LoopOnce, 1);
    actions.Jump.clampWhenFinished = true;
    info.clips = clipNames;
    info.ready = true;
    play('Idle');
    return info;
  });
  function play(name) {
    const next = actions[name];
    if (!next || current === next) return;
    // The game's 8.6 m/s impulse and 22 m/s² gravity give a .78 s flight.
    // Play one complete tuck/extension instead of looping Jump in mid-air.
    const rate = name === 'Jump' ? next.getClip().duration / .78 : 1;
    next.reset().setEffectiveTimeScale(rate).setEffectiveWeight(1).play();
    if (current) next.crossFadeFrom(current, .16, false);
    current = next;
    info.animation = name;
  }
  return {
    root, ready, info,
    updateView() {}, // Textures are tied to mesh UVs and never to the camera.
    update(dt, time, running, jumping) {
      if (!info.ready) return;
      play(jumping ? 'Jump' : running ? 'Run' : 'Idle');
      mixer.update(Math.min(Math.max(dt, 0), .1));
    }
  };
}
