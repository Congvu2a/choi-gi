import * as THREE from 'three';

const host = document.querySelector('#roomScene');
const message = document.querySelector('#roomMessage');
const interact = document.querySelector('#interactBtn');
const modal = document.querySelector('#gameModal');
const musicOverlay = document.querySelector('#musicOverlay');
const socialOverlay = document.querySelector('#socialOverlay');
const socialDrawer = document.querySelector('#socialDrawer');
let cinemaScreenGroup, cinemaVideoSurface;
if (!host) throw new Error('Không tìm thấy khu vực phòng game.');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#252033');
scene.fog = new THREE.Fog('#252033', 25, 45);
const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
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
host.addEventListener('pointerdown',e=>{if(activeRoom!=='cinema'||e.button!==0)return;cameraDragging=true;lastPointerX=e.clientX;lastPointerY=e.clientY;host.setPointerCapture?.(e.pointerId);renderer.domElement.style.cursor='grabbing';e.preventDefault();},true);
host.addEventListener('pointermove',e=>{if(!cameraDragging)return;const dx=e.clientX-lastPointerX,dy=e.clientY-lastPointerY;lastPointerX=e.clientX;lastPointerY=e.clientY;cinemaCameraYaw-=dx*.005;cinemaCameraPitch=THREE.MathUtils.clamp(cinemaCameraPitch+dy*.003,.18,.95);},true);
const stopCameraDrag=e=>{if(!cameraDragging)return;cameraDragging=false;renderer.domElement.style.cursor=activeRoom==='cinema'?'grab':'default';if(e?.pointerId!==undefined&&host.hasPointerCapture?.(e.pointerId))host.releasePointerCapture(e.pointerId);};
host.addEventListener('pointerup',stopCameraDrag,true);host.addEventListener('pointercancel',stopCameraDrag,true);host.addEventListener('lostpointercapture',()=>{cameraDragging=false;});

scene.add(new THREE.HemisphereLight('#d5ddff', '#5a3b53', 2.0));
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
window.addEventListener('choigi-video-active', e => {const active=e.detail?.active,room=e.detail?.room;const isBar=room==='bar';if(isBar){if(typeof barProjectionHint!=='undefined')barProjectionHint.hidden=Boolean(active);if(typeof barVideoSurface!=='undefined')barVideoSurface.material.color.set(active?'#090a12':'#301338');}else{projectionHint.hidden=Boolean(active);videoScreenSurface.material.color.set(active?'#090a12':'#12101b');if(cinemaVideoSurface)cinemaVideoSurface.material.color.set(active?'#090a12':'#10131c');}});

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
sofa.userData.gameId='seat';sofa.userData.name='SOFA';sofa.userData.seatTarget={x:3.25,z:-6.4};sofa.userData.seatHeight=.70;sofa.userData.seatRotation=0;
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
makeLobbyPortal(-2.35,6.85,'RẠP NGOÀI TRỜI','#a9eaff','cinema',{x:80,z:11});
makeLobbyPortal(2.35,6.85,'CỔNG · QUÁN BAR','#ff91cf','bar',{x:40,z:3.45});

// Lakeside open-air cinema: stepped timber deck, café tables, forest, shoreline and a truss-mounted screen.
const cinemaRoot=new THREE.Group();cinemaRoot.name='rap-chieu-ngoai-troi';cinemaRoot.position.set(80,0,0);scene.add(cinemaRoot);
const cinemaSkyPositions=[];let skySeed=81427;const skyRand=()=>{skySeed=(skySeed*16807)%2147483647;return (skySeed-1)/2147483646;};
for(let i=0;i<360;i++){const x=(skyRand()-.5)*82,y=7+skyRand()*24;cinemaSkyPositions.push(x,y,-27+skyRand()*2);}
const cinemaSkyGeometry=new THREE.BufferGeometry();cinemaSkyGeometry.setAttribute('position',new THREE.Float32BufferAttribute(cinemaSkyPositions,3));
const cinemaStars=new THREE.Points(cinemaSkyGeometry,new THREE.PointsMaterial({color:'#dceaff',size:.12,transparent:true,opacity:.88,sizeAttenuation:true}));cinemaRoot.add(cinemaStars);
const moon=new THREE.Mesh(new THREE.SphereGeometry(2.15,24,18),mat('#fff0c9',.35,{emissive:'#ffe9ad',emissiveIntensity:.32}));moon.position.set(-20,17,-25);cinemaRoot.add(moon);
const moonGlow=new THREE.PointLight('#c9d8ff',.55,42);moonGlow.position.set(-20,15,-22);cinemaRoot.add(moonGlow);
// Still water starts just beyond the deck; shoreline stones catch the warm deck lights.
const water=new THREE.Mesh(new THREE.PlaneGeometry(180,120),new THREE.MeshStandardMaterial({color:'#123b3c',roughness:.28,metalness:.12,emissive:'#092425',emissiveIntensity:.22}));water.rotation.x=-Math.PI/2;water.position.set(0,-.52,72);cinemaRoot.add(water);
box(cinemaRoot,36,.42,30,mat('#493741',.82),0,-.24,-.5);
for(let z=-15;z<=13.8;z+=.72)box(cinemaRoot,35.6,.018,.025,mat(Math.round(z*10)%2?'#725149':'#654941',.82),0,-.012,z,false);
for(const [x,z,w,d] of [[0,-15.35,36,.22],[0,14.35,36,.22],[-17.72,-.5,.22,29.7],[17.72,-.5,.22,29.7]])box(cinemaRoot,w,.2,d,mat('#b88763',.48,{emissive:'#4e2d25',emissiveIntensity:.22}),x,.02,z,false);
// Continuous stepped rows create the terraced seating seen in the reference.
const cinemaRows=[{z:-8.4,level:0},{z:-5.2,level:.18},{z:-2,level:.36},{z:1.2,level:.54},{z:4.4,level:.72},{z:7.6,level:.9}];
function cinemaGroundY(z){return Math.max(0,Math.min(.9,Math.floor(Math.max(0,z+9.5)/3.2)*.18));}
for(let row=0;row<cinemaRows.length;row++){
  const {z,level}=cinemaRows[row];
  box(cinemaRoot,35.1,.22,3.12,mat(row%2?'#483339':'#513b3d',.82),0,level-.11,z);
  box(cinemaRoot,34.9,.045,3.02,mat('#77513f',.7),0,level+.012,z,false);
  for(let plank=-16.8;plank<=16.8;plank+=.62)box(cinemaRoot,.025,.018,2.94,mat(plank%2?'#a17153':'#98694d',.78),plank,level+.041,z,false);
  box(cinemaRoot,2.5,.035,2.92,mat('#46515a',.9),0,level+.067,z,false);
  for(const aisleX of [-1.28,1.28])box(cinemaRoot,.045,.035,2.92,mat('#ffc477',.25,{emissive:'#ffad57',emissiveIntensity:.85}),aisleX,level+.09,z,false);
  box(cinemaRoot,34.7,.055,.07,mat('#ffc477',.24,{emissive:'#ffae50',emissiveIntensity:.7}),0,level+.06,z+1.53,false);
}
// Raised, plank-finished landing links the last terrace to the lobby gate.
box(cinemaRoot,35.1,.22,5.1,mat('#513b3d',.82),0,.79,11.85);
for(let z=9.48;z<=14.2;z+=.72)box(cinemaRoot,34.9,.018,.025,mat(Math.round(z*10)%2?'#a17153':'#98694d',.78),0,.921,z,false);
box(cinemaRoot,34.7,.055,.07,mat('#ffc477',.24,{emissive:'#ffae50',emissiveIntensity:.7}),0,.9,9.3,false);
// Carpeted center aisle and narrow side paths run from the water-facing entry to the screen.
box(cinemaRoot,2.6,.035,26,mat('#38404a',.92),0,.04,-.5,false);
for(const x of [-1.26,1.26,-16.65,16.65])box(cinemaRoot,.045,.035,26,mat('#ffbd70',.28,{emissive:'#ffab53',emissiveIntensity:.8}),x,.07,-.5,false);
// Stage and large outdoor screen, supported by a visible concert-style metal truss.
box(cinemaRoot,23,.48,3.1,mat('#302a34'),0,.08,-13.25);
box(cinemaRoot,22.2,.14,2.8,mat('#876154',.42),0,.39,-13.25,false);
cinemaScreenGroup=new THREE.Group();cinemaScreenGroup.position.set(0,7,-14.55);cinemaRoot.add(cinemaScreenGroup);
roundedPanel(cinemaScreenGroup,17.8,10.2,.52,mat('#151722',.24,{metalness:.35,emissive:'#101522',emissiveIntensity:.42}),0,0,0,.45);
roundedPanel(cinemaScreenGroup,17.15,9.58,.1,mat('#c08491',.3,{metalness:.22,emissive:'#633d59',emissiveIntensity:.65}),0,0,.3,.3);
cinemaVideoSurface=box(cinemaScreenGroup,16.62,9.04,.04,mat('#080c16',.2,{emissive:'#101622',emissiveIntensity:.42}),0,0,.37,false);
const trussMat=mat('#171d27',.55,{metalness:.6});
function cinemaBeam(a,b,width=.075,material=trussMat){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),beam=new THREE.Mesh(new THREE.BoxGeometry(width,delta.length(),width),material);beam.position.copy(start.add(end).multiplyScalar(.5));beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());beam.castShadow=true;cinemaRoot.add(beam);return beam;}
for(const x of [-9.65,9.65]){
  cinemaBeam([x,.1,-14.9],[x,13.3,-14.9],.16);
  for(let y=.4;y<13;y+=1.15){cinemaBeam([x-.3,y,-14.88],[x+.3,y+1.15,-14.88],.045);cinemaBeam([x+.3,y,-14.88],[x-.3,y+1.15,-14.88],.045);}
}
for(let x=-9.6;x<9.6;x+=1.25){cinemaBeam([x,13.3,-14.9],[x+1.25,13.3,-14.9],.12);cinemaBeam([x,.12,-14.9],[x+1.25,.12,-14.9],.09);}
for(const x of [-10.9,10.9]){
  const cabinet=box(cinemaRoot,1.55,5.2,1.35,mat('#171a22',.52,{metalness:.25}),x,2.72,-12.75);
  for(let j=0;j<3;j++){const cone=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.12,24),mat('#090c13',.42,{metalness:.35}));cone.rotation.x=Math.PI/2;cone.position.set(x,1.25+j*1.45,-12.03);cinemaRoot.add(cone);const ring=new THREE.Mesh(new THREE.TorusGeometry(.34,.045,8,24),mat(j===1?'#e6b878':'#8d9099',.25,{metalness:.45,emissive:j===1?'#b57535':'#242936',emissiveIntensity:.35}));ring.position.set(x,1.25+j*1.45,-11.94);cinemaRoot.add(ring);}
  obstacles.push({x:80+x,z:-12.75,r:1.0});
}
for(const [x,color] of [[-7.8,'#8ddfff'],[7.8,'#ff9fc5']]){
  const beam=box(cinemaRoot,.08,5.2,.08,mat(color,.2,{emissive:color,emissiveIntensity:1.15}),x,2.88,-13.48,false);animatedDecor.push({type:'neon',mesh:beam,base:.92,phase:x});
  const spot=new THREE.SpotLight(color,2.6,21,.28,.65,1.25);spot.position.set(x,7.3,-11.8);spot.target.position.set(x*.25,1,-7);cinemaRoot.add(spot,spot.target);animatedDecor.push({type:'cinemaSpot',light:spot,phase:x});
  const ray=new THREE.Mesh(new THREE.ConeGeometry(3.4,13,24,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.045,depthWrite:false,side:THREE.DoubleSide}));ray.position.set(x*.55,5.2,-8.8);ray.rotation.x=Math.PI;cinemaRoot.add(ray);
}
const cinemaSign=addLabel(cinemaRoot,'OPEN AIR · CINEMA','#d9f2a2');cinemaSign.position.set(0,13.85,-14.15);cinemaSign.scale.set(5.1,.78,1);
function makeCinemaChair(x,z,rotation=0,level=0,index=0){
  const chair=new THREE.Group();chair.position.set(x,level,z);chair.rotation.y=rotation;cinemaRoot.add(chair);
  const wood=mat('#252932',.65,{metalness:.2}),fabric=['#517d83','#6b7e62','#87575c','#536783'][index%4];
  const seatBase=box(chair,.94,.13,.83,wood,0,.62,0),seatPad=box(chair,.84,.2,.72,mat(fabric,.82),0,.78,.035);
  box(chair,.92,.13,.16,wood,0,.7,-.35);box(chair,.84,.9,.15,mat(fabric,.82),0,1.31,-.37);
  for(const sx of [-.48,.48]){box(chair,.14,.54,.77,wood,sx,.97,.015);box(chair,.12,.12,.78,mat('#59443a',.6),sx,.78,.02);const cup=new THREE.Mesh(new THREE.CylinderGeometry(.1,.095,.12,12),mat('#c2a16b',.35,{metalness:.35}));cup.position.set(sx*1.04,.86,.18);chair.add(cup);}
  for(const sx of [-.36,.36])for(const sz of [-.29,.29])box(chair,.075,.62,.075,wood,sx,.31,sz);
  seatPad.userData.station=chair;chair.userData.gameId='seat';chair.userData.name='GHẾ RẠP';chair.userData.room='cinema';chair.userData.seatTarget={x:80+x+Math.sin(rotation)*.05,z:z+Math.cos(rotation)*.05};chair.userData.seatHeight=.89+level;chair.userData.seatRotation=rotation;
  stations.push(chair);obstacles.push({x:80+x,z,r:.54});
}
function makeCinemaTable(x,z,index,level){
  const group=new THREE.Group();group.position.set(x,level,z);cinemaRoot.add(group);
  box(group,2.15,.15,1.05,mat(index%2?'#583e34':'#674b39',.46),0,1.06,0);
  box(group,1.98,.055,.9,mat('#9b7050',.52),0,1.16,0,false);
  for(const sx of [-.72,.72])for(const sz of [-.31,.31])box(group,.12,.98,.12,mat('#2b2b31',.56,{metalness:.25}),sx,.53,sz);
  const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,.34,10),mat('#363139',.38,{metalness:.25}));lamp.position.set(0,1.4,0);group.add(lamp);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),mat('#ffe3a4',.2,{emissive:'#ffc45d',emissiveIntensity:1.55}));bulb.position.set(0,1.63,0);group.add(bulb);
  if(index%3===0){const glow=new THREE.PointLight('#ffc47f',.55,4);glow.position.set(0,1.72,0);group.add(glow);animatedDecor.push({type:'pulseLight',light:glow,phase:index*.67});}
  obstacles.push({x:80+x,z,r:.58});makeCinemaChair(x,z+1.02,Math.PI,level,index);makeCinemaChair(x,z-1.02,0,level,index+1);
}
const cinemaTableColumns=[-13.4,-8.1,-2.8,2.8,8.1,13.4];let cinemaTableIndex=0;
for(const row of cinemaRows)for(const x of cinemaTableColumns)makeCinemaTable(x,row.z,cinemaTableIndex++,row.level);
// Waterfront guard rails, low path lights, and faceted shoreline pebbles.
for(const x of [-17.25,17.25]){
  for(let z=-13;z<=11;z+=3.2){box(cinemaRoot,.16,1.08,.16,mat('#252a32',.55,{metalness:.3}),x,.54,z);const cap=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),mat('#ffd88b',.24,{emissive:'#ffbc61',emissiveIntensity:.75}));cap.position.set(x,1.14,z);cinemaRoot.add(cap);}
  box(cinemaRoot,.12,.12,25,mat('#37383e',.52,{metalness:.3}),x,1.02,-1,false);
}
const pebbleMats=['#94d3c1','#dfb98d','#a6b4db','#d594b5','#d4d6ca'];
for(let i=0;i<28;i++){const x=-17+i*1.25,stone=new THREE.Mesh(new THREE.DodecahedronGeometry(.36+(i%4)*.1,0),mat(pebbleMats[i%pebbleMats.length],.86));stone.position.set(x,-.18,14.55+(i%3)*.42);stone.scale.set(1.3,.65,.85);stone.castShadow=true;cinemaRoot.add(stone);}
// A welcoming entry arch is visible when walking back from the deck to the lobby portal.
for(const x of [-4.5,4.5])box(cinemaRoot,.28,4.5,.28,mat('#292933',.52,{metalness:.25}),x,3.15,11.65);
box(cinemaRoot,9.3,.28,.32,mat('#292933',.52,{metalness:.25}),0,5.32,11.65);
const lobbyArch=addLabel(cinemaRoot,'SẢNH · LỐI VÀO','#e7d69d');lobbyArch.position.set(0,5.75,11.45);lobbyArch.scale.set(3.2,.58,1);
// A small campfire lounge occupies the far-right corner of the deck.
const firepit=new THREE.Group();firepit.position.set(12.6,.9,8.7);cinemaRoot.add(firepit);
const fireBase=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.3,.28,12),mat('#343239',.84));fireBase.position.y=.16;firepit.add(fireBase);
for(let i=0;i<4;i++){const log=new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,1.8,8),mat('#594338',.9));log.rotation.z=Math.PI/2;log.rotation.y=i*Math.PI/4;log.position.set(Math.cos(i*Math.PI/2)*.18,.46,Math.sin(i*Math.PI/2)*.18);log.castShadow=true;firepit.add(log);}
const flameA=new THREE.Mesh(new THREE.ConeGeometry(.42,1.25,7),mat('#ff9b42',.25,{emissive:'#ff5b25',emissiveIntensity:1.8}));flameA.position.y=.96;firepit.add(flameA);
const flameB=new THREE.Mesh(new THREE.ConeGeometry(.25,.86,6),mat('#ffe286',.22,{emissive:'#ffb72f',emissiveIntensity:2}));flameB.position.y=1.12;firepit.add(flameB);
const fireLight=new THREE.PointLight('#ff8c42',2.2,9);fireLight.position.y=1.1;firepit.add(fireLight);animatedDecor.push({type:'campfire',mesh:flameA,secondary:flameB,light:fireLight,phase:1.2});obstacles.push({x:92.6,z:8.7,r:1.55});
for(const x of [9.6,15.6]){const logSeat=new THREE.Mesh(new THREE.CylinderGeometry(.34,.38,1.8,9),mat('#725442',.9));logSeat.rotation.z=Math.PI/2;logSeat.position.set(x,1.26,8.7);logSeat.castShadow=true;cinemaRoot.add(logSeat);obstacles.push({x:80+x,z:8.7,r:.7});}// A small garden-bar nook sits outside the center sightline.
const gardenBar=new THREE.Group();gardenBar.position.set(13,0,-10.8);cinemaRoot.add(gardenBar);
box(gardenBar,5.2,1.28,1.2,mat('#392a36'),0,.72,0);box(gardenBar,5.45,.2,1.38,mat('#9a685e',.4,{metalness:.12}),0,1.48,0);
box(gardenBar,5,.09,.1,mat('#ffc477',.22,{emissive:'#ff9a47',emissiveIntensity:1.2}),0,.98,.62,false);
box(gardenBar,4.5,1.35,.13,mat('#24202a'),0,2.08,-.47);
for(let i=0;i<5;i++){const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.55+(i%2)*.2,8),mat(i%2?'#9ddac3':'#e9b783',.27,{emissive:i%2?'#2f9c8b':'#c56b55',emissiveIntensity:.48}));bottle.position.set(-1.65+i*.82,2.75,-.39);gardenBar.add(bottle);}
const gardenBarLabel=addLabel(gardenBar,'GARDEN BAR','#ffd59b');gardenBarLabel.position.set(0,3.25,-.38);gardenBarLabel.scale.set(3.4,.7,1);obstacles.push({x:93,z:-10.8,r:2.85});

const swayingPines=[];
function addPine(x,z,height,scale=1){
  const tree=new THREE.Group();tree.position.set(x,0,z);tree.scale.setScalar(scale);cinemaRoot.add(tree);
  swayingPines.push({tree,phase:x*.8+z*.35});
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.32,height*.38,7),mat('#49353a'));trunk.position.y=height*.19;trunk.castShadow=true;tree.add(trunk);
  for(let tier=0;tier<3;tier++){const cone=new THREE.Mesh(new THREE.ConeGeometry(height*(.3-tier*.055),height*.42,8),mat(tier%2?'#173b3a':'#1c4642',.9));cone.position.y=height*(.4+tier*.22);cone.castShadow=true;tree.add(cone);}
  obstacles.push({x:80+x,z,r:.72*scale});
}
for(const [x,z,h,s] of [[-17,-13,8,1.2],[-17,-5,7,1],[-17,4,9,1.2],[-15,13,7,.9],[17,-13,8,1.2],[17,-5,7,1],[17,4,9,1.2],[15,13,7,.9],[-10,-15,6,.85],[10,-15,6,.85]])addPine(x,z,h,s);
// Layered firs beyond the deck create the deep forest horizon in the reference.
for(let i=0;i<17;i++)addPine(-30+i*3.75,-22,8+(i%4),.9+(i%3)*.16);
for(let i=0;i<7;i++){addPine(-22,-15+i*4.4,7+(i%3),.9+(i%2)*.18);addPine(22,-15+i*4.4,7+((i+1)%3),.9+(i%2)*.18);}
for(const x of [-16,16]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,11,8),mat('#49353a'));pole.position.set(x,5.5,11.2);pole.castShadow=true;cinemaRoot.add(pole);obstacles.push({x:80+x,z:11.2,r:.3});}
const festoonPts=[];for(let i=0;i<=18;i++){const x=-16+i*(32/18);festoonPts.push(new THREE.Vector3(x,10.8-Math.sin(i/18*Math.PI)*.8,11.2));}
cinemaRoot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(festoonPts),new THREE.LineBasicMaterial({color:'#d3b58e',transparent:true,opacity:.68})));
for(let i=0;i<19;i++){
  const x=-16+i*(32/18),y=10.8-Math.sin(i/18*Math.PI)*.8,color=i%3===0?'#ffe0a5':'#d8e6b1';
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(i%3===0?.12:.085,10,8),mat(color,.22,{emissive:i%3===0?'#ffb86b':'#b1df9c',emissiveIntensity:1.15}));bulb.position.set(x,y,11.2);cinemaRoot.add(bulb);
  if(i%3===0){const glow=new THREE.PointLight(i%2===0?'#ffc47f':'#b5e7be',.46,3);glow.position.set(x,y-.12,11.2);cinemaRoot.add(glow);animatedDecor.push({type:'pulseLight',light:glow,phase:i*.48});}
}
const cinemaFireflies=[];for(let i=0;i<22;i++){
  const color=i%3===0?'#ffe19b':i%3===1?'#aee7c1':'#abdfff',mote=new THREE.Mesh(new THREE.OctahedronGeometry(i%5===0?.12:.075,0),mat(color,.2,{emissive:color,emissiveIntensity:1.5}));
  const phase=i*1.37,baseY=1.5+(i%5)*.68,rx=11+(i%4)*1.2,rz=7+(i%3)*1.35;mote.position.set(Math.cos(phase)*rx,baseY,Math.sin(phase)*rz);cinemaRoot.add(mote);cinemaFireflies.push({mesh:mote,phase,baseY,rx,rz,speed:.16+(i%4)*.035});
}
const cinemaExit=new THREE.Group();cinemaExit.position.set(0,.9,12.6);cinemaRoot.add(cinemaExit);
const cinemaExitRing=new THREE.Mesh(new THREE.TorusGeometry(.72,.1,10,32),mat('#b9f1ff',.2,{emissive:'#86dcff',emissiveIntensity:1.2}));cinemaExitRing.position.y=1.15;cinemaExit.add(cinemaExitRing);
const cinemaExitBase=box(cinemaExit,1.8,.14,.65,mat('#302d3c'),0,.1,0);cinemaExitBase.userData.station=cinemaExit;
const cinemaExitLabel=addLabel(cinemaExit,'VỀ SẢNH','#b9f1ff');cinemaExitLabel.position.set(0,2.25,0);
cinemaExit.userData.gameId='door';cinemaExit.userData.name='CỔNG VỀ SẢNH';cinemaExit.userData.room='cinema';cinemaExit.userData.targetRoom='lounge';cinemaExit.userData.targetPosition={x:-2.35,z:3.6};cinemaExitRing.userData.station=cinemaExit;stations.push(cinemaExit);animatedDecor.push({type:'portal',mesh:cinemaExitRing,phase:1.4});

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
  stool.userData.gameId='seat';stool.userData.name='GHẾ QUẦY BAR';stool.userData.room='bar';stool.userData.seatTarget={x,z:1.8};stool.userData.seatHeight=1.08;stool.userData.seatRotation=0;stool.children[0].userData.station=stool;stations.push(stool);obstacles.push({x,z:1.8,r:0.58});
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
  chair.userData.gameId='seat'; chair.userData.name='GHẾ NGỒI'; chair.userData.room='lounge'; chair.userData.seatTarget={x:x+Math.sin(rotation)*.05,z:z+Math.cos(rotation)*.05};chair.userData.seatHeight=.81;chair.userData.seatRotation=rotation;
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
const hoodie = new THREE.Mesh(new THREE.SphereGeometry(0.43, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), mat('#c5a4ff'));
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

// Other signed-in visitors use the same full low-poly avatar silhouette as the local player.
const remotePlayers=new Map();
function createRemoteAvatar(uid,data){
  const avatar=new THREE.Group();avatar.userData.arms=[];avatar.userData.legs=[];
  const palette=['#57b7cf','#e58aae','#78c98a','#e4a55c','#9a83e8','#71a7e8'];
  const hash=[...String(uid)].reduce((sum,char)=>sum+char.charCodeAt(0),0);
  const shirtMat=mat(palette[hash%palette.length],0.58),skin=mat('#ffd0ae',0.7),hairMatRemote=mat('#49304f',0.82);
  const shirt=new THREE.Mesh(new THREE.CapsuleGeometry(0.36,0.5,4,8),shirtMat);shirt.position.y=1.05;shirt.castShadow=true;avatar.add(shirt);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.36,14,12),skin);head.position.y=1.82;head.castShadow=true;avatar.add(head);
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(0.375,14,9,0,Math.PI*2,0,Math.PI*.53),hairMatRemote);hairCap.position.y=1.94;hairCap.castShadow=true;avatar.add(hairCap);
  for(const side of [-1,1]){
    const ear=new THREE.Mesh(new THREE.SphereGeometry(0.095,9,8),skin);ear.position.set(side*.35,1.78,.015);avatar.add(ear);
    const arm=new THREE.Group();arm.position.set(side*.3,1.37,.025);avatar.add(arm);
    const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.125,.27,4,8),shirtMat);sleeve.position.set(side*.08,-.18,0);sleeve.rotation.z=-side*.16;sleeve.castShadow=true;arm.add(sleeve);
    const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.07,9),mat('#d9c4ff'));cuff.position.set(side*.12,-.35,.02);cuff.rotation.z=-side*.16;arm.add(cuff);
    const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.078,.17,3,7),skin);forearm.position.set(side*.15,-.47,.03);forearm.rotation.z=-side*.16;forearm.castShadow=true;arm.add(forearm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.095,10,8),skin);hand.position.set(side*.17,-.62,.065);hand.scale.set(1,.82,.75);hand.castShadow=true;arm.add(hand);
    avatar.userData.arms.push({arm,side});
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.26,3,7),mat('#e5b5cf'));leg.position.set(side*.16,.41,0);leg.castShadow=true;avatar.add(leg);avatar.userData.legs.push(leg);
    const shoe=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),mat('#f2d8a1'));shoe.position.set(side*.16,.15,.1);shoe.scale.set(1.15,.62,1.4);shoe.castShadow=true;avatar.add(shoe);
  }
  const nameTag=addLabel(avatar,String(data.displayName||data.username||'Bạn').slice(0,16),'#d6ff72');nameTag.position.y=2.48;nameTag.scale.set(2.5,.62,1);
  avatar.userData.target=new THREE.Vector3(Number(data.x)||0,Number(data.y)||0,Number(data.z)||0);avatar.userData.targetRotation=Number(data.rotation)||0;avatar.userData.seated=Boolean(data.seated);
  avatar.scale.y=avatar.userData.seated ? .76 : 1;
  scene.add(avatar);avatar.position.copy(avatar.userData.target);
  return avatar;
}
window.addEventListener('choigi-online-players',event=>{
  const players=event.detail?.players||{},known=new Set();
  for(const [uid,data] of Object.entries(players)){
    if(uid===window.choigiOnlineUserId)continue;
    known.add(uid);let avatar=remotePlayers.get(uid);
    if(!avatar){avatar=createRemoteAvatar(uid,data);remotePlayers.set(uid,avatar);}
    const nextX=Number(data.x)||0,nextY=Number(data.y)||0,nextZ=Number(data.z)||0,moveX=nextX-avatar.userData.target.x,moveZ=nextZ-avatar.userData.target.z;
    if(Math.hypot(moveX,moveZ)>.035)avatar.userData.targetRotation=Math.atan2(moveX,moveZ);
    if(data.seated)avatar.userData.targetRotation=Number(data.rotation)||0;
    avatar.userData.seated=Boolean(data.seated);avatar.userData.target.set(nextX,nextY,nextZ);
  }
  for(const [uid,avatar] of remotePlayers)if(!known.has(uid)){scene.remove(avatar);remotePlayers.delete(uid);}
});
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const keys = new Set();
let nearest = null;
const radius=0.34;
let seated=false;
const playerVelocity=new THREE.Vector2();
let walkPhase=0;
function switchRoom(room){
  const next=['lounge','left','right','bar','cinema'].includes(room)?room:'lounge';
  if(next===activeRoom)return;
  activeRoom=next;
  if(activeRoom==='cinema')player.position.y=cinemaGroundY(player.position.z);
  const shell=document.querySelector('.room-shell');shell?.classList.remove('bar-mode','left-mode','cinema-mode');
  if(activeRoom==='cinema')shell?.classList.add('cinema-mode');
  projectionFrame.classList.toggle('room-projection-cinema',activeRoom==='cinema');
  seated=false;player.scale.y=1;player.position.y=0;player.userData.seatBaseY=0;legs.forEach(leg=>leg.rotation.x=0);
  const copy={lounge:['SẢNH CHILL','Sảnh trò chuyện <span>✳</span>','Ngồi thư giãn, trò chuyện và cùng xem video.'],left:['PHÒNG GAME · TRÁI','Phòng game <span>TRÁI</span>','Chọn một máy chơi rồi nhấn E để bắt đầu.'],right:['PHÒNG GAME · PHẢI','Phòng game <span>PHẢI</span>','Chọn một máy chơi rồi nhấn E để bắt đầu.'],bar:['NIGHT OWL · BAR','Quán bar <span>✦</span>','Nghe nhạc, xem video và ngồi ở quầy bar.'],cinema:['RẠP TRỜI · CHIẾU PHIM','Rạp ngoài trời <span>✦</span>','Chọn ghế, ngồi cùng bạn bè và xem chung trên màn chiếu lớn.']}[activeRoom];
  document.querySelector('#roomEyebrow').textContent=copy[0];document.querySelector('#roomHeading').innerHTML=copy[1];document.querySelector('#roomIntro').textContent=copy[2];
  document.querySelector('.room-footnote').innerHTML=activeRoom==='lounge'?'<span>✦</span> Hai cửa bên nối tới phòng game. Hai cổng ở phía trước dẫn tới rạp ngoài trời và quán bar.':activeRoom==='bar'?'<span>✦</span> Đi tới quầy hoặc ghế để tương tác. Cổng xanh đưa bạn về sảnh.':activeRoom==='cinema'?'<span>✦</span> WASD để đi theo hướng camera · Kéo chuột để xoay góc nhìn. Tới ghế nhấn <b>E</b> để ngồi; video chiếu chung từ jukebox sảnh.':'<span>✦</span> Đi lại gần máy chơi rồi nhấn E. Qua cửa để trở lại sảnh.';
  projectionHint.innerHTML=activeRoom==='cinema'?'<span>▶</span><b>RẠP NGOÀI TRỜI</b><small>Video chung đang được chiếu từ jukebox sảnh</small>':'<span>▶</span><b>CHILL SCREEN</b><small>Thêm nhạc trong jukebox để chiếu video tại đây</small>';
  window.dispatchEvent(new CustomEvent('choigi-room-changed',{detail:{room:activeRoom}}));updateNearby();
}
function standFromSeat(){
  if(!seated)return;
  const angle=player.rotation.y,origin=player.userData.seatTarget||{x:player.position.x,z:player.position.z};
  const isBlocked=(x,z)=>obstacles.some(o=>o.minX!==undefined?x+0.34>o.minX&&x-0.34<o.maxX&&z+0.34>o.minZ&&z-0.34<o.maxZ:Math.hypot(x-o.x,z-o.z)<o.r+0.34);
  let exit={x:origin.x+Math.sin(angle)*1.2,z:origin.z+Math.cos(angle)*1.2};
  for(let distance=.85;distance<=4.1;distance+=.25){const candidate={x:origin.x+Math.sin(angle)*distance,z:origin.z+Math.cos(angle)*distance};if(!isBlocked(candidate.x,candidate.z)){exit=candidate;break;}}
  player.position.set(exit.x,0,exit.z);player.userData.seatBaseY=0;player.scale.y=1;seated=false;player.userData.seatTarget=null;legs.forEach(leg=>leg.rotation.x=0);
}function openStation(station) {
  if (window.choigiOnlineReady !== true) {
    if (socialOverlay) socialOverlay.hidden = false;
    return;
  }
  if(!station||station.userData.room!==activeRoom)return;
  if(station.userData.gameId==='jukebox'){
    if(typeof window.openMusicPanel==='function')window.openMusicPanel(activeRoom);
    else window.showToast('Máy phát nhạc chưa tải xong. Hãy tải lại trang một lần nhé.');
  }
  else if(station.userData.gameId==='door'){
    player.position.set(station.userData.targetPosition.x,0,station.userData.targetPosition.z);
    if(station.userData.targetRoom==='cinema')player.rotation.y=Math.PI;
    playerVelocity.set(0,0);keys.clear();seated=false;player.scale.y=1;
    switchRoom(station.userData.targetRoom);
  }
  else if(station.userData.gameId==='seat'){
    playerVelocity.set(0,0);keys.clear();
    if(seated)standFromSeat();
    else {seated=true;player.position.set(station.userData.seatTarget.x,Math.max(0,(station.userData.seatHeight||.82)-.045),station.userData.seatTarget.z);player.userData.seatBaseY=player.position.y;player.userData.seatTarget={...station.userData.seatTarget};player.rotation.y=station.userData.seatRotation??station.rotation.y??0;player.scale.y=.76;legs.forEach(leg=>leg.rotation.x=-1.08);}
    updateNearby();
  } else window.openGame(station.userData.gameId);
}
function updateNearby() {
  let closest = null, distance = Infinity;
  for (const station of stations.filter(item=>item.userData.room===activeRoom)) {
    const stationPosition=station.getWorldPosition(new THREE.Vector3());
    const d = Math.hypot(player.position.x - stationPosition.x, player.position.z - stationPosition.z);
    if (d < distance) { closest = station; distance = d; }
  }
  nearest = distance < 4 ? closest : null;
  if (nearest) {
    const music = nearest.userData.gameId === 'jukebox', seat=nearest.userData.gameId==='seat',door=nearest.userData.gameId==='door';
    const doorName=nearest.userData.targetRoom==='bar'?'quán bar':nearest.userData.targetRoom==='cinema'?'rạp ngoài trời':'sảnh';
    message.textContent = door ? `Nhấn E để tới ${doorName}.` : seat ? (seated?'Bạn đang ngồi thư giãn. Nhấn E để đứng dậy.':`Bạn đang gần ${nearest.userData.name}. Nhấn E để ngồi.`) : music ? (activeRoom==='bar'?'Jukebox này chỉ phát riêng trong quán bar. Nhấn E để chọn nhạc!':'Jukebox phát chung cho phòng game và rạp ngoài trời. Nhấn E để chọn nhạc!') : `Bạn đang ở máy ${nearest.userData.name}. Nhấn E để chơi!`;
    interact.lastChild.textContent = door ? ` Đi tới ${doorName}` : seat ? (seated?' Đứng dậy':' Ngồi xuống') : music ? ' Mở máy phát chung' : ` Chơi ${nearest.userData.name}`;
    interact.classList.add('can-interact');
  } else {
    message.textContent = activeRoom==='lounge'?'Đi tới jukebox, ghế sofa hoặc bàn ghế để tương tác.':activeRoom==='bar'?'Đi tới jukebox riêng của bar hoặc ghế để tương tác.':activeRoom==='cinema'?'Đi tới một chiếc ghế để ngồi xem phim cùng mọi người.':'Đi lại gần một máy game để bắt đầu chơi.';
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
renderer.domElement.addEventListener('pointermove', e => { if(cameraDragging)return; renderer.domElement.style.cursor = activeRoom==='cinema'?'grab':pointerPosition(e) ? 'pointer' : 'default'; });
renderer.domElement.addEventListener('click', e => { const station = pointerPosition(e); if (station) openStation(station); });

function tryInteract() {
  if (window.choigiOnlineReady !== true) {
    if (socialOverlay) socialOverlay.hidden = false;
    return;
  }
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
  if (modal.classList.contains('open') || !musicOverlay.hidden || (socialOverlay && !socialOverlay.hidden) || (socialDrawer && !socialDrawer.hidden)) return;
  const k = e.key.toLowerCase();
  if (window.choigiOnlineReady !== true && ['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','enter'].includes(k)) {
    e.preventDefault();
    if (socialOverlay) socialOverlay.hidden = false;
    return;
  }
  if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','enter'].includes(k)) e.preventDefault();
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
  if(activeRoom==='cinema'&&inputActive){const strafe=dx,forward=-dz,c=Math.cos(cinemaCameraYaw),s=Math.sin(cinemaCameraYaw);dx=strafe*c-forward*s;dz=-strafe*s-forward*c;}
  const canMove=window.choigiOnlineReady===true&&!modal.classList.contains('open')&&musicOverlay.hidden&&(!socialOverlay||socialOverlay.hidden)&&(!socialDrawer||socialDrawer.hidden);
  if(canMove&&inputActive){
    if(seated)standFromSeat();
    const len = Math.hypot(dx, dz); dx /= len; dz /= len;
  } else { dx=0;dz=0; }
  const maxSpeed=4.4,response=inputActive&&canMove?9.5:12.5,blend=1-Math.exp(-response*dt);
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
  const xMin=activeRoom==='bar'?30.1:activeRoom==='cinema'?62:-14,xMax=activeRoom==='bar'?49.9:activeRoom==='cinema'?98:14;
  const zMin=activeRoom==='cinema'?-15.2:-8,zMax=activeRoom==='cinema'?14.4:8;
  const nextX=THREE.MathUtils.clamp(player.position.x+playerVelocity.x*dt,xMin,xMax);
  const nextZ=THREE.MathUtils.clamp(player.position.z+playerVelocity.y*dt,zMin,zMax);
  if(!blocked(nextX,player.position.z))player.position.x=nextX;else playerVelocity.x=0;
  if(!blocked(player.position.x,nextZ))player.position.z=nextZ;else playerVelocity.y=0;
  if(['lounge','left','right'].includes(activeRoom))switchRoom(player.position.x < -5.8 ? 'left' : player.position.x > 5.8 ? 'right' : 'lounge');
  const speed=Math.hypot(playerVelocity.x,playerVelocity.y),moving=speed>0.22;
  if(moving){const wanted=Math.atan2(playerVelocity.x,playerVelocity.y),turn=Math.atan2(Math.sin(wanted-player.rotation.y),Math.cos(wanted-player.rotation.y));player.rotation.y+=turn*(1-Math.exp(-13*dt));}
  walkPhase+=speed*dt*3.4;
  const thirdPerson=activeRoom==='cinema';
  if(thirdPerson){
    const followDistance=12.8,lookAhead=4.5,horizontal=followDistance*Math.cos(cinemaCameraPitch),forwardX=-Math.sin(cinemaCameraYaw),forwardZ=-Math.cos(cinemaCameraYaw);
    cameraGoal.set(player.position.x-forwardX*horizontal,player.position.y+followDistance*Math.sin(cinemaCameraPitch),player.position.z-forwardZ*horizontal);
    lookGoal.set(player.position.x+forwardX*lookAhead,player.position.y+2.0,player.position.z+forwardZ*lookAhead);
  }else{
    cameraGoal.set(player.position.x,player.position.y+14.2,player.position.z+22.55);
    lookGoal.set(player.position.x,player.position.y+2.1,player.position.z-3.45);
  }
  const cameraBlend=1-Math.exp(-4.2*dt);
  camera.position.lerp(cameraGoal,cameraBlend);cameraLook.lerp(lookGoal,cameraBlend);camera.lookAt(cameraLook);
  if(renderer.domElement.style.cursor!=='grabbing')renderer.domElement.style.cursor=activeRoom==='cinema'?'grab':'default';
  const t = clock.elapsedTime;
  for(const item of animatedDecor){if(item.type==='leaf')item.mesh.rotation.z=item.base+Math.sin(t*1.1+item.phase)*0.075;else if(item.type==='record')item.mesh.rotation.z=t*1.7;else if(item.type==='neon')item.mesh.material.emissiveIntensity=0.75+Math.sin(t*2+item.phase)*0.35;else if(item.type==='pulseLight')item.light.intensity=0.28+Math.max(0,Math.sin(t*2+item.phase))*0.55;else if(item.type==='portal'){item.mesh.rotation.z=t*0.16;item.mesh.scale.setScalar(1+Math.sin(t*2.2+item.phase)*0.055);}else if(item.type==='barBeam')item.light.intensity=0.7+Math.max(0,Math.sin(t*2+item.phase))*1.8;else if(item.type==='cinemaSpot')item.light.intensity=1.35+Math.max(0,Math.sin(t*1.3+item.phase))*1.1;else if(item.type==='campfire'){item.mesh.scale.y=.78+.18*Math.sin(t*8+item.phase);item.secondary.rotation.y=t*1.8;item.light.intensity=1.55+Math.random()*.9;}}
  for(const mote of cinemaFireflies){const a=t*mote.speed+mote.phase;mote.mesh.position.set(Math.cos(a)*mote.rx,mote.baseY+Math.sin(t*1.2+mote.phase)*.3,Math.sin(a*.8)*mote.rz);mote.mesh.rotation.y=a;}
  for(const pine of swayingPines)pine.tree.rotation.z=Math.sin(t*.55+pine.phase)*.014;
  for(const mote of fireflies){const a=t*mote.speed+mote.phase;mote.mesh.position.set(Math.cos(a)*mote.radiusX,mote.baseY+Math.sin(t*1.3+mote.phase)*0.34,Math.sin(a*0.82)*mote.radiusZ);mote.mesh.rotation.x=a;mote.mesh.rotation.y=a*0.7;}
  fan.rotation.y=t*0.48;
  screenLight.intensity=0.9+Math.sin(t*1.4)*0.22;
  orb.position.y=1.05+Math.sin(t*1.6)*0.17;
  const floorY=activeRoom==='cinema'?cinemaGroundY(player.position.z):0;
  if(seated)player.position.y=player.userData.seatBaseY??player.position.y;else player.position.y=floorY+(moving?Math.abs(Math.sin(walkPhase*2))*Math.min(0.055,speed*0.012):Math.sin(t*1.6)*0.014);
  legs.forEach((leg, i) => { leg.rotation.x = seated ? -1.08 : moving ? Math.sin(walkPhase + i * Math.PI) * 0.38 : THREE.MathUtils.damp(leg.rotation.x,0,9,dt); });
  arms.forEach(({arm,side}) => { arm.rotation.x = moving ? Math.sin(walkPhase + (side > 0 ? Math.PI : 0)) * 0.3 : THREE.MathUtils.damp(arm.rotation.x,0,8,dt); });
  for(const avatar of remotePlayers.values()){
    const distance=avatar.position.distanceTo(avatar.userData.target);
    avatar.position.lerp(avatar.userData.target,1-Math.exp(-8.5*dt));
    const turn=Math.atan2(Math.sin(avatar.userData.targetRotation-avatar.rotation.y),Math.cos(avatar.userData.targetRotation-avatar.rotation.y));avatar.rotation.y+=turn*(1-Math.exp(-9*dt));
    const walking=distance>.025&&!avatar.userData.seated,phase=t*9+avatar.position.x;
    avatar.scale.y=THREE.MathUtils.damp(avatar.scale.y,avatar.userData.seated ? .76 : 1,10,dt);
    const remoteFloorY=avatar.userData.target.y;avatar.position.y=avatar.userData.seated?THREE.MathUtils.damp(avatar.position.y,remoteFloorY,12,dt):walking?remoteFloorY+Math.abs(Math.sin(phase))*.045:THREE.MathUtils.damp(avatar.position.y,remoteFloorY,8,dt);
    avatar.userData.legs.forEach((leg,index)=>{leg.rotation.x=avatar.userData.seated?-1.08:walking?Math.sin(phase+index*Math.PI)*.34:THREE.MathUtils.damp(leg.rotation.x,0,8,dt);});
    avatar.userData.arms.forEach(({arm,side})=>{arm.rotation.x=walking?Math.sin(phase+(side>0?Math.PI:0))*.26:THREE.MathUtils.damp(arm.rotation.x,0,8,dt);});
  }
  for (const station of stations) {
    const screen = station.children.find(c => c.geometry?.type === 'BoxGeometry' && c.position.y === 1.33 && c.position.z === 0.55);
    if (screen) screen.material.emissiveIntensity = 0.7 + Math.sin(t * 2.2 + station.position.x) * 0.16;
  }
  updateNearby();
  if(performance.now()-lastPositionPublish>100){lastPositionPublish=performance.now();window.dispatchEvent(new CustomEvent('choigi-player-position',{detail:{x:player.position.x,y:seated?player.userData.seatBaseY:(activeRoom==='cinema'?player.position.y:0),z:player.position.z,seated,rotation:player.rotation.y}}));}
  // Keep the real YouTube iframe aligned with the perspective-projected 3D screen.
  const rect=host.getBoundingClientRect();
  const projectScreen=(screen,w,h,frame,planeZ=.23)=>{
    // Solve a normalized four-corner homography so all screen corners stay registered.
    const corners=[new THREE.Vector3(-w,h,planeZ),new THREE.Vector3(w,h,planeZ),new THREE.Vector3(w,-h,planeZ),new THREE.Vector3(-w,-h,planeZ)].map(v=>screen.localToWorld(v).project(camera));
    if(corners.some(p=>p.z>1||p.z< -1)){frame.style.display='none';return;}
    const dst=corners.map(p=>({x:(p.x+1)*rect.width/2,y:(1-p.y)*rect.height/2}));
    const minX=Math.min(...dst.map(p=>p.x)),maxX=Math.max(...dst.map(p=>p.x)),minY=Math.min(...dst.map(p=>p.y)),maxY=Math.max(...dst.map(p=>p.y));
    if(maxX<=0||minX>=rect.width||maxY<=0||minY>=rect.height){frame.style.display='none';return;}
    const sourceW=1000,sourceH=sourceW*h/w,src=[[0,0],[1,0],[1,1],[0,1]],rows=[];
    for(let i=0;i<4;i++){const [u,v]=src[i],X=dst[i].x,Y=dst[i].y;rows.push([u,v,1,0,0,0,-X*u,-X*v,X],[0,0,0,u,v,1,-Y*u,-Y*v,Y]);}
    for(let col=0;col<8;col++){let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;[rows[col],rows[pivot]]=[rows[pivot],rows[col]];const divisor=rows[col][col];if(Math.abs(divisor)<1e-10){frame.style.display='none';return;}for(let j=col;j<9;j++)rows[col][j]/=divisor;for(let row=0;row<8;row++)if(row!==col){const factor=rows[row][col];for(let j=col;j<9;j++)rows[row][j]-=factor*rows[col][j];}}
    const [A,B,C,D,E,F,G,H]=rows.map(row=>row[8]);
    const a=A/sourceW,b=B/sourceH,c=C,d=D/sourceW,e=E/sourceH,f=F,g=G/sourceW,k=H/sourceH;
    if(![a,b,c,d,e,f,g,k].every(Number.isFinite)){frame.style.display='none';return;}
    frame.style.left='0px';frame.style.top='0px';frame.style.width=`${sourceW}px`;frame.style.height=`${sourceH}px`;frame.style.transformOrigin='0 0';
    frame.style.transform=`matrix3d(${a},${d},0,${g},${b},${e},0,${k},0,0,1,0,${c},${f},0,1)`;frame.style.display='block';frame.style.visibility='visible';
  };  const inBar=activeRoom==='bar';
  if(activeRoom==='lounge')projectScreen(videoScreenGroup,5.375,2.74,projectionFrame,.23);
  else if(activeRoom==='cinema')projectScreen(cinemaScreenGroup,8.31,4.52,projectionFrame,.4);
  else projectionFrame.style.display='none';
  if(inBar)projectScreen(barScreenGroup,4.775,2.51,barProjectionFrame,.23);else barProjectionFrame.style.display='none';  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
