import * as T from './three.module.js';
import {mergeGeometries} from './BufferGeometryUtils.js';

// Moonlit canal garden. All foreground scenery is real geometry.
export function createWorld(scene) {
  let seed=31917;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const range=(a,b)=>a+(b-a)*rnd();
  const material=(color,extras={})=>new T.MeshStandardMaterial({color,roughness:.85,...extras});
  const stone=material('#8d91a5'),edge=material('#b2afbc'),iron=material('#303848',{metalness:.35}),gold=material('#b1a18b',{metalness:.45,roughness:.5}),wood=material('#38313d');
  const add=(geo,mat,parent,pos=[0,0,0])=>{const o=new T.Mesh(geo,mat);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const box=(p,pos,dim,m)=>add(new T.BoxGeometry(...dim),m,p,pos);
  const tube=(points,r,m,parent)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,6,false),m,parent);
  const instances=(geo,mat,poses,parent)=>{const mesh=new T.InstancedMesh(geo,mat,poses.length),dummy=new T.Object3D();poses.forEach((p,i)=>{dummy.position.set(...p.pos);dummy.rotation.set(...(p.rot||[0,0,0]));dummy.scale.set(...(p.scale||[1,1,1]));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(p.color)mesh.setColorAt(i,new T.Color(p.color));});mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  const canvasTexture=(draw,w=512,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return new T.CanvasTexture(c);};
  scene.background=new T.Color('#303d59');scene.fog=new T.Fog('#738095',45,150);
  const ambient=new T.HemisphereLight('#d4ddff','#6b5e78',1.75);scene.add(ambient);
  const moonlight=new T.DirectionalLight('#dce9ff',2.15);moonlight.position.set(-20,30,-18);moonlight.castShadow=true;moonlight.shadow.mapSize.set(2048,2048);moonlight.shadow.bias=-.0003;moonlight.shadow.normalBias=.018;Object.assign(moonlight.shadow.camera,{left:-20,right:20,top:30,bottom:-25,near:.1,far:100});scene.add(moonlight);
  const portraitFill=new T.DirectionalLight('#f4e9e8',1.55);portraitFill.position.set(4,6,12);scene.add(portraitFill);
  const rim=new T.DirectionalLight('#aaaaff',.65);rim.position.set(-6,5,-6);scene.add(rim);

  const sky=add(new T.SphereGeometry(145,32,20),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v; void main(){float h=normalize(v).y;vec3 c=mix(vec3(.47,.45,.56),vec3(.16,.22,.36),smoothstep(-.05,.45,h));c=mix(c,vec3(.07,.105,.21),smoothstep(.3,1.,h));gl_FragColor=vec4(c,1.);}' }),scene);sky.castShadow=false;sky.receiveShadow=false;
  const stars=[];for(let i=0;i<580;i++){let x=range(-120,120),y=range(18,110),z=range(-135,-65);stars.push(x,y,z);}const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(starGeo,new T.PointsMaterial({color:'#dce8ff',size:.105,transparent:true,opacity:.75,depthWrite:false})));
  const moonTex=canvasTexture((ctx,w)=>{ctx.fillStyle='#ebe9df';ctx.fillRect(0,0,w,w);for(let i=0;i<45;i++){const x=rnd()*w,y=rnd()*w,r=range(8,62);let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#abb1be20');g.addColorStop(.55,'#abb1be12');g.addColorStop(1,'#abb1be00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}});
  const moon=add(new T.SphereGeometry(5.2,48,24),new T.MeshBasicMaterial({map:moonTex,color:'#e9efff',fog:false}),scene,[-22,31,-115]);moon.castShadow=false;
  const glowTex=canvasTexture((ctx,w)=>{let g=ctx.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,'#ffffffb0');g.addColorStop(.18,'#ffffff60');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,w,w);},128);
  const glow=(parent,pos,color,size,opacity=.7)=>{let p=new T.Sprite(new T.SpriteMaterial({map:glowTex,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending}));p.position.set(...pos);p.scale.set(size,size,1);parent.add(p);return p;};
  glow(scene,[-22,31,-114],'#bccdff',27,.2);
  const cloudTex=canvasTexture((ctx,w,h)=>{for(let i=0;i<70;i++){let x=range(40,w-40),y=range(h*.30,h*.75),r=range(20,75),g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#f0e0ee32');g.addColorStop(1,'#f0e0ee00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}},1024,256);
  const clouds=[];for(let i=0;i<8;i++){let c=add(new T.PlaneGeometry(range(30,65),range(5,10)),new T.MeshBasicMaterial({map:cloudTex,transparent:true,depthWrite:false,opacity:range(.2,.6),fog:false}),scene,[range(-80,80),range(11,28),-115+i*1.1]);c.rotation.z=range(-.08,.08);c.castShadow=false;clouds.push(c);}

  const roadTex=canvasTexture((ctx,w,h)=>{ctx.fillStyle='#83899b';ctx.fillRect(0,0,w,h);for(let y=0;y<8;y++)for(let x=0;x<5;x++){let xx=x*w/5+(y%2?w/10:0),yy=y*h/8;ctx.fillStyle=`hsl(${220+rnd()*10} 9% ${54+rnd()*10}%)`;ctx.fillRect(xx+2,yy+2,w/5-4,h/8-4);ctx.fillStyle='#c4c3d022';ctx.fillRect(xx+4,yy+4,w/5-8,2);}for(let i=0;i<4000;i++){ctx.fillStyle=i%2?'#ffffff0a':'#14192c09';ctx.fillRect(rnd()*w,rnd()*h,1,1);}},512,1024);roadTex.wrapS=roadTex.wrapT=T.RepeatWrapping;roadTex.repeat.set(1,18);roadTex.colorSpace=T.SRGBColorSpace;roadTex.anisotropy=8;
  box(scene,[0,-.25,-65],[9,.45,170],material('#ffffff',{map:roadTex,roughness:.78}));
  for(const s of [-1,1]){box(scene,[s*4.7,-.14,-65],[.45,.6,170],edge);box(scene,[s*4.7,.17,-65],[.62,.08,170],edge);box(scene,[s*1.5,.001,-65],[.032,.01,170],material('#c1bcae',{metalness:.2}));}
  const water=new T.ShaderMaterial({transparent:true,uniforms:{time:{value:0}},vertexShader:'varying vec3 v;void main(){vec4 w=modelMatrix*vec4(position,1.);v=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'varying vec3 v;uniform float time;void main(){float a=sin(v.z*2.5+sin(v.x*1.3+time)*2.0-time*1.2);float b=sin(v.x*6.+v.z*12.+time*1.7);float c=pow(max(0.,a*.5+.5),12.);float r=exp(-pow((v.x+16.+sin(v.z*.35+time)*1.4)/4.,2.));vec3 col=mix(vec3(.085,.16,.235),vec3(.23,.34,.45),.35+a*.08+b*.025);col+=vec3(.45,.45,.53)*c*r*.6;gl_FragColor=vec4(col,.94);}'});
  const waterMesh=add(new T.PlaneGeometry(210,250),water,scene,[0,-.8,-90]);waterMesh.rotation.x=-Math.PI/2;waterMesh.castShadow=false;waterMesh.receiveShadow=false;

  // Repeating decorative railing pieces, with curved ironwork between posts.
  const railing=new T.Group();scene.add(railing);let posts=[],finials=[];
  for(const s of [-1,1]){for(let z=-150;z<18;z+=3){posts.push({pos:[s*4.85,.65,z]});finials.push({pos:[s*4.85,1.22,z]});}box(railing,[s*4.85,1.1,-65],[.075,.06,170],iron);box(railing,[s*4.85,.38,-65],[.055,.055,170],iron);}
  instances(new T.CylinderGeometry(.05,.07,1.02,8),iron,posts,railing);instances(new T.SphereGeometry(.09,10,6),gold,finials,railing);
  const curls=[];for(const s of [-1,1])for(let z=-150;z<18;z+=3){for(const d of [-1,1]){const curve=new T.CatmullRomCurve3([new T.Vector3(s*4.85,.4,z+1.5),new T.Vector3(s*4.85,.63,z+1.5+d*.65),new T.Vector3(s*4.85,.96,z+1.5+d*.78),new T.Vector3(s*4.85,1.03,z+1.5+d*.33)]);curls.push(new T.TubeGeometry(curve,10,.018,4,false));}}add(mergeGeometries(curls),iron,railing);curls.forEach(g=>g.dispose());
  const scenery=[];
  function lantern(s,z) {
    const g=new T.Group();g.position.set(s*4.98,0,z);scene.add(g);
    box(g,[0,.12,0],[.32,.24,.32],stone);add(new T.CylinderGeometry(.037,.075,2.6,10),iron,g,[0,1.45,0]);
    tube([[0,2.58,0],[-s*.1,2.86,0],[-s*.4,2.9,0],[-s*.60,2.7,0]],.032,iron,g);
    const lx=-s*.60;add(new T.ConeGeometry(.34,.19,4),iron,g,[lx,2.62,0]).rotation.y=Math.PI/4;
    box(g,[lx,2.29,0],[.34,.52,.34],material('#fce3b6',{emissive:'#f8cc85',emissiveIntensity:1.2,roughness:.6}));
    for(const x of [-.18,.18])for(const zz of [-.18,.18])box(g,[lx+x,2.29,zz],[.025,.57,.025],iron);
    box(g,[lx,2.01,0],[.40,.08,.40],iron);glow(g,[lx,2.30,0],'#ffd69b',2.5,.42);
    scenery.push(g);
  }
  for(let i=0;i<20;i++)lantern(i%2?1:-1,-i*8+7);

  function petalGeo(size=1) {
    const shape=new T.Shape();shape.moveTo(0,-size*.6);shape.bezierCurveTo(-size*.8,0,-size*.6,size*.7,0,size*.47);shape.bezierCurveTo(size*.6,size*.7,size*.8,0,0,-size*.6);return new T.ShapeGeometry(shape,4);
  }
  const flowerGeo=(()=>{const geos=[];for(let k=0;k<5;k++){let p=petalGeo(.10);p.translate(0,.063,0);p.rotateZ(k*Math.PI*2/5);geos.push(p);}const g=mergeGeometries(geos);geos.forEach(g=>g.dispose());return g;})();
  const blossomMaterial=new T.MeshStandardMaterial({color:'#ffffff',roughness:.95,side:T.DoubleSide,emissive:'#8b5d7c',emissiveIntensity:.12});
  function tree(s,z,i) {
    const g=new T.Group();g.position.set(s*6.5,0,z);g.rotation.y=range(-.4,.4);scene.add(g);
    box(g,[0,.03,0],[2.4,.4,2.4],stone);box(g,[0,.25,0],[2.48,.10,2.48],edge);box(g,[0,.30,0],[2.18,.02,2.18],material('#383c45'));
    const branches=[],tips=[];
    const branch=(pts,r)=>branches.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),12,r,6,false));
    branch([[0,.3,0],[-s*.11,1.2,0],[-s*.38,2.4,.15],[-s*.55,3.2,.12]],.16);
    for(let j=0;j<9;j++){const a=j*2.399+range(-.4,.4),h=range(2,3.5),r=range(1.1,2.55),end=[Math.sin(a)*r-s*.35,h+range(.3,.8),Math.cos(a)*r];branch([[-s*.2,1.65,.05],[-s*.40+Math.sin(a)*r*.35,h-.4,Math.cos(a)*r*.3],end],range(.035,.075));tips.push(new T.Vector3(...end));for(let k=0;k<3;k++){const te=[end[0]+range(-.8,.8),end[1]+range(.1,.6),end[2]+range(-.7,.7)];branch([[end[0]*.65,h-.15,end[2]*.65],end,te],.015);tips.push(new T.Vector3(...te));}}
    add(mergeGeometries(branches),wood,g);branches.forEach(b=>b.dispose());
    const flowers=[];
    for(let k=0;k<650;k++){const t=tips[k%tips.length];let rr=range(.03,.62),a=rnd()*Math.PI*2,yy=range(-.3,.4);flowers.push({pos:[t.x+Math.sin(a)*rr,t.y+yy,t.z+Math.cos(a)*rr],rot:[rnd()*6.2,rnd()*6.2,rnd()*6.2],scale:[range(.7,1.4),range(.7,1.4),1],color:['#e7d6e1','#f3e6eb','#c5b6d0','#e1bdd0','#dfdbe7'][Math.floor(rnd()*5)]});}
    instances(flowerGeo,blossomMaterial,flowers,g);
    // The bed has individual small flowers and leaves rather than a solid blob.
    const small=[];for(let k=0;k<45;k++)small.push({pos:[range(-.95,.95),range(.32,.43),range(-.95,.95)],rot:[-Math.PI/2,0,rnd()*6],scale:[.55,.55,.55],color:'#d4c3d5'});instances(flowerGeo,blossomMaterial,small,g);
    scenery.push(g);
  }
  for(let i=0;i<18;i++)tree(i%2?1:-1,-i*9.5+4,i);

  // Warm windows on the distant canal-side town.
  const town=new T.Group();scene.add(town);const buildings=[],roofs=[],windows=[];
  for(const side of [-1,1])for(let i=0;i<26;i++){let x=side*range(18,35),z=-i*6-12,h=range(4,11),w=range(3,6),d=range(3,6);buildings.push({pos:[x,h*.5-1,z],scale:[w,h,d],color:['#4e536b','#58596d','#606075','#454d65'][i%4]});roofs.push({pos:[x,h-.5,z],scale:[w*.85,1.5,d*.82],rot:[0,Math.PI/4,0]});for(let a=0;a<3;a++)for(let b=0;b<Math.floor(h/1.5)-1;b++)if(rnd()>.25)windows.push({pos:[x-side*(w/2+.01),b*1.4+.8,z+(a-1)*.85],scale:[.025,.55,.35],color:rnd()>.5?'#efd9af':'#b3c4db'});}
  instances(new T.BoxGeometry(1,1,1),material('#ffffff'),buildings,town);instances(new T.ConeGeometry(1,1,4),material('#323b53'),roofs,town);instances(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:'#ffffff'}),windows,town);
  const petals=new T.InstancedMesh(petalGeo(.12),new T.MeshStandardMaterial({color:'#e7cdda',side:T.DoubleSide,roughness:1,emissive:'#ad789d',emissiveIntensity:.25}),200);petals.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(petals);const pp=Array.from({length:200},()=>({x:range(-12,12),y:range(.2,10),z:range(-125,12),r:rnd()*6,s:range(.7,1.3)}));const dummy=new T.Object3D();
  const moteGeo=new T.BufferGeometry(),motePositions=[];for(let i=0;i<100;i++)motePositions.push(range(-10,10),range(.5,3),range(-110,10));moteGeo.setAttribute('position',new T.Float32BufferAttribute(motePositions,3));scene.add(new T.Points(moteGeo,new T.PointsMaterial({map:glowTex,color:'#ffe4b4',size:.17,transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending})));
  return {
    update(dt,time,speed) {
      water.uniforms.time.value=time;roadTex.offset.y-=speed*dt/170*18;
      for(const g of scenery){g.position.z+=speed*dt;if(g.position.z>20)g.position.z-=174;}
      for(let i=0;i<pp.length;i++){const p=pp[i];p.z+=speed*dt*.7;p.y-=dt*.16;p.x+=Math.sin(time*.4+i)*dt*.10;if(p.z>16)p.z=-140;if(p.y<.1)p.y=9;dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(time*.7+p.r,time*.4+p.r,time*.33+p.r);dummy.scale.setScalar(p.s);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);}petals.instanceMatrix.needsUpdate=true;
      clouds.forEach((c,i)=>c.position.x+=Math.sin(time*.02+i)*dt*.04);
    }
  };
}
