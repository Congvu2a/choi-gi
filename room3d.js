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
window.addEventListener('choigi-video-active', e => {const active=e.detail?.active;projectionHint.hidden=Boolean(active);videoScreenSurface.material.color.set(active?'#090a12':'#12101b');});

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
sofa.userData.gameId='seat';sofa.userData.name='SOFA';sofa.userData.seatTarget={x:5,z:-3.65};
const pouf = new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.68,0.58,12),mat('#cf8c9c')); pouf.position.set(0,0.3,7.5); pouf.castShadow=true; pouf.receiveShadow=true; loungeRoot.add(pouf);
const poufTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.1,12),mat('#efb5a1')); poufTop.position.set(0,0.62,7.5); poufTop.castShadow=true; loungeRoot.add(poufTop);

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
function makePortal(parent,x,z,label,color,targetRoom){
  const group=new THREE.Group();group.position.set(x,0,z);parent.add(group);
  const glow=mat(color,0.2,{emissive:color,emissiveIntensity:1.4});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.12,0.11,12,40),glow);ring.position.y=1.35;ring.castShadow=true;group.add(ring);
  const base=box(group,2.8,0.14,0.7,mat('#33223c'),0,0.1,0);
  const light=new THREE.PointLight(color,1.7,4);light.position.y=1.3;group.add(light);
  const sign=addLabel(group,label,color);sign.position.set(0,2.8,0);sign.scale.set(2.8,0.7,1);
  ring.userData.station=group;base.userData.station=group;
  group.userData.gameId='door';group.userData.name=label;group.userData.room=parent.userData.roomKey||'lounge';group.userData.targetRoom=targetRoom;
  stations.push(group);return group;
}

const stations = [];
sofa.userData.room='lounge';stations.push(sofa);
const obstacles = [];
const leftRoot=new THREE.Group();leftRoot.name='phong-game-trai';leftRoot.userData.roomKey='left';leftRoot.visible=false;scene.add(leftRoot);
const rightRoot=new THREE.Group();rightRoot.name='phong-game-phai';rightRoot.userData.roomKey='right';rightRoot.visible=false;scene.add(rightRoot);
const roomRoots={lounge:loungeRoot,left:leftRoot,right:rightRoot};
const roomObstacles={lounge:obstacles,left:[],right:[]};
function buildArcadeRoom(root,{floor,wall,accent,title}){
  box(root,30,0.35,18,mat(floor),0,-0.22,0,false);
  box(root,30,7.5,0.38,mat(wall),0,3.53,-9.05);
  box(root,0.38,7.5,18,mat(wall),-14.95,3.53,0);box(root,0.38,7.5,18,mat(wall),14.95,3.53,0);
  const trim=mat(accent,0.24,{emissive:accent,emissiveIntensity:1.0});
  box(root,29.6,0.12,0.18,trim,0,0.16,-8.78,false);
  box(root,29.6,0.08,0.14,trim,0,6.75,-8.78,false);
  const sign=addLabel(root,title,accent);sign.position.set(0,5.95,-8.55);sign.scale.set(5.2,1.05,1);
  for(let i=0;i<7;i++){
    const x=-12+i*4,ball=new THREE.Mesh(new THREE.SphereGeometry(0.12,12,8),mat(accent,0.2,{emissive:accent,emissiveIntensity:0.8}));ball.position.set(x,6.65,-7.9);root.add(ball);
    const light=new THREE.PointLight(accent,0.5,4);light.position.set(x,6.1,-6.7);root.add(light);
    animatedDecor.push({type:'pulseLight',light,phase:i*0.7});
  }
}
buildArcadeRoom(leftRoot,{floor:'#443a5c',wall:'#382e50',accent:'#7bdcff',title:'PHÒNG GAME · TRÁI'});
buildArcadeRoom(rightRoot,{floor:'#49384e',wall:'#3c2b49',accent:'#ff91cf',title:'PHÒNG GAME · PHẢI'});
let activeRoom = 'lounge';
const stationDefs = [
  { id: 'guess', name: 'ĐOÁN SỐ', room:'left', x: -9.5, z: -1.6, color: '#aa83ff', icon: '?', hint: 'CHƠI NHANH' },
  { id: 'memory', name: 'TRÍ NHỚ', room:'left', x: -3.2, z: -1.6, color: '#59bd9f', icon: '✦', hint: 'ĐỘNG NÃO' },
  { id: 'rps', name: 'OẲN TÙ TÌ', room:'left', x: 3.2, z: -1.6, color: '#ff9f83', icon: '✊', hint: 'ĐỐI KHÁNG' },
  { id: 'reaction', name: 'PHẢN XẠ', room:'left', x: 9.5, z: -1.6, color: '#d6ff72', icon: '⚡', hint: 'NHANH TAY' },
  { id: 'ttt', name: 'CỜ CA-RÔ', room:'left', x: 0, z: 4.3, color: '#8faeff', icon: '×', hint: 'ĐẤU TRÍ' },
  { id: 'math', name: 'TÍNH NHẨM', room:'right', x: -9.5, z: -1.6, color: '#ffc96e', icon: '+', hint: 'ĐỘNG NÃO' },
  { id: 'whack', name: 'ĐẬP CHUỘT', room:'right', x: -3.2, z: -1.6, color: '#ff79ae', icon: '🐹', hint: 'NHANH TAY' },
  { id: 'coin', name: 'SẤP HAY NGỬA', room:'right', x: 3.2, z: -1.6, color: '#67d8d0', icon: '✦', hint: 'MAY MẮN' },
  { id: 'shooter', name: 'BẮN TÀU', room:'right', x: 9.5, z: -1.6, color: '#79d8ff', icon: '✦', hint: 'BẮN TÀU VŨ TRỤ' },
  { id: 'merge', name: '2048', room:'right', x: -5.0, z: 4.3, color: '#ffb86b', icon: '8', hint: 'GHÉP SỐ' },
  { id: 'mines', name: 'GỠ MÌN', room:'right', x: 5.0, z: 4.3, color: '#c4a0ff', icon: '⚑', hint: 'DÒ MÌN' },
];
function makeArcade(def) {
  const group = new THREE.Group(); group.position.set(def.x, 0, def.z); roomRoots[def.room].add(group);
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
  roomObstacles[def.room].push({ x:def.x, z:def.z, r:0.92 });
  stations.push(group);
}
stationDefs.forEach(makeArcade);

// A clickable retro jukebox for a personal YouTube queue.
function makeJukebox() {
  const group = new THREE.Group(); group.position.set(-8.2, 0, 0.2); loungeRoot.add(group);
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
  obstacles.push({ x:-8.2, z:0.2, r:0.98 });
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
makeChair(-3.15,1.4,Math.PI); makeChair(3.15,1.4,Math.PI); makeChair(0,5.2,Math.PI);
obstacles.push({x:0,z:1,r:1.35}); // low central table
obstacles.push({x:0,z:-8.1,r:4.8}); // cinema screen and wall margin
obstacles.push({x:5,z:-6.4,r:2.15}); // sofa
obstacles.push({x:0,z:7.5,r:0.78}); // pouf
for(const [x,z] of [[-13.3,-7.6],[13.3,-7.6],[-13.3,6.2],[13.3,6.0]]) obstacles.push({x,z,r:0.55});

// Portals connect the central social lobby to the two arcade wings.
const portalLeft=makePortal(loungeRoot,-12.2,3.2,'GAME · TRÁI','#7bdcff','left');
portalLeft.userData.targetSpawn={x:0,z:-2.8};
const portalRight=makePortal(loungeRoot,12.2,3.2,'GAME · PHẢI','#ff91cf','right');
portalRight.userData.targetSpawn={x:0,z:-2.8};
const portalLeftReturn=makePortal(leftRoot,0,-6.8,'VỀ SẢNH','#d6ff72','lounge');portalLeftReturn.userData.targetSpawn={x:-10.3,z:3.2};
const portalRightReturn=makePortal(rightRoot,0,-6.8,'VỀ SẢNH','#d6ff72','lounge');portalRightReturn.userData.targetSpawn={x:10.3,z:3.2};
const portals=[portalLeft,portalRight,portalLeftReturn,portalRightReturn];

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
function switchRoom(room,spawn){
  const next=['lounge','left','right'].includes(room)?room:'lounge';
  if(next===activeRoom)return;
  activeRoom=next;
  for(const [id,root] of Object.entries(roomRoots))root.visible=id===activeRoom;
  const shell=document.querySelector('.room-shell');shell?.classList.toggle('bar-mode',activeRoom==='right');shell?.classList.toggle('left-mode',activeRoom==='left');
  const entry=spawn||({lounge:{x:0,z:3.4},left:{x:0,z:-2.8},right:{x:0,z:-2.8}}[activeRoom]);
  player.position.set(entry.x,0,entry.z);seated=false;player.scale.y=1;keys.clear();playerVelocity.set(0,0);
  const copy={lounge:['SẢNH CHILL','Sảnh trò chuyện <span>✳</span>','Ngồi thư giãn, trò chuyện và cùng xem video.'],left:['PHÒNG GAME · TRÁI','Phòng game <span>TRÁI</span>','Chọn một máy chơi rồi nhấn E để bắt đầu.'],right:['PHÒNG GAME · PHẢI','Phòng game <span>PHẢI</span>','Thêm trò mới đang chờ bạn khám phá.']}[activeRoom];
  document.querySelector('#roomEyebrow').textContent=copy[0];document.querySelector('#roomHeading').innerHTML=copy[1];document.querySelector('#roomIntro').textContent=copy[2];
  document.querySelector('.room-footnote').innerHTML=activeRoom==='lounge'?'<span>✦</span> Hai cổng hai bên dẫn tới phòng mini game. Máy phát ở sảnh phát nhạc xuyên cả ba phòng.':'<span>✦</span> Đi lại gần máy chơi để chơi, tìm cổng <b>VỀ SẢNH</b> để quay lại.';
  window.dispatchEvent(new CustomEvent('choigi-room-changed',{detail:{room:activeRoom}}));updateNearby();
}
function openStation(station) {
  if(!station||station.userData.room!==activeRoom)return;
  if(station.userData.gameId==='jukebox'){
    if(typeof window.openMusicPanel==='function')window.openMusicPanel(activeRoom);
    else window.showToast('Máy phát nhạc chưa tải xong. Hãy tải lại trang một lần nhé.');
  }
  else if(station.userData.gameId==='door')switchRoom(station.userData.targetRoom,station.userData.targetSpawn);
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
    const targetName=nearest.userData.targetRoom==='left'?'phòng game bên trái':nearest.userData.targetRoom==='right'?'phòng game bên phải':'sảnh';
    message.textContent = door ? `Cổng tới ${targetName}. Nhấn E để đi qua.` : seat ? (seated?'Bạn đang ngồi thư giãn. Nhấn E để đứng dậy.':`Bạn đang gần ${nearest.userData.name}. Nhấn E để ngồi.`) : music ? 'Máy phát chung của sảnh. Nhấn E để chọn nhạc!' : `Bạn đang ở máy ${nearest.userData.name}. Nhấn E để chơi!`;
    interact.lastChild.textContent = door ? ` Đi tới ${targetName}` : seat ? (seated?' Đứng dậy':' Ngồi xuống') : music ? ' Mở máy phát chung' : ` Chơi ${nearest.userData.name}`;
    interact.classList.add('can-interact');
  } else {
    message.textContent = activeRoom==='lounge'?'Đi tới máy phát chung, ngồi ghế hoặc chọn một trong hai cổng.':'Khám phá các máy game hoặc tìm cổng VỀ SẢNH.';
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
  const screenHit=activeRoom==='lounge'?raycaster.intersectObject(videoScreenSurface,false)[0]:null;
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
  const blocked=(x,z)=>roomObstacles[activeRoom].some(o=>Math.hypot(x-o.x,z-o.z)<o.r+radius);
  const nextX=THREE.MathUtils.clamp(player.position.x+playerVelocity.x*dt,-14,14);
  const nextZ=THREE.MathUtils.clamp(player.position.z+playerVelocity.y*dt,-8,8);
  if(!blocked(nextX,player.position.z))player.position.x=nextX;else playerVelocity.x=0;
  if(!blocked(player.position.x,nextZ))player.position.z=nextZ;else playerVelocity.y=0;
  const speed=Math.hypot(playerVelocity.x,playerVelocity.y),moving=speed>0.22;
  if(moving){const wanted=Math.atan2(playerVelocity.x,playerVelocity.y),turn=Math.atan2(Math.sin(wanted-player.rotation.y),Math.cos(wanted-player.rotation.y));player.rotation.y+=turn*(1-Math.exp(-13*dt));}
  walkPhase+=speed*dt*3.4;
  cameraGoal.set(player.position.x,player.position.y+14.2,player.position.z+22.55);
  lookGoal.set(player.position.x,player.position.y+2.1,player.position.z-3.45);
  const cameraBlend=1-Math.exp(-4.2*dt);
  camera.position.lerp(cameraGoal,cameraBlend);cameraLook.lerp(lookGoal,cameraBlend);camera.lookAt(cameraLook);
  const t = clock.elapsedTime;
  for(const item of animatedDecor){if(item.type==='leaf')item.mesh.rotation.z=item.base+Math.sin(t*1.1+item.phase)*0.075;else if(item.type==='record')item.mesh.rotation.z=t*1.7;else if(item.type==='neon')item.mesh.material.emissiveIntensity=0.75+Math.sin(t*2+item.phase)*0.35;else if(item.type==='pulseLight')item.light.intensity=0.28+Math.max(0,Math.sin(t*2+item.phase))*0.55;}
  for(const mote of fireflies){const a=t*mote.speed+mote.phase;mote.mesh.position.set(Math.cos(a)*mote.radiusX,mote.baseY+Math.sin(t*1.3+mote.phase)*0.34,Math.sin(a*0.82)*mote.radiusZ);mote.mesh.rotation.x=a;mote.mesh.rotation.y=a*0.7;}
  fan.rotation.y=t*0.48;
  screenLight.intensity=0.9+Math.sin(t*1.4)*0.22;
  orb.position.y=1.05+Math.sin(t*1.6)*0.17;
  for(const [i,portal] of portals.entries()){const pulse=1+Math.sin(t*2.2+i)*0.07;portal.children[0].scale.setScalar(pulse);portal.children[0].rotation.z=t*0.12;}
  player.position.y = moving ? Math.abs(Math.sin(walkPhase*2)) * Math.min(0.055,speed*0.012) : Math.sin(t * 1.6) * 0.014;
  legs.forEach((leg, i) => { leg.rotation.x = moving ? Math.sin(walkPhase + i * Math.PI) * 0.38 : THREE.MathUtils.damp(leg.rotation.x,0,9,dt); });
  arms.forEach(({arm,side}) => { arm.rotation.x = moving ? Math.sin(walkPhase + (side > 0 ? Math.PI : 0)) * 0.3 : THREE.MathUtils.damp(arm.rotation.x,0,8,dt); });
  for (const station of stations) {
    const screen = station.children.find(c => c.geometry?.type === 'BoxGeometry' && c.position.y === 1.33 && c.position.z === 0.55);
    if (screen) screen.material.emissiveIntensity = 0.7 + Math.sin(t * 2.2 + station.position.x) * 0.16;
  }
  updateNearby();
  // Keep the real YouTube iframe aligned with the perspective-projected 3D screen.
  const activeScreen=videoScreenGroup;
  const halfWidth=3.6,halfHeight=2.025;
  const activeProjection=projectionFrame;
  const corners=[new THREE.Vector3(-halfWidth,-halfHeight,0.23),new THREE.Vector3(halfWidth,-halfHeight,0.23),new THREE.Vector3(halfWidth,halfHeight,0.23),new THREE.Vector3(-halfWidth,halfHeight,0.23)].map(v=>activeScreen.localToWorld(v).project(camera));
  const rect=host.getBoundingClientRect(), px=corners.map(v=>({x:(v.x+1)*rect.width/2,y:(1-v.y)*rect.height/2}));
  const left=Math.min(...px.map(p=>p.x)),top=Math.min(...px.map(p=>p.y)),right=Math.max(...px.map(p=>p.x)),bottom=Math.max(...px.map(p=>p.y));
  activeProjection.style.left=`${left}px`;activeProjection.style.top=`${top}px`;activeProjection.style.width=`${right-left}px`;activeProjection.style.height=`${bottom-top}px`;
  activeProjection.style.display=bottom>0&&top<rect.height&&right>0&&left<rect.width?'block':'none';
  activeProjection.style.visibility=activeRoom==='lounge'?'visible':'hidden';
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
