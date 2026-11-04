(() => {
  const bar = document.querySelector('#quickControls');
  if (!bar) return;
  const range = document.querySelector('#quickVolumeRange');
  const valueText = document.querySelector('#quickVolumeText');
  const output = document.querySelector('#quickVolumeOutput');
  const popover = document.querySelector('#quickVolumePopover');
  const muteButton = document.querySelector('#quickMuteBtn');
  const speakerWave = muteButton?.querySelector('.speaker-wave');
  const speakerMuted = muteButton?.querySelector('.speaker-muted');
  const players = ['youtubePlayer', 'youtubeBarPlayer'].map(id => document.getElementById(id)).filter(Boolean);
  const savedVolumeRaw = localStorage.getItem('choigi-player-volume');
  const savedVolume = savedVolumeRaw === null ? Number.NaN : Number(savedVolumeRaw);
  let volume = Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 100 ? savedVolume : 14;
  let muted = localStorage.getItem('choigi-player-muted') === 'true';
  let captionsOn = localStorage.getItem('choigi-player-captions') === 'true';
  let currentRoom = 'lounge';

  function command(player, func, args = []) {
    if (!player?.contentWindow || !player.src) return;
    try { player.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com'); } catch {}
  }
  function applySound() {
    range.value = String(volume);
    valueText.textContent = `${volume}%`;
    output.value = `${volume}%`;
    bar.classList.toggle('is-muted', muted);
    muteButton.setAttribute('aria-label', muted ? 'Bật tiếng' : 'Tắt tiếng');
    muteButton.title = muted ? 'Bật tiếng' : 'Tắt tiếng';
    if (speakerWave) speakerWave.style.display = muted ? 'none' : '';
    if (speakerMuted) speakerMuted.style.display = muted ? '' : 'none';
    players.forEach(player => {
      command(player, 'setVolume', [volume]);
      command(player, muted ? 'mute' : 'unMute');
    });
    localStorage.setItem('choigi-player-volume', String(volume));
    localStorage.setItem('choigi-player-muted', String(muted));
  }
  function applyCaptions() {
    const button = document.querySelector('#quickCaptionsBtn');
    button?.classList.toggle('is-active', captionsOn);
    button?.setAttribute('aria-label', captionsOn ? 'Tắt phụ đề' : 'Bật phụ đề');
    button.title = captionsOn ? 'Tắt phụ đề' : 'Bật phụ đề';
    players.forEach(player => command(player, captionsOn ? 'loadModule' : 'unloadModule', ['captions']));
    localStorage.setItem('choigi-player-captions', String(captionsOn));
  }
  players.forEach(player => player.addEventListener('load', () => setTimeout(() => { applySound(); applyCaptions(); }, 250)));

  document.querySelector('#quickMusicBtn')?.addEventListener('click', () => {
    window.openMusicPanel?.(currentRoom === 'bar' ? 'bar' : 'lounge');
  });
  document.querySelector('#quickCaptionsBtn')?.addEventListener('click', () => { captionsOn = !captionsOn; applyCaptions(); });
  muteButton?.addEventListener('click', () => { muted = !muted; applySound(); });
  document.querySelector('#quickVolumeToggle')?.addEventListener('click', () => { popover.hidden = !popover.hidden; });
  range?.addEventListener('input', () => { volume = Number(range.value); if (volume > 0) muted = false; applySound(); });
  window.addEventListener('choigi-room-changed', event => { currentRoom = event.detail?.room || 'lounge'; });
  document.addEventListener('pointerdown', event => {
    if (!popover.hidden && !bar.contains(event.target)) popover.hidden = true;
  });
  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    document.querySelector('#fullscreenBtn')?.classList.toggle('is-active', active);
  });
  applySound();
  applyCaptions();
})();
