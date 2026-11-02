import * as THREE from 'three';

const host = document.querySelector('#roomScene');
const message = document.querySelector('#roomMessage');
const interact = document.querySelector('#interactBtn');
const modal = document.querySelector('#gameModal');
const musicOverlay = document.querySelector('#musicOverlay');
if (!host) throw new Error('Không tìm thấy khu vực phòng game.');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#252033');
scene.fog = new THREE.Fog('#252033', 18, 33);
const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
camera.position.set(0, 10.5, 16.5);
camera.lookAt(0, 1, 0);
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
const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.35, 12), floorMat);
floor.position.set(0, -0.22, 0); floor.receiveShadow = true; scene.add(floor);

function box(parent, w, h, d, material, x, y, z, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
// Three enclosing walls make the lobby read as a real room while leaving the front open to the camera.
box(scene, 18, 7, 0.38, wallMat, 0, 3.28, -6.05);
box(scene, 0.38, 7, 12, mat('#443750'), -8.95, 3.28, 0);
box(scene, 0.38, 7, 12, mat('#443750'), 8.95, 3.28, 0);
box(scene, 18, 0.18, 0.5, trimMat, 0, 0.05, -5.78, false);
box(scene, 0.5, 0.18, 12, trimMat, -8.72, 0.05, 0, false);
box(scene, 0.5, 0.18, 12, trimMat, 8.72, 0.05, 0, false);

// Big sunset window, mullions, and a low sill on the back wall.
const windowGlow = mat('#f4a6c2', 0.24, { emissive: '#dc7fa8', emissiveIntensity: 0.62 });
box(scene, 5.1, 3.55, 0.16, mat('#281f39'), -4.55, 4.55, -5.79, false);
box(scene, 4.68, 3.1, 0.08, windowGlow, -4.55, 4.58, -5.68, false);
box(scene, 0.11, 3.08, 0.12, mat('#563a59'), -4.55, 4.58, -5.59, false);
box(scene, 4.7, 0.12, 0.12, mat('#563a59'), -4.55, 4.58, -5.58, false);
box(scene, 5.15, 0.2, 0.55, mat('#32243d'), -4.55, 2.79, -5.45);

// A framed wall feature and gallery strip add depth to the wall.
box(scene, 3.6, 1.85, 0.18, mat('#30243b'), 2.8, 4.75, -5.78, false);
box(scene, 3.36, 1.62, 0.08, mat('#b288c7', 0.35, { emissive: '#624084', emissiveIntensity: 0.42 }), 2.8, 4.75, -5.66, false);
for (let i = 0; i < 4; i++) {
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.58, 0.12), mat(i % 2 ? '#f7b1bf' : '#d6ff8c', 0.4, { emissive: i % 2 ? '#7a374d' : '#526427', emissiveIntensity: 0.4 }));
  frame.position.set(1.68 + i * 0.75, 2.7, -5.7); frame.castShadow = true; scene.add(frame);
}

// Layered oval rug, stitched border, and low central table.
const rug = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 0.08, 64), mat('#a66584'));
rug.scale.set(1, 1, 0.62); rug.position.set(0, 0.01, 0.25); rug.receiveShadow = true; rug.castShadow = true; scene.add(rug);
const rugInner = new THREE.Mesh(new THREE.CylinderGeometry(4.55, 4.55, 0.09, 64), mat('#715279'));
rugInner.scale.set(1, 1, 0.62); rugInner.position.set(0, 0.03, 0.25); rugInner.receiveShadow = true; scene.add(rugInner);
const table = new THREE.Group(); table.position.set(0, 0, 1.0); scene.add(table);
const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.1, 0.2, 12), mat('#d398a4', 0.34));
tableTop.position.y = 0.8; tableTop.castShadow = true; table.add(tableTop);
const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.72, 8), mat('#403047'));
tableLeg.position.y = 0.36; tableLeg.castShadow = true; table.add(tableLeg);
const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat('#d6ff8c', 0.2, { emissive: '#9ee851', emissiveIntensity: 1.2 }));
orb.position.set(0, 1.05, 1); scene.add(orb);

// Decorative potted plants built from simple low-poly geometry.
function plant(x, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); scene.add(g);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.33, 0.65, 8), mat('#c7838e')); pot.position.y = 0.34; pot.castShadow = true; g.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8), mat('#382b35')); soil.position.y = 0.69; g.add(soil);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.33, 8, 6), mat(i % 2 ? '#89b77d' : '#a6cf8a'));
    const a = i * Math.PI / 3; leaf.position.set(Math.cos(a) * 0.38, 1.08 + (i % 3) * 0.13, Math.sin(a) * 0.35); leaf.scale.set(0.62, 1.45, 0.55); leaf.rotation.z = -Math.cos(a) * 0.45; leaf.castShadow = true; g.add(leaf);
  }
}
plant(-7.5, -4.8, 1.12); plant(7.5, -4.8, 1.15); plant(-7.45, 3.5, 0.9); plant(7.45, 3.2, 0.92);

// A soft sofa, throw pillows, and a little pouf make the lounge feel lived in.
const sofa = new THREE.Group(); sofa.position.set(3.1, 0, -4.9); scene.add(sofa);
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
const pouf = new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.68,0.58,12),mat('#cf8c9c')); pouf.position.set(-2.4,0.3,3.25); pouf.castShadow=true; pouf.receiveShadow=true; scene.add(pouf);
const poufTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.1,12),mat('#efb5a1')); poufTop.position.set(-2.4,0.62,3.25); poufTop.castShadow=true; scene.add(poufTop);

// Vinyl wall art and warm fairy lights bring color into the back wall.
const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(0.78,0.78,0.08,48),mat('#231a2e',0.25)); vinyl.rotation.x=Math.PI/2; vinyl.position.set(-0.75,4.55,-5.65); vinyl.castShadow=true; scene.add(vinyl);
const vinylRing = new THREE.Mesh(new THREE.TorusGeometry(0.49,0.035,8,48),mat('#ff9ec2',0.25,{emissive:'#c64d86',emissiveIntensity:0.65})); vinylRing.position.set(-0.75,4.55,-5.57); scene.add(vinylRing);
const vinylHub = new THREE.Mesh(new THREE.SphereGeometry(0.13,12,10),mat('#d6ff8c',0.25,{emissive:'#a3dc58',emissiveIntensity:0.6})); vinylHub.position.set(-0.75,4.55,-5.52); scene.add(vinylHub);
const wirePoints=[];for(let i=0;i<=24;i++){const x=-7.8+i*0.65;wirePoints.push(new THREE.Vector3(x,5.95-Math.sin(i/24*Math.PI)*0.48,-5.57))}const wire=new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePoints),new THREE.LineBasicMaterial({color:'#e2b8bb'}));scene.add(wire);
for(let i=0;i<13;i++){const x=-7.5+i*1.25,y=5.95-Math.sin(i/12*Math.PI)*0.48;const bulb=glowingSphere(i%3===0?'#d6ff8c':'#ffc58f',0.8,x,y-0.08,-5.5,0.09);const glow=new THREE.PointLight(i%3===0?'#d6ff8c':'#ffc58f',0.3,1.5);glow.position.set(x,y-0.1,-5.2);scene.add(glow)}

// Neon wall sign and warm sconces.
function glowingSphere(color, intensity, x, y, z, radius = 0.12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), mat(color, 0.25, { emissive: color, emissiveIntensity: intensity }));
  m.position.set(x, y, z); scene.add(m); return m;
}
glowingSphere('#d6ff8c', 1.4, 7.0, 5.5, -5.63, 0.2);
glowingSphere('#ff9bc0', 1.4, -7.0, 5.5, -5.63, 0.2);
const neon = new THREE.PointLight('#d6ff8c', 2.4, 7); neon.position.set(6.4, 4.8, -4.8); scene.add(neon);
const sunset = new THREE.PointLight('#ff9fc5', 2.8, 9); sunset.position.set(-4.5, 4.5, -3.9); scene.add(sunset);

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
const stationDefs = [
  { id: 'guess', name: 'ĐOÁN SỐ', x: -6.1, z: -1.0, color: '#aa83ff', icon: '?', hint: 'CHƠI NHANH' },
  { id: 'memory', name: 'TRÍ NHỚ', x: -3.25, z: -3.25, color: '#59bd9f', icon: '✦', hint: 'ĐỘNG NÃO' },
  { id: 'rps', name: 'OẲN TÙ TÌ', x: 0.05, z: -3.3, color: '#ff9f83', icon: '✊', hint: 'ĐỐI KHÁNG' },
  { id: 'reaction', name: 'PHẢN XẠ', x: 6.1, z: -1.0, color: '#d6ff72', icon: '⚡', hint: 'NHANH TAY' },
  { id: 'ttt', name: 'CỜ CA-RÔ', x: 3.5, z: 2.65, color: '#8faeff', icon: '×', hint: 'ĐẤU TRÍ' },
];
function makeArcade(def) {
  const group = new THREE.Group(); group.position.set(def.x, 0, def.z); scene.add(group);
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
  group.userData.gameId = def.id; group.userData.name = def.name; group.userData.hitMesh = shell;
  shell.userData.station = group;
  stations.push(group);
}
stationDefs.forEach(makeArcade);

// A clickable retro jukebox for a personal YouTube queue.
function makeJukebox() {
  const group = new THREE.Group(); group.position.set(-7.15, 0, 1.1); scene.add(group);
  const shellMat = mat('#7d4a9a', 0.32, { emissive: '#351847', emissiveIntensity: 0.3 });
  const shell = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.0, 0.88), shellMat); shell.position.y = 1.08; shell.castShadow = true; group.add(shell);
  const topArch = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#b87ecb', 0.3, { emissive: '#8540a5', emissiveIntensity: 0.7 }));
  topArch.position.set(0, 2.03, 0); topArch.rotation.x = -Math.PI / 2; topArch.scale.set(1, 0.65, 0.55); group.add(topArch);
  const front = new THREE.Mesh(new THREE.BoxGeometry(1.03, 1.13, 0.08), mat('#1a1424', 0.25)); front.position.set(0, 1.28, 0.49); group.add(front);
  const record = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.075, 40), mat('#241d2b', 0.22, { emissive: '#47304e', emissiveIntensity: 0.3 }));
  record.rotation.x = Math.PI / 2; record.position.set(0, 1.48, 0.56); record.castShadow = true; group.add(record);
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
  group.userData.gameId = 'jukebox'; group.userData.name = 'MÁY PHÁT NHẠC'; shell.userData.station = group; stations.push(group);
}
makeJukebox();

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
const bounds = { x: 8.1, z: 5.1 };
function openStation(station) { if (!station) return; if (station.userData.gameId === 'jukebox') window.openMusicPanel(); else window.openGame(station.userData.gameId); }
function updateNearby() {
  let closest = null, distance = Infinity;
  for (const station of stations) {
    const d = Math.hypot(player.position.x - station.position.x, player.position.z - station.position.z);
    if (d < distance) { closest = station; distance = d; }
  }
  nearest = distance < 2.5 ? closest : null;
  if (nearest) {
    const music = nearest.userData.gameId === 'jukebox';
    message.textContent = music ? 'Bạn đang ở máy phát nhạc. Nhấn E để chọn nhạc!' : `Bạn đang ở khu ${nearest.userData.name}. Nhấn E để chơi!`;
    interact.lastChild.textContent = music ? ' Mở máy nhạc' : ` Chơi ${nearest.userData.name}`;
    interact.classList.add('can-interact');
  } else {
    message.textContent = 'Đi tới một máy game hoặc máy nhạc rồi nhấn E.';
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
  const hits = raycaster.intersectObjects(stations, true);
  return hits.map(h => h.object.userData.station || h.object.parent).find(o => o?.userData?.gameId) || null;
}
renderer.domElement.addEventListener('pointermove', e => { renderer.domElement.style.cursor = pointerPosition(e) ? 'pointer' : 'default'; });
renderer.domElement.addEventListener('click', e => { const station = pointerPosition(e); if (station) openStation(station); });

function tryInteract() {
  if (nearest) openStation(nearest);
  else window.showToast('Đi lại gần máy game hoặc máy nhạc rồi nhấn E nhé!');
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
    const len = Math.hypot(dx, dz); dx /= len; dz /= len;
    player.position.x = THREE.MathUtils.clamp(player.position.x + dx * dt * 4.4, -bounds.x, bounds.x);
    player.position.z = THREE.MathUtils.clamp(player.position.z + dz * dt * 4.4, -bounds.z, bounds.z);
    player.rotation.y = Math.atan2(dx, dz);
  }
  const t = clock.elapsedTime;
  player.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.08 : Math.sin(t * 2) * 0.018;
  legs.forEach((leg, i) => { leg.rotation.x = moving ? Math.sin(t * 10 + i * Math.PI) * 0.48 : 0; });
  arms.forEach(({arm,side}) => { arm.rotation.x = moving ? Math.sin(t * 10 + (side > 0 ? Math.PI : 0)) * 0.38 : Math.sin(t * 2 + side) * 0.025; });
  for (const station of stations) {
    const screen = station.children.find(c => c.geometry?.type === 'BoxGeometry' && c.position.y === 1.33 && c.position.z === 0.55);
    if (screen) screen.material.emissiveIntensity = 0.7 + Math.sin(t * 2.2 + station.position.x) * 0.16;
  }
  updateNearby();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
