import * as THREE from '../dist/three.module.js';
import {createYui} from '../dist/character.js';
const pairs = [false, true].map((faceDetail,i) => {
  const canvas=document.getElementById(i?'after':'before');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#85868d');
  scene.add(new THREE.HemisphereLight('#ecebf4','#686071',.65));
  for(const [color,power,xyz] of [['#fff1e9',1.4,[3,5,6]],['#bcbde1',.55,[-4,3,-2]]]){
    const light=new THREE.DirectionalLight(color,power);light.position.set(...xyz);scene.add(light);
  }
  const character=createYui({faceDetail});character.root.scale.setScalar(1/2.47);scene.add(character.root);
  const camera=new THREE.OrthographicCamera(-.2,.2,.3,-.3,.01,20);
  return {canvas,renderer,scene,character,camera};
});
await Promise.all(pairs.map(p=>p.character.ready));
let angle=0,closeup=true,running=false;
document.querySelectorAll('[data-angle]').forEach(b=>b.onclick=()=>{
  angle=Number(b.dataset.angle)*Math.PI/180;
  document.querySelectorAll('[data-angle]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));
});
document.getElementById('size').onclick=e=>{closeup=!closeup;e.target.textContent=closeup?'全身':'臉部特寫';document.querySelector('.reference').classList.toggle('face',closeup)};
document.getElementById('motion').onclick=e=>{running=!running;e.target.textContent=running?'停止跑步':'示範跑步'};
document.getElementById('setting').onclick=()=>document.querySelector('dialog').showModal();
document.getElementById('close').onclick=()=>document.querySelector('dialog').close();
document.getElementById('status').textContent='已載入 · 兩側皆為同一份原模型；可切換正面、雙側與跑步比較。';
window.yuiReview={ready:false,states:()=>pairs.map(p=>p.character.info)};
let last=performance.now(),renderedFrames=0;
function render(now){
  const dt=Math.min((now-last)/1000,.04);last=now;
  for(const {canvas,renderer,scene,character,camera} of pairs){
    const width=canvas.clientWidth,height=canvas.clientHeight;renderer.setSize(width,height,false);
    const scale=closeup?.45:1.93,aspect=width/height;
    camera.left=-scale*aspect/2;camera.right=scale*aspect/2;camera.top=scale/2;camera.bottom=-scale/2;camera.updateProjectionMatrix();
    const target=new THREE.Vector3(-.005,closeup?1.417:.835,closeup?.13:0);
    camera.position.copy(target).add(new THREE.Vector3(Math.sin(angle)*3,.02,Math.cos(angle)*3));camera.lookAt(target);
    character.update(dt,now/1000,running,false);renderer.render(scene,camera);
  }
  if(++renderedFrames>=2) window.yuiReview.ready=true;
  requestAnimationFrame(render);
}requestAnimationFrame(render);
