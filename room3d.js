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
camera.position.set(0, 13.8, 24);
camera.lookAt(0, 2.1, 0);
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
const floor = new THREE.Mesh(new THREE.BoxGeometry(26, 0.35, 18), floorMat);
floor.position.set(0, -0.22, 0); floor.receiveShadow = true; loungeRoot.add(floor);

function box(parent, w, h, d, material, x, y, z, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
// Three enclosing walls make the lobby read as a real room while leaving the front open to the camera.
box(loungeRoot, 26, 7, 0.38, wallMat, 0, 3.28, -9.05);
box(loungeRoot, 0.38, 7, 18, mat('#443750'), -12.95, 3.28, 0);
box(loungeRoot, 0.38, 7, 18, mat('#443750'), 12.95, 3.28, 0);
box(loungeRoot, 26, 0.18, 0.5, trimMat, 0, 0.05, -8.78, false);
box(loungeRoot, 0.5, 0.18, 18, trimMat, -12.72, 0.05, 0, false);
box(loungeRoot, 0.5, 0.18, 18, trimMat, 12.72, 0.05, 0, false);

// Big sunset window, mullions, and a low sill on the back wall.
const windowGlow = mat('#f4a6c2', 0.24, { emissive: '#dc7fa8', emissiveIntensity: 0.62 });
box(loungeRoot, 5.1, 3.55, 0.16, mat('#281f39'), -8.0, 4.55, -8.79, false);
box(loungeRoot, 4.68, 3.1, 0.08, windowGlow, -8.0, 4.58, -8.68, false);
box(loungeRoot, 0.11, 3.08, 0.12, mat('#563a59'), -8.0, 4.58, -8.59, false);
box(loungeRoot, 4.7, 0.12, 0.12, mat('#563a59'), -8.0, 4.58, -8.58, false);
box(loungeRoot, 5.15, 0.2, 0.55, mat('#32243d'), -8.0, 2.79, -8.45);

// Giant projection screen. The HTML YouTube iframe is projected over this 3D panel below.
const videoScreenGroup = new THREE.Group(); videoScreenGroup.position.set(0, 4.35, -8.70); loungeRoot.add(videoScreenGroup);
box(videoScreenGroup, 7.8, 4.35, 0.3, mat('#211a2c'), 0, 0, 0, false);
const videoScreenSurface = box(videoScreenGroup, 7.48, 4.03, 0.08, mat('#090a12', 0.3, { emissive:'#12121e', emissiveIntensity:0.6 }), 0, 0, 0.18, false);
for (const x of [-3.85, 3.85]) box(videoScreenGroup, 0.14, 4.5, 0.22, mat('#d6ff72',0.3,{emissive:'#9fcb42',emissiveIntensity:0.6}),x,0,0.12,false);
box(videoScreenGroup, 8.0, 0.15, 0.24, mat('#d6ff72',0.3,{emissive:'#9fcb42',emissiveIntensity:0.6}),0,-2.22,0.12,false);
const screenStand = new THREE.Group(); screenStand.position.set(0, 0, -8.35); loungeRoot.add(screenStand);
box(screenStand, 0.36, 2.1, 0.36, mat('#342a43'), -1.6, 1.05, 0);
box(screenStand, 0.36, 2.1, 0.36, mat('#342a43'), 1.6, 1.05, 0);
box(screenStand, 3.9, 0.15, 1.0, mat('#241c30'), 0, 0.12, 0);
const projectionFrame = document.createElement('div'); projectionFrame.className = 'room-projection'; projectionFrame.setAttribute('aria-label','Video đang chiếu trên màn hình lớn');
const projectionHint = document.createElement('div'); projectionHint.className = 'projection-hint'; projectionHint.innerHTML = '<span>▶</span><b>CHILL SCREEN</b><small>Thêm nhạc trong jukebox để chiếu video tại đây</small>'; projectionFrame.append(projectionHint); host.append(projectionFrame);
const musicPlayer = document.querySelector('#youtubePlayer'); projectionFrame.append(musicPlayer);
const barProjectionFrame=document.createElement('div'); barProjectionFrame.className='room-projection room-projection-bar'; barProjectionFrame.setAttribute('aria-label','Màn hình video trong quán bar'); barProjectionFrame.style.display='none';
const barProjectionHint=document.createElement('div'); barProjectionHint.className='projection-hint'; barProjectionHint.innerHTML='<span>♫</span><b>BAR · LIVE</b><small>Thêm nhạc từ máy phát riêng của quán bar</small>'; barProjectionFrame.append(barProjectionHint); host.append(barProjectionFrame);
const barMusicPlayer=document.querySelector('#youtubeBarPlayer'); barProjectionFrame.append(barMusicPlayer);
const musicPlayerWrap = document.querySelector('.music-player-wrap');
if (musicPlayerWrap) { const note=document.createElement('div'); note.className='music-project-note'; note.textContent='Video đang được chiếu trên màn hình lớn trong phòng.'; musicPlayerWrap.replaceChildren(note); }
window.addEventListener('choigi-video-active', e => {const active=e.detail?.active,room=e.detail?.room||'lounge';if(room==='bar'){barProjectionHint.hidden=Boolean(active);barScreenSurface.material.color.set(active?'#09070d':'#160b1b');}else{projectionHint.hidden=Boolean(active);videoScreenSurface.material.color.set(active?'#090a12':'#12101b');}});

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
plant(-11.3, -7.6, 1.12); plant(11.3, -7.6, 1.15); plant(-11.3, 6.2, 0.9); plant(11.3, 6.0, 0.92);

// A soft sofa, throw pillows, and a little pouf make the lounge feel lived in.
const sofa = new THREE.Group(); sofa.position.set(5.0, 0, -6.4); loungeRoot.add(sofa);
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
const pouf = new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.68,0.58,12),mat('#cf8c9c')); pouf.position.set(-3.4,0.3,5.2); pouf.castShadow=true; pouf.receiveShadow=true; loungeRoot.add(pouf);
const poufTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.1,12),mat('#efb5a1')); poufTop.position.set(-3.4,0.62,5.2); poufTop.castShadow=true; loungeRoot.add(poufTop);

// Vinyl wall art and warm fairy lights bring color into the back wall.
const wirePoints=[];for(let i=0;i<=24;i++){const x=-12+i;wirePoints.push(new THREE.Vector3(x,6.78-Math.sin(i/24*Math.PI)*0.34,-8.56))}const wire=new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePoints),new THREE.LineBasicMaterial({color:'#e2b8bb'}));loungeRoot.add(wire);
for(let i=0;i<13;i++){const x=-11.5+i*1.92,y=6.78-Math.sin(i/12*Math.PI)*0.34;const bulb=glowingSphere(i%3===0?'#d6ff8c':'#ffc58f',0.8,x,y-0.08,-8.5,0.09);const glow=new THREE.PointLight(i%3===0?'#d6ff8c':'#ffc58f',0.3,1.5);glow.position.set(x,y-0.1,-8.2);loungeRoot.add(glow)}

// Neon wall sign and warm sconces.
function glowingSphere(color, intensity, x, y, z, radius = 0.12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), mat(color, 0.25, { emissive: color, emissiveIntensity: intensity }));
  m.position.set(x, y, z); loungeRoot.add(m); return m;
}
glowingSphere('#d6ff8c', 1.4, 11.5, 5.5, -8.63, 0.2);
glowingSphere('#ff9bc0', 1.4, -11.5, 5.5, -8.63, 0.2);
const neon = new THREE.PointLight('#d6ff8c', 2.4, 7); neon.position.set(10.8, 4.8, -7.8); loungeRoot.add(neon);
const sunset = new THREE.PointLight('#ff9fc5', 2.8, 9); sunset.position.set(-10.5, 4.5, -7.8); loungeRoot.add(sunset);

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
function makePortal(parent,x,z,label,color,targetRoom){
  const group=new THREE.Group();group.position.set(x,0,z);parent.add(group);
  const glow=mat(color,0.2,{emissive:color,emissiveIntensity:1.4});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.12,0.11,12,40),glow);ring.position.y=1.35;ring.castShadow=true;group.add(ring);
  const base=box(group,2.8,0.14,0.7,mat('#33223c'),0,0.1,0);
  const light=new THREE.PointLight(color,1.7,4);light.position.y=1.3;group.add(light);
  const sign=addLabel(group,label,color);sign.position.set(0,2.8,0);sign.scale.set(2.8,0.7,1);
  ring.userData.station=group;base.userData.station=group;
  group.userData.gameId='door';group.userData.name=label;group.userData.room=parent===loungeRoot?'lounge':'bar';group.userData.targetRoom=targetRoom;
  stations.push(group);return group;
}

const stations = [];
const obstacles = [];
const roomObstacles = { lounge: obstacles, bar: [] };
let activeRoom = 'lounge';
const stationDefs = [
  { id: 'guess', name: 'ĐOÁN SỐ', x: -9.0, z: -1.0, color: '#aa83ff', icon: '?', hint: 'CHƠI NHANH' },
  { id: 'memory', name: 'TRÍ NHỚ', x: -5.1, z: -4.2, color: '#59bd9f', icon: '✦', hint: 'ĐỘNG NÃO' },
  { id: 'rps', name: 'OẲN TÙ TÌ', x: -0.2, z: -3.2, color: '#ff9f83', icon: '✊', hint: 'ĐỐI KHÁNG' },
  { id: 'reaction', name: 'PHẢN XẠ', x: 9.0, z: -1.0, color: '#d6ff72', icon: '⚡', hint: 'NHANH TAY' },
  { id: 'ttt', name: 'CỜ CA-RÔ', x: 4.4, z: 3.8, color: '#8faeff', icon: '×', hint: 'ĐẤU TRÍ' },
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
  group.userData.gameId = def.id; group.userData.name = def.name; group.userData.hitMesh = shell; group.userData.room='lounge';
  shell.userData.station = group;
  obstacles.push({ x:def.x, z:def.z, r:0.92 });
  stations.push(group);
}
stationDefs.forEach(makeArcade);

// A clickable retro jukebox for a personal YouTube queue.
function makeJukebox() {
  const group = new THREE.Group(); group.position.set(-10.5, 0, 1.4); loungeRoot.add(group);
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
  obstacles.push({ x:-10.5, z:1.4, r:0.98 });
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
  chair.userData.gameId='seat'; chair.userData.name='GHẾ NGỒI'; chair.userData.room='lounge'; chair.userData.seatTarget={x:x,z:z+1.35};
  stations.push(chair); obstacles.push({x,z,r:0.72});
}
makeChair(-7.1,5.7,Math.PI); makeChair(8.0,5.8,Math.PI);
obstacles.push({x:0,z:1,r:1.35}); // low central table
obstacles.push({x:0,z:-8.1,r:3.85}); // solid cinema screen and stand
obstacles.push({x:5,z:-6.4,r:2.15}); // sofa
obstacles.push({x:-3.4,z:5.2,r:0.78}); // pouf
for(const [x,z] of [[-11.3,-7.6],[11.3,-7.6],[-11.3,6.2],[11.3,6.0]]) obstacles.push({x,z,r:0.55});

// A separate room with its own cocktail counter, dance floor, jukebox and projection screen.
const barRoot=new THREE.Group(); barRoot.name='bar-rieng'; barRoot.visible=false; scene.add(barRoot);
const barFloor=box(barRoot,26,0.35,18,mat('#201b31'),0,-0.22,0,false); barFloor.receiveShadow=true;
box(barRoot,26,7,0.38,mat('#25172e'),0,3.28,-9.05);
box(barRoot,0.38,7,18,mat('#24172d'),-12.95,3.28,0); box(barRoot,0.38,7,18,mat('#24172d'),12.95,3.28,0);
for(const [y,color] of [[0.18,'#d536a8'],[6.65,'#5c39b9']]){
  const strip=box(barRoot,25.6,0.1,0.18,mat(color,0.25,{emissive:color,emissiveIntensity:1.1}),0,y,-8.77,false);
  animatedDecor.push({type:'neon',mesh:strip,base:0.9,phase:y});
}
// Wall-mounted big screen on the right side of the bar.
const barScreenGroup=new THREE.Group(); barScreenGroup.position.set(6.4,4.35,-8.68); barRoot.add(barScreenGroup);
box(barScreenGroup,6.8,4.0,0.3,mat('#160f20'),0,0,0,false);
const barScreenSurface=box(barScreenGroup,6.52,3.72,0.08,mat('#160b1b',0.3,{emissive:'#25102b',emissiveIntensity:0.65}),0,0,0.18,false);
for(const x of [-3.38,3.38])box(barScreenGroup,0.13,4.15,0.2,mat('#ff48c4',0.27,{emissive:'#f22bb5',emissiveIntensity:1.15}),x,0,0.12,false);
box(barScreenGroup,6.95,0.13,0.2,mat('#ff48c4',0.27,{emissive:'#f22bb5',emissiveIntensity:1.15}),0,-2.04,0.12,false);
const barScreenStand=new THREE.Group();barScreenStand.position.set(6.4,0,-8.35);barRoot.add(barScreenStand);
box(barScreenStand,0.3,1.95,0.3,mat('#321b3a'),-1.5,0.98,0);box(barScreenStand,0.3,1.95,0.3,mat('#321b3a'),1.5,0.98,0);
box(barScreenStand,3.7,0.16,0.9,mat('#21142a'),0,0.1,0);
const barSign=addLabel(barRoot,'BAR · OPEN LATE','#ff91dc');barSign.position.set(-4.8,5.55,-8.55);barSign.scale.set(4.6,0.95,1);
// Amber bottle shelves behind the counter.
for(const y of [2.7,3.85]){
  box(barRoot,6.3,0.13,0.65,mat('#8d4e73',0.35,{emissive:'#642650',emissiveIntensity:0.3}),-5.2,y,-8.25);
  for(let i=0;i<8;i++){
    const x=-8.0+i*0.8,color=['#ff7c57','#cf68d5','#d6ff72','#4ac9bf'][i%4];
    const bottle=new THREE.Group();bottle.position.set(x,y,-8.1);barRoot.add(bottle);
    const glass=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.19,0.62,8),mat(color,0.28,{emissive:color,emissiveIntensity:0.22}));glass.position.y=0.36;glass.castShadow=true;bottle.add(glass);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.11,0.22,8),mat('#d4c4cc',0.35));neck.position.y=0.78;bottle.add(neck);
  }
}
// Counter and stools along the left wall.
box(barRoot,9.0,1.05,1.35,mat('#37233d'),-4.2,0.6,-5.65);
box(barRoot,9.15,0.17,1.5,mat('#d083b4',0.3,{emissive:'#6e3158',emissiveIntensity:0.35}),-4.2,1.18,-5.65);
for(let i=0;i<4;i++){
  const x=-7.6+i*2.25,z=-3.45;
  const seatGroup=new THREE.Group();seatGroup.position.set(x,0,z);barRoot.add(seatGroup);
  const stool=new THREE.Mesh(new THREE.CylinderGeometry(0.47,0.43,0.18,16),mat(i%2?'#b86caa':'#e48bb3',0.4));stool.position.y=0.78;stool.castShadow=true;seatGroup.add(stool);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.15,0.72,10),mat('#a98ba9',0.3));stem.position.y=0.36;seatGroup.add(stem);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.12,16),mat('#39253f'));base.position.y=0.07;seatGroup.add(base);
  seatGroup.userData.gameId='seat';seatGroup.userData.name='GHẾ QUẦY BAR';seatGroup.userData.room='bar';seatGroup.userData.seatTarget={x,z:z+1.1};
  stool.userData.station=seatGroup;stations.push(seatGroup);roomObstacles.bar.push({x,z,r:0.58});
}
roomObstacles.bar.push({x:-5.2,z:-8.25,r:3.0},{x:6.4,z:-8.1,r:3.35},{x:9.7,z:1.6,r:0.95});
// Checker-like dance floor tiles shimmer gently at the center of the room.
const danceTiles=[];const danceColors=['#ff45bc','#6548ff','#24d5cf','#ffc75a'];
for(let row=0;row<3;row++)for(let col=0;col<4;col++){
  const color=danceColors[(row+col)%danceColors.length],tile=box(barRoot,1.35,0.06,1.15,mat(color,0.24,{emissive:color,emissiveIntensity:0.55}),1.4+col*1.42,0.015,-0.7+row*1.23,false);
  danceTiles.push({mesh:tile,phase:(row*4+col)*0.7});
}
// A faceted disco ball and rotating colored bar lights.
const discoBall=new THREE.Group();discoBall.position.set(2.2,6.1,0.7);barRoot.add(discoBall);
const disco=new THREE.Mesh(new THREE.IcosahedronGeometry(0.78,1),mat('#c8bfda',0.18,{metalness:0.82,emissive:'#5e3d81',emissiveIntensity:0.22}));disco.castShadow=true;discoBall.add(disco);
const discoLight=new THREE.PointLight('#ff57cb',1.4,13);discoLight.position.set(2.2,5.9,0.7);barRoot.add(discoLight);
const barSpotLights=[];for(const [x,color] of [[-8,'#ff48c4'],[0,'#7d63ff'],[8,'#39e9d4']]){const light=new THREE.PointLight(color,2.1,9);light.position.set(x,5.9,-0.2);barRoot.add(light);barSpotLights.push(light);}
// Separate bar jukebox: it opens its own queue and its own screen.
const barJukebox=new THREE.Group();barJukebox.position.set(10.0,0,1.6);barRoot.add(barJukebox);
box(barJukebox,1.35,2.1,0.9,mat('#4c245b',0.3,{emissive:'#672b7e',emissiveIntensity:0.32}),0,1.08,0);
const barJukeScreen=box(barJukebox,0.9,0.8,0.08,mat('#f15ab7',0.23,{emissive:'#ea42b0',emissiveIntensity:1.0}),0,1.35,0.5,false);
const barDisc=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,0.08,32),mat('#25172e',0.22,{emissive:'#9d39bb',emissiveIntensity:0.55}));barDisc.rotation.x=Math.PI/2;barDisc.position.set(0,0.78,0.51);barJukebox.add(barDisc);animatedDecor.push({type:'record',mesh:barDisc});
const barJukeHit=barJukebox.children[0];barJukeHit.userData.station=barJukebox;
barJukebox.userData.gameId='jukebox';barJukebox.userData.name='MÁY PHÁT NHẠC BAR';barJukebox.userData.room='bar';stations.push(barJukebox);
const portalLounge=makePortal(loungeRoot,0,7.45,'PORTAL · BAR','#ff63ce','bar');
const portalBar=makePortal(barRoot,0,7.45,'QUAY LẠI SẢNH','#d6ff72','lounge');
roomObstacles.bar.push({x:-11.3,z:6.2,r:0.55},{x:11.3,z:6.0,r:0.55});

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
function switchRoom(room){
  if(room===activeRoom)return;
  activeRoom=room==='bar'?'bar':'lounge';
  loungeRoot.visible=activeRoom==='lounge';barRoot.visible=activeRoom==='bar';
  document.querySelector('.room-shell')?.classList.toggle('bar-mode',activeRoom==='bar');
  player.position.set(activeRoom==='bar'?6.4:-5.2,0,activeRoom==='bar'?4.8:4.6);
  seated=false;player.scale.y=1;keys.clear();
  document.querySelector('#roomEyebrow').textContent=activeRoom==='bar'?'QUÁN BAR':'SẢNH GAME';
  document.querySelector('#roomHeading').innerHTML=activeRoom==='bar'?'Một chút chill ở <span>BAR ✦</span>':'Góc vui vẻ <span>✳</span>';
  document.querySelector('#roomIntro').textContent=activeRoom==='bar'?'Nghe nhạc và thư giãn trong căn phòng bar riêng.':'Đi một vòng, chọn khu bạn thích rồi chơi nhé.';
  document.querySelector('.room-footnote').innerHTML=activeRoom==='bar'?'<span>✦</span> Vào gần máy phát để thêm nhạc riêng, hoặc tìm cổng để quay lại sảnh.':'<span>✦</span> Đi tới máy game, máy nhạc hoặc cổng BAR rồi nhấn <b>E</b>.';
  window.dispatchEvent(new CustomEvent('choigi-room-changed',{detail:{room:activeRoom}}));
  updateNearby();
}
function openStation(station) {
  if(!station||station.userData.room!==activeRoom)return;
  if(station.userData.gameId==='jukebox')window.openMusicPanel(activeRoom);
  else if(station.userData.gameId==='door')switchRoom(station.userData.targetRoom);
  else if(station.userData.gameId==='seat'){
    seated=!seated;
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
  nearest = distance < 2.5 ? closest : null;
  if (nearest) {
    const music = nearest.userData.gameId === 'jukebox', seat=nearest.userData.gameId==='seat',door=nearest.userData.gameId==='door';
    message.textContent = door ? (activeRoom==='bar'?'Bạn đang ở cửa ra sảnh. Nhấn E để quay lại.':'Bạn đang ở cửa BAR. Nhấn E để vào quán!') : seat ? (seated?'Bạn đang ngồi thư giãn. Nhấn E để đứng dậy.':'Bạn đang ở gần ghế. Nhấn E để ngồi!') : music ? 'Bạn đang ở máy phát nhạc. Nhấn E để chọn nhạc!' : `Bạn đang ở khu ${nearest.userData.name}. Nhấn E để chơi!`;
    interact.lastChild.textContent = door ? (activeRoom==='bar'?' Về sảnh':' Vào BAR') : seat ? (seated?' Đứng dậy':' Ngồi xuống') : music ? ' Mở máy nhạc' : ` Chơi ${nearest.userData.name}`;
    interact.classList.add('can-interact');
  } else {
    message.textContent = activeRoom==='bar'?'Khám phá quầy bar, máy nhạc hoặc tìm cửa ra sảnh.':'Đi tới máy game, máy nhạc hoặc cửa BAR rồi nhấn E.';
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
  const moving = dx !== 0 || dz !== 0;
  if (moving && !modal.classList.contains('open') && musicOverlay.hidden) {
    if(seated){seated=false;player.scale.y=1;}
    const len = Math.hypot(dx, dz); dx /= len; dz /= len;
    const nextX=THREE.MathUtils.clamp(player.position.x + dx * dt * 4.4, -12.0, 12.0);
    const nextZ=THREE.MathUtils.clamp(player.position.z + dz * dt * 4.4, -8.0, 8.0);
    const blocked=(x,z)=>roomObstacles[activeRoom].some(o=>Math.hypot(x-o.x,z-o.z)<o.r+radius) ||
      (activeRoom==='lounge'&&x>2.6&&x<7.4&&z>-7.25&&z<-5.45) ||
      (activeRoom==='bar'&&x>-9.0&&x<0.4&&z>-6.45&&z<-4.82);
    if(!blocked(nextX,player.position.z)) player.position.x=nextX;
    if(!blocked(player.position.x,nextZ)) player.position.z=nextZ;
    player.rotation.y = Math.atan2(dx, dz);
  }
  const t = clock.elapsedTime;
  for(const item of animatedDecor){if(item.type==='leaf')item.mesh.rotation.z=item.base+Math.sin(t*1.1+item.phase)*0.075;else if(item.type==='record')item.mesh.rotation.z=t*1.7;else if(item.type==='neon')item.mesh.material.emissiveIntensity=0.75+Math.sin(t*2+item.phase)*0.35;}
  for(const mote of fireflies){const a=t*mote.speed+mote.phase;mote.mesh.position.set(Math.cos(a)*mote.radiusX,mote.baseY+Math.sin(t*1.3+mote.phase)*0.34,Math.sin(a*0.82)*mote.radiusZ);mote.mesh.rotation.x=a;mote.mesh.rotation.y=a*0.7;}
  fan.rotation.y=t*0.48;
  screenLight.intensity=0.9+Math.sin(t*1.4)*0.22;
  orb.position.y=1.05+Math.sin(t*1.6)*0.17;
  discoBall.rotation.y=t*0.32;discoBall.rotation.x=Math.sin(t*0.4)*0.12;
  discoLight.intensity=1.0+Math.sin(t*1.9)*0.65;
  barSpotLights.forEach((light,i)=>{light.intensity=1.1+Math.sin(t*2.2+i*2.1)*1.0;light.position.x=Math.sin(t*0.45+i*2.1)*8;});
  danceTiles.forEach(({mesh,phase})=>{mesh.material.emissiveIntensity=0.28+Math.max(0,Math.sin(t*2.6+phase))*1.0;});
  player.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.08 : Math.sin(t * 2) * 0.018;
  legs.forEach((leg, i) => { leg.rotation.x = moving ? Math.sin(t * 10 + i * Math.PI) * 0.48 : 0; });
  arms.forEach(({arm,side}) => { arm.rotation.x = moving ? Math.sin(t * 10 + (side > 0 ? Math.PI : 0)) * 0.38 : Math.sin(t * 2 + side) * 0.025; });
  for (const station of stations) {
    const screen = station.children.find(c => c.geometry?.type === 'BoxGeometry' && c.position.y === 1.33 && c.position.z === 0.55);
    if (screen) screen.material.emissiveIntensity = 0.7 + Math.sin(t * 2.2 + station.position.x) * 0.16;
  }
  updateNearby();
  // Keep the real YouTube iframe aligned with the perspective-projected 3D screen.
  const activeScreen=activeRoom==='bar'?barScreenGroup:videoScreenGroup;
  const halfWidth=activeRoom==='bar'?3.26:3.74,halfHeight=activeRoom==='bar'?1.86:2.015;
  const activeProjection=activeRoom==='bar'?barProjectionFrame:projectionFrame;
  const corners=[new THREE.Vector3(-halfWidth,-halfHeight,0.23),new THREE.Vector3(halfWidth,-halfHeight,0.23),new THREE.Vector3(halfWidth,halfHeight,0.23),new THREE.Vector3(-halfWidth,halfHeight,0.23)].map(v=>activeScreen.localToWorld(v).project(camera));
  const rect=host.getBoundingClientRect(), px=corners.map(v=>({x:(v.x+1)*rect.width/2,y:(1-v.y)*rect.height/2}));
  const left=Math.min(...px.map(p=>p.x)),top=Math.min(...px.map(p=>p.y)),right=Math.max(...px.map(p=>p.x)),bottom=Math.max(...px.map(p=>p.y));
  activeProjection.style.left=`${left}px`; activeProjection.style.top=`${top}px`; activeProjection.style.width=`${right-left}px`; activeProjection.style.height=`${bottom-top}px`;
  activeProjection.style.display=bottom>0&&top<rect.height&&right>0&&left<rect.width?'block':'none';
  (activeRoom==='bar'?projectionFrame:barProjectionFrame).style.display='none';
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
