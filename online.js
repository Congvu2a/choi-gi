import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, deleteUser } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import { getDatabase, ref, get, set, update, remove, push, query, orderByChild, startAt, endAt, limitToFirst, limitToLast, onValue, onDisconnect, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js';
import { firebaseConfig, firebaseReady } from './firebase-config.js?v=20261104-online2';

const $ = selector => document.querySelector(selector);
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const overlay = $('#socialOverlay');
const authSection = $('#authSection');
const signedInSection = $('#signedInSection');
const authForm = $('#authForm');
const authError = $('#authError');
const status = $('#onlineStatus');
let auth = null, db = null, user = null, profile = null, profileSetupPromise = null;
let authMode = 'login', currentRoom = 'lounge', lastPosition = { x: 0, z: 3.45 };
let stopRoomListener = null, stopFriendListener = null, stopRequestListener = null, stopChatListener = null;
let presenceRef = null, presenceWorld = null, positionWriteAt = 0;

function showError(error) {
  const messages = {
    'auth/email-already-in-use': 'Email này đã có tài khoản rồi.',
    'auth/invalid-email': 'Email chưa đúng định dạng.',
    'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
    'auth/invalid-credential': 'Email hoặc mật khẩu chưa đúng.',
    'auth/network-request-failed': 'Mạng đang lỗi. Thử lại sau nhé.',
    'PERMISSION_DENIED': 'Firebase đang từ chối quyền. Kiểm tra Realtime Database Rules.'
  };
  return messages[error?.code] || messages[error?.message] || error?.message || 'Có lỗi xảy ra. Thử lại nhé.';
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
  $('#signupFields').hidden = mode !== 'signup';
  $('#characterName').required = mode === 'signup';
  $('#characterTag').required = mode === 'signup';
  $('#authSubmit').textContent = mode === 'signup' ? 'Tạo tài khoản' : 'Đăng nhập';
  $('#authPassword').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  authError.textContent = '';
}

function cleanHandle(value) { return value.trim().toLowerCase().replace(/^@/, ''); }
function showProfile() {
  authSection.hidden = Boolean(user);
  signedInSection.hidden = !user;
  if (!user) return;
  $('#socialName').textContent = profile?.displayName || 'Người chơi';
  $('#socialHandle').textContent = `@${profile?.username || 'player'}`;
  $('#socialAvatar').textContent = (profile?.displayName || '✦').trim().slice(0, 1).toUpperCase();
  $('#displayNameEdit').value = profile?.displayName || '';
  const profileButton = $('#onlineBtn');
  profileButton.textContent = $('#socialAvatar').textContent;
  profileButton.title = `${profile?.displayName || 'Người chơi'} · tài khoản, bạn bè, chat`;
}

function stopListeners() {
  [stopRoomListener, stopFriendListener, stopRequestListener, stopChatListener].forEach(stop => stop?.());
  stopRoomListener = stopFriendListener = stopRequestListener = stopChatListener = null;
}

async function reserveAndCreateProfile(uid, username, displayName) {
  const handle = cleanHandle(username);
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) throw new Error('Tên tài khoản cần 3–20 ký tự: chữ a–z, số hoặc gạch dưới.');
  const reservation = await runTransaction(ref(db, `usernames/${handle}`), value => value === null ? uid : undefined);
  if (!reservation.committed || reservation.snapshot.val() !== uid) throw new Error('Tên tài khoản này đã được dùng. Chọn tên khác nhé.');
  try {
    await set(ref(db, `profiles/${uid}`), {
      username: handle,
      usernameLower: handle,
      displayName: displayName.trim().slice(0, 20) || 'Người chơi',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    await remove(ref(db, `usernames/${handle}`)).catch(() => {});
    throw error;
  }
}

authForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!auth) return;
  const email = $('#authEmail').value.trim();
  const password = $('#authPassword').value;
  const button = $('#authSubmit'); button.disabled = true; authError.textContent = '';
  try {
    if (authMode === 'signup') {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      profileSetupPromise = reserveAndCreateProfile(credential.user.uid, $('#characterTag').value, $('#characterName').value);
      try { await profileSetupPromise; } catch(error) { await deleteUser(credential.user).catch(()=>{}); throw error; }
      finally { profileSetupPromise = null; }
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    authError.textContent = showError(error);
    if (error?.code === 'auth/email-already-in-use') setAuthMode('login');
  } finally { button.disabled = false; }
});

$('#signOutBtn').addEventListener('click', () => signOut(auth).catch(error => window.showToast(showError(error))));
$('#nameForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!user || !profile) return;
  const displayName = $('#displayNameEdit').value.trim().slice(0, 20);
  if (!displayName) return;
  try {
    await update(ref(db, `profiles/${user.uid}`), { displayName });
    profile.displayName = displayName; showProfile();
    await updatePresence();
    window.showToast('Đã lưu tên nhân vật.');
  } catch (error) { window.showToast(showError(error)); }
});

function renderRequests(snapshot) {
  const list = $('#friendRequests'); list.replaceChildren();
  const rows = [];
  snapshot.forEach(child => { if (child.val()?.status === 'pending') rows.push({ uid: child.key, ...child.val() }); });
  if (!rows.length) { list.innerHTML = '<p class="social-empty">Chưa có lời mời kết bạn.</p>'; return; }
  rows.forEach(request => {
    const row = document.createElement('div'); row.className = 'social-list-row';
    const copy = document.createElement('span'); copy.textContent = `${request.fromName || 'Người chơi'} · @${request.fromUid.slice(0, 6)}`;
    const accept = document.createElement('button'); accept.type = 'button'; accept.className = 'social-quiet'; accept.textContent = 'Chấp nhận';
    accept.addEventListener('click', async () => {
      accept.disabled = true;
      try {
        const updates = {};
        updates[`friendRequests/${user.uid}/${request.uid}/status`] = 'accepted';
        updates[`friends/${user.uid}/${request.uid}`] = true;
        updates[`friends/${request.uid}/${user.uid}`] = true;
        await update(ref(db), updates);
      } catch (error) { window.showToast(showError(error)); accept.disabled = false; }
    });
    row.append(copy, accept); list.append(row);
  });
}

function watchSocialData() {
  stopListeners();
  if (!user) return;
  stopFriendListener = onValue(ref(db, `friends/${user.uid}`), async snapshot => {
    const list = $('#friendList'); list.replaceChildren();
    const ids = Object.keys(snapshot.val() || {});
    if (!ids.length) { list.innerHTML = '<p class="social-empty">Thêm bạn bằng tên tài khoản @ của họ.</p>'; return; }
    const profiles = await Promise.all(ids.map(async uid => ({ uid, data: (await get(ref(db, `profiles/${uid}`))).val() })));
    profiles.forEach(({ uid, data }) => {
      if (!data) return;
      const row = document.createElement('div'); row.className = 'social-list-row';
      const copy = document.createElement('span'); copy.textContent = `${data.displayName} · @${data.username}`;
      const badge = document.createElement('small'); badge.className = 'friend-badge'; badge.textContent = 'Bạn bè';
      row.append(copy, badge); list.append(row);
    });
  });
  stopRequestListener = onValue(ref(db, `friendRequests/${user.uid}`), renderRequests);
}

$('#friendSearchForm').addEventListener('submit', async event => {
  event.preventDefault();
  const handle = cleanHandle($('#friendSearch').value);
  const results = $('#friendSearchResults'); results.replaceChildren();
  if (!handle || !user) return;
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) { results.innerHTML = '<p class="social-empty">Dùng 3–20 ký tự: chữ thường, số hoặc gạch dưới.</p>'; return; }
  try {
    const found = await get(query(ref(db, 'profiles'), orderByChild('usernameLower'), startAt(handle), endAt(`${handle}\uf8ff`), limitToFirst(10)));
    const matches = [];
    found.forEach(child => { if (child.key !== user.uid && child.val()?.usernameLower === handle) matches.push({ uid: child.key, ...child.val() }); });
    if (!matches.length) { results.innerHTML = '<p class="social-empty">Không tìm thấy tên tài khoản đó.</p>'; return; }
    for (const person of matches) {
      const row = document.createElement('div'); row.className = 'social-list-row';
      const copy = document.createElement('span'); copy.textContent = `${person.displayName} · @${person.username}`;
      const add = document.createElement('button'); add.type = 'button'; add.className = 'social-quiet'; add.textContent = 'Kết bạn';
      add.addEventListener('click', async () => {
        add.disabled = true;
        try {
          if ((await get(ref(db, `friends/${user.uid}/${person.uid}`))).exists()) { add.textContent = 'Đã là bạn'; return; }
          await set(ref(db, `friendRequests/${person.uid}/${user.uid}`), { fromUid: user.uid, fromName: profile.displayName, status: 'pending', createdAt: serverTimestamp() });
          add.textContent = 'Đã gửi';
        } catch (error) { window.showToast(showError(error)); add.disabled = false; }
      });
      row.append(copy, add); results.append(row);
    }
  } catch (error) { results.innerHTML = `<p class="social-empty">${showError(error)}</p>`; }
});

function renderMessages(snapshot) {
  const list = $('#chatMessages'); list.replaceChildren();
  snapshot.forEach(child => {
    const message = child.val();
    const row = document.createElement('article'); row.className = `chat-message${message.uid === user?.uid ? ' mine' : ''}`;
    const author = document.createElement('b'); author.textContent = message.displayName || message.username || 'Người chơi';
    const text = document.createElement('p'); text.textContent = message.text || '';
    row.append(author, text); list.append(row);
  });
  list.scrollTop = list.scrollHeight;
}

$('#chatForm').addEventListener('submit', async event => {
  event.preventDefault();
  const input = $('#chatInput'), text = input.value.trim();
  if (!text || !user || !profile) return;
  input.value = '';
  try { await set(push(ref(db, 'lobbyChat')), { uid: user.uid, username: profile.username, displayName: profile.displayName, text: text.slice(0, 300), createdAt: serverTimestamp() }); }
  catch (error) { input.value = text; window.showToast(showError(error)); }
});

function worldKey(room) { return room === 'bar' ? 'bar' : 'game'; }
async function updatePresence() {
  if (!user || !profile || !db) return;
  const key = worldKey(currentRoom);
  if (!presenceRef || presenceWorld !== key) {
    if (presenceRef) await remove(presenceRef).catch(() => {});
    presenceRef = ref(db, `rooms/${key}/players/${user.uid}`);
    presenceWorld = key;
    await onDisconnect(presenceRef).remove();
  }
  await set(presenceRef, { uid: user.uid, username: profile.username, displayName: profile.displayName, room: currentRoom, x: lastPosition.x, z: lastPosition.z, updatedAt: serverTimestamp() });
  stopRoomListener?.();
  stopRoomListener = onValue(ref(db, `rooms/${key}/players`), snapshot => {
    const players = snapshot.val() || {};
    const count = Object.keys(players).length;
    const counter = $('#guestCount'); if (counter) counter.textContent = `${count} người ở đây`;
    window.dispatchEvent(new CustomEvent('choigi-online-players', { detail: { world: key, players } }));
  });
}

window.addEventListener('choigi-room-changed', event => {
  currentRoom = event.detail?.room || 'lounge';
  updatePresence().catch(error => { if (user) status.textContent = showError(error); });
});
window.addEventListener('choigi-player-position', event => {
  if (!user || !profile) return;
  const now = performance.now(); if (now - positionWriteAt < 350) return;
  positionWriteAt = now; lastPosition = { x: event.detail.x, z: event.detail.z };
  const key = worldKey(currentRoom);
  set(ref(db, `rooms/${key}/players/${user.uid}`), { uid: user.uid, username: profile.username, displayName: profile.displayName, room: currentRoom, x: lastPosition.x, z: lastPosition.z, updatedAt: serverTimestamp() }).catch(() => {});
});

function renderPresenceEmpty() {
  $('#guestCount').textContent = user ? '1 người ở đây' : 'Khách';
  window.dispatchEvent(new CustomEvent('choigi-online-players', { detail: { world: worldKey(currentRoom), players: {} } }));
}

$('#onlineBtn').addEventListener('click', () => { overlay.hidden = false; });
document.querySelectorAll('[data-social-close]').forEach(button => button.addEventListener('click', () => { overlay.hidden = true; }));
overlay.addEventListener('click', event => { if (event.target === overlay) overlay.hidden = true; });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !overlay.hidden) overlay.hidden = true; });
document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));
document.querySelectorAll('[data-social-tab]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-social-tab]').forEach(tab => tab.classList.toggle('active', tab === button));
  $('#friendsPane').hidden = button.dataset.socialTab !== 'friends'; $('#chatPane').hidden = button.dataset.socialTab !== 'chat';
}));

let stopQueueMatch = null, stopActiveMatch = null, activeQueueRef = null, matchmakingBusy = false;
const matchWins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function currentMatchMoves(snapshot){const data=snapshot.val()?.rounds||{};return Object.keys(data).sort((a,b)=>Number(a)-Number(b)).flatMap(turn=>Object.entries(data[turn]?.moves||{}).map(([uid,move])=>({turn:Number(turn),uid,move})));}
function describeRps(a,b){if(a===b)return 'Hòa ván này.';return ((a==='rock'&&b==='scissors')||(a==='paper'&&b==='rock')||(a==='scissors'&&b==='paper'))?'Người ra đầu thắng ván này!':'Người ra sau thắng ván này!';}
function paintOnlineMatch(game,matchRef,snapshot){
  if(!snapshot.exists())return;
  const state=snapshot.val(), ids=Object.keys(state.players||{}).sort(), opponentId=ids.find(id=>id!==user.uid), opponent=state.players?.[opponentId]||{};
  const turns=currentMatchMoves(snapshot), wins=matchWins;
  if(game==='rps'){
    let round=0,scoreMe=0,scoreThem=0,lastResult='Chọn búa, bao hoặc kéo.';
    while(true){const row=state.rounds?.[round]?.moves||{},a=row[user.uid],b=row[opponentId];if(!a||!b)break;lastResult=describeRps(a,b);if(a!==b){const iWin=(a==='rock'&&b==='scissors')||(a==='paper'&&b==='rock')||(a==='scissors'&&b==='paper');if(iWin)scoreMe++;else scoreThem++;}round++;}
    const mine=state.rounds?.[round]?.moves?.[user.uid];
    $('#modalTitle').textContent='Oẳn tù tì · đấu online';
    $('#gameArea').innerHTML=`<p class="game-instructions">Bạn đang đấu với <b>${escapeText(opponent.displayName||opponent.username||'Bạn chơi')}</b>. Cả hai chọn xong mới lật bài.</p><div class="game-result">Điểm ${scoreMe} – ${scoreThem}${mine?' · Đã chọn, đang chờ đối thủ…':' · '+escapeText(round?lastResult:'Chọn một nước đi')}</div><div class="rps-options">${[['rock','✊','Búa'],['paper','✋','Bao'],['scissors','✌️','Kéo']].map(([move,icon,label])=>`<button class="rps-choice" data-online-move="${move}" ${mine?'disabled':''} aria-label="${label}">${icon}</button>`).join('')}</div><div class="game-result online-match-foot">${round} ván đã chơi · kết nối trực tuyến</div>`;
    $('#gameArea').querySelectorAll('[data-online-move]').forEach(button=>button.addEventListener('click',()=>set(ref(db,`matches/${game}/${matchRef.key}/rounds/${round}/moves/${user.uid}`),button.dataset.onlineMove).catch(error=>window.showToast(showError(error)))));
  }else{
    const board=Array(9).fill('');turns.forEach((turn,index)=>{const cell=Number(turn.move);if(cell>=0&&cell<9)board[cell]=index%2?'○':'×';});
    const winner=matchWins.find(line=>line.every(i=>board[i]&&board[i]===board[line[0]]));
    const turnNumber=turns.length, myTurn=ids[turnNumber%2]===user.uid, done=Boolean(winner)||turnNumber>=9;
    $('#modalTitle').textContent='Cờ ca-rô · đấu online';
    const message=winner?`Người chơi ${winner?board[winner[0]]:''} thắng ván này!`:turnNumber>=9?'Ván này hòa rồi.':myTurn?'Tới lượt bạn.':'Đang chờ đối thủ đánh…';
    $('#gameArea').innerHTML=`<p class="game-instructions">Đang đấu với <b>${escapeText(opponent.displayName||opponent.username||'Bạn chơi')}</b> · Bạn là <b>${ids[0]===user.uid?'×':'○'}</b>.</p><div class="ttt-board">${board.map((mark,index)=>`<button class="ttt-cell" data-cell="${index}" ${!myTurn||done||mark?'disabled':''}>${mark}</button>`).join('')}</div><div class="game-result">${escapeText(message)}</div>${done?'<button type="button" class="game-button secondary" id="rematchOnline">Tìm ván khác</button>':''}`;
    $('#gameArea').querySelectorAll('[data-cell]').forEach(button=>button.addEventListener('click',()=>set(ref(db,`matches/${game}/${matchRef.key}/rounds/${turnNumber}/moves/${user.uid}`),button.dataset.cell).catch(error=>window.showToast(showError(error)))));
    $('#rematchOnline')?.addEventListener('click',()=>findOnlineMatch(game));
  }
}

async function findOnlineMatch(game){
  if(!auth||!user||!profile){overlay.hidden=false;window.showToast('Đăng nhập trước rồi mới tìm được đối thủ online nhé.');return;}
  stopQueueMatch?.();stopActiveMatch?.();stopQueueMatch=stopActiveMatch=null;matchmakingBusy=false;
  const area=$('#gameArea');$('#modalTitle').textContent=game==='rps'?'Oẳn tù tì · tìm đối thủ':'Cờ ca-rô · tìm đối thủ';
  area.innerHTML='<div class="online-match-search"><span class="match-orbit">✳</span><b>Đang tìm người chơi…</b><p>Giữ cửa sổ này mở, mình sẽ ghép bạn với người đang chờ.</p><button class="game-button secondary" id="cancelMatch">Hủy tìm</button></div>';
  $('#cancelMatch').addEventListener('click',()=>window.choigiCancelMatch?.());
  const queueRef=ref(db,`matchmaking/${game}/${user.uid}`);activeQueueRef=queueRef;
  const session=push(ref(db)).key;
  try{
    await set(queueRef,{uid:user.uid,username:profile.username,displayName:profile.displayName,session,createdAt:serverTimestamp()});
    await onDisconnect(queueRef).remove();
    stopQueueMatch=onValue(ref(db,`matchmaking/${game}`),async snapshot=>{
      if(matchmakingBusy||!user)return;
      const waiting=[];snapshot.forEach(child=>{const value=child.val();if(value?.uid&&value.uid!==user.uid)waiting.push({uid:value.uid,...value});});
      if(!waiting.length)return;
      waiting.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
      const peer=waiting[0],pair=[user.uid,peer.uid].sort(),sessions=[session,peer.session].sort();
      const matchId=`${pair.join('_')}__${sessions.join('_')}`;
      const matchRef=ref(db,`matches/${game}/${matchId}`);
      const players={};players[pair[0]]={uid:pair[0],username:pair[0]===user.uid?profile.username:peer.username,displayName:pair[0]===user.uid?profile.displayName:peer.displayName};players[pair[1]]={uid:pair[1],username:pair[1]===user.uid?profile.username:peer.username,displayName:pair[1]===user.uid?profile.displayName:peer.displayName};
      const created=await runTransaction(matchRef,value=>value===null?{players,createdAt:Date.now()}:undefined);
      const match=created.snapshot.val();
      if(!match?.players?.[user.uid]||!match?.players?.[peer.uid])return;
      matchmakingBusy=true;stopQueueMatch?.();stopQueueMatch=null;
      await remove(queueRef).catch(()=>{});activeQueueRef=null;
      stopActiveMatch=onValue(matchRef,snap=>paintOnlineMatch(game,matchRef,snap));
    });
  }catch(error){area.innerHTML=`<p class="game-result">Không tìm được trận đấu: ${escapeText(showError(error))}</p>`;}
}
window.choigiFindOnlineMatch=findOnlineMatch;
window.choigiCancelMatch=async()=>{stopQueueMatch?.();stopActiveMatch?.();stopQueueMatch=stopActiveMatch=null;matchmakingBusy=false;if(activeQueueRef)await remove(activeQueueRef).catch(()=>{});activeQueueRef=null;const area=$('#gameArea');if(area)area.innerHTML='<p class="game-result">Đã hủy tìm đối thủ.</p>';};

if (!firebaseReady) {
  status.textContent = 'Chưa nối Firebase. Cần điền cấu hình để bật tài khoản và chơi online.';
  renderPresenceEmpty();
} else {
  try {
    const app = initializeApp(firebaseConfig); auth = getAuth(app); db = getDatabase(app);
    status.textContent = 'Firebase đã kết nối · đăng nhập để vào sảnh online.';
    onAuthStateChanged(auth, async nextUser => {
      stopListeners(); if(presenceRef)remove(presenceRef).catch(()=>{});presenceRef = null;presenceWorld=null;user = nextUser;profile = null;window.choigiOnlineUserId=user?.uid||null;
      if (!user) {
        status.textContent = 'Đăng nhập để gặp bạn bè, chat và chơi online.';
        $('#onlineBtn').textContent = '☺'; $('#onlineBtn').title = 'Đăng nhập, bạn bè và chat';
        showProfile(); renderPresenceEmpty(); return;
      }
      if(profileSetupPromise)await profileSetupPromise.catch(()=>{});
      for (let attempt = 0; attempt < 8; attempt++) {
        const snapshot = await get(ref(db, `profiles/${user.uid}`));
        if (snapshot.exists()) { profile = snapshot.val(); break; }
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      if (!profile) {
        status.textContent = 'Tài khoản chưa có hồ sơ. Đăng xuất rồi tạo tài khoản lại nhé.';
        await signOut(auth); return;
      }
      status.textContent = 'Đã đăng nhập · sảnh đang kết nối.';
      showProfile(); watchSocialData();
      stopChatListener = onValue(query(ref(db, 'lobbyChat'), limitToLast(60)), renderMessages);
      await updatePresence();
    });
  } catch (error) { status.textContent = `Không kết nối được Firebase: ${showError(error)}`; }
}
