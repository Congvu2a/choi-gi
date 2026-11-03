import * as THREE from 'three';

const host = document.querySelector('#roomScene');
const message = document.querySelector('#roomMessage');
const interact = document.querySelector('#interactBtn');
const modal = document.querySelector('#gameModal');
const musicOverlay = document.querySelector('#musicOverlay');
if (!host) throw new Error('Không tìm thấy khu vực phòng game.');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#252033');
scene.fog = new THREE.Fog('#252033', 25, 45);
const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
camera.position.set(0, 14.2, 26);
camera.lookAt(0, 2.1, 0);
const cameraGoal=new THREE.Vector3(),lookGoal=new THREE.Vector3(),cameraLook=new THREE.Vector3(0,2.1,0);
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
const videoScreenGroup = new THREE.Group(); videoScreenGroup.position.set(0, 5.1, -8.70); loungeRoot.add(videoScreenGroup);
roundedPanel(videoScreenGroup,8.0,4.75,0.42,mat('#241d34',0.24,{metalness:0.45,emissive:'#412956',emissiveIntensity:0.3}),0,0,0,0.46);
roundedPanel(videoScreenGroup,7.55,4.43,0.08,mat('#c67bb8',0.28,{metalness:0.3,emissive:'#8b3a7d',emissiveIntensity:0.7}),0,0,0.24,0.38);
const videoScreenSurface = box(videoScreenGroup, 7.2, 4.05, 0.035, mat('#090a12', 0.3, { emissive:'#12121e', emissiveIntensity:0.6 }), 0, 0, 0.31, false);
for(const x of [-3.82,3.82]){const light=box(videoScreenGroup,0.055,3.75,0.06,mat('#d6ff72',0.2,{emissive:'#b8ee54',emissiveIntensity:1.0}),x,0,0.31,false);animatedDecor.push({type:'neon',mesh:light,base:0.8,phase:x});}
const projectionFrame = document.createElement('div'); projectionFrame.className = 'room-projection'; projectionFrame.setAttribute('aria-label','Video đang chiếu trên màn hình lớn');
const projectionHint = document.createElement('div'); projectionHint.className = 'projection-hint'; projectionHint.innerHTML = '<span>▶</span><b>CHILL SCREEN</b><small>Thêm nhạc trong jukebox để chiếu video tại đây</small>'; projectionFrame.append(projectionHint); host.append(projectionFrame);
const musicPlayer = document.querySelector('#youtubePlayer'); projectionFrame.append(musicPlayer);
const projectionShield=document.createElement('div');projectionShield.className='projection-shield';projectionShield.setAttribute('aria-label','Màn hình chỉ để xem video');projectionShield.title='Dùng máy phát nhạc để đổi bài';projectionFrame.append(projectionShield);
Object.assign(projectionFrame.style,{pointerEvents:'auto'});musicPlayer.style.pointerEvents='none';musicPlayer.tabIndex=-1;Object.assign(projectionShield.style,{position:'absolute',inset:'0',zIndex:'5',background:'transparent',pointerEvents:'auto',touchAction:'none'});
const musicPlayerWrap = document.querySelector('.music-player-wrap');
if (musicPlayerWrap) { const note=document.createElement('div'); note.className='music-project-note'; note.textContent='Video đang được chiếu trên màn hình lớn trong phòng.'; musicPlayerWrap.replaceChildren(note); }
window.addEventListener('choigi-video-active', e => {const active=e.detail?.active;projectionHint.hidden=Boolean(active);videoScreenSurface.material.color.set(active?'#090a12':'#12101b');if(typeof barVideoSurface!=='undefined')barVideoSurface.material.color.set(active?'#090a12':'#301338');});

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
// The game wings are reached through their doorways. Only the bar gets a lobby portal.
makeLobbyPortal(0,6.85,'CỔNG · QUÁN BAR','#ff91cf','bar',{x:40,z:3.45});
// The bar is a separate fourth space, reached only from the lobby gate.
const barRoot=new THREE.Group();barRoot.name='quan-bar';barRoot.position.set(40,0,0);scene.add(barRoot);
const barFloor=mat('#302b3c');
box(barRoot,21,0.35,18,barFloor,0,-0.22,0);
box(barRoot,21,7.5,0.38,mat('#291f36'),0,3.53,-9.05);
box(barRoot,0.38,7.5,18,mat('#291f36'),-10.45,3.53,0);box(barRoot,0.38,7.5,18,mat('#291f36'),10.45,3.53,0);
const barNeon=mat('#ff58bd',0.22,{emissive:'#ff28ac',emissiveIntensity:1.2});
box(barRoot,18,0.14,0.18,barNeon,0,6.75,-8.78,false);
const barSign=addLabel(barRoot,'NIGHT OWL · BAR','#ff9cda');barSign.position.set(0,5.7,-8.55);barSign.scale.set(5.5,1.0,1);
const barScreenGroup=new THREE.Group();barScreenGroup.position.set(0,4.8,-8.5);barRoot.add(barScreenGroup);
roundedPanel(barScreenGroup,7.0,3.9,0.3,mat('#17131f',0.25,{metalness:0.4,emissive:'#64204f',emissiveIntensity:0.55}),0,0,0,0.35);
const barVideoSurface=box(barScreenGroup,6.45,3.42,0.04,mat('#100b17',0.24,{emissive:'#301338',emissiveIntensity:0.8}),0,0,0.22,false);
const counter=new THREE.Group();counter.position.set(40,0,-1.1);scene.add(counter);
box(counter,7.2,1.2,1.45,mat('#613956'),0,0.75,0);
box(counter,7.55,0.24,1.75,mat('#d18cb9',0.32,{metalness:0.25}),0,1.43,0);
box(counter,6.85,0.1,0.08,barNeon,0,0.75,0.76,false);
obstacles.push({x:40,z:-1.1,r:3.45});
for(let i=0;i<7;i++){
  const bottle=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.16,0.5+(i%3)*0.12,8),mat(i%2?'#7bdcff':'#d6ff72',0.28,{emissive:i%2?'#248db2':'#7bba32',emissiveIntensity:0.55}));
  bottle.position.set(-2.8+i*0.92,1.78,-0.1);bottle.castShadow=true;counter.add(bottle);
}
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

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const keys = new Set();
let nearest = null;
const radius=0.34;
let seated=false;
const playerVelocity=new THREE.Vector2();
let walkPhase=0;
function switchRoom(room){
  const next=['lounge','left','right','bar'].includes(room)?room:'lounge';
  if(next===activeRoom)return;
  activeRoom=next;
  const shell=document.querySelector('.room-shell');shell?.classList.remove('bar-mode','left-mode');
  seated=false;player.scale.y=1;
  const copy={lounge:['SẢNH CHILL','Sảnh trò chuyện <span>✳</span>','Ngồi thư giãn, trò chuyện và cùng xem video.'],left:['PHÒNG GAME · TRÁI','Phòng game <span>TRÁI</span>','Chọn một máy chơi rồi nhấn E để bắt đầu.'],right:['PHÒNG GAME · PHẢI','Phòng game <span>PHẢI</span>','Chọn một máy chơi rồi nhấn E để bắt đầu.'],bar:['NIGHT OWL · BAR','Quán bar <span>✦</span>','Nghe nhạc, xem video và ngồi ở quầy bar.']}[activeRoom];
  document.querySelector('#roomEyebrow').textContent=copy[0];document.querySelector('#roomHeading').innerHTML=copy[1];document.querySelector('#roomIntro').textContent=copy[2];
  document.querySelector('.room-footnote').innerHTML=activeRoom==='lounge'?'<span>✦</span> Hai cửa bên nối thẳng tới phòng game. Cổng dịch chuyển ở sảnh đưa bạn tới quán bar. Nhạc vẫn phát chung.':activeRoom==='bar'?'<span>✦</span> Đi tới quầy hoặc ghế để tương tác. Cổng xanh đưa bạn về sảnh.':'<span>✦</span> Đi lại gần máy chơi rồi nhấn E. Qua cửa để trở lại sảnh.';
  window.dispatchEvent(new CustomEvent('choigi-room-changed',{detail:{room:activeRoom}}));updateNearby();
}
function openStation(station) {
  if(!station||station.userData.room!==activeRoom)return;
  if(station.userData.gameId==='jukebox'){
    if(typeof window.openMusicPanel==='function')window.openMusicPanel(activeRoom);
    else window.showToast('Máy phát nhạc chưa tải xong. Hãy tải lại trang một lần nhé.');
  }
  else if(station.userData.gameId==='door'){
    player.position.set(station.userData.targetPosition.x,0,station.userData.targetPosition.z);
    playerVelocity.set(0,0);keys.clear();seated=false;player.scale.y=1;
    switchRoom(station.userData.targetRoom);
  }
  else if(station.userData.gameId==='seat'){
    seated=!seated;
    playerVelocity.set(0,0);keys.clear();
    if(seated){player.position.set(station.userData.seatTarget.x,0,station.userData.seatTarget.z);player.scale.y=.76;}
    else player.scale.y=1;
    updateNearby();
  } else window.openGame(station.userData.gameId);
}
function updateNearby() {
  let closest = null, distance = Infinity;
  for (const station of stations.filter(item=>item.userData.room===activeRoom)) {
    const d = Math.hypot(player.position.x - station.position.x, player.position.z - station.position.z);
    if (d < distance) { closest = station; distance = d; }
  }
  nearest = distance < 4 ? closest : null;
  if (nearest) {
    const music = nearest.userData.gameId === 'jukebox', seat=nearest.userData.gameId==='seat',door=nearest.userData.gameId==='door';
    message.textContent = door ? `Nhấn E để tới ${nearest.userData.targetRoom==='bar'?'quán bar':'sảnh'}.` : seat ? (seated?'Bạn đang ngồi thư giãn. Nhấn E để đứng dậy.':`Bạn đang gần ${nearest.userData.name}. Nhấn E để ngồi.`) : music ? 'Jukebox phát nhạc chung cho cả ba khu. Nhấn E để chọn nhạc!' : `Bạn đang ở máy ${nearest.userData.name}. Nhấn E để chơi!`;
    interact.lastChild.textContent = door ? ` Đi tới ${nearest.userData.targetRoom==='bar'?'quán bar':'sảnh'}` : seat ? (seated?' Đứng dậy':' Ngồi xuống') : music ? ' Mở máy phát chung' : ` Chơi ${nearest.userData.name}`;
    interact.classList.add('can-interact');
  } else {
    message.textContent = activeRoom==='lounge'?'Đi tới jukebox, ghế sofa hoặc bàn ghế để tương tác.':'Đi lại gần một máy game để bắt đầu chơi.';
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
  const screenSurface=activeRoom==='bar'?barVideoSurface:videoScreenSurface;
  const screenHit=activeRoom==='lounge'||activeRoom==='bar'?raycaster.intersectObject(screenSurface,false)[0]:null;
  if(screenHit&&(!hits[0]||screenHit.distance<hits[0].distance))return null;
  return hits.map(h => h.object.userData.station || h.object.parent).find(o => o?.userData?.gameId) || null;
}
renderer.domElement.addEventListener('pointermove', e => { renderer.domElement.style.cursor = pointerPosition(e) ? 'pointer' : 'default'; });
renderer.domElement.addEventListener('click', e => { const station = pointerPosition(e); if (station) openStation(station); });

function tryInteract() {
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
  if (modal.classList.contains('open') || !musicOverlay.hidden) return;
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','enter'].includes(k)) e.preventDefault();
  if (k === 'e' || k === 'enter') tryInteract(); else keys.add(k);
});
document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
document.querySelectorAll('[data-move]').forEach(btn => {
  btn.addEventListener('pointerdown', e => { e.preventDefault(); keys.add(({up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'})[btn.dataset.move]); });
  for (const end of ['pointerup','pointerleave','pointercancel']) btn.addEventListener(end, () => keys.delete(({up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'})[btn.dataset.move]));
});

const clock = new THREE.Clock();
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  let dx = 0, dz = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dz -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dz += 1;
  const inputActive=dx!==0||dz!==0;
  const canMove=!modal.classList.contains('open')&&musicOverlay.hidden;
  if(canMove&&inputActive){
    if(seated){seated=false;player.scale.y=1;}
    const len = Math.hypot(dx, dz); dx /= len; dz /= len;
  } else { dx=0;dz=0; }
  const maxSpeed=4.4,response=inputActive&&canMove?9.5:12.5,blend=1-Math.exp(-response*dt);
  playerVelocity.x=THREE.MathUtils.lerp(playerVelocity.x,dx*maxSpeed,blend);
  playerVelocity.y=THREE.MathUtils.lerp(playerVelocity.y,dz*maxSpeed,blend);
  if(Math.abs(playerVelocity.x)<0.015)playerVelocity.x=0;
  if(Math.abs(playerVelocity.y)<0.015)playerVelocity.y=0;
  const doorClearance=1.08;
  const blocked=(x,z)=>obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+radius)||
    (activeRoom!=='bar'&&[-5.8,5.8].some(wall=>Math.abs(x-wall)<radius+0.21&&Math.abs(z)>doorClearance));
  const crossesDivider=(from,to,z)=>Math.abs(to-from)>0.001&&[-5.8,5.8].some(wall=>((from<wall&&to>=wall)||(from>wall&&to<=wall))&&Math.abs(z)>doorClearance);
  const xMin=activeRoom==='bar'?30.1:-14,xMax=activeRoom==='bar'?49.9:14;
  const nextX=THREE.MathUtils.clamp(player.position.x+playerVelocity.x*dt,xMin,xMax);
  const nextZ=THREE.MathUtils.clamp(player.position.z+playerVelocity.y*dt,-8,8);
  if(!blocked(nextX,player.position.z)&&!crossesDivider(player.position.x,nextX,player.position.z))player.position.x=nextX;else playerVelocity.x=0;
  if(!blocked(player.position.x,nextZ))player.position.z=nextZ;else playerVelocity.y=0;
  if(activeRoom!=='bar')switchRoom(player.position.x < -5.8 ? 'left' : player.position.x > 5.8 ? 'right' : 'lounge');
  const speed=Math.hypot(playerVelocity.x,playerVelocity.y),moving=speed>0.22;
  if(moving){const wanted=Math.atan2(playerVelocity.x,playerVelocity.y),turn=Math.atan2(Math.sin(wanted-player.rotation.y),Math.cos(wanted-player.rotation.y));player.rotation.y+=turn*(1-Math.exp(-13*dt));}
  walkPhase+=speed*dt*3.4;
  cameraGoal.set(player.position.x,player.position.y+14.2,player.position.z+22.55);
  lookGoal.set(player.position.x,player.position.y+2.1,player.position.z-3.45);
  const cameraBlend=1-Math.exp(-4.2*dt);
  camera.position.lerp(cameraGoal,cameraBlend);cameraLook.lerp(lookGoal,cameraBlend);camera.lookAt(cameraLook);
  const t = clock.elapsedTime;
  for(const item of animatedDecor){if(item.type==='leaf')item.mesh.rotation.z=item.base+Math.sin(t*1.1+item.phase)*0.075;else if(item.type==='record')item.mesh.rotation.z=t*1.7;else if(item.type==='neon')item.mesh.material.emissiveIntensity=0.75+Math.sin(t*2+item.phase)*0.35;else if(item.type==='pulseLight')item.light.intensity=0.28+Math.max(0,Math.sin(t*2+item.phase))*0.55;else if(item.type==='portal'){item.mesh.rotation.z=t*0.16;item.mesh.scale.setScalar(1+Math.sin(t*2.2+item.phase)*0.055);}else if(item.type==='barBeam')item.light.intensity=0.7+Math.max(0,Math.sin(t*2+item.phase))*1.8;}
  for(const mote of fireflies){const a=t*mote.speed+mote.phase;mote.mesh.position.set(Math.cos(a)*mote.radiusX,mote.baseY+Math.sin(t*1.3+mote.phase)*0.34,Math.sin(a*0.82)*mote.radiusZ);mote.mesh.rotation.x=a;mote.mesh.rotation.y=a*0.7;}
  fan.rotation.y=t*0.48;
  screenLight.intensity=0.9+Math.sin(t*1.4)*0.22;
  orb.position.y=1.05+Math.sin(t*1.6)*0.17;
  player.position.y = moving ? Math.abs(Math.sin(walkPhase*2)) * Math.min(0.055,speed*0.012) : Math.sin(t * 1.6) * 0.014;
  legs.forEach((leg, i) => { leg.rotation.x = moving ? Math.sin(walkPhase + i * Math.PI) * 0.38 : THREE.MathUtils.damp(leg.rotation.x,0,9,dt); });
  arms.forEach(({arm,side}) => { arm.rotation.x = moving ? Math.sin(walkPhase + (side > 0 ? Math.PI : 0)) * 0.3 : THREE.MathUtils.damp(arm.rotation.x,0,8,dt); });
  for (const station of stations) {
    const screen = station.children.find(c => c.geometry?.type === 'BoxGeometry' && c.position.y === 1.33 && c.position.z === 0.55);
    if (screen) screen.material.emissiveIntensity = 0.7 + Math.sin(t * 2.2 + station.position.x) * 0.16;
  }
  updateNearby();
  // Keep the real YouTube iframe aligned with the perspective-projected 3D screen.
  const activeScreen=activeRoom==='bar'?barScreenGroup:videoScreenGroup;
  const halfWidth=activeRoom==='bar'?3.225:3.6,halfHeight=activeRoom==='bar'?1.71:2.025;
  const activeProjection=projectionFrame;
  const corners=[new THREE.Vector3(-halfWidth,-halfHeight,0.23),new THREE.Vector3(halfWidth,-halfHeight,0.23),new THREE.Vector3(halfWidth,halfHeight,0.23),new THREE.Vector3(-halfWidth,halfHeight,0.23)].map(v=>activeScreen.localToWorld(v).project(camera));
  const rect=host.getBoundingClientRect(), px=corners.map(v=>({x:(v.x+1)*rect.width/2,y:(1-v.y)*rect.height/2}));
  const left=Math.min(...px.map(p=>p.x)),top=Math.min(...px.map(p=>p.y)),right=Math.max(...px.map(p=>p.x)),bottom=Math.max(...px.map(p=>p.y));
  activeProjection.style.left=`${left}px`;activeProjection.style.top=`${top}px`;activeProjection.style.width=`${right-left}px`;activeProjection.style.height=`${bottom-top}px`;
  activeProjection.style.display=bottom>0&&top<rect.height&&right>0&&left<rect.width?'block':'none';
  activeProjection.style.visibility=activeRoom==='lounge'||activeRoom==='bar'?'visible':'hidden';
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
