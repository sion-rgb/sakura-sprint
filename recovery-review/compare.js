import * as THREE from '../dist/three.module.js';
import {createYui as canonical} from './canonical.js';
import {createYui as rebuilt} from './rebuilt.js';
import {createYui as recovered} from './recovered.js';
const recovery=new URLSearchParams(location.search).has('recovered');
if(recovery){document.querySelector('h1').textContent='回復驗證：原設定 / Canonical 基準 / Recovery';document.querySelectorAll('h2')[2].textContent='Recovery · 原始 Canonical + 播放修正';document.querySelectorAll('.caption')[2].textContent='原始臉部、網格、四張貼圖及骨架完整保留。'}
let mode='face',side=false,running=false;
const views=[['canonical',canonical,1.54],['rebuilt',recovery?recovered:rebuilt,recovery?1.54:1.40]].map(([id,create,height])=>{
 const el=document.getElementById(id),scene=new THREE.Scene();scene.background=new THREE.Color('#292d40');
 const camera=new THREE.PerspectiveCamera(30,1,.01,100);camera.layers.enable(1);
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;el.append(renderer.domElement);
 scene.add(new THREE.HemisphereLight('#ecebf4','#686071',.65));
 for(const [col,pow,pos] of [['#fff1e9',1.4,[3,5,6]],['#bcbde1',.55,[-4,3,-2]]]){const l=new THREE.DirectionalLight(col,pow);l.position.set(...pos);scene.add(l);}
 const yui=create();scene.add(yui.root);return {el,scene,camera,renderer,yui,height};
});
await Promise.all(views.map(v=>v.yui.ready));document.getElementById('status').textContent='兩版已載入 · 相同照明 · 原資產未更改';
document.getElementById('face').onclick=()=>{mode='face';side=false;document.getElementById('ref').classList.add('face')};
document.getElementById('full').onclick=()=>{mode='full';side=false;document.getElementById('ref').classList.remove('face')};
document.getElementById('side').onclick=()=>{side=!side};document.getElementById('run').onclick=()=>{running=!running};
let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;
 for(const v of views){const {el,camera,renderer,yui,scene}=v,w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 const face=mode==='face',height=face?v.height*2.47:2.02,distance=face?2.3:10.2;
 camera.position.set(side?distance:0,height,side?0:distance);camera.lookAt(0,height,0);yui.updateView(camera);if(running)yui.update(dt,now/1000,true,false);renderer.render(scene,camera);
 }}requestAnimationFrame(frame);
