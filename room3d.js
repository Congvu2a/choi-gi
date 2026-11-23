import * as THREE from 'three';

const host = document.querySelector('#roomScene');
const message = document.querySelector('#roomMessage');
const interact = document.querySelector('#interactBtn');
const modal = document.querySelector('#gameModal');
const musicOverlay = document.querySelector('#musicOverlay');
const socialOverlay = document.querySelector('#socialOverlay');
const socialDrawer = document.querySelector('#socialDrawer');
let cinemaScreenGroup, cinemaVideoSurface, cinemaScreenLight=null;
let sharedVideoActive=false;
if (!host) throw new Error('Không tìm thấy khu vực phòng game.');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#252033');
scene.fog = new THREE.Fog('#252033', 25, 45);
const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 160);
camera.position.set(0, 14.2, 26);
camera.lookAt(0, 2.1, 0);
const cameraGoal=new THREE.Vector3(),lookGoal=new THREE.Vector3(),cameraLook=new THREE.Vector3(0,2.1,0);
let cinemaCameraYaw=0,cinemaCameraPitch=.55,cameraDragging=false,lastPointerX=0,lastPointerY=0;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.domElement.className = 'three-room-canvas';
renderer.domElement.setAttribute('aria-label', 'Căn phòng game 3D. Di chuyển bằng WASD hoặc phím mũi tên.');
host.append(renderer.domElement);
host.addEventListener('pointerdown',e=>{if(!['cinema','race'].includes(activeRoom)||e.button!==0||e.target.closest('.wardrobe-panel,.race-speed-hud'))return;cameraDragging=true;lastPointerX=e.clientX;lastPointerY=e.clientY;host.setPointerCapture?.(e.pointerId);renderer.domElement.style.cursor='grabbing';e.preventDefault();},true);
host.addEventListener('pointermove',e=>{if(!cameraDragging)return;const dx=e.clientX-lastPointerX,dy=e.clientY-lastPointerY;lastPointerX=e.clientX;lastPointerY=e.clientY;cinemaCameraYaw-=dx*.005;cinemaCameraPitch=THREE.MathUtils.clamp(cinemaCameraPitch+dy*.003,.18,.95);},true);
const stopCameraDrag=e=>{if(!cameraDragging)return;cameraDragging=false;renderer.domElement.style.cursor=['cinema','race'].includes(activeRoom)?'grab':'default';if(e?.pointerId!==undefined&&host.hasPointerCapture?.(e.pointerId))host.releasePointerCapture(e.pointerId);};
host.addEventListener('pointerup',stopCameraDrag,true);host.addEventListener('pointercancel',stopCameraDrag,true);host.addEventListener('lostpointercapture',()=>{cameraDragging=false;});

const roomHemisphere=new THREE.HemisphereLight('#d5ddff', '#5a3b53', 2.0);scene.add(roomHemisphere);
const keyLight = new THREE.DirectionalLight('#fff0d4', 3.3);
keyLight.position.set(-5, 11, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -11; keyLight.shadow.camera.right = 11;
keyLight.shadow.camera.top = 11; keyLight.shadow.camera.bottom = -11;
scene.add(keyLight);

const mat = (color, roughness = 0.72, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const floorMat = mat('#57405e');
const wallMat = mat('#51415f');
const trimMat = mat('#d290a7', 0.45, { emissive: '#4c243f', emissiveIntensity: 0.35 });
const animatedDecor = [];
const loungeRoot = new THREE.Group(); loungeRoot.name='sanh-game'; scene.add(loungeRoot);
const floor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.35, 18), floorMat);
floor.position.set(0, -0.22, 0); floor.receiveShadow = true; loungeRoot.add(floor);

function box(parent, w, h, d, material, x, y, z, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function roundedPanel(parent,w,h,d,material,x,y,z,r=0.38){
  const hw=w/2,hh=h/2,shape=new THREE.Shape();r=Math.min(r,hw,hh);
  shape.moveTo(-hw+r,-hh);shape.lineTo(hw-r,-hh);shape.quadraticCurveTo(hw,-hh,hw,-hh+r);
  shape.lineTo(hw,hh-r);shape.quadraticCurveTo(hw,hh,hw-r,hh);shape.lineTo(-hw+r,hh);
  shape.quadraticCurveTo(-hw,hh,-hw,hh-r);shape.lineTo(-hw,-hh+r);shape.quadraticCurveTo(-hw,-hh,-hw+r,-hh);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:0.035,bevelThickness:0.035,curveSegments:10});
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z-d/2);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
// Three enclosing walls make the lobby read as a real room while leaving the front open to the camera.
box(loungeRoot, 30, 7.5, 0.38, wallMat, 0, 3.53, -9.05);
box(loungeRoot, 0.38, 7.5, 18, mat('#443750'), -14.95, 3.53, 0);
box(loungeRoot, 0.38, 7.5, 18, mat('#443750'), 14.95, 3.53, 0);
box(loungeRoot, 30, 0.18, 0.5, trimMat, 0, 0.05, -8.78, false);
box(loungeRoot, 0.5, 0.18, 18, trimMat, -14.72, 0.05, 0, false);
box(loungeRoot, 0.5, 0.18, 18, trimMat, 14.72, 0.05, 0, false);

// Big sunset window, mullions, and a low sill on the back wall.
const windowGlow = mat('#f4a6c2', 0.24, { emissive: '#dc7fa8', emissiveIntensity: 0.62 });
box(loungeRoot, 5.1, 3.55, 0.16, mat('#281f39'), -12.0, 4.55, -8.79, false);
box(loungeRoot, 4.68, 3.1, 0.08, windowGlow, -12.0, 4.58, -8.68, false);
box(loungeRoot, 0.11, 3.08, 0.12, mat('#563a59'), -12.0, 4.58, -8.59, false);
box(loungeRoot, 4.7, 0.12, 0.12, mat('#563a59'), -12.0, 4.58, -8.58, false);
box(loungeRoot, 5.15, 0.2, 0.55, mat('#32243d'), -12.0, 2.79, -8.45);

// Giant projection screen. The HTML YouTube iframe is projected over this 3D panel below.
const videoScreenGroup = new THREE.Group(); videoScreenGroup.position.set(0, 4.45, -8.70); loungeRoot.add(videoScreenGroup);
roundedPanel(videoScreenGroup,11.7,6.15,0.42,mat('#241d34',0.24,{metalness:0.45,emissive:'#412956',emissiveIntensity:0.3}),0,0,0,0.46);
roundedPanel(videoScreenGroup,11.2,5.83,0.08,mat('#c67bb8',0.28,{metalness:0.3,emissive:'#8b3a7d',emissiveIntensity:0.7}),0,0,0.24,0.38);
const videoScreenSurface = box(videoScreenGroup, 10.75, 5.48, 0.035, mat('#090a12', 0.3, { emissive:'#12121e', emissiveIntensity:0.6 }), 0, 0, 0.31, false);
for(const x of [-5.62,5.62]){const light=box(videoScreenGroup,0.055,5.2,0.06,mat('#d6ff72',0.2,{emissive:'#b8ee54',emissiveIntensity:1.0}),x,0,0.31,false);animatedDecor.push({type:'neon',mesh:light,base:0.8,phase:x});}
const projectionFrame = document.createElement('div'); projectionFrame.className = 'room-projection'; projectionFrame.setAttribute('aria-label','Video đang chiếu trên màn hình lớn');
const projectionHint = document.createElement('div'); projectionHint.className = 'projection-hint'; projectionHint.innerHTML = '<span>▶</span><b>CHILL SCREEN</b><small>Thêm nhạc trong jukebox để chiếu video tại đây</small>'; projectionFrame.append(projectionHint); host.append(projectionFrame);
const musicPlayer = document.querySelector('#youtubePlayer'); projectionFrame.append(musicPlayer);
const projectionShield=document.createElement('div');projectionShield.className='projection-shield';projectionShield.setAttribute('aria-label','Màn hình chỉ để xem video');projectionShield.title='Dùng máy phát nhạc để đổi bài';projectionFrame.append(projectionShield);
Object.assign(projectionFrame.style,{pointerEvents:'auto'});musicPlayer.style.pointerEvents='none';musicPlayer.tabIndex=-1;Object.assign(projectionShield.style,{position:'absolute',inset:'0',zIndex:'5',background:'transparent',pointerEvents:'auto',touchAction:'none'});
const musicPlayerWrap = document.querySelector('.music-player-wrap');
if (musicPlayerWrap) { const note=document.createElement('div'); note.className='music-project-note'; note.textContent='Video đang được chiếu trên màn hình lớn trong phòng.'; musicPlayerWrap.replaceChildren(note); }
window.addEventListener('choigi-video-active', e => {const active=e.detail?.active,room=e.detail?.room;const isBar=room==='bar';if(isBar){if(typeof barProjectionHint!=='undefined')barProjectionHint.hidden=Boolean(active);if(typeof barVideoSurface!=='undefined')barVideoSurface.material.color.set(active?'#090a12':'#301338');}else{sharedVideoActive=Boolean(active);projectionHint.hidden=Boolean(active);videoScreenSurface.material.color.set(active?'#090a12':'#12101b');if(cinemaVideoSurface)cinemaVideoSurface.material.color.set(active?'#090a12':'#10131c');if(cinemaScreenLight)cinemaScreenLight.intensity=active?11:0;}});

// Layered oval rug, stitched border, and low central table.
const rug = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 0.08, 64), mat('#a66584'));
rug.scale.set(1, 1, 0.62); rug.position.set(0, 0.01, 0.25); rug.receiveShadow = true; rug.castShadow = true; loungeRoot.add(rug);
const rugInner = new THREE.Mesh(new THREE.CylinderGeometry(4.55, 4.55, 0.09, 64), mat('#715279'));
rugInner.scale.set(1, 1, 0.62); rugInner.position.set(0, 0.03, 0.25); rugInner.receiveShadow = true; loungeRoot.add(rugInner);
const table = new THREE.Group(); table.position.set(0, 0, 1.0); loungeRoot.add(table);
const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.1, 0.2, 12), mat('#d398a4', 0.34));
tableTop.position.y = 0.8; tableTop.castShadow = true; table.add(tableTop);
const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.72, 8), mat('#403047'));
tableLeg.position.y = 0.36; tableLeg.castShadow = true; table.add(tableLeg);
const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat('#d6ff8c', 0.2, { emissive: '#9ee851', emissiveIntensity: 1.2 }));
orb.position.set(0, 1.05, 1); loungeRoot.add(orb);

// Decorative potted plants built from simple low-poly geometry.
function plant(x, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); loungeRoot.add(g);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.33, 0.65, 8), mat('#c7838e')); pot.position.y = 0.34; pot.castShadow = true; g.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8), mat('#382b35')); soil.position.y = 0.69; g.add(soil);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.33, 8, 6), mat(i % 2 ? '#89b77d' : '#a6cf8a'));
    const a = i * Math.PI / 3; leaf.position.set(Math.cos(a) * 0.38, 1.08 + (i % 3) * 0.13, Math.sin(a) * 0.35); leaf.scale.set(0.62, 1.45, 0.55); leaf.rotation.z = -Math.cos(a) * 0.45; leaf.castShadow = true; g.add(leaf); animatedDecor.push({type:'leaf',mesh:leaf,base:leaf.rotation.z,phase:i*0.9+x});
  }
}
plant(-13.3, -7.6, 1.12); plant(13.3, -7.6, 1.15); plant(-13.3, 6.2, 0.9); plant(13.3, 6.0, 0.92);

// A soft sofa, throw pillows, and a little pouf make the lounge feel lived in.
const sofa = new THREE.Group(); sofa.position.set(3.25, 0, -6.4); loungeRoot.add(sofa);
box(sofa, 3.7, 0.48, 1.3, mat('#745184'), 0, 0.46, 0);
box(sofa, 3.7, 1.2, 0.36, mat('#674675'), 0, 1.13, -0.48);
box(sofa, 0.48, 0.88, 1.32, mat('#79538a'), -1.62, 0.75, 0.02);
box(sofa, 0.48, 0.88, 1.32, mat('#79538a'), 1.62, 0.75, 0.02);
for (let i = 0; i < 3; i++) {
  const x = -1.02 + i * 1.02;
  box(sofa, 0.94, 0.18, 0.82, mat(i === 1 ? '#b17698' : '#9a6b91'), x, 0.76, 0.12);
  const back = box(sofa, 0.92, 0.73, 0.18, mat(i === 1 ? '#c186a5' : '#a77a9b'), x, 1.23, -0.27);
  back.rotation.z = (i - 1) * -0.05;
}
for (const [x,color,rot] of [[-1.08,'#d6ff8c',-0.16],[1.07,'#ffb3c9',0.16]]) {
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.48,0.2),mat(color,0.72)); pillow.position.set(x,1.25,-0.08); pillow.rotation.z=rot; pillow.castShadow=true; sofa.add(pillow);
}
sofa.userData.gameId='seat';sofa.userData.name='SOFA';sofa.userData.seatTarget={x:3.25,z:-3.65};
const pouf = new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.68,0.58,12),mat('#cf8c9c')); pouf.position.set(3.1,0.3,5.7); pouf.castShadow=true; pouf.receiveShadow=true; loungeRoot.add(pouf);
const poufTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.1,12),mat('#efb5a1')); poufTop.position.set(3.1,0.62,5.7); poufTop.castShadow=true; loungeRoot.add(poufTop);

// Vinyl wall art and warm fairy lights bring color into the back wall.
const wirePoints=[];for(let i=0;i<=24;i++){const x=-14+i*1.16;wirePoints.push(new THREE.Vector3(x,6.78-Math.sin(i/24*Math.PI)*0.34,-8.56))}const wire=new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePoints),new THREE.LineBasicMaterial({color:'#e2b8bb'}));loungeRoot.add(wire);
for(let i=0;i<13;i++){const x=-13.3+i*2.21,y=6.78-Math.sin(i/12*Math.PI)*0.34;const bulb=glowingSphere(i%3===0?'#d6ff8c':'#ffc58f',0.8,x,y-0.08,-8.5,0.09);const glow=new THREE.PointLight(i%3===0?'#d6ff8c':'#ffc58f',0.3,1.5);glow.position.set(x,y-0.1,-8.2);loungeRoot.add(glow)}

// Neon wall sign and warm sconces.
function glowingSphere(color, intensity, x, y, z, radius = 0.12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), mat(color, 0.25, { emissive: color, emissiveIntensity: intensity }));
  m.position.set(x, y, z); loungeRoot.add(m); return m;
}
glowingSphere('#d6ff8c', 1.4, 13.5, 5.5, -8.63, 0.2);
glowingSphere('#ff9bc0', 1.4, -13.5, 5.5, -8.63, 0.2);
const neon = new THREE.PointLight('#d6ff8c', 2.4, 7); neon.position.set(12.8, 4.8, -7.8); loungeRoot.add(neon);
const sunset = new THREE.PointLight('#ff9fc5', 2.8, 9); sunset.position.set(-12.5, 4.5, -7.8); loungeRoot.add(sunset);

function labelTexture(text, color = '#f7f1ff') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const ctx = c.getContext('2d'); ctx.clearRect(0, 0, 512, 128); ctx.fillStyle = '#21182bdc';
  ctx.beginPath(); ctx.roundRect(12, 12, 488, 104, 28); ctx.fill();
  ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = color; ctx.font = '700 46px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 65);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function addLabel(parent, text, color) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(text, color), transparent: true, depthTest: false }));
  sprite.scale.set(2.25, 0.56, 1); sprite.position.set(0, 2.55, 0); parent.add(sprite); return sprite;
}
const stations = [];
sofa.userData.room='lounge';stations.push(sofa);
const obstacles = [];
function makeLobbyPortal(x,z,label,color,targetRoom,targetPosition){
  const portal=new THREE.Group();portal.position.set(x,0,z);loungeRoot.add(portal);
  const glow=mat(color,0.2,{emissive:color,emissiveIntensity:1.5});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.82,0.12,12,40),glow);ring.position.y=1.25;ring.castShadow=true;portal.add(ring);
  const core=new THREE.Mesh(new THREE.CircleGeometry(0.68,32),mat(color,0.25,{emissive:color,emissiveIntensity:0.42,transparent:true,opacity:0.4,side:THREE.DoubleSide}));core.position.y=1.25;portal.add(core);
  const base=box(portal,1.9,0.16,0.7,mat('#30243b'),0,0.12,0);base.userData.station=portal;
  const light=new THREE.PointLight(color,1.6,4);light.position.y=1.3;portal.add(light);
  const sign=addLabel(portal,label,color);sign.position.set(0,2.45,0);sign.scale.set(2.55,0.62,1);
  portal.userData.gameId='door';portal.userData.name=label;portal.userData.room='lounge';portal.userData.targetRoom=targetRoom;portal.userData.targetPosition=targetPosition;
  ring.userData.station=portal;stations.push(portal);animatedDecor.push({type:'portal',mesh:ring,phase:x});
  return portal;
}
// Two separate gates in the lounge lead to the outdoor cinema and the bar.
makeLobbyPortal(-2.35,6.85,'RẠP NGOÀI TRỜI','#a9eaff','cinema',{x:100,z:22});
makeLobbyPortal(2.35,6.85,'CỔNG · QUÁN BAR','#ff91cf','bar',{x:40,z:3.45});

// Open-air cinema garden: a wide timber deck, large shared screen, tiered
// tables with usable seats, warm lights and animated trees/fireflies.
const cinemaRoot=new THREE.Group();cinemaRoot.name='rap-chieu-ngoai-troi';cinemaRoot.position.set(100,0,0);scene.add(cinemaRoot);
// A deliberately sparse, evenly distributed sky across the full 360° dome.
const skyPositions=[];
const starCount=38,goldenAngle=Math.PI*(3-Math.sqrt(5));
for(let i=0;i<starCount;i++){
  const vertical=.12+.84*((i+.5)/starCount),azimuth=i*goldenAngle,radius=49+(i%4)*1.2,horizontal=Math.sqrt(1-vertical*vertical)*radius;
  skyPositions.push(Math.cos(azimuth)*horizontal,vertical*radius,Math.sin(azimuth)*horizontal);
}
const skyGeometry=new THREE.BufferGeometry();skyGeometry.setAttribute('position',new THREE.Float32BufferAttribute(skyPositions,3));
const skyStars=new THREE.Points(skyGeometry,new THREE.PointsMaterial({color:'#d8e8ff',size:.22,transparent:true,opacity:.88,sizeAttenuation:true,fog:false,depthWrite:false}));cinemaRoot.add(skyStars);
const cinemaMoon=new THREE.Mesh(new THREE.SphereGeometry(2.1,24,18),new THREE.MeshStandardMaterial({color:'#fff3ce',emissive:'#ffe7a6',emissiveIntensity:.38,roughness:.9}));cinemaMoon.position.set(-15,15,-22);cinemaRoot.add(cinemaMoon);
const cinemaMoonHalo=new THREE.Mesh(new THREE.SphereGeometry(3.5,18,14),new THREE.MeshBasicMaterial({color:'#ffe1a0',transparent:true,opacity:.04,side:THREE.BackSide,depthWrite:false}));cinemaMoonHalo.position.copy(cinemaMoon.position);cinemaRoot.add(cinemaMoonHalo);
const cinemaMoonLight=new THREE.PointLight('#ffe4ae',.75,48);cinemaMoonLight.position.set(-15,14,-19);cinemaRoot.add(cinemaMoonLight);
// A larger deck extends sideways and deep behind the audience while keeping
// every prop at its natural proportions.
const cinemaWater=new THREE.Mesh(new THREE.PlaneGeometry(84,112),new THREE.MeshStandardMaterial({color:'#12343a',roughness:.38,metalness:.12,emissive:'#07171a',emissiveIntensity:.16}));
cinemaWater.rotation.x=-Math.PI/2;cinemaWater.position.set(0,-.49,16);cinemaWater.receiveShadow=true;cinemaRoot.add(cinemaWater);
box(cinemaRoot,72,.42,96,mat('#493741',.82),0,-.24,16);
for(let z=-31;z<=63;z+=.72)box(cinemaRoot,71.6,.018,.025,mat(z%2?'#725149':'#654941',.82),0,-.012,z,false);
for(const [x,z,w,d] of [[0,-32.72,72,.22],[0,64.72,72,.22],[-35.72,16,.22,95.4],[35.72,16,.22,95.4]])box(cinemaRoot,w,.2,d,mat('#624638',.62),x,.02,z,false);
box(cinemaRoot,25,.42,2.4,mat('#382a38'),0,.08,-13.25);
box(cinemaRoot,24.3,.12,2.2,mat('#92646f',.45),0,.34,-13.25,false);
cinemaScreenGroup=new THREE.Group();cinemaScreenGroup.position.set(0,7,-14.55);cinemaRoot.add(cinemaScreenGroup);
roundedPanel(cinemaScreenGroup,22.1,12.55,.52,mat('#19151f',.35,{metalness:.32}),0,0,0,.5);
roundedPanel(cinemaScreenGroup,21.55,12.1,.1,mat('#614651',.46,{metalness:.22}),0,0,.3,.36);
cinemaVideoSurface=box(cinemaScreenGroup,21,11.82,.04,mat('#070a10',.4),0,0,.37,false);
// Keep the front frame and rails. There is deliberately no large rear panel:
// from behind the display the scenery should remain visible, not read as a
// second blank screen.
for(const y of [-6.45,6.45])box(cinemaScreenGroup,22.9,.22,.62,mat('#343743',.4,{metalness:.56}),0,y,.42);
for(const x of [-11.3,11.3])box(cinemaScreenGroup,.22,12.7,.62,mat('#343743',.4,{metalness:.56}),x,0,.42);
for(const x of [-10.85,10.85])for(const y of [-6,6]){const bolt=new THREE.Mesh(new THREE.SphereGeometry(.095,10,8),mat('#b08a61',.36,{metalness:.65}));bolt.position.set(x,y,.76);cinemaScreenGroup.add(bolt);}
cinemaScreenLight=new THREE.SpotLight('#c5dcff',0,56,.78,.7,1.15);cinemaScreenLight.position.set(0,-1.7,.72);cinemaScreenLight.target.position.set(0,-6.2,8.5);cinemaScreenGroup.add(cinemaScreenLight,cinemaScreenLight.target);
obstacles.push({minX:88.2,maxX:111.8,minZ:-14.92,maxZ:-14.08});
for(const [x,color] of [[-11.8,'#8ddfff'],[11.8,'#ff9fc5']]){
  const beam=box(cinemaRoot,.08,5.2,.08,mat('#303440',.48,{metalness:.24}),x,2.88,-13.48,false);
  const spot=new THREE.SpotLight(color,2.1,18,.28,.65,1.25);spot.position.set(x,5.55,-12.7);spot.target.position.set(x*.45,0,-5);cinemaRoot.add(spot,spot.target);animatedDecor.push({type:'cinemaSpot',light:spot,phase:x});
}
const cinemaSign=addLabel(cinemaRoot,'OPEN AIR · CINEMA','#d9f2a2');cinemaSign.position.set(0,14.5,-14.15);cinemaSign.scale.set(5.1,.78,1);

// A small garden-bar nook sits outside the center sightline.
const gardenBar=new THREE.Group();gardenBar.position.set(13,0,-10.8);cinemaRoot.add(gardenBar);
box(gardenBar,5.2,1.28,1.2,mat('#392a36'),0,.72,0);box(gardenBar,5.45,.2,1.38,mat('#9a685e',.4,{metalness:.12}),0,1.48,0);
box(gardenBar,5,.09,.1,mat('#65483f',.55),0,.98,.62,false);
box(gardenBar,4.5,1.35,.13,mat('#24202a'),0,2.08,-.47);
for(let i=0;i<5;i++){const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.55+(i%2)*.2,8),mat(i%2?'#476e66':'#80604b',.46));bottle.position.set(-1.65+i*.82,2.75,-.39);gardenBar.add(bottle);}
const gardenBarLabel=addLabel(gardenBar,'GARDEN BAR','#ffd59b');gardenBarLabel.position.set(0,3.25,-.38);gardenBarLabel.scale.set(3.4,.7,1);obstacles.push({x:113,z:-10.8,r:2.85});

function makeCinemaChair(x,z,rotation=Math.PI){
  const chair=new THREE.Group();chair.position.set(x,0,z);chair.rotation.y=rotation;cinemaRoot.add(chair);
  const wood=mat('#322932',.72),seatMat=mat('#815959',.62),seat=box(chair,.98,.16,.86,seatMat,0,.78,0);
  box(chair,.98,.82,.16,wood,0,1.18,-.35);for(const sx of [-.38,.38])for(const sz of [-.31,.31])box(chair,.105,.72,.105,wood,sx,.37,sz);
  seat.userData.station=chair;chair.userData.gameId='seat';chair.userData.name='GHẾ RẠP';chair.userData.room='cinema';chair.userData.seatTarget={x:100+x,z};
  stations.push(chair);obstacles.push({x:100+x,z,r:.5});
}
// Auditorium rows: no café tables or side-facing seats. Every chair faces the
// screen at negative z, with a wide center aisle and clear paths between rows.
for(const z of [-8,-1,6,13,20,27,34,41]){
  for(const x of [-27,-21,-15,-9,9,15,21,27])makeCinemaChair(x,z,Math.PI);
}

// A walk-in wardrobe lives at the rear garden edge, near the race entrance.
const wardrobe=new THREE.Group();wardrobe.position.set(-29,0,52);cinemaRoot.add(wardrobe);
box(wardrobe,4.2,.24,1.05,mat('#282a38',.42,{metalness:.35}),0,.12,0);
box(wardrobe,3.7,3.3,.42,mat('#322b3d',.32,{metalness:.32}),0,1.78,-.23);
for(const x of [-1.86,0,1.86])box(wardrobe,.08,3.18,.5,mat('#a17b61',.3,{metalness:.62}),x,1.8,-.23);
for(const x of [-1.55,-.78,0,.78,1.55]){
  const hanger=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,6,14,Math.PI),mat('#d6c2a0',.3,{metalness:.75}));hanger.position.set(x,2.62,.12);hanger.rotation.x=Math.PI/2;wardrobe.add(hanger);
  const coat=new THREE.Mesh(new THREE.BoxGeometry(.48,.84,.12),mat(['#b15e73','#438c92','#d9ad57','#77905c','#7864a7'][Math.round((x+1.55)/.78)%5],.48));coat.position.set(x,1.98,.12);coat.castShadow=true;wardrobe.add(coat);
}
const wardrobeMirror=box(wardrobe,1.1,2.35,.08,mat('#a6d4e0',.16,{metalness:.75,roughness:.16}),0,1.55,.31,false);wardrobeMirror.material.emissive.set('#18313a');wardrobeMirror.material.emissiveIntensity=.22;
const wardrobeSign=addLabel(wardrobe,'TỦ ĐỒ · THAY TRANG PHỤC','#d6ff72');wardrobeSign.position.set(0,3.65,0);wardrobeSign.scale.set(4.1,.7,1);
const wardrobeBase=box(wardrobe,2.2,.12,.8,mat('#30243b'),0,.08,.85);wardrobeBase.userData.station=wardrobe;
wardrobe.userData.gameId='wardrobe';wardrobe.userData.name='TỦ ĐỒ';wardrobe.userData.room='cinema';wardrobeBase.userData.station=wardrobe;stations.push(wardrobe);obstacles.push({x:71,z:52,r:2.5});

// Link the back of the cinema to the driving area behind it.
function addCinemaDoor(parent,x,z,label,targetRoom,targetPosition,color='#d6ff72'){
  const door=new THREE.Group();door.position.set(x,0,z);parent.add(door);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.13,10,36),mat(color,.25,{emissive:color,emissiveIntensity:1.35}));ring.position.y=1.35;door.add(ring);
  const base=box(door,2,.16,.72,mat('#30243b'),0,.1,0);base.userData.station=door;
  const sign=addLabel(door,label,color);sign.position.set(0,2.55,0);sign.scale.set(3,.68,1);
  door.userData.gameId='door';door.userData.name=label;door.userData.room='cinema';door.userData.targetRoom=targetRoom;door.userData.targetPosition=targetPosition;base.userData.station=door;stations.push(door);animatedDecor.push({type:'portal',mesh:ring,phase:z});return door;
}
addCinemaDoor(cinemaRoot,0,61.5,'ĐƯỜNG ĐUA','race',{x:103,z:110},'#d6ff72');
const rearGuide=addLabel(cinemaRoot,'TỦ ĐỒ ←     ·     SÂN ĐUA ↑','#d6ff72');rearGuide.position.set(0,2.25,45);rearGuide.scale.set(4.2,.46,1);
const rearPathMat=mat('#d6ff72',.22,{emissive:'#b3f45c',emissiveIntensity:1.45}),wardrobePathMat=mat('#a9eaff',.22,{emissive:'#7bdcff',emissiveIntensity:1.25});
for(const z of [46,49,52,55,58]){const marker=box(cinemaRoot,.48,.035,.48,rearPathMat,0,.035,z,false);marker.rotation.y=Math.PI/4;}
for(const [x,z] of [[-7,48],[-14,49],[-21,51],[-27,52]]){const marker=box(cinemaRoot,.42,.035,.42,wardrobePathMat,x,.035,z,false);marker.rotation.y=Math.PI/4;}

// Broad oval circuit behind the cinema, with an approach road, pit lane,
// edge lighting, barriers and distant terrain. Objects keep natural scale.
const raceRoot=new THREE.Group();raceRoot.name='san-dua';raceRoot.position.set(100,0,0);raceRoot.visible=false;scene.add(raceRoot);
const raceGrass=mat('#263b35',.98),roadMat=mat('#242934',.96),kerbA=mat('#eee2c8',.75),kerbB=mat('#d85658',.72),barrierMat=mat('#525660',.58,{metalness:.38});
const raceGround=new THREE.Mesh(new THREE.PlaneGeometry(240,220),raceGrass);raceGround.rotation.x=-Math.PI/2;raceGround.position.set(0,-.56,165);raceGround.receiveShadow=true;raceRoot.add(raceGround);
box(raceRoot,15,.12,85,roadMat,0,-.1,105);
for(let z=66;z<148;z+=2.5){box(raceRoot,12,.035,.075,mat('#f1d690',.45,{emissive:'#9b7d42',emissiveIntensity:.16}),0,-.015,z,false);}
const ovalCenterZ=181,ovalA=54,ovalB=34,roadHalf=9,segments=220;
const ovalGeometry=new THREE.BufferGeometry(),ovalPos=[],ovalUv=[],ovalIdx=[];
for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,cx=ovalA*Math.cos(a),cz=ovalCenterZ+ovalB*Math.sin(a),nx=Math.cos(a)/ovalA,nz=Math.sin(a)/ovalB,nl=Math.hypot(nx,nz),ox=nx/nl,oz=nz/nl;
  for(const side of [-1,1]){ovalPos.push(cx+ox*roadHalf*side,-.03,cz+oz*roadHalf*side);ovalUv.push(i/segments,side>0?1:0);}
  if(i<segments){const j=i*2;ovalIdx.push(j,j+2,j+1,j+1,j+2,j+3);}
}
ovalGeometry.setAttribute('position',new THREE.Float32BufferAttribute(ovalPos,3));ovalGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(ovalUv,2));ovalGeometry.setIndex(ovalIdx);ovalGeometry.computeVertexNormals();const ovalRoad=new THREE.Mesh(ovalGeometry,roadMat);ovalRoad.receiveShadow=true;raceRoot.add(ovalRoad);
function ovalPoint(t,offset=0,y=.06){const x=ovalA*Math.cos(t),z=ovalCenterZ+ovalB*Math.sin(t),nx=Math.cos(t)/ovalA,nz=Math.sin(t)/ovalB,nl=Math.hypot(nx,nz);return new THREE.Vector3(x+nx/nl*offset,y,z+nz/nl*offset);}
for(const offset of [-roadHalf+.55,roadHalf-.55]){const count=segments/2,curbs=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.045,1),kerbA,count),dummy=new THREE.Object3D();for(let i=0;i<count;i++){const pts=[ovalPoint((i*2)/segments*Math.PI*2,offset,.02),ovalPoint((i*2+1)/segments*Math.PI*2,offset,.02)],d=pts[1].clone().sub(pts[0]);dummy.position.copy(pts[0]).add(pts[1]).multiplyScalar(.5);dummy.scale.set(1,1,d.length());dummy.rotation.y=Math.atan2(d.x,d.z);dummy.updateMatrix();curbs.setMatrixAt(i,dummy.matrix);curbs.setColorAt(i,new THREE.Color(i%2?'#eee2c8':'#d85658'));}raceRoot.add(curbs);}
for(const offset of [-roadHalf-2,roadHalf+2]){const points=Array.from({length:segments+1},(_,i)=>ovalPoint(i/segments*Math.PI*2,offset,.42));const curve=new THREE.CatmullRomCurve3(points,true);const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,offset<0?.42:.42,7,true),barrierMat);rail.castShadow=true;raceRoot.add(rail);}
// Start/finish stripe and broad grid boxes on the near straight.
for(let i=0;i<16;i++){const x=-7.5+i;box(raceRoot,.88,.035,.52,mat(i%2?'#e9e7e2':'#22252b',.8),x,.01,147,false);}
for(let row=0;row<4;row++)for(const side of [-1,1])box(raceRoot,2,.04,.14,mat('#d6d3cc',.55),side*(2.7+row*.3),.01,151-row*2,false);
// Pit garage on the western side and grandstand to the east.
const pit=new THREE.Group();pit.position.set(-69,0,128);raceRoot.add(pit);box(pit,22,5.4,8,mat('#343846',.72),0,2.7,0);box(pit,23,.34,8.6,mat('#d6ff72',.34,{emissive:'#a8cd45',emissiveIntensity:.7}),0,5.45,0,false);box(pit,20,2.1,.12,mat('#151922'),0,2.15,4.08);
for(let i=0;i<5;i++){box(pit,3.2,1.9,.18,mat(['#b54d57','#4e8e9c','#b58e48','#63815c','#7164a2'][i]),-8+i*4,2.15,4.2,false);}
const pitSign=addLabel(pit,'PIT LANE · GARAGE','#d6ff72');pitSign.position.set(0,6.1,4.5);pitSign.scale.set(4,.75,1);
const stand=new THREE.Group();stand.position.set(81,0,175);raceRoot.add(stand);box(stand,20,.5,12,mat('#333641'),0,.25,0);for(let row=0;row<4;row++){box(stand,20,.42,2.3,mat(row%2?'#464956':'#393d49'),0,.62+row*.62,-3.9+row*2.3);for(let x=-8;x<=8;x+=2)box(stand,.85,.78,.75,mat(['#b44f62','#4f92a1','#b09050'][((x+8)/2+row)%3]),x,1+row*.62,-3.9+row*2.3);}
for(const side of [-1,1])for(let i=0;i<7;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(2.1+(i%3)*.6,1),mat(['#455047','#39474a','#4b5058'][i%3],.98));rock.position.set(side*(82+i%2*5),1.2,91+i*18);rock.scale.set(1.8,1.2,2.5);rock.castShadow=true;raceRoot.add(rock);}
for(const side of [-1,1])for(let i=0;i<12;i++){const mountain=new THREE.Mesh(new THREE.ConeGeometry(7+(i%3)*2,16+(i%4)*4,7),mat(i%2?'#243237':'#29363b',.99));mountain.position.set(side*(92+(i%3)*9),8,65+i*18);raceRoot.add(mountain);}
for(let i=0;i<16;i++){const x=-57+i*7.6;const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,8,8),barrierMat);pole.position.set(x,4,145);raceRoot.add(pole);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),mat('#ffe5ac',.2,{emissive:'#ffd27c',emissiveIntensity:1.8}));lamp.position.set(x,8,145);raceRoot.add(lamp);const light=new THREE.PointLight('#ffd8a0',.75,15);light.position.copy(lamp.position);raceRoot.add(light);}

function createCarModel(color='#d84940'){
  const car=new THREE.Group();
  const paint=mat(color,.24,{metalness:.72}),dark=mat('#171c23',.36,{metalness:.55}),glass=mat('#192c3a',.18,{metalness:.5,transparent:true,opacity:.9}),rubber=mat('#111317',.88),metal=mat('#9ba2aa',.26,{metalness:.78});
  const shell=new THREE.Mesh(new THREE.BoxGeometry(2.25,.62,4.3),paint);shell.position.y=.9;shell.castShadow=true;car.add(shell);
  const hood=new THREE.Mesh(new THREE.BoxGeometry(1.98,.2,1.08),paint);hood.position.set(0,1.23,-1.47);hood.castShadow=true;car.add(hood);
  const rear=new THREE.Mesh(new THREE.BoxGeometry(1.95,.18,.78),paint);rear.position.set(0,1.2,1.55);car.add(rear);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.64,.78,1.95),paint);cabin.position.set(0,1.55,-.05);cabin.castShadow=true;car.add(cabin);
  const wind=new THREE.Mesh(new THREE.BoxGeometry(1.48,.52,.06),glass);wind.position.set(0,1.64,-1.04);wind.rotation.x=-.22;car.add(wind);
  const backGlass=new THREE.Mesh(new THREE.BoxGeometry(1.45,.48,.06),glass);backGlass.position.set(0,1.62,.91);backGlass.rotation.x=.22;car.add(backGlass);
  for(const x of [-.81,.81]){const sideGlass=new THREE.Mesh(new THREE.BoxGeometry(.055,.48,1.25),glass);sideGlass.position.set(x,1.63,-.02);car.add(sideGlass);}
  const spoiler=new THREE.Mesh(new THREE.BoxGeometry(2.45,.12,.38),dark);spoiler.position.set(0,1.66,1.93);car.add(spoiler);for(const x of [-.86,.86]){const support=new THREE.Mesh(new THREE.BoxGeometry(.09,.4,.1),metal);support.position.set(x,1.48,1.82);car.add(support);}
  const wheels=[];for(const x of [-1.12,1.12])for(const z of [-1.35,1.35]){const wheel=new THREE.Group();wheel.position.set(x,.52,z);const tire=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.32,18),rubber);tire.rotation.z=Math.PI/2;tire.castShadow=true;wheel.add(tire);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.34,12),metal);hub.rotation.z=Math.PI/2;wheel.add(hub);for(let spoke=0;spoke<5;spoke++){const sp=new THREE.Mesh(new THREE.BoxGeometry(.045,.33,.025),mat('#d5d8dc',.24,{metalness:.75}));sp.position.set(0,0,0);sp.rotation.y=spoke*Math.PI/5;hub.add(sp);}car.add(wheel);wheels.push(wheel);}
  for(const x of [-.72,.72]){const headlamp=new THREE.Mesh(new THREE.BoxGeometry(.46,.16,.055),mat('#fff1bd',.2,{emissive:'#fff0c0',emissiveIntensity:1.4}));headlamp.position.set(x,1.02,-2.17);car.add(headlamp);const tail=new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.055),mat('#ff313f',.22,{emissive:'#f20b24',emissiveIntensity:1.3}));tail.position.set(x,1.02,2.17);car.add(tail);}
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.42,24),new THREE.MeshBasicMaterial({color:'#05070c',transparent:true,opacity:.42}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;shadow.scale.set(1,1.85,1);car.add(shadow);
  car.userData.wheels=wheels;return car;
}
const raceReturn=new THREE.Group();raceReturn.position.set(-10,0,104);raceRoot.add(raceReturn);const raceReturnRing=new THREE.Mesh(new THREE.TorusGeometry(.9,.13,10,36),mat('#a9eaff',.22,{emissive:'#8deaff',emissiveIntensity:1.3}));raceReturnRing.position.y=1.35;raceReturn.add(raceReturnRing);const raceReturnBase=box(raceReturn,2,.16,.72,mat('#30243b'),0,.1,0);raceReturnBase.userData.station=raceReturn;const raceReturnLabel=addLabel(raceReturn,'VỀ RẠP NGOÀI TRỜI','#a9eaff');raceReturnLabel.position.set(0,2.55,0);raceReturnLabel.scale.set(4,.68,1);raceReturn.userData.gameId='door';raceReturn.userData.name='CỔNG VỀ RẠP';raceReturn.userData.room='race';raceReturn.userData.targetRoom='cinema';raceReturn.userData.targetPosition={x:100,z:58};raceReturnBase.userData.station=raceReturn;stations.push(raceReturn);
const raceCar=createCarModel();raceCar.position.set(0,-.14,111);raceCar.rotation.y=Math.PI;raceRoot.add(raceCar);raceCar.userData.gameId='car';raceCar.userData.name='XE ĐUA';raceCar.userData.room='race';const carSign=addLabel(raceCar,'R-01 · XE ĐUA','#d6ff72');carSign.position.set(0,2.35,0);carSign.scale.set(2.4,.58,1);stations.push(raceCar);
const speedHud=document.createElement('div');speedHud.className='race-speed-hud';speedHud.hidden=true;speedHud.innerHTML='<b>0</b><span>KM/H</span><small>W ga · S phanh · A/D lái · Space drift · E xuống xe</small>';host.append(speedHud);
const wardrobePanel=document.createElement('aside');wardrobePanel.className='wardrobe-panel';wardrobePanel.hidden=true;wardrobePanel.innerHTML='<header><div><small>TỦ ĐỒ · PHÒNG THAY ĐỒ</small><b>Chọn trang phục</b></div><button type="button" aria-label="Đóng tủ đồ">×</button></header><div class="wardrobe-grid"></div><p>Trang phục được dựng trực tiếp cho avatar 3D và lưu trên thiết bị này.</p>';host.append(wardrobePanel);

const swayingPines=[];
function addPine(x,z,height,scale=1){
  const tree=new THREE.Group();tree.position.set(x,0,z);tree.scale.setScalar(scale);cinemaRoot.add(tree);
  swayingPines.push({tree,phase:x*.8+z*.35});
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.32,height*.38,7),mat('#49353a'));trunk.position.y=height*.19;trunk.castShadow=true;tree.add(trunk);
  for(let tier=0;tier<3;tier++){const cone=new THREE.Mesh(new THREE.ConeGeometry(height*(.3-tier*.055),height*.42,8),mat(tier%2?'#173b3a':'#1c4642',.9));cone.position.y=height*(.4+tier*.22);cone.castShadow=true;tree.add(cone);}
  obstacles.push({x:100+x,z,r:.72*scale});
}
for(const [x,z,h,s] of [[-34,-30,8,1.2],[-34,-10,7,1],[-34,12,9,1.2],[-34,34,8,1],[34,-30,8,1.2],[34,-10,7,1],[34,12,9,1.2],[34,34,7,.9],[-22,-31,6,.85],[22,-31,6,.85],[-30,57,9,1.1],[30,57,8,1]])addPine(x,z,h,s);
for(const x of [-33,33]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,11,8),mat('#49353a'));pole.position.set(x,5.5,11.2);pole.castShadow=true;cinemaRoot.add(pole);obstacles.push({x:100+x,z:11.2,r:.3});}
const festoonPts=[];for(let i=0;i<=18;i++){const x=-32+i*(64/18);festoonPts.push(new THREE.Vector3(x,10.8-Math.sin(i/18*Math.PI)*.8,11.2));}
cinemaRoot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(festoonPts),new THREE.LineBasicMaterial({color:'#d3b58e',transparent:true,opacity:.68})));
for(let i=0;i<19;i++){
  const x=-32+i*(64/18),y=10.8-Math.sin(i/18*Math.PI)*.8,color=i%3===0?'#ffe0a5':'#d8e6b1';
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(i%3===0?.12:.085,10,8),mat(color,.22,{emissive:i%3===0?'#ffb86b':'#b1df9c',emissiveIntensity:1.15}));bulb.position.set(x,y,11.2);cinemaRoot.add(bulb);
  if(i%3===0){const glow=new THREE.PointLight(i%2===0?'#ffc47f':'#b5e7be',.46,3);glow.position.set(x,y-.12,11.2);cinemaRoot.add(glow);animatedDecor.push({type:'pulseLight',light:glow,phase:i*.48});}
}
const cinemaFireflies=[];for(let i=0;i<5;i++){
  const color=i%2===0?'#d9ff86':'#ffe38a';
  const mote=new THREE.Mesh(new THREE.SphereGeometry(.085,10,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.96}));
  const halo=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.13,depthWrite:false}));mote.add(halo);
  const glow=new THREE.PointLight(color,.55,3.8);mote.add(glow);
  const phase=i*2.4,baseY=1.05+(i%3)*.38,rx=11+(i%3)*1.5,rz=9+(i%2)*3;mote.position.set(Math.cos(phase)*rx,baseY,Math.sin(phase)*rz);cinemaRoot.add(mote);cinemaFireflies.push({mesh:mote,phase,baseY,rx,rz,speed:.07+(i%3)*.012});
}
const cinemaExit=new THREE.Group();cinemaExit.position.set(0,0,28);cinemaRoot.add(cinemaExit);
const cinemaExitRing=new THREE.Mesh(new THREE.TorusGeometry(.72,.1,10,32),mat('#607781',.4,{metalness:.22}));cinemaExitRing.position.y=1.15;cinemaExit.add(cinemaExitRing);
const cinemaExitBase=box(cinemaExit,1.8,.14,.65,mat('#302d3c'),0,.1,0);cinemaExitBase.userData.station=cinemaExit;
const cinemaExitLabel=addLabel(cinemaExit,'VỀ SẢNH','#b9f1ff');cinemaExitLabel.position.set(0,2.25,0);
cinemaExit.userData.gameId='door';cinemaExit.userData.name='CỔNG VỀ SẢNH';cinemaExit.userData.room='cinema';cinemaExit.userData.targetRoom='lounge';cinemaExit.userData.targetPosition={x:-2.35,z:3.6};cinemaExitRing.userData.station=cinemaExit;stations.push(cinemaExit);animatedDecor.push({type:'portal',mesh:cinemaExitRing,phase:1.4});

// Keep the larger floor dimensions while leaving every prop at its authored scale.

// Low-poly mountain ridges surround the forest, keeping the horizon filled
// when the camera turns around the larger open-air venue.
const cinemaMountainMats=['#17283a','#1b3038','#20373a','#1a2638'].map(color=>mat(color,.98));
const cinemaMountainGroup=new THREE.Group();cinemaMountainGroup.name='cinema-distant-mountains';cinemaMountainGroup.visible=false;cinemaRoot.add(cinemaMountainGroup);
for(let i=0;i<17;i++){
  const side=i%2?1:-1,index=Math.floor(i/2),x=side*(78+(index%3)*8),z=-48+index*13,height=12+(index%4)*3,radius=10+(index%3)*3;
  const peak=new THREE.Mesh(new THREE.ConeGeometry(radius,height,6,1),cinemaMountainMats[i%cinemaMountainMats.length]);peak.position.set(x,height/2-1,z);peak.rotation.y=(i%5)*.38;peak.castShadow=true;cinemaMountainGroup.add(peak);
}
for(let i=0;i<8;i++){
  const x=-80+i*23,z=i%2?-74:78,height=14+(i%3)*3.2;
  const ridge=new THREE.Mesh(new THREE.ConeGeometry(10+(i%2)*2,height,5,1),cinemaMountainMats[(i+1)%cinemaMountainMats.length]);ridge.position.set(x,height/2-1,z);ridge.castShadow=true;cinemaMountainGroup.add(ridge);
}
// A complete low-poly ridge around the lake keeps mountains visible from
// every camera angle, including the newly extended rear garden.
for(let i=0;i<22;i++){
  const angle=(i/22)*Math.PI*2,radius=88+(i%3)*8,height=15+(i%5)*3,width=12+(i%4)*2;
  const peak=new THREE.Mesh(new THREE.ConeGeometry(width,height,6,1),cinemaMountainMats[(i+2)%cinemaMountainMats.length]);
  peak.position.set(Math.cos(angle)*radius,height/2-1,8+Math.sin(angle)*radius);peak.rotation.y=angle*.37;peak.castShadow=true;cinemaMountainGroup.add(peak);
}
// A broken shoreline of rocks traces both sides of the widened deck.
for(let i=0;i<12;i++){
  const z=-27+i*7.5,side=i%2?1:-1,size=.75+(i%4)*.22;
  const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(size,0),mat(i%2?'#52676a':'#48525e',.96));
  rock.position.set(side*(40.2+(i%3)*.45),-.05,z);rock.scale.y=.46;rock.rotation.set(i*.31,i*.77,i*.19);rock.castShadow=true;cinemaRoot.add(rock);
}

// Fire-pit lounge with rough timber seats at the back of the cinema deck.
const cinemaCampfire=new THREE.Group();cinemaCampfire.position.set(25,0,53);cinemaRoot.add(cinemaCampfire);
const fireBowl=new THREE.Mesh(new THREE.CylinderGeometry(1.08,1.25,.42,10),mat('#343039',.82,{metalness:.2}));fireBowl.position.y=.24;fireBowl.castShadow=true;cinemaCampfire.add(fireBowl);
for(let i=0;i<4;i++){const log=new THREE.Mesh(new THREE.CylinderGeometry(.17,.2,1.5,7),mat('#553a30',.92));log.rotation.z=Math.PI/2;log.rotation.y=i*Math.PI/4;log.position.set(Math.cos(i*Math.PI/2)*.2,.48,Math.sin(i*Math.PI/2)*.2);log.castShadow=true;cinemaCampfire.add(log);}
const campFlame=new THREE.Mesh(new THREE.ConeGeometry(.48,1.2,7),mat('#ff9b42',.28,{emissive:'#ff5b25',emissiveIntensity:1.7}));campFlame.position.y=1.05;cinemaCampfire.add(campFlame);
const campFlameCore=new THREE.Mesh(new THREE.ConeGeometry(.25,.78,6),mat('#ffe286',.25,{emissive:'#ffb72f',emissiveIntensity:1.8}));campFlameCore.position.y=1.08;cinemaCampfire.add(campFlameCore);
const campLight=new THREE.PointLight('#ff8c42',2.1,10);campLight.position.y=1.1;cinemaCampfire.add(campLight);animatedDecor.push({type:'campfire',mesh:campFlame,secondary:campFlameCore,light:campLight,phase:1.1});
for(const [i,angle] of [-Math.PI/2,Math.PI/6,5*Math.PI/6].entries()){
  const seat=new THREE.Group();seat.position.set(25+Math.cos(angle)*3.05,0,53+Math.sin(angle)*3.05);seat.rotation.y=-angle;cinemaRoot.add(seat);
  const wood=mat(i===1?'#735341':'#604638',.93),bench=new THREE.Mesh(new THREE.CylinderGeometry(.34,.4,2.35,9),wood);bench.rotation.z=Math.PI/2;bench.castShadow=true;bench.position.y=.39;seat.add(bench);
  obstacles.push({x:100+seat.position.x,z:seat.position.z,r:1.15});
}
obstacles.push({x:100+cinemaCampfire.position.x,z:cinemaCampfire.position.z,r:2.1});

// The bar remains its own separate room and video source.
const barRoot=new THREE.Group();barRoot.name='quan-bar';barRoot.position.set(40,0,0);scene.add(barRoot);
const barFloor=mat('#302b3c');
box(barRoot,21,0.35,18,barFloor,0,-0.22,0);
box(barRoot,21,7.5,0.38,mat('#291f36'),0,3.53,-9.05);
box(barRoot,0.38,7.5,18,mat('#291f36'),-10.45,3.53,0);box(barRoot,0.38,7.5,18,mat('#291f36'),10.45,3.53,0);
const barNeon=mat('#ff58bd',0.22,{emissive:'#ff28ac',emissiveIntensity:1.2});
box(barRoot,18,0.14,0.18,barNeon,0,6.75,-8.78,false);
const barSign=addLabel(barRoot,'NIGHT OWL · BAR','#ff9cda');barSign.position.set(0,5.7,-8.55);barSign.scale.set(5.5,1.0,1);
const barScreenGroup=new THREE.Group();barScreenGroup.position.set(0,4.7,-8.5);barRoot.add(barScreenGroup);
roundedPanel(barScreenGroup,10.5,5.7,0.3,mat('#17131f',0.25,{metalness:0.4,emissive:'#64204f',emissiveIntensity:0.55}),0,0,0,0.35);
roundedPanel(barScreenGroup,10.0,5.38,0.08,mat('#ad4b91',0.25,{metalness:0.3,emissive:'#ff45c4',emissiveIntensity:0.9}),0,0,0.18,0.3);
const barVideoSurface=box(barScreenGroup,9.55,5.02,0.04,mat('#100b17',0.24,{emissive:'#301338',emissiveIntensity:0.8}),0,0,0.25,false);
const barProjectionFrame=document.createElement('div');barProjectionFrame.className='room-projection room-projection-bar';barProjectionFrame.setAttribute('aria-label','Video riêng của quán bar');
const barProjectionHint=document.createElement('div');barProjectionHint.className='projection-hint';barProjectionHint.innerHTML='<span>♫</span><b>BAR SCREEN</b><small>Thêm nhạc tại jukebox của quán bar</small>';barProjectionFrame.append(barProjectionHint);
let barMusicPlayer=document.querySelector('#youtubeBarPlayer');
if(!barMusicPlayer){barMusicPlayer=document.createElement('iframe');barMusicPlayer.id='youtubeBarPlayer';barMusicPlayer.title='YouTube music player · Quán bar';barMusicPlayer.allow='autoplay; encrypted-media';barMusicPlayer.referrerPolicy='no-referrer-when-downgrade';barMusicPlayer.hidden=true;document.querySelector('.music-player-wrap')?.append(barMusicPlayer);}
barProjectionFrame.append(barMusicPlayer);host.append(barProjectionFrame);
const barProjectionShield=document.createElement('div');barProjectionShield.className='projection-shield';barProjectionShield.setAttribute('aria-label','Màn hình chỉ để xem video');barProjectionFrame.append(barProjectionShield);
Object.assign(barProjectionFrame.style,{pointerEvents:'auto'});barMusicPlayer.style.pointerEvents='none';barMusicPlayer.tabIndex=-1;Object.assign(barProjectionShield.style,{position:'absolute',inset:'0',zIndex:'5',background:'transparent',pointerEvents:'auto',touchAction:'none'});
const counter=new THREE.Group();counter.position.set(40,0,-1.1);scene.add(counter);
box(counter,7.2,1.2,1.45,mat('#613956'),0,0.75,0);
box(counter,7.55,0.24,1.75,mat('#d18cb9',0.32,{metalness:0.25}),0,1.43,0);
box(counter,6.85,0.1,0.08,barNeon,0,0.75,0.76,false);
obstacles.push({x:40,z:-1.1,r:3.45});
for(let i=0;i<7;i++){
  const bottle=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.16,0.5+(i%3)*0.12,8),mat(i%2?'#7bdcff':'#d6ff72',0.28,{emissive:i%2?'#248db2':'#7bba32',emissiveIntensity:0.55}));
  bottle.position.set(-2.8+i*0.92,1.78,-0.1);bottle.castShadow=true;counter.add(bottle);
}
// The bar has its own jukebox and independent YouTube queue.
const barJukebox=new THREE.Group();barJukebox.position.set(34.3,0,-3.2);scene.add(barJukebox);
const barJukeboxShell=box(barJukebox,1.35,2.0,0.88,mat('#7d356c',0.32,{emissive:'#612253',emissiveIntensity:0.55}),0,1.08,0);
box(barJukebox,1.02,1.08,0.08,mat('#17111f'),0,1.28,0.48,false);
const barRecord=new THREE.Mesh(new THREE.CylinderGeometry(0.37,0.37,0.07,32),mat('#e26bb3',0.24,{emissive:'#ff45b0',emissiveIntensity:0.8}));barRecord.rotation.x=Math.PI/2;barRecord.position.set(0,1.45,0.56);barJukebox.add(barRecord);animatedDecor.push({type:'record',mesh:barRecord});
addLabel(barJukebox,'JUKEBOX · BAR','#ff9cda');barJukebox.userData.gameId='jukebox';barJukebox.userData.name='JUKEBOX QUÁN BAR';barJukebox.userData.room='bar';barJukeboxShell.userData.station=barJukebox;stations.push(barJukebox);obstacles.push({x:34.3,z:-3.2,r:0.95});
const disco=new THREE.Group();disco.position.set(40,6.1,-1.6);scene.add(disco);
const discoBall=new THREE.Mesh(new THREE.SphereGeometry(0.65,16,12),mat('#bdb6cf',0.25,{metalness:0.8,roughness:0.2}));disco.add(discoBall);
for(let i=0;i<4;i++){const beam=new THREE.SpotLight(['#ff58bd','#58dfff','#d6ff72','#a882ff'][i],1.8,16,0.25,0.6,1.3);beam.position.set(40+(i-1.5)*3,6.5,2);beam.target.position.set(40+(i-1.5)*2,0,-2);scene.add(beam,beam.target);animatedDecor.push({type:'barBeam',light:beam,phase:i*1.6});}
for(const x of [36.5,40,43.5]){
  const stool=new THREE.Group();stool.position.set(x,0,1.8);scene.add(stool);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.16,0.85,10),mat('#40334f'));stem.position.y=0.46;stool.add(stem);
  const cushion=new THREE.Mesh(new THREE.CylinderGeometry(0.48,0.48,0.2,14),mat('#c879aa'));cushion.position.y=0.98;cushion.castShadow=true;stool.add(cushion);
  stool.userData.gameId='seat';stool.userData.name='GHẾ QUẦY BAR';stool.userData.room='bar';stool.userData.seatTarget={x,z:2.75};stool.children[0].userData.station=stool;stations.push(stool);obstacles.push({x,z:1.8,r:0.58});
}
const barReturn=new THREE.Group();barReturn.position.set(40,0,6.8);scene.add(barReturn);
const returnRing=new THREE.Mesh(new THREE.TorusGeometry(0.72,0.1,10,32),mat('#d6ff72',0.2,{emissive:'#b3f45c',emissiveIntensity:1.3}));returnRing.position.y=1.15;barReturn.add(returnRing);
const returnBase=box(barReturn,1.8,0.14,0.65,mat('#30243b'),0,0.1,0);returnBase.userData.station=barReturn;
const returnSign=addLabel(barReturn,'VỀ SẢNH','#d6ff72');returnSign.position.set(0,2.25,0);returnSign.scale.set(2.4,0.58,1);
barReturn.userData.gameId='door';barReturn.userData.name='CỔNG VỀ SẢNH';barReturn.userData.room='bar';barReturn.userData.targetRoom='lounge';barReturn.userData.targetPosition={x:0,z:3.45};returnRing.userData.station=barReturn;stations.push(barReturn);
// Full-height partitions divide the cutaway scene into three actual rooms.
const leftTrim=mat('#7bdcff',0.22,{emissive:'#55c9ff',emissiveIntensity:0.85});
const rightTrim=mat('#ff91cf',0.22,{emissive:'#ff5cae',emissiveIntensity:0.85});
for(const [x,trim] of [[-5.8,leftTrim],[5.8,rightTrim]]){
  for(const z of [-5.2,5.2]){
    box(loungeRoot,0.42,7.15,7.6,mat('#30283e'),x,3.575,z);
    box(loungeRoot,0.16,0.16,7.55,trim,x,7.12,z,false);
  }
  // Door jambs and lintel leave a real walk-through opening at the center.
  for(const z of [-1.52,1.52])box(loungeRoot,0.5,5.7,0.18,trim,x,2.85,z,false);
  box(loungeRoot,0.5,0.42,3.2,trim,x,5.92,0,false);
}
// Separate floor finishes make each room read as its own space.
box(loungeRoot,9.05,0.045,17.5,mat('#40374d'),-10.45,-0.012,0,false);
box(loungeRoot,9.05,0.045,17.5,mat('#483548'),10.45,-0.012,0,false);
for(const [x,color] of [[-10.45,'#7bdcff'],[10.45,'#ff91cf']]){
  const stripe=mat(color,0.24,{emissive:color,emissiveIntensity:0.45});
  box(loungeRoot,0.12,0.035,16.8,stripe,x,-0.005,0,false);
}
const wingLeft=addLabel(loungeRoot,'MINI GAME · TRÁI','#9de9ff');wingLeft.position.set(-10.2,4.45,-8.45);wingLeft.scale.set(4.0,0.82,1);
const wingRight=addLabel(loungeRoot,'MINI GAME · PHẢI','#ffaddb');wingRight.position.set(10.2,4.45,-8.45);wingRight.scale.set(4.0,0.82,1);
let activeRoom = 'lounge';
const stationDefs = [
  { id: 'guess', name: 'ĐOÁN SỐ', room:'left', x: -11.8, z: -5.5, color: '#aa83ff', icon: '?', hint: 'CHƠI NHANH' },
  { id: 'memory', name: 'TRÍ NHỚ', room:'left', x: -8.3, z: -5.5, color: '#59bd9f', icon: '✦', hint: 'ĐỘNG NÃO' },
  { id: 'rps', name: 'OẲN TÙ TÌ', room:'left', x: -11.8, z: 0, color: '#ff9f83', icon: '✊', hint: 'ĐỐI KHÁNG' },
  { id: 'reaction', name: 'PHẢN XẠ', room:'left', x: -8.3, z: 5.5, color: '#d6ff72', icon: '⚡', hint: 'NHANH TAY' },
  { id: 'ttt', name: 'CỜ CA-RÔ', room:'left', x: -11.8, z: 5.5, color: '#8faeff', icon: '×', hint: 'ĐẤU TRÍ' },
  { id: 'math', name: 'TÍNH NHẨM', room:'right', x: 8.3, z: -5.5, color: '#ffc96e', icon: '+', hint: 'ĐỘNG NÃO' },
  { id: 'whack', name: 'ĐẬP CHUỘT', room:'right', x: 11.8, z: -5.5, color: '#ff79ae', icon: '🐹', hint: 'NHANH TAY' },
  { id: 'coin', name: 'SẤP HAY NGỬA', room:'right', x: 8.3, z: 0, color: '#67d8d0', icon: '✦', hint: 'MAY MẮN' },
  { id: 'shooter', name: 'BẮN TÀU', room:'right', x: 11.8, z: 0, color: '#79d8ff', icon: '✦', hint: 'BẮN TÀU VŨ TRỤ' },
  { id: 'merge', name: '2048', room:'right', x: 8.3, z: 5.5, color: '#ffb86b', icon: '8', hint: 'GHÉP SỐ' },
  { id: 'mines', name: 'GỠ MÌN', room:'right', x: 11.8, z: 5.5, color: '#c4a0ff', icon: '⚑', hint: 'DÒ MÌN' },
];
function makeArcade(def) {
  const group = new THREE.Group(); group.position.set(def.x, 0, def.z); loungeRoot.add(group);
  const color = new THREE.Color(def.color);
  const shell = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.85, 0.9), mat('#2e263c', 0.38));
  shell.position.y = 1.02; shell.castShadow = true; group.add(shell);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.43, 0.2, 1.0), mat(def.color, 0.35, { emissive: color, emissiveIntensity: 0.42 }));
  cap.position.set(0, 1.94, 0); cap.castShadow = true; group.add(cap);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.86, 0.08), mat('#110f1a', 0.28)); bezel.position.set(0, 1.31, 0.49); group.add(bezel);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.68, 0.04), mat(def.color, 0.25, { emissive: color, emissiveIntensity: 0.92 })); screen.position.set(0, 1.33, 0.55); group.add(screen);
  const icon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.045), mat('#fff0bd', 0.24, { emissive: '#ffe18a', emissiveIntensity: 0.9 })); icon.position.set(0, 1.33, 0.58); group.add(icon);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.15, 0.34), mat('#7b668a')); deck.position.set(0, 0.83, 0.42); deck.rotation.x = -0.12; group.add(deck);
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), mat(i === 0 ? def.color : '#f8d990', 0.25, { emissive: i === 0 ? color : new THREE.Color('#f8d990'), emissiveIntensity: 0.7 }));
    b.position.set(-0.29 + i * 0.28, 0.94, 0.52); group.add(b);
  }
  const foot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.03), mat('#211c2b')); foot.position.y = 0.09; foot.castShadow = true; group.add(foot);
  const lamp = new THREE.PointLight(def.color, 2.0, 4.0); lamp.position.set(0, 1.7, 0.9); group.add(lamp);
  addLabel(group, def.name, def.color);
  group.userData.gameId = def.id; group.userData.name = def.name; group.userData.hitMesh = shell; group.userData.room=def.room;
  shell.userData.station = group;
  obstacles.push({ x:def.x, z:def.z, r:0.92 });
  stations.push(group);
}
stationDefs.forEach(makeArcade);

// A clickable retro jukebox for a personal YouTube queue.
function makeJukebox() {
  const group = new THREE.Group(); group.position.set(-4.45, 0, -2.65); loungeRoot.add(group);
  const shellMat = mat('#7d4a9a', 0.32, { emissive: '#351847', emissiveIntensity: 0.3 });
  const shell = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.0, 0.88), shellMat); shell.position.y = 1.08; shell.castShadow = true; group.add(shell);
  const topArch = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#b87ecb', 0.3, { emissive: '#8540a5', emissiveIntensity: 0.7 }));
  topArch.position.set(0, 2.03, 0); topArch.rotation.x = -Math.PI / 2; topArch.scale.set(1, 0.65, 0.55); group.add(topArch);
  const front = new THREE.Mesh(new THREE.BoxGeometry(1.03, 1.13, 0.08), mat('#1a1424', 0.25)); front.position.set(0, 1.28, 0.49); group.add(front);
  const record = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.075, 40), mat('#241d2b', 0.22, { emissive: '#47304e', emissiveIntensity: 0.3 }));
  record.rotation.x = Math.PI / 2; record.position.set(0, 1.48, 0.56); record.castShadow = true; group.add(record);
  animatedDecor.push({type:'record',mesh:record});
  const recordRing = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.035, 8, 40), mat('#d6ff72', 0.22, { emissive: '#b3f45c', emissiveIntensity: 1.3 }));
  recordRing.position.set(0, 1.48, 0.61); group.add(recordRing);
  const recordHub = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), mat('#ff9fc5', 0.2, { emissive: '#ff4f9a', emissiveIntensity: 0.8 }));
  recordHub.position.set(0, 1.48, 0.64); group.add(recordHub);
  for (const sx of [-0.38, 0.38]) {
    const speaker = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 24), mat('#b5a0c4', 0.45));
    speaker.rotation.x = Math.PI / 2; speaker.position.set(sx, 0.75, 0.51); group.add(speaker);
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat('#ffbc85', 0.3, { emissive: '#ff805f', emissiveIntensity: 0.65 })); center.position.set(sx, 0.75, 0.56); group.add(center);
  }
  const foot = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.13, 1.0), mat('#302038')); foot.position.y = 0.09; group.add(foot);
  const light = new THREE.PointLight('#d98bff', 1.6, 4); light.position.set(0, 1.7, 0.9); group.add(light);
  addLabel(group, 'JUKEBOX · NHẠC', '#e3c0ff');
  group.userData.gameId = 'jukebox'; group.userData.name = 'MÁY PHÁT NHẠC'; group.userData.room='lounge'; shell.userData.station = group; stations.push(group);
  obstacles.push({ x:-4.45, z:-2.65, r:0.98 });
}
makeJukebox();

// Gentle motion makes the expanded lounge feel occupied without blocking movement.
const fireflies=[];
for(let i=0;i<18;i++){
  const color=i%3===0?'#ff9fc5':i%3===1?'#d6ff72':'#9edbff';
  const mote=new THREE.Mesh(new THREE.OctahedronGeometry(i%4===0?0.13:0.085,0),mat(color,0.2,{emissive:color,emissiveIntensity:1.4}));
  const phase=i*1.71, baseY=1.5+(i%5)*0.72, radiusX=3.4+(i%4)*1.15, radiusZ=2.8+(i%3)*1.4;
  mote.position.set(Math.cos(phase)*radiusX,baseY,Math.sin(phase)*radiusZ); loungeRoot.add(mote);
  const glow=new THREE.PointLight(color,0.42,2.1); mote.add(glow); fireflies.push({mesh:mote,phase,baseY,radiusX,radiusZ,speed:0.18+(i%4)*0.035});
}
const fan=new THREE.Group(); fan.position.set(0,6.55,1.7); loungeRoot.add(fan);
const fanHub=new THREE.Mesh(new THREE.SphereGeometry(0.24,16,12),mat('#e3b7c6',0.3,{emissive:'#a65684',emissiveIntensity:0.35})); fanHub.castShadow=true; fan.add(fanHub);
for(let i=0;i<4;i++){const blade=box(fan,0.28,0.1,2.35,mat(i%2?'#986caa':'#c08baa',0.43),0,0,1.18,false);blade.rotation.y=i*Math.PI/2;}
const screenLight=new THREE.PointLight('#a985ff',1.2,12); screenLight.position.set(0,4.2,-6.8); loungeRoot.add(screenLight);

// Comfy chairs are usable: walk close and press E to sit or stand up.
function makeChair(x,z,rotation=0) {
  const chair=new THREE.Group(); chair.position.set(x,0,z); chair.rotation.y=rotation; loungeRoot.add(chair);
  const wood=mat('#563b5e'), cushion=mat('#d18ba8',0.55);
  const seat=box(chair,1.05,0.18,0.95,cushion,0,0.72,0);
  box(chair,1.05,0.95,0.18,wood,0,1.17,-0.39);
  for(const sx of [-0.4,0.4]) for(const sz of [-0.34,0.34]) box(chair,0.12,0.7,0.12,wood,sx,0.36,sz);
  seat.userData.station=chair;
  chair.userData.gameId='seat'; chair.userData.name='GHẾ NGỒI'; chair.userData.room='lounge'; chair.userData.seatTarget={x:x,z:z+1.15};
  stations.push(chair); obstacles.push({x,z,r:0.72});
}
makeChair(-3.15,1.4,Math.PI); makeChair(3.15,1.4,Math.PI); makeChair(-3.15,5.2,Math.PI);
obstacles.push({x:0,z:1,r:1.35}); // low central table
obstacles.push({x:3.25,z:-6.4,r:2.05}); // sofa stays inside the lobby
obstacles.push({x:3.1,z:5.7,r:0.78}); // pouf beside the bar gate
for(const [x,z] of [[-13.3,-7.6],[13.3,-7.6],[-13.3,6.2],[13.3,6.0]]) obstacles.push({x,z,r:0.55});

// Low-poly avatar with bobbing limbs and a soft pool of light.
const player = new THREE.Group(); player.position.set(0, 0, 3.45); scene.add(player);
const avatarMat = mat('#9869e8', 0.56);
const skinMat = mat('#ffd0ae', 0.7);
const hairMat = mat('#49304f', 0.82);
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.55, 4, 8), avatarMat); torso.position.y = 1.05; torso.castShadow = true; player.add(torso);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), skinMat); head.position.y = 1.82; head.castShadow = true; player.add(head);
const hair = new THREE.Mesh(new THREE.SphereGeometry(0.395, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.53), hairMat); hair.position.y = 1.94; hair.castShadow = true; player.add(hair);
for (const sx of [-1, 1]) {
  const curl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), hairMat); curl.position.set(sx * 0.31, 1.83, 0.13); curl.castShadow = true; player.add(curl);
  const ear = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), skinMat); ear.position.set(sx * 0.37, 1.78, 0.02); player.add(ear);
}
const eyeMat = mat('#36273b', 0.55);
for (const sx of [-0.13, 0.13]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat); eye.position.set(sx, 1.83, 0.34); player.add(eye); }
const blushMat = mat('#f19aa8', 0.65);
for (const sx of [-0.23, 0.23]) { const blush = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), blushMat); blush.position.set(sx, 1.72, 0.31); blush.scale.set(1.3, 0.65, 0.42); player.add(blush); }
const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), mat('#f3ae91')); nose.position.set(0, 1.75, 0.37); player.add(nose);
const smile = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 6, 14, Math.PI), eyeMat); smile.position.set(0, 1.68, 0.345); smile.rotation.z = Math.PI; player.add(smile);
const hoodieMat=mat('#c5a4ff',.56),hoodie = new THREE.Mesh(new THREE.SphereGeometry(0.43, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hoodieMat);
hoodie.position.set(0, 1.43, -0.02); hoodie.scale.set(1.03, 0.85, 0.78); hoodie.castShadow = true; player.add(hoodie);
// Keep the hood behind the face and body so its rim reads as clothing detail.
hoodie.position.z = -0.16;
const legMat = mat('#e5b5cf');
const legs = [];
const arms = [];
for (const side of [-1, 1]) {
  const arm = new THREE.Group(); arm.position.set(side * 0.31, 1.37, 0.03); player.add(arm); arms.push({ arm, side });
  const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.27, 4, 8), avatarMat); sleeve.position.set(side * 0.09, -0.17, 0); sleeve.rotation.z = -side * 0.18; sleeve.castShadow = true; arm.add(sleeve);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.08, 10), mat('#c5a4ff')); cuff.position.set(side * 0.13, -0.34, 0.02); cuff.rotation.z = -side * 0.18; arm.add(cuff);
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.17, 3, 7), skinMat); forearm.position.set(side * 0.17, -0.47, 0.03); forearm.rotation.z = -side * 0.18; forearm.castShadow = true; arm.add(forearm);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), skinMat); hand.position.set(side * 0.19, -0.62, 0.07); hand.scale.set(1.05, 0.82, 0.72); hand.castShadow = true; arm.add(hand);
  for (let finger = 0; finger < 3; finger++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.032, 7, 6), skinMat); f.position.set(side * 0.19 + (finger - 1) * 0.045, -0.685, 0.12); f.scale.set(0.8, 1.25, 0.8); arm.add(f); }
}
for (const sx of [-0.17, 0.17]) {
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.27, 3, 7), legMat); leg.position.set(sx, 0.42, 0); leg.castShadow = true; player.add(leg); legs.push(leg);
  const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('#f2d8a1')); shoe.position.set(sx, 0.16, 0.1); shoe.scale.set(1.15, 0.62, 1.45); shoe.castShadow = true; player.add(shoe);
}
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({ color: '#100d19', transparent: true, opacity: 0.34 })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.012; player.add(shadow);
const playerLight = new THREE.PointLight('#bca2ff', 0.55, 3.5); playerLight.position.set(0, 2.1, 0); player.add(playerLight);

const outfits=[
  {id:'violet',name:'Neon tím',top:'#9869e8',hood:'#c5a4ff',pants:'#583e78',accent:'#d6ff72',shoes:'#f2d8a1'},
  {id:'racer',name:'Tay đua',top:'#d84443',hood:'#f2f0e9',pants:'#232a35',accent:'#ffd166',shoes:'#eeeeea'},
  {id:'ocean',name:'Biển đêm',top:'#227f98',hood:'#50c5d4',pants:'#183d58',accent:'#a8edff',shoes:'#dcecf3'},
  {id:'forest',name:'Rừng thông',top:'#357a55',hood:'#8bc48a',pants:'#344c3c',accent:'#d6ff72',shoes:'#d8c9aa'},
  {id:'sunset',name:'Hoàng hôn',top:'#c35d86',hood:'#f29ab0',pants:'#6b365f',accent:'#ffc96e',shoes:'#ffe0b8'},
  {id:'gold',name:'Đua vàng',top:'#bd8b28',hood:'#f1ca63',pants:'#3a3330',accent:'#fff0b5',shoes:'#f5dfad'},
  {id:'ice',name:'Băng giá',top:'#789ec8',hood:'#c8e5ff',pants:'#34485f',accent:'#ffffff',shoes:'#e6edf5'},
  {id:'midnight',name:'Bóng đêm',top:'#42404f',hood:'#7b6f91',pants:'#20212b',accent:'#ff75b5',shoes:'#c6bfd2'}
];
let currentOutfitId='violet',drivingCar=false;
function addOutfitExtras(target){
  const extras=new THREE.Group();target.add(extras);
  const trim=mat('#d6ff72',.42,{metalness:.2}),stripe=new THREE.Mesh(new THREE.BoxGeometry(.075,.5,.045),trim);stripe.position.set(0,1.08,.355);stripe.castShadow=true;extras.add(stripe);
  const scarf=new THREE.Mesh(new THREE.TorusGeometry(.22,.075,8,18),trim);scarf.rotation.x=Math.PI/2;scarf.position.set(0,1.48,.02);scarf.castShadow=true;extras.add(scarf);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.405,14,9,0,Math.PI*2,0,Math.PI/2),trim);cap.scale.y=.52;cap.position.set(0,2.15,0);cap.castShadow=true;extras.add(cap);
  const brim=new THREE.Mesh(new THREE.BoxGeometry(.56,.07,.28),trim);brim.position.set(0,2.14,.26);extras.add(brim);
  target.userData.outfitExtras={trim,stripe,scarf,cap,brim};
}
const outfitCuffs=[];for(const item of arms)for(const child of item.arm.children)if(child.geometry?.type==='CylinderGeometry')outfitCuffs.push(child.material);
const outfitShoes=player.children.filter(child=>child.geometry?.type==='SphereGeometry'&&child.position.y===.16).map(child=>child.material);
function paintAvatar(target,id){
  const outfit=outfits.find(item=>item.id===id)||outfits[0];
  if(target===player){currentOutfitId=outfit.id;avatarMat.color.set(outfit.top);hoodieMat.color.set(outfit.hood);legMat.color.set(outfit.pants);outfitCuffs.forEach(material=>material.color.set(outfit.accent));outfitShoes.forEach(material=>material.color.set(outfit.shoes));}
  else if(target.userData.outfitParts){const p=target.userData.outfitParts;p.top.color.set(outfit.top);p.hood.color.set(outfit.hood);p.pants.forEach(material=>material.color.set(outfit.pants));p.shoes.forEach(material=>material.color.set(outfit.shoes));p.cuffs.forEach(material=>material.color.set(outfit.accent));}
  if(target.userData.outfitExtras){const e=target.userData.outfitExtras;e.trim.color.set(outfit.accent);e.stripe.visible=['racer','ocean','gold','midnight'].includes(outfit.id);e.scarf.visible=['ocean','forest','sunset','ice'].includes(outfit.id);e.cap.visible=e.brim.visible=['racer','gold','midnight'].includes(outfit.id);}
  target.userData.outfitId=outfit.id;
}
addOutfitExtras(player);paintAvatar(player,currentOutfitId);
function selectOutfit(id){paintAvatar(player,id);const key=window.choigiOnlineUserId?`choigi-outfit-v1:${window.choigiOnlineUserId}`:'choigi-outfit-v1:guest';try{localStorage.setItem(key,id);}catch{};window.dispatchEvent(new CustomEvent('choigi-player-outfit',{detail:{outfit:id}}));wardrobePanel.hidden=true;keys.clear();window.showToast(`Đã thay trang phục: ${outfits.find(item=>item.id===id)?.name||'Neon tím'}`);}
const outfitGrid=wardrobePanel.querySelector('.wardrobe-grid');for(const outfit of outfits){const button=document.createElement('button');button.type='button';button.dataset.outfit=outfit.id;button.innerHTML=`<i style="--swatch:${outfit.top};--trim:${outfit.accent}"></i><span>${outfit.name}</span>`;button.addEventListener('click',()=>selectOutfit(outfit.id));outfitGrid.append(button);}
wardrobePanel.querySelector('header button').addEventListener('click',()=>{wardrobePanel.hidden=true;keys.clear();});
window.addEventListener('choigi-user-ready',event=>{const uid=event.detail?.uid;if(!uid)return;let saved='violet';try{saved=localStorage.getItem(`choigi-outfit-v1:${uid}`)||'violet';}catch{}paintAvatar(player,saved);});
window.addEventListener('choigi-outfit-selected',event=>{if(event.detail?.uid===window.choigiOnlineUserId)paintAvatar(player,event.detail?.outfit);});

// Other signed-in visitors use the same full low-poly avatar silhouette as the local player.
const remotePlayers=new Map();
function createRemoteAvatar(uid,data){
  const avatar=new THREE.Group();avatar.userData.arms=[];avatar.userData.legs=[];
  const palette=['#57b7cf','#e58aae','#78c98a','#e4a55c','#9a83e8','#71a7e8'];
  const hash=[...String(uid)].reduce((sum,char)=>sum+char.charCodeAt(0),0);
  const shirtMat=mat(palette[hash%palette.length],0.58),skin=mat('#ffd0ae',0.7),hairMatRemote=mat('#49304f',0.82),hoodMat=mat('#c5a4ff',.56),pantsMats=[],shoeMats=[],cuffMats=[];
  const shirt=new THREE.Mesh(new THREE.CapsuleGeometry(0.36,0.5,4,8),shirtMat);shirt.position.y=1.05;shirt.castShadow=true;avatar.add(shirt);
  const hood=new THREE.Mesh(new THREE.SphereGeometry(.43,12,9,0,Math.PI*2,0,Math.PI*.52),hoodMat);hood.position.set(0,1.43,-.16);hood.scale.set(1.03,.85,.78);avatar.add(hood);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.36,14,12),skin);head.position.y=1.82;head.castShadow=true;avatar.add(head);
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(0.375,14,9,0,Math.PI*2,0,Math.PI*.53),hairMatRemote);hairCap.position.y=1.94;hairCap.castShadow=true;avatar.add(hairCap);
  for(const side of [-1,1]){
    const ear=new THREE.Mesh(new THREE.SphereGeometry(0.095,9,8),skin);ear.position.set(side*.35,1.78,.015);avatar.add(ear);
    const arm=new THREE.Group();arm.position.set(side*.3,1.37,.025);avatar.add(arm);
    const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.125,.27,4,8),shirtMat);sleeve.position.set(side*.08,-.18,0);sleeve.rotation.z=-side*.16;sleeve.castShadow=true;arm.add(sleeve);
    const cuffMat=mat('#d9c4ff');cuffMats.push(cuffMat);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.07,9),cuffMat);cuff.position.set(side*.12,-.35,.02);cuff.rotation.z=-side*.16;arm.add(cuff);
    const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.078,.17,3,7),skin);forearm.position.set(side*.15,-.47,.03);forearm.rotation.z=-side*.16;forearm.castShadow=true;arm.add(forearm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.095,10,8),skin);hand.position.set(side*.17,-.62,.065);hand.scale.set(1,.82,.75);hand.castShadow=true;arm.add(hand);
    avatar.userData.arms.push({arm,side});
    const pantsMat=mat('#e5b5cf');pantsMats.push(pantsMat);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.26,3,7),pantsMat);leg.position.set(side*.16,.41,0);leg.castShadow=true;avatar.add(leg);avatar.userData.legs.push(leg);
    const shoeMat=mat('#f2d8a1');shoeMats.push(shoeMat);const shoe=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),shoeMat);shoe.position.set(side*.16,.15,.1);shoe.scale.set(1.15,.62,1.4);shoe.castShadow=true;avatar.add(shoe);
  }
  const nameTag=addLabel(avatar,String(data.displayName||data.username||'Bạn').slice(0,16),'#d6ff72');nameTag.position.y=2.48;nameTag.scale.set(2.5,.62,1);
  avatar.userData.outfitParts={top:shirtMat,hood:hoodMat,pants:pantsMats,shoes:shoeMats,cuffs:cuffMats};addOutfitExtras(avatar);paintAvatar(avatar,data.outfit||'violet');
  avatar.userData.target=new THREE.Vector3(Number(data.x)||0,0,Number(data.z)||0);avatar.userData.targetRotation=0;
  scene.add(avatar);avatar.position.copy(avatar.userData.target);
  return avatar;
}
window.addEventListener('choigi-online-players',event=>{
  const players=event.detail?.players||{},known=new Set();
  for(const [uid,data] of Object.entries(players)){
    if(uid===window.choigiOnlineUserId)continue;
    known.add(uid);let avatar=remotePlayers.get(uid);
    if(!avatar){avatar=createRemoteAvatar(uid,data);remotePlayers.set(uid,avatar);}
    const nextX=Number(data.x)||0,nextZ=Number(data.z)||0,moveX=nextX-avatar.userData.target.x,moveZ=nextZ-avatar.userData.target.z;
    if(Math.hypot(moveX,moveZ)>.035)avatar.userData.targetRotation=Math.atan2(moveX,moveZ);
    avatar.userData.target.set(nextX,0,nextZ);
    if(data.outfit&&avatar.userData.outfitId!==data.outfit)paintAvatar(avatar,data.outfit);
    let remoteCar=avatar.userData.remoteCar;
    if(data.inCar&&!remoteCar){const carColors=['#d84940','#4d9acb','#45a374','#b883d8','#e29240','#d65e8e'],hash=[...String(uid)].reduce((sum,char)=>sum+char.charCodeAt(0),0);remoteCar=createCarModel(carColors[hash%carColors.length]);remoteCar.userData.target=new THREE.Vector3(Number(data.vehicleX)||nextX,0,Number(data.vehicleZ)||nextZ);remoteCar.position.copy(remoteCar.userData.target);scene.add(remoteCar);avatar.userData.remoteCar=remoteCar;}
    if(remoteCar){remoteCar.visible=Boolean(data.inCar);remoteCar.userData.target.set(Number(data.vehicleX)||nextX,0,Number(data.vehicleZ)||nextZ);remoteCar.userData.targetYaw=Number(data.vehicleYaw)||0;remoteCar.userData.speed=Number(data.speed)||0;}avatar.visible=!data.inCar;
  }
  for(const [uid,avatar] of remotePlayers)if(!known.has(uid)){scene.remove(avatar);if(avatar.userData.remoteCar)scene.remove(avatar.userData.remoteCar);remotePlayers.delete(uid);}
});
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const keys = new Set();
let nearest = null;
const radius=0.34;
let seated=false;
let seatedStation=null;
const playerVelocity=new THREE.Vector2();
let walkPhase=0;
const carVelocity=new THREE.Vector2();let carSteer=0,vehicleSpeed=0;
function exitRaceCar(){
  const worldPos=raceCar.getWorldPosition(new THREE.Vector3()),side=new THREE.Vector3(1,0,0).applyQuaternion(raceCar.getWorldQuaternion(new THREE.Quaternion()));
  player.position.set(worldPos.x+side.x*2.3,0,worldPos.z+side.z*2.3);player.visible=true;drivingCar=false;raceCar.userData.drivenByLocal=false;vehicleSpeed=0;carVelocity.set(0,0);speedHud.hidden=true;updateNearby();
}
function standFromSeat(){
  if(activeRoom==='cinema'&&seatedStation){
    const chairPosition=seatedStation.getWorldPosition(new THREE.Vector3());
    const chairRotation=seatedStation.getWorldQuaternion(new THREE.Quaternion());
    const facing=new THREE.Vector3(0,0,1).applyQuaternion(chairRotation).normalize();
    player.position.set(chairPosition.x-facing.x*1.65,0,chairPosition.z-facing.z*1.65);
  }
  seated=false;seatedStation=null;player.scale.y=1;
}
function switchRoom(room){
  const next=['lounge','left','right','bar','cinema','race'].includes(room)?room:'lounge';
  if(next===activeRoom)return;
  activeRoom=next;
  cinemaMountainGroup.visible=activeRoom==='cinema'||activeRoom==='race';
  raceRoot.visible=activeRoom==='race';
  const shell=document.querySelector('.room-shell');shell?.classList.remove('bar-mode','left-mode','cinema-mode','race-mode');
  if(activeRoom==='cinema')shell?.classList.add('cinema-mode');if(activeRoom==='race')shell?.classList.add('race-mode');
  projectionFrame.classList.toggle('room-projection-cinema',activeRoom==='cinema');
  seated=false;seatedStation=null;player.scale.y=1;
  const copy={lounge:['SẢNH CHILL','Sảnh trò chuyện <span>✳</span>','Ngồi thư giãn, trò chuyện và cùng xem video.'],left:['PHÒNG GAME · TRÁI','Phòng game <span>TRÁI</span>','Chọn một máy chơi rồi nhấn E để bắt đầu.'],right:['PHÒNG GAME · PHẢI','Phòng game <span>PHẢI</span>','Chọn một máy chơi rồi nhấn E để bắt đầu.'],bar:['NIGHT OWL · BAR','Quán bar <span>✦</span>','Nghe nhạc, xem video và ngồi ở quầy bar.'],cinema:['RẠP TRỜI · CHIẾU PHIM','Rạp ngoài trời <span>✦</span>','Chọn ghế, ngồi cùng bạn bè và xem chung trên màn chiếu lớn.'],race:['ĐƯỜNG ĐUA · PINE RIDGE','Sân đua đêm <span>✦</span>','Đến xe thể thao màu đỏ để lái. W ga · S phanh · A/D đánh lái · giữ Shift tăng tốc.']}[activeRoom];
  document.querySelector('#roomEyebrow').textContent=copy[0];document.querySelector('#roomHeading').innerHTML=copy[1];document.querySelector('#roomIntro').textContent=copy[2];
  document.querySelector('.room-footnote').innerHTML=activeRoom==='lounge'?'<span>✦</span> Hai cửa bên nối tới phòng game. Hai cổng ở phía trước dẫn tới rạp ngoài trời và quán bar.':activeRoom==='bar'?'<span>✦</span> Đi tới quầy hoặc ghế để tương tác. Cổng xanh đưa bạn về sảnh.':activeRoom==='cinema'?'<span>✦</span> Ra phía sau rạp: đi thẳng tới cổng <b>ĐƯỜNG ĐUA</b>, rẽ trái ở lối đèn xanh tới <b>TỦ ĐỒ</b>. WASD · Shift chạy · kéo chuột xoay camera.':activeRoom==='race'?'<span>✦</span> Đường đua rộng phía sau rạp · W ga · S phanh/lùi · A/D lái · giữ Shift tăng tốc · Space phanh tay · E lên/xuống xe. Kéo chuột để xoay camera.':'<span>✦</span> Đi lại gần máy chơi rồi nhấn E. Qua cửa để trở lại sảnh.';
  projectionHint.innerHTML=activeRoom==='cinema'?'<span>▶</span><b>RẠP NGOÀI TRỜI</b><small>Video chung đang được chiếu từ jukebox sảnh</small>':'<span>▶</span><b>CHILL SCREEN</b><small>Thêm nhạc trong jukebox để chiếu video tại đây</small>';
  window.dispatchEvent(new CustomEvent('choigi-room-changed',{detail:{room:activeRoom}}));updateNearby();
}
function openStation(station) {
  if (window.choigiOnlineReady !== true) {
    if (socialOverlay) socialOverlay.hidden = false;
    return;
  }
  if(!station||station.userData.room!==activeRoom)return;
  if(station.userData.gameId==='wardrobe'){wardrobePanel.hidden=false;wardrobePanel.querySelectorAll('[data-outfit]').forEach(button=>button.classList.toggle('selected',button.dataset.outfit===currentOutfitId));keys.clear();return;}
  if(station.userData.gameId==='car'){
    if(drivingCar){exitRaceCar();return;}
    if(Math.hypot(player.position.x-raceCar.getWorldPosition(new THREE.Vector3()).x,player.position.z-raceCar.getWorldPosition(new THREE.Vector3()).z)>5){window.showToast('Đi sát xe hơn rồi nhấn E để lái.');return;}
    drivingCar=true;raceCar.userData.drivenByLocal=true;player.visible=false;carVelocity.set(0,0);vehicleSpeed=0;speedHud.hidden=false;keys.clear();updateNearby();return;
  }
  if(station.userData.gameId==='jukebox'){
    if(typeof window.openMusicPanel==='function')window.openMusicPanel(activeRoom);
    else window.showToast('Máy phát nhạc chưa tải xong. Hãy tải lại trang một lần nhé.');
  }
  else if(station.userData.gameId==='door'){
    player.position.set(station.userData.targetPosition.x,0,station.userData.targetPosition.z);
    if(station.userData.targetRoom==='cinema')player.rotation.y=Math.PI;
    playerVelocity.set(0,0);keys.clear();seated=false;seatedStation=null;player.scale.y=1;
    switchRoom(station.userData.targetRoom);
  }
  else if(station.userData.gameId==='seat'){
    playerVelocity.set(0,0);keys.clear();
    if(seated){standFromSeat();}
    else{seated=true;seatedStation=station;player.position.set(station.userData.seatTarget.x,.43,station.userData.seatTarget.z);player.rotation.y=station.rotation.y;player.scale.y=.76;}
    updateNearby();
  } else window.openGame(station.userData.gameId);
}
function updateNearby() {
  if(drivingCar){message.textContent='Bạn đang lái xe. W ga · S phanh · A/D lái · Shift tăng tốc · Space drift · E xuống xe.';interact.lastChild.textContent=' Xuống xe';interact.classList.add('can-interact');return;}
  let closest = null, distance = Infinity;
  for (const station of stations.filter(item=>item.userData.room===activeRoom)) {
    const stationPosition=station.getWorldPosition(new THREE.Vector3());
    const d = Math.hypot(player.position.x - stationPosition.x, player.position.z - stationPosition.z);
    if (d < distance) { closest = station; distance = d; }
  }
  nearest = distance < 4 ? closest : null;
  if (nearest) {
    const music = nearest.userData.gameId === 'jukebox', seat=nearest.userData.gameId==='seat',door=nearest.userData.gameId==='door',wardrobeHere=nearest.userData.gameId==='wardrobe',carHere=nearest.userData.gameId==='car';
    const doorName=nearest.userData.targetRoom==='bar'?'quán bar':nearest.userData.targetRoom==='cinema'?'rạp ngoài trời':nearest.userData.targetRoom==='race'?'sân đua':'sảnh';
    message.textContent = door ? `Nhấn E để tới ${doorName}.` : wardrobeHere?'Tủ đồ ở đây. Nhấn E để xem và thay 8 bộ trang phục.':carHere?'Xe thể thao sẵn sàng. Nhấn E để lái.':seat ? (seated?'Bạn đang ngồi thư giãn. Nhấn E để đứng dậy.':`Bạn đang gần ${nearest.userData.name}. Nhấn E để ngồi.`) : music ? (activeRoom==='bar'?'Jukebox này chỉ phát riêng trong quán bar. Nhấn E để chọn nhạc!':'Jukebox phát chung cho phòng game và rạp ngoài trời. Nhấn E để chọn nhạc!') : `Bạn đang ở máy ${nearest.userData.name}. Nhấn E để chơi!`;
    interact.lastChild.textContent = door ? ` Đi tới ${doorName}` : wardrobeHere?' Mở tủ đồ':carHere?' Lái xe':seat ? (seated?' Đứng dậy':' Ngồi xuống') : music ? ' Mở máy phát chung' : ` Chơi ${nearest.userData.name}`;
    interact.classList.add('can-interact');
  } else {
    message.textContent = activeRoom==='lounge'?'Đi tới jukebox, ghế sofa hoặc bàn ghế để tương tác.':activeRoom==='bar'?'Đi tới jukebox riêng của bar hoặc ghế để tương tác.':activeRoom==='cinema'?'Ra sau rạp: giữ S để đi thẳng tới cổng ĐƯỜNG ĐUA; rẽ trái theo đèn xanh để tới TỦ ĐỒ.':activeRoom==='race'?'Đi tới xe thể thao ở lối vào để bắt đầu lái.':'Đi lại gần một máy game để bắt đầu chơi.';
    interact.lastChild.textContent = ' Chơi ở đây';
    interact.classList.remove('can-interact');
  }
}
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
}
new ResizeObserver(resize).observe(host); resize();

function pointerPosition(event) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((event.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(stations.filter(item=>item.userData.room===activeRoom), true);
  const screenSurface=activeRoom==='bar'?barVideoSurface:activeRoom==='cinema'?cinemaVideoSurface:videoScreenSurface;
  const screenHit=['lounge','bar','cinema'].includes(activeRoom)?raycaster.intersectObject(screenSurface,false)[0]:null;
  if(screenHit&&(!hits[0]||screenHit.distance<hits[0].distance))return null;
  return hits.map(h => h.object.userData.station || h.object.parent).find(o => o?.userData?.gameId) || null;
}
renderer.domElement.addEventListener('pointermove', e => { if(cameraDragging)return; renderer.domElement.style.cursor = ['cinema','race'].includes(activeRoom)?'grab':pointerPosition(e) ? 'pointer' : 'default'; });
renderer.domElement.addEventListener('click', e => { const station = pointerPosition(e); if (station) openStation(station); });

function tryInteract() {
  if (window.choigiOnlineReady !== true) {
    if (socialOverlay) socialOverlay.hidden = false;
    return;
  }
  if(drivingCar){exitRaceCar();return;}
  if (nearest) openStation(nearest);
  else window.showToast('Đi tới gần một máy game, máy nhạc hoặc ghế rồi nhấn E nhé!');
}
interact.addEventListener('click', tryInteract);
const fullscreenButton = document.querySelector('#fullscreenBtn');
fullscreenButton?.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { window.showToast('Trình duyệt chưa cho bật toàn màn hình. Nhấn F11 để thử nhé.'); }
});
document.addEventListener('fullscreenchange', () => {
  const on = Boolean(document.fullscreenElement);
  if (fullscreenButton) {
    fullscreenButton.textContent = on ? '⛶' : '⛶';
    fullscreenButton.title = on ? 'Thoát toàn màn hình' : 'Toàn màn hình';
    fullscreenButton.setAttribute('aria-label', on ? 'Thoát toàn màn hình' : 'Bật toàn màn hình');
  }
  resize();
});
document.querySelectorAll('.room-station').forEach(el => el.addEventListener('click', () => window.openGame(el.dataset.station)));
document.querySelector('#shareRoomBtn')?.addEventListener('click', () => {
  if (navigator.share) navigator.share({ title: 'Chơi Gì? — Góc vui vẻ', text: 'Vào phòng mini game chơi cùng mình nè!', url: location.href }).catch(() => {});
  else navigator.clipboard?.writeText(location.href).then(() => window.showToast('Đã sao chép link phòng!'));
});
document.addEventListener('keydown', e => {
  if (modal.classList.contains('open') || !musicOverlay.hidden || !wardrobePanel.hidden || (socialOverlay && !socialOverlay.hidden) || (socialDrawer && !socialDrawer.hidden)) return;
  const k = e.key===' '?'space':e.key.toLowerCase();
  if (window.choigiOnlineReady !== true && ['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','enter'].includes(k)) {
    e.preventDefault();
    if (socialOverlay) socialOverlay.hidden = false;
    return;
  }
  if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','enter','shift','space'].includes(k)) e.preventDefault();
  if (k === 'e' || k === 'enter') tryInteract(); else keys.add(k);
});
document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
document.querySelectorAll('[data-move]').forEach(btn => {
  btn.addEventListener('pointerdown', e => { e.preventDefault(); if(window.choigiOnlineReady!==true){if(socialOverlay)socialOverlay.hidden=false;return;} keys.add(({up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'})[btn.dataset.move]); });
  for (const end of ['pointerup','pointerleave','pointercancel']) btn.addEventListener(end, () => keys.delete(({up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'})[btn.dataset.move]));
});

const clock = new THREE.Clock();
let lastPositionPublish=0;
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  let dx = 0, dz = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dz -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dz += 1;
  const inputActive=dx!==0||dz!==0;
  // In the cinema, WASD is relative to the camera: W advances, S reverses,
  // and A/D strafe without changing the camera angle.
  if(['cinema','race'].includes(activeRoom)&&inputActive){const strafe=dx,forward=-dz,c=Math.cos(cinemaCameraYaw),s=Math.sin(cinemaCameraYaw);dx=strafe*c-forward*s;dz=-strafe*s-forward*c;}
  const canMove=window.choigiOnlineReady===true&&!modal.classList.contains('open')&&musicOverlay.hidden&&wardrobePanel.hidden&&(!socialOverlay||socialOverlay.hidden)&&(!socialDrawer||socialDrawer.hidden);
  if(drivingCar){dx=0;dz=0;}
  else if(canMove&&inputActive){
    if(seated)standFromSeat();
    const len = Math.hypot(dx, dz); dx /= len; dz /= len;
  } else { dx=0;dz=0; }
  const maxSpeed=activeRoom==='cinema'?(keys.has('shift')?8.2:4.4):4.4,response=inputActive&&canMove?9.5:12.5,blend=1-Math.exp(-response*dt);
  playerVelocity.x=THREE.MathUtils.lerp(playerVelocity.x,dx*maxSpeed,blend);
  playerVelocity.y=THREE.MathUtils.lerp(playerVelocity.y,dz*maxSpeed,blend);
  if(Math.abs(playerVelocity.x)<0.015)playerVelocity.x=0;
  if(Math.abs(playerVelocity.y)<0.015)playerVelocity.y=0;
  const circleHitsRect=(x,z,minX,maxX,minZ,maxZ)=>{
    const nearX=THREE.MathUtils.clamp(x,minX,maxX),nearZ=THREE.MathUtils.clamp(z,minZ,maxZ);
    return (x-nearX)**2+(z-nearZ)**2<radius**2;
  };
  // Test against the actual wall rectangles, expanded by the avatar radius.
  // The central gap remains open as a doorway; the other two room dividers are solid.
  const hitsDivider=(x,z)=>['lounge','left','right'].includes(activeRoom)&&[-5.8,5.8].some(wall=>
    circleHitsRect(x,z,wall-0.21,wall+0.21,-9,-1.4)||
    circleHitsRect(x,z,wall-0.21,wall+0.21,1.4,9));
  const blocked=(x,z)=>obstacles.some(o=>o.minX!==undefined?circleHitsRect(x,z,o.minX,o.maxX,o.minZ,o.maxZ):Math.hypot(x-o.x,z-o.z)<o.r+radius)||hitsDivider(x,z);
  const xMin=activeRoom==='bar'?30.1:['cinema','race'].includes(activeRoom)?35:-14,xMax=activeRoom==='bar'?49.9:['cinema','race'].includes(activeRoom)?165:14;
  const zMin=activeRoom==='cinema'?-15.5:activeRoom==='race'?68:-8,zMax=activeRoom==='cinema'?64.2:activeRoom==='race'?260:8;
  const nextX=THREE.MathUtils.clamp(player.position.x+playerVelocity.x*dt,xMin,xMax);
  const nextZ=THREE.MathUtils.clamp(player.position.z+playerVelocity.y*dt,zMin,zMax);
  if(!blocked(nextX,player.position.z))player.position.x=nextX;else playerVelocity.x=0;
  if(!blocked(player.position.x,nextZ))player.position.z=nextZ;else playerVelocity.y=0;
  if(['lounge','left','right'].includes(activeRoom))switchRoom(player.position.x < -5.8 ? 'left' : player.position.x > 5.8 ? 'right' : 'lounge');
  if(drivingCar&&activeRoom==='race'&&canMove){
    let forward=new THREE.Vector2(-Math.sin(raceCar.rotation.y),-Math.cos(raceCar.rotation.y)),side=new THREE.Vector2(Math.cos(raceCar.rotation.y),-Math.sin(raceCar.rotation.y));const previousLateral=carVelocity.dot(side);
    const throttle=(keys.has('w')||keys.has('arrowup'))?1:0,brake=(keys.has('s')||keys.has('arrowdown'))?1:0,steer=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),handbrake=keys.has('space');
    if(throttle)vehicleSpeed+= (vehicleSpeed<0?34:22)*dt;
    if(brake)vehicleSpeed+= (vehicleSpeed>0?-34: -13)*dt;
    const offRoad=Math.hypot(raceCar.position.x/ovalA,(raceCar.position.z-ovalCenterZ)/ovalB),nearApproach=raceCar.position.z>64&&raceCar.position.z<149&&Math.abs(raceCar.position.x)<10,onRoad=nearApproach||(Math.abs(offRoad-1)*Math.min(ovalA,ovalB)<roadHalf+4);
    if(!throttle&&!brake)vehicleSpeed*=Math.max(0,1-(onRoad?1.25:3.5)*dt);
    if(handbrake)vehicleSpeed*=Math.max(0,1-1.9*dt);
    const maxVehicleSpeed=(keys.has('shift')?53:42)*(onRoad?1:.37);vehicleSpeed=THREE.MathUtils.clamp(vehicleSpeed,-12,maxVehicleSpeed);
    if(Math.abs(vehicleSpeed)<.08)vehicleSpeed=0;
    if(Math.abs(vehicleSpeed)>.35)raceCar.rotation.y+=steer*dt*(.24+Math.min(1.1,Math.abs(vehicleSpeed)*.018))*Math.sign(vehicleSpeed)*(handbrake?1.35:1);
    forward.set(-Math.sin(raceCar.rotation.y),-Math.cos(raceCar.rotation.y));side.set(Math.cos(raceCar.rotation.y),-Math.sin(raceCar.rotation.y));const grip=handbrake?.55:(onRoad?5.5:1.3),lateral=previousLateral*Math.exp(-grip*dt);carVelocity.copy(forward).multiplyScalar(vehicleSpeed).addScaledVector(side,lateral);
    raceCar.position.x=THREE.MathUtils.clamp(raceCar.position.x+carVelocity.x*dt,-92,92);raceCar.position.z=THREE.MathUtils.clamp(raceCar.position.z+carVelocity.y*dt,64,270);
    raceCar.position.y=-.14+Math.min(.075,Math.abs(lateral)*.004);for(const wheel of raceCar.userData.wheels){wheel.rotation.x+=vehicleSpeed*dt/.48;if(wheel.position.z<0)wheel.rotation.y=steer*.3;}
    speedHud.querySelector('b').textContent=String(Math.round(Math.abs(vehicleSpeed)*3.6));
  }
  const speed=Math.hypot(playerVelocity.x,playerVelocity.y),moving=speed>0.22;
  if(moving){const wanted=Math.atan2(playerVelocity.x,playerVelocity.y),turn=Math.atan2(Math.sin(wanted-player.rotation.y),Math.cos(wanted-player.rotation.y));player.rotation.y+=turn*(1-Math.exp(-13*dt));}
  walkPhase+=speed*dt*3.4;
  const thirdPerson=['cinema','race'].includes(activeRoom);
  if(thirdPerson){
    const focus=drivingCar?raceCar.getWorldPosition(new THREE.Vector3()):player.position;
    const followDistance=drivingCar?20:16,lookAhead=drivingCar?9:6.5,horizontal=followDistance*Math.cos(cinemaCameraPitch),forwardX=drivingCar?-Math.sin(raceCar.rotation.y)-Math.sin(cinemaCameraYaw)*.48:-Math.sin(cinemaCameraYaw),forwardZ=drivingCar?-Math.cos(raceCar.rotation.y)-Math.cos(cinemaCameraYaw)*.48:-Math.cos(cinemaCameraYaw);
    cameraGoal.set(focus.x-forwardX*horizontal,focus.y+followDistance*Math.sin(cinemaCameraPitch),focus.z-forwardZ*horizontal);
    lookGoal.set(focus.x+forwardX*lookAhead,focus.y+(drivingCar?1.2:2.0),focus.z+forwardZ*lookAhead);
  }else{
    cameraGoal.set(player.position.x,player.position.y+14.2,player.position.z+22.55);
    lookGoal.set(player.position.x,player.position.y+2.1,player.position.z-3.45);
  }
  const cameraBlend=1-Math.exp(-4.2*dt);
  camera.position.lerp(cameraGoal,cameraBlend);cameraLook.lerp(lookGoal,cameraBlend);camera.lookAt(cameraLook);
  if(renderer.domElement.style.cursor!=='grabbing')renderer.domElement.style.cursor=['cinema','race'].includes(activeRoom)?'grab':'default';
  const t = clock.elapsedTime;
  const isOutdoors=['cinema','race'].includes(activeRoom);scene.background.set(isOutdoors?'#061126':'#252033');
  scene.fog.color.set(isOutdoors?'#061126':'#252033');
  scene.fog.near=isOutdoors?80:25;scene.fog.far=isOutdoors?155:45;
  roomHemisphere.intensity=isOutdoors?.42:2.0;
  keyLight.intensity=isOutdoors?.2:3.3;
  cinemaMoonLight.intensity=.65+.12*Math.sin(t*.42);
  cinemaMoon.material.emissiveIntensity=.32+.05*Math.sin(t*.42);
  for(const item of animatedDecor){if(item.type==='leaf')item.mesh.rotation.z=item.base+Math.sin(t*1.1+item.phase)*0.075;else if(item.type==='record')item.mesh.rotation.z=t*1.7;else if(item.type==='neon')item.mesh.material.emissiveIntensity=0.75+Math.sin(t*2+item.phase)*0.35;else if(item.type==='pulseLight')item.light.intensity=0.28+Math.max(0,Math.sin(t*2+item.phase))*0.55;else if(item.type==='portal'){item.mesh.rotation.z=t*0.16;item.mesh.scale.setScalar(1+Math.sin(t*2.2+item.phase)*0.055);}else if(item.type==='barBeam')item.light.intensity=0.7+Math.max(0,Math.sin(t*2+item.phase))*1.8;else if(item.type==='cinemaSpot')item.light.intensity=1.35+Math.max(0,Math.sin(t*1.3+item.phase))*1.1;else if(item.type==='campfire'){item.mesh.scale.y=.78+.16*Math.sin(t*8+item.phase);item.secondary.rotation.y=t*1.7;item.light.intensity=1.6+Math.random()*.65;}}
  for(const mote of cinemaFireflies){const a=t*mote.speed+mote.phase;mote.mesh.position.set(Math.cos(a)*mote.rx,mote.baseY+Math.sin(t*.62+mote.phase)*.16,Math.sin(a*.72)*mote.rz);mote.mesh.scale.setScalar(.82+Math.max(0,Math.sin(t*1.8+mote.phase))*.55);}
  for(const pine of swayingPines)pine.tree.rotation.z=Math.sin(t*.55+pine.phase)*.014;
  for(const mote of fireflies){const a=t*mote.speed+mote.phase;mote.mesh.position.set(Math.cos(a)*mote.radiusX,mote.baseY+Math.sin(t*1.3+mote.phase)*0.34,Math.sin(a*0.82)*mote.radiusZ);mote.mesh.rotation.x=a;mote.mesh.rotation.y=a*0.7;}
  fan.rotation.y=t*0.48;
  screenLight.intensity=0.9+Math.sin(t*1.4)*0.22;
  orb.position.y=1.05+Math.sin(t*1.6)*0.17;
  player.position.y = seated ? .43 : moving ? Math.abs(Math.sin(walkPhase*2)) * Math.min(0.055,speed*0.012) : Math.sin(t * 1.6) * 0.014;
  legs.forEach((leg, i) => { leg.rotation.x = moving ? Math.sin(walkPhase + i * Math.PI) * 0.38 : THREE.MathUtils.damp(leg.rotation.x,0,9,dt); });
  arms.forEach(({arm,side}) => { arm.rotation.x = moving ? Math.sin(walkPhase + (side > 0 ? Math.PI : 0)) * 0.3 : THREE.MathUtils.damp(arm.rotation.x,0,8,dt); });
  for(const avatar of remotePlayers.values()){
    const otherCar=avatar.userData.remoteCar;if(otherCar?.visible){otherCar.position.lerp(otherCar.userData.target,1-Math.exp(-5.5*dt));const turn=Math.atan2(Math.sin(otherCar.userData.targetYaw-otherCar.rotation.y),Math.cos(otherCar.userData.targetYaw-otherCar.rotation.y));otherCar.rotation.y+=turn*(1-Math.exp(-6*dt));for(const wheel of otherCar.userData.wheels)wheel.rotation.x+=Number(otherCar.userData.speed||0)*dt/.48;}
    const distance=avatar.position.distanceTo(avatar.userData.target);
    avatar.position.lerp(avatar.userData.target,1-Math.exp(-8.5*dt));
    const turn=Math.atan2(Math.sin(avatar.userData.targetRotation-avatar.rotation.y),Math.cos(avatar.userData.targetRotation-avatar.rotation.y));avatar.rotation.y+=turn*(1-Math.exp(-9*dt));
    const walking=distance>.025,phase=t*9+avatar.position.x;
    avatar.position.y=walking?Math.abs(Math.sin(phase))*.045:THREE.MathUtils.damp(avatar.position.y,0,8,dt);
    avatar.userData.legs.forEach((leg,index)=>{leg.rotation.x=walking?Math.sin(phase+index*Math.PI)*.34:THREE.MathUtils.damp(leg.rotation.x,0,8,dt);});
    avatar.userData.arms.forEach(({arm,side})=>{arm.rotation.x=walking?Math.sin(phase+(side>0?Math.PI:0))*.26:THREE.MathUtils.damp(arm.rotation.x,0,8,dt);});
  }
  for (const station of stations) {
    const screen = station.children.find(c => c.geometry?.type === 'BoxGeometry' && c.position.y === 1.33 && c.position.z === 0.55);
    if (screen) screen.material.emissiveIntensity = 0.7 + Math.sin(t * 2.2 + station.position.x) * 0.16;
  }
  updateNearby();
  if(performance.now()-lastPositionPublish>100){lastPositionPublish=performance.now();const carWorld=drivingCar?raceCar.getWorldPosition(new THREE.Vector3()):null;window.dispatchEvent(new CustomEvent('choigi-player-position',{detail:{x:carWorld?.x??player.position.x,z:carWorld?.z??player.position.z,outfit:currentOutfitId,inCar:drivingCar,vehicleX:carWorld?.x??raceCar.getWorldPosition(new THREE.Vector3()).x,vehicleZ:carWorld?.z??raceCar.getWorldPosition(new THREE.Vector3()).z,vehicleYaw:raceCar.rotation.y,speed:vehicleSpeed}}));}
  // Keep the real YouTube iframe aligned with the perspective-projected 3D screen.
  const rect=host.getBoundingClientRect();
  const projectScreen=(screen,w,h,frame,enabled,planeZ=.23,flipY=false)=>{
    const cameraSpace=screen.worldToLocal(camera.position.clone());
    // The DOM video is a front-face overlay on the physical screen. Hiding it
    // from the back prevents a second, mirrored image appearing behind it.
    if(!enabled||cameraSpace.z<=planeZ+.08){frame.style.display='none';return;}
    // CSS perspective mapping expects top-left, top-right, bottom-right,
    // bottom-left. The old order started at bottom-left and flipped the video.
    const worldTop=flipY?-h:h,worldBottom=-worldTop;
    const corners=[new THREE.Vector3(-w,worldTop,planeZ),new THREE.Vector3(w,worldTop,planeZ),new THREE.Vector3(w,worldBottom,planeZ),new THREE.Vector3(-w,worldBottom,planeZ)].map(v=>screen.localToWorld(v).project(camera));
    const px=corners.map(v=>({x:(v.x+1)*rect.width/2,y:(1-v.y)*rect.height/2})),[p1,p2,p3,p4]=px;
    const left=Math.min(...px.map(p=>p.x)),top=Math.min(...px.map(p=>p.y)),right=Math.max(...px.map(p=>p.x)),bottom=Math.max(...px.map(p=>p.y));
    const width=1000,height=width*h/w,dx1=p2.x-p3.x,dx2=p4.x-p3.x,dx3=p1.x-p2.x+p3.x-p4.x,dy1=p2.y-p3.y,dy2=p4.y-p3.y,dy3=p1.y-p2.y+p3.y-p4.y,den=dx1*dy2-dx2*dy1;
    let g=0,k=0;if(Math.abs(dx3)+Math.abs(dy3)>.001&&Math.abs(den)>.001){g=(dx3*dy2-dx2*dy3)/den;k=(dx1*dy3-dx3*dy1)/den;}
    const a=p2.x-p1.x+g*p2.x,b=p4.x-p1.x+k*p4.x,c=p1.x,d=p2.y-p1.y+g*p2.y,e=p4.y-p1.y+k*p4.y,f=p1.y;
    frame.style.left='0px';frame.style.top='0px';frame.style.width=`${width}px`;frame.style.height=`${height}px`;frame.style.transformOrigin='0 0';
    frame.style.transform=`matrix3d(${a/width},${d/width},0,${g/width},${b/height},${e/height},0,${k/height},0,0,1,0,${c},${f},0,1)`;
    const tooClose=cameraSpace.z<planeZ+1.25;
    frame.style.display=!tooClose&&bottom>0&&top<rect.height&&right>0&&left<rect.width?'block':'none';frame.style.visibility='visible';
  };
  const inBar=activeRoom==='bar';
  projectScreen(videoScreenGroup,5.375,2.74,projectionFrame,activeRoom==='lounge');
  const cinemaCameraLocal=cinemaScreenGroup.worldToLocal(camera.position.clone());
  cinemaScreenGroup.visible=activeRoom==='cinema'&&cinemaCameraLocal.z>.08;
  // Do not render the detached HTML placeholder over the physical 3D screen.
  // The video overlay is only needed while a shared video is actually playing.
  projectScreen(cinemaScreenGroup,10.5,5.91,projectionFrame,activeRoom==='cinema'&&cinemaScreenGroup.visible&&sharedVideoActive,.4,true);
  projectScreen(barScreenGroup,4.775,2.51,barProjectionFrame,inBar);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
