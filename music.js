(() => {
  const overlay = document.querySelector('#musicOverlay');
  const form = document.querySelector('#musicAddForm');
  const urlField = document.querySelector('#musicUrl');
  const nameField = document.querySelector('#musicName');
  const queueEl = document.querySelector('#musicQueue');
  const empty = document.querySelector('#musicEmpty');
  const externalLink = document.querySelector('#musicOpenYoutube');
  const title = document.querySelector('#musicTitle');
  const kicker = document.querySelector('#musicKicker');
  const queueTitle = document.querySelector('#musicQueueTitle');
  const gamePlayer=document.querySelector('#youtubePlayer');
  let barPlayer=document.querySelector('#youtubeBarPlayer');
  if(!barPlayer){barPlayer=document.createElement('iframe');barPlayer.id='youtubeBarPlayer';barPlayer.title='YouTube music player · Quán bar';barPlayer.allow='autoplay; encrypted-media';barPlayer.referrerPolicy='no-referrer-when-downgrade';barPlayer.hidden=true;document.querySelector('.music-player-wrap')?.append(barPlayer);}
  const players={game:gamePlayer,bar:barPlayer};
  const queueStorageKey=room=>`choigi-youtube-queue-v2-${room}`;
  let currentRoom = 'lounge';
  let queue = loadQueue(currentRoom === 'bar' ? 'bar' : 'game');

  function parseYouTube(raw) {
    let url;
    try { url = new URL(raw); } catch { return null; }
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) return null;
    const list = url.searchParams.get('list');
    let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
    else {
      id = url.searchParams.get('v') || '';
      if (!id) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) id = parts[1] || '';
      }
    }
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { type: 'video', id };
    if (list && /^[A-Za-z0-9_-]{10,80}$/.test(list)) return { type: 'playlist', id: list };
    return null;
  }

  function normalizeQueue(items) {
    if (!Array.isArray(items)) return [];
    return items.map(item => {
      if (!item) return null;
      if ((item.type === 'video' && /^[A-Za-z0-9_-]{11}$/.test(item.id || '')) ||
          (item.type === 'playlist' && /^[A-Za-z0-9_-]{10,80}$/.test(item.id || ''))) {
        const label = item.name || item.title || '';
        return { type: item.type, id: item.id, name: label && !label.startsWith('http') ? label : `${item.type === 'playlist' ? 'Playlist' : 'Video'} ${item.id.slice(0, 6)}…` };
      }
      const raw = typeof item === 'string' ? item : item.url || item.link || item.href ||
        ((item.name || item.title || '').startsWith('http') ? (item.name || item.title) : '');
      const parsed = parseYouTube(raw);
      if (!parsed) return null;
      const suppliedName = typeof item === 'object' ? (item.name || item.title || '') : '';
      return { ...parsed, name: suppliedName && !suppliedName.startsWith('http') ? suppliedName : (parsed.type === 'playlist' ? 'Playlist YouTube' : `Video ${parsed.id.slice(0, 6)}…`) };
    }).filter(Boolean);
  }

  function loadQueue(room) {
    try {
      const saved = localStorage.getItem(queueStorageKey(room));
      const raw = saved || (room === 'game' ? localStorage.getItem('choigi-youtube-queue-v1') : null) || '[]';
      return normalizeQueue(JSON.parse(raw));
    } catch { return []; }
  }

  function save() {
    try { localStorage.setItem(queueStorageKey(currentRoom === 'bar' ? 'bar' : 'game'), JSON.stringify(queue)); }
    catch { window.showToast('Không lưu được danh sách trên thiết bị này.'); }
  }

  function close() { overlay.hidden = true; }

  function updatePlayerNote() {
    if (!empty) return;
    empty.hidden = Boolean(getPlayer()?.src);
  }

  function getPlayer() { return players[currentRoom === 'bar' ? 'bar' : 'game']; }

  function playOnRoom(room, item, broadcast = false, startedAt = Date.now()) {
    const world = room === 'bar' ? 'bar' : 'game';
    const player = players[world];
    if (!player) return;
    if (!item) {
      player.src = ''; player.hidden = true; delete player.dataset.trackKey;
      if (world === currentRoom) { externalLink.hidden = true; updatePlayerNote(); }
      window.dispatchEvent(new CustomEvent('choigi-video-active', { detail: { active: false, room: world } }));
      return;
    }
    const base = item.type === 'playlist'
      ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(item.id)}`
      : `https://www.youtube.com/embed/${encodeURIComponent(item.id)}`;
    const trackKey = `${item.type}:${item.id}:${Math.floor(Number(startedAt) / 1000)}`;
    if (player.dataset.trackKey === trackKey) return;
    player.dataset.trackKey = trackKey;
    const target = new URL(base);
    const startSeconds = Math.max(0, Math.floor((Date.now() - Number(startedAt)) / 1000));
    const params = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0', enablejsapi: '1', origin: location.origin, controls: '0', disablekb: '1', fs: '0' });
    if (startSeconds > 0) params.set('start', String(startSeconds));
    params.forEach((value, key) => target.searchParams.set(key, value));
    player.referrerPolicy = 'no-referrer-when-downgrade';
    player.src = target.toString();
    player.hidden = false;
    if (world === currentRoom) {
      updatePlayerNote();
      externalLink.href = item.type === 'playlist'
        ? `https://www.youtube.com/playlist?list=${encodeURIComponent(item.id)}`
        : `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`;
      externalLink.hidden = false;
    }
    window.dispatchEvent(new CustomEvent('choigi-video-active', { detail: { active: true, room: world, item } }));
    if (broadcast) window.dispatchEvent(new CustomEvent('choigi-music-state-write', { detail: { room: world, item, startedAt: Number(startedAt) } }));
  }

  function play(item) { playOnRoom(currentRoom, item, true); }

  window.addEventListener('choigi-shared-music-state', event => {
    const room = event.detail?.room === 'bar' ? 'bar' : 'game';
    const state = event.detail?.state;
    // Local playback already updated this frame; avoid restarting it when its database echo arrives.
    if (state?.updatedBy && state.updatedBy === event.detail?.localUid) return;
    playOnRoom(room, state?.playing ? state.item : null, false, state?.startedAt || Date.now());
  });

  function render() {
    queueEl.replaceChildren();
    if (!queue.length) {
      const li = document.createElement('li');
      li.className = 'music-queue-empty';
      li.textContent = 'Chưa có nhạc. Dán link YouTube ở trên để thêm bài.';
      queueEl.append(li);
      return;
    }
    queue.forEach((item, index) => {
      const li = document.createElement('li'); li.className = 'music-track';
      const playBtn = document.createElement('button'); playBtn.className = 'music-track-play'; playBtn.type = 'button'; playBtn.textContent = '▶';
      playBtn.setAttribute('aria-label', `Phát ${item.name}`); playBtn.addEventListener('click', () => play(item));
      const copy = document.createElement('span'); copy.className = 'music-track-copy';
      const name = document.createElement('b'); name.textContent = item.name;
      const detail = document.createElement('small'); detail.textContent = item.type === 'playlist' ? 'Playlist YouTube' : 'YouTube';
      copy.append(name, detail);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'music-track-remove'; remove.textContent = '×';
      remove.setAttribute('aria-label', `Xóa ${item.name}`);
      remove.addEventListener('click', () => { queue.splice(index, 1); save(); render(); });
      li.append(playBtn, copy, remove); queueEl.append(li);
    });
  }

  window.openMusicPanel = (room = 'lounge') => {
    currentRoom = room === 'bar' ? 'bar' : 'game';
    queue = loadQueue(currentRoom);
    title.textContent = currentRoom === 'bar' ? 'Máy phát nhạc quán bar' : 'Máy phát nhạc phòng game';
    kicker.textContent = currentRoom === 'bar' ? 'JUKEBOX · QUÁN BAR RIÊNG' : 'JUKEBOX · HAI PHÒNG GAME';
    queueTitle.textContent = currentRoom === 'bar' ? 'Danh sách nhạc quán bar' : 'Danh sách nhạc chung hai phòng game';
    const note=document.querySelector('#musicNote');if(note)note.textContent = currentRoom === 'bar' ? 'Nhạc và video của quán bar độc lập với hai phòng game.' : 'Hai phòng game dùng chung danh sách và màn hình.';
    externalLink.hidden = !getPlayer()?.src;
    updatePlayerNote(); render(); overlay.hidden = false; urlField.focus();
  };

  document.querySelectorAll('[data-music-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const parsed = parseYouTube(urlField.value.trim());
    if (!parsed) { window.showToast('Link chưa đúng. Hãy dán link video hoặc playlist YouTube.'); return; }
    const item = { ...parsed, name: nameField.value.trim() || (parsed.type === 'playlist' ? 'Playlist YouTube' : `Video ${parsed.id.slice(0, 6)}…`) };
    queue.push(item); save(); render(); play(item); urlField.value = ''; nameField.value = '';
    window.showToast(currentRoom === 'bar' ? 'Đã thêm nhạc riêng cho quán bar!' : 'Đã thêm nhạc chung cho hai phòng game!');
  });

  document.querySelector('#clearMusicQueue').addEventListener('click', () => {
    queue = []; save(); render();
    playOnRoom(currentRoom, null, true);
  });

  window.addEventListener('choigi-room-changed', e => {
    const nextRoom=e.detail?.room;
    if(['lounge','left','right','bar'].includes(nextRoom)){currentRoom=nextRoom==='bar'?'bar':'game';const player=getPlayer();if(player?.src)player.hidden=false;}
  });

  render();
})();
