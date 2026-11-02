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
  const players = {
    lounge: document.querySelector('#youtubePlayer'),
    bar: document.querySelector('#youtubeBarPlayer'),
  };
  const storageKeys = {
    lounge: 'choigi-youtube-queue-v1',
    bar: 'choigi-youtube-queue-bar-v1',
  };
  let currentRoom = 'lounge';
  let queue = loadQueue(currentRoom);

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
      const raw = localStorage.getItem(storageKeys[room]) || (room === 'lounge' ? localStorage.getItem('choigi-youtube-queue-v1') : '[]') || '[]';
      return normalizeQueue(JSON.parse(raw));
    } catch { return []; }
  }

  function save() {
    try { localStorage.setItem(storageKeys[currentRoom], JSON.stringify(queue)); }
    catch { window.showToast('Không lưu được danh sách trên thiết bị này.'); }
  }

  function close() { overlay.hidden = true; }

  function updatePlayerNote() {
    if (!empty) return;
    empty.hidden = Boolean(players[currentRoom]?.src);
  }

  function play(item) {
    const player = players[currentRoom];
    if (!player) return;
    const base = item.type === 'playlist'
      ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(item.id)}`
      : `https://www.youtube.com/embed/${encodeURIComponent(item.id)}`;
    const target = new URL(base);
    const params = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0', enablejsapi: '1', origin: location.origin, controls: '0', disablekb: '1', fs: '0' });
    params.forEach((value, key) => target.searchParams.set(key, value));
    player.referrerPolicy = 'no-referrer-when-downgrade';
    player.src = target.toString();
    player.hidden = false;
    updatePlayerNote();
    window.dispatchEvent(new CustomEvent('choigi-video-active', { detail: { active: true, room: currentRoom, item } }));
    externalLink.href = item.type === 'playlist'
      ? `https://www.youtube.com/playlist?list=${encodeURIComponent(item.id)}`
      : `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`;
    externalLink.hidden = false;
  }

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
    currentRoom = room === 'bar' ? 'bar' : 'lounge';
    queue = loadQueue(currentRoom);
    title.textContent = currentRoom === 'bar' ? 'Máy phát nhạc · Bar' : 'Góc phát nhạc';
    kicker.textContent = currentRoom === 'bar' ? 'JUKEBOX · BAR RIÊNG' : 'JUKEBOX · SẢNH GAME';
    queueTitle.textContent = currentRoom === 'bar' ? 'Danh sách nhạc của Bar' : 'Danh sách của bạn';
    externalLink.hidden = !players[currentRoom]?.src;
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
    window.showToast(currentRoom === 'bar' ? 'Đã thêm nhạc riêng cho Bar!' : 'Đã thêm nhạc vào danh sách!');
  });

  document.querySelector('#clearMusicQueue').addEventListener('click', () => {
    queue = []; save(); render();
    const player = players[currentRoom]; player.src = ''; player.hidden = true;
    externalLink.hidden = true; updatePlayerNote();
    window.dispatchEvent(new CustomEvent('choigi-video-active', { detail: { active: false, room: currentRoom } }));
  });

  window.addEventListener('choigi-room-changed', e => {
    const nextRoom = e.detail?.room === 'bar' ? 'bar' : 'lounge';
    const oldRoom = currentRoom;
    if (oldRoom !== nextRoom) {
      const oldPlayer = players[oldRoom]; oldPlayer.src = ''; oldPlayer.hidden = true;
      window.dispatchEvent(new CustomEvent('choigi-video-active', { detail: { active: false, room: oldRoom } }));
      currentRoom = nextRoom; queue = loadQueue(currentRoom);
      if (!overlay.hidden) window.openMusicPanel(currentRoom);
    }
  });

  render();
})();
