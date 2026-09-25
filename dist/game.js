import * as THREE from './three.module.js';
import {createYui} from './character.js?v=selected-3f6ff47b61-8b391270';
import {createWorld} from './world.js?v=7';

const $=id=>document.getElementById(id);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,250);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('scene').appendChild(renderer.domElement);
const world=createWorld(scene);
const character=createYui(),runner=character.root;runner.scale.setScalar(.78);scene.add(runner);
runner.traverse(o=>o.layers.enable(1));
// The inspection view has softer lighting than the moonlit course. Keeping its
// lights on the inspection layer preserves the existing world illumination.
const studioSky=new THREE.HemisphereLight('#ecebf4','#686071',.65);studioSky.layers.set(1);scene.add(studioSky);
for(const [color,power,position] of [['#fff1e9',1.4,[3,5,6]],['#bcbde1',.55,[-4,3,-2]]]){
  const light=new THREE.DirectionalLight(color,power);light.position.set(...position);light.layers.set(1);scene.add(light);
}
$('start').disabled=true;$('start').innerHTML='月白結準備中 <span class="loader"></span>';$('inspect').disabled=true;
character.ready.then(()=>{$('start').disabled=false;$('start').innerHTML='開始旅程 <span>↗</span>';$('inspect').disabled=false;$('status').textContent='月光之下，讓旋律陪你出發';}).catch(()=>{$('start').textContent='重新載入角色';$('start').disabled=false;$('start').onclick=()=>location.reload();$('status').textContent='角色未能載入，請按重新載入';});

let state='intro',lane=0,y=0,vy=0,distance=0,coins=0,speed=12,spawn=0,objects=[];
let showcase=false,orbit=0,zoom=1,demo=false,dragging=false,dragX=0,startX=0,startY=0;
let muted=false,audioContext;
const music=$('bgm');music.volume=.38;
try{muted=localStorage.getItem('yui-music-muted')==='true';}catch{}
function syncMusic(){music.muted=muted;$('sound').textContent=muted?'♪':'♫';$('sound').setAttribute('aria-label',muted?'開啟背景音樂與音效':'關閉背景音樂與音效');$('sound').setAttribute('aria-pressed',String(!muted));}
function playMusic(){if(!muted&&!document.hidden)music.play().catch(()=>{});}
syncMusic();
function tone(freq){if(muted)return;try{audioContext??=new AudioContext();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=freq;o.connect(g);g.connect(audioContext.destination);g.gain.setValueAtTime(.035,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.22);o.start();o.stop(audioContext.currentTime+.24);}catch{}}
function sync(){$('distance').textContent=Math.floor(distance);$('coins').textContent=coins;}
function remove(o){scene.remove(o);o.traverse(c=>{if(c.geometry&&!c.userData.shared)c.geometry.dispose();});}
function clear(){objects.forEach(remove);objects=[];}
function resetView(){showcase=false;zoom=1;demo=false;orbit=0;document.body.classList.remove('showcase');$('view-motion').textContent='示範跑步';$('view-close').textContent='臉部特寫';}
function start(){if(!character.info.ready)return;resetView();clear();lane=0;y=vy=distance=coins=spawn=0;speed=12;state='running';playMusic();$('dialog').hidden=true;document.body.classList.add('playing');$('status').textContent='拾起音符，沿著月光前行';sync();}
function pause(){if(state==='running'){state='paused';music.pause();$('endtag').textContent='A QUIET MOMENT';$('endtitle').textContent='讓風等一等';$('result').textContent='準備好，就繼續這段旋律。';$('resume').hidden=false;$('dialog').hidden=false;}else if(state==='paused'){state='running';playMusic();$('dialog').hidden=true;}}
function end(){state='over';tone(196);$('endtag').textContent='YOUR LITTLE NOCTURNE';$('endtitle').textContent='把這段月光留住';$('result').textContent=`前行 ${Math.floor(distance)} 公尺 · 收集 ${coins} 枚音符`;$('resume').hidden=true;$('dialog').hidden=false;$('status').textContent='下一段旋律，等你繼續';}
function home(){clear();state='intro';lane=0;y=vy=0;orbit=0;resetView();$('dialog').hidden=true;document.body.classList.remove('playing');$('status').textContent='月光之下，讓旋律陪你出發';}
function jump(){if(state==='running'&&y<.01){vy=8.6;tone(440);}}
function move(n){if(state==='running')lane=THREE.MathUtils.clamp(lane+n,-1,1);}
$('start').onclick=start;$('restart').onclick=start;$('resume').onclick=pause;$('pause').onclick=pause;$('home').onclick=home;
$('sound').onclick=()=>{muted=!muted;syncMusic();try{localStorage.setItem('yui-music-muted',String(muted));}catch{}if(muted)music.pause();else playMusic();};
$('left').onclick=()=>move(-1);$('right').onclick=()=>move(1);$('jump').onclick=jump;
$('inspect').onclick=()=>{showcase=true;zoom=1;orbit=0;document.body.classList.add('showcase');};
$('view-front').onclick=()=>orbit=0;$('view-side').onclick=()=>orbit=Math.PI/2;$('view-back').onclick=()=>orbit=Math.PI;
$('view-close').onclick=()=>{zoom=zoom===1?3:1;$('view-close').textContent=zoom===1?'臉部特寫':'全身';};
$('view-motion').onclick=()=>{demo=!demo;$('view-motion').textContent=demo?'靜態展示':'示範跑步';};
$('view-exit').onclick=resetView;
$('reference').onclick=()=>{$('reference-dialog').hidden=false;};$('reference-close').onclick=()=>{$('reference-dialog').hidden=true;};
addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp',' ','Escape','a','d','w','p'].includes(e.key))return;e.preventDefault();if(e.repeat)return;if(e.key==='Escape'&&!$('reference-dialog').hidden){$('reference-dialog').hidden=true;return;}if(e.key==='ArrowLeft'||e.key==='a')move(-1);if(e.key==='ArrowRight'||e.key==='d')move(1);if(['ArrowUp',' ','w'].includes(e.key))jump();if(e.key==='Escape'||e.key==='p')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();if(state==='running')pause();}});
renderer.domElement.addEventListener('pointerdown',e=>{startX=e.clientX;startY=e.clientY;dragX=e.clientX;dragging=true;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(dragging&&state==='intro'){orbit+=(e.clientX-dragX)*.009;dragX=e.clientX;}});
renderer.domElement.addEventListener('pointerup',e=>{dragging=false;if(state==='intro')return;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)>30)move(Math.sign(dx));else if(dy< -25||Math.abs(dx)<10)jump();});
renderer.domElement.addEventListener('pointercancel',()=>dragging=false);

const colors={dark:new THREE.MeshStandardMaterial({color:'#444859',roughness:.7}),trim:new THREE.MeshStandardMaterial({color:'#bdb3a2',metalness:.45,roughness:.45}),ivory:new THREE.MeshStandardMaterial({color:'#d4c6c7',roughness:.8}),note:new THREE.MeshStandardMaterial({color:'#eee0bd',metalness:.4,roughness:.25,emissive:'#b38d52',emissiveIntensity:.42})};
function box(p,w,h,d,m,x=0,yy=0,z=0){let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,yy,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function addRow(){const blocked=Math.floor(Math.random()*3)-1;const o=new THREE.Group();o.position.set(blocked*3,0,-95);o.userData.type='barrier';
  box(o,1.9,.68,.62,colors.dark,0,.34);box(o,1.94,.055,.66,colors.trim,0,.7);box(o,1.82,.035,.63,colors.trim,0,.08);
  for(const x of [-.77,.77]){box(o,.055,.85,.08,colors.trim,x,.43);box(o,.13,.1,.15,colors.ivory,x,.85);}
  for(const x of [-.45,0,.45])box(o,.035,.55,.03,colors.trim,x,.39,.325);
  scene.add(o);objects.push(o);const free=[-1,0,1].filter(n=>n!==blocked);const path=free[Math.floor(Math.random()*free.length)];
  for(let i=0;i<4;i++){const n=new THREE.Group();n.position.set(path*3,1.05,-98-i*3.1);n.userData.type='coin';const ring=new THREE.Mesh(new THREE.TorusGeometry(.23,.055,8,20),colors.note);ring.scale.y=.78;n.add(ring);box(n,.055,.50,.055,colors.note,.21,.24);box(n,.16,.055,.055,colors.note,.28,.47);scene.add(n);objects.push(n);}
}
let last=performance.now(),time=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.045);last=now;time+=dt;const running=state==='running';
  if(running){distance+=speed*dt;speed=Math.min(24,12+distance/230);spawn-=dt;if(spawn<=0){addRow();spawn=1.7;}vy-=22*dt;y=Math.max(0,y+vy*dt);if(y===0)vy=0;sync();}
  runner.position.x=THREE.MathUtils.damp(runner.position.x,lane*3,13,dt);runner.position.y=y;
  if(state!=='paused')character.update(dt,time,running||(state==='intro'&&demo),y>.01);
  runner.rotation.y=state==='intro'?orbit:Math.PI;runner.rotation.z=THREE.MathUtils.damp(runner.rotation.z,(runner.position.x-lane*3)*.035,8,dt);
  world.update(dt,time,running?speed:state==='intro'&&!showcase?1:0);
  for(let i=objects.length-1;i>=0;i--){const o=objects[i];if(running)o.position.z+=speed*dt;if(o.userData.type==='coin')o.rotation.y+=dt*1.6;
    const hit=running&&Math.abs(o.position.z)<.6&&Math.abs(o.position.x-runner.position.x)<.9;
    if(hit&&o.userData.type==='barrier'&&y<.9){end();break;}
    if(hit&&o.userData.type==='coin'&&y<1.6){coins++;tone(660+(coins%5)*83);remove(o);objects.splice(i,1);sync();continue;}
    if(o.position.z>14){remove(o);objects.splice(i,1);}
  }
  const narrow=innerWidth<650,lobby=state==='intro';
  const target=new THREE.Vector3(lobby?(showcase?0:(narrow?0:-.8)):0,lobby?(showcase&&zoom>1?2.72:(showcase?1.35:1.94)):1.45,lobby?0:-3.5);
  const dest=new THREE.Vector3(lobby?(showcase?.1:(narrow?.1:.85)):0,lobby?(showcase&&zoom>1?2.77:(showcase?2.08:2.45)):(narrow?5.8:5.0),lobby?(showcase?8.1:(narrow?8.3:6.7))/zoom:(narrow?13:10));
  camera.fov=lobby?42:(narrow?63:48);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();camera.position.lerp(dest,1-Math.exp(-dt*5));camera.lookAt(target);camera.layers.set(showcase?1:0);
  scene.background.set(showcase?'#292d40':'#303d59');character.updateView(camera);renderer.render(scene,camera);
}
requestAnimationFrame(frame);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);});
window.sakura={getState:()=>({state,lane,y,distance,coins,speed,obstacles:objects.length,character:'月白結',model:character.info,showcase,orbit,zoom,demo,environment:'月下花徑',music:{title:'Sunny Hillside Dash',muted,playing:!music.paused,time:music.currentTime,duration:music.duration}}),start,pause,jump,move};
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'sakura_game',description:'Read game status or start a new run.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['status','start']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!['status','start'].includes(input.action))throw new Error('Invalid action');if(input.action==='start')start();return window.sakura.getState();}})).catch(()=>{});}catch{}}
