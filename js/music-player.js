const playlist = [
    { title: 'Montagem pitty', artist: '见过夏天P/洛天依', src: 'https://m701.music.126.net/20260611010702/88ebb95a4dea383403ae550fc21cd532/jdymusic/obj/wo3DlMOGwrbDjj7DisKw/78836438796/af82/828d/c0e5/0f114dda22328c5aa6de7d46c0c3442c.mp3?vuutv=DUwr7Ps/r3x6M6GF1rShktswm2ET2Z3hLaIWPKTsKY/FwSjzfTjRWAas/2tJkj0vSrWMyc8lZzcjVmIe4f/SbUZuJwHLgHeFnIWxd1KDzrc=' },
    { title: 'Oh! Susanna', artist: '2nd South Carolina String Band', src: 'https://m7.music.126.net/20260611011122/1ccc7bd0bb5eb2c7c7982ec3e84f07a9/ymusic/555b/510c/560b/b17d5bc316ff6e45a715aa20f26e25d5.mp3?vuutv=yqBqYZft/Vfg11tTtH1OAuPoZu+Er0/VXHg0N+jZnCUZUPLZlnpdiJFOT9AQAEyyKvDVqVVGEXHDXiF+DvKiA39vpeJvqRdftTaqxLBIosg=' },
    { title: '心予報', artist: 'Eve', src: 'https://m702.music.126.net/20260611011333/febd10b68eeebb40cbef7a829897a915/jd-musicrep-ts/6ce4/46b6/d062/fd7711a35cf54a4e482eba68a7d59810.mp3?vuutv=47ZSB11NpeMJNdmaxV/A8uTyKJ3KUSfEqyacDmRNizKDzIm0GM2Nbfx6X374hk4EcmFpjxhC/WMzC7kZ2xsVeEnXdlU9lC8BR/kYZJIrSM8=' },
    { title: '天天天国地獄国 (feat. ななひら & P丸様。)', artist: 'Aiobahn +81/ななひら/P丸様。', src: 'https://m802.music.126.net/20260611014848/bec7018f2ef665713ccffaf11de0d107/jd-musicrep-ts/9f41/6b4b/c1ee/a509d2c5c9eed132b356e2826d669e3a.mp3?vuutv=qGCq14rpH330GebgIblBpFiZjLAVzN1Bw7DliW1fgQVCV63eb5PcabsEdZ0ULxKSKHSjs6f2Hdmp/ULWP4DlAAH97Cgd/gTWJsIm/4EdmvQ=' }
];
let currentTrackIndex = 0, isPlaying = false, isShuffle = false, loopMode = 'none'; // 'none', 'one', 'all'
const audio = new Audio();
const nowPlayingTitle = document.getElementById('nowPlayingTitle'), nowPlayingArtist = document.getElementById('nowPlayingArtist');
const currentTimeEl = document.getElementById('currentTime'), totalTimeEl = document.getElementById('totalTime');
const progressBar = document.getElementById('musicProgressBar'), progressFill = document.getElementById('musicProgressFill'), progressThumb = document.getElementById('musicProgressThumb');
const btnPlayIcon = document.getElementById('btnPlayIcon'), playlistContainer = document.getElementById('musicPlaylist'), volumeSlider = document.getElementById('musicVolumeSlider');
const visualizerBars = document.querySelectorAll('.v-bar');

function formatTime(sec) { if (isNaN(sec)) return '00:00'; const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; }

function renderPlaylist() {
    playlistContainer.innerHTML = '';
    playlist.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${idx === currentTrackIndex ? 'active' : ''}`;
        item.innerHTML = `<span>${track.title} - ${track.artist}</span>`;
        item.addEventListener('click', () => { currentTrackIndex = idx; loadAndPlayTrack(); });
        playlistContainer.appendChild(item);
    });
}

function updatePlaylistActive() {
    document.querySelectorAll('.playlist-item').forEach((item, idx) => item.classList.toggle('active', idx === currentTrackIndex));
}

function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    audio.src = track.src;
    nowPlayingTitle.textContent = track.title;
    nowPlayingArtist.textContent = track.artist;
    currentTimeEl.textContent = '00:00';
    totalTimeEl.textContent = '00:00';
    progressFill.style.width = '0%';
    progressThumb.style.left = '0%';
    updatePlaylistActive();
}

function loadAndPlayTrack() { loadTrack(currentTrackIndex); audio.play().then(() => { isPlaying = true; updatePlayButton(); }).catch(e => console.warn(e)); }

function updatePlayButton() { btnPlayIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play'; }

function togglePlay() {
    if (!audio.src) loadTrack(currentTrackIndex);
    if (audio.paused) audio.play().then(() => { isPlaying = true; updatePlayButton(); }).catch(e => console.warn(e));
    else { audio.pause(); isPlaying = false; updatePlayButton(); }
}

function playNext() {
    if (loopMode === 'one') { audio.currentTime = 0; audio.play(); return; }
    if (isShuffle) currentTrackIndex = Math.floor(Math.random() * playlist.length);
    else currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadAndPlayTrack();
}

function playPrev() {
    if (isShuffle) currentTrackIndex = Math.floor(Math.random() * playlist.length);
    else currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadAndPlayTrack();
}

function toggleLoop() {
    const modes = ['none', 'one', 'all'];
    const nextIdx = (modes.indexOf(loopMode) + 1) % modes.length;
    loopMode = modes[nextIdx];
    const btnLoop = document.getElementById('btnLoop');
    // 使用文字代替图标，避免图标消失问题，同时满足“不使用表情包”
    if (loopMode === 'none') btnLoop.innerHTML = '<span style="font-size:0.8rem;">顺序</span>';
    else if (loopMode === 'one') btnLoop.innerHTML = '<span style="font-size:0.8rem;">单曲</span>';
    else btnLoop.innerHTML = '<span style="font-size:0.8rem;">循环</span>';
    audio.loop = (loopMode === 'one');
}

audio.addEventListener('timeupdate', () => {
    if (audio.duration && !isNaN(audio.duration)) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${percent}%`;
        progressThumb.style.left = `${percent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
    }
});

audio.addEventListener('loadedmetadata', () => totalTimeEl.textContent = formatTime(audio.duration));

audio.addEventListener('ended', () => {
    if (loopMode === 'one') { audio.currentTime = 0; audio.play(); }
    else if (loopMode === 'all') playNext();
    else { isPlaying = false; updatePlayButton(); }
});

progressBar.addEventListener('click', (e) => {
    if (!audio.duration || isNaN(audio.duration)) return;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
});

volumeSlider.addEventListener('input', (e) => audio.volume = e.target.value / 100);
audio.volume = volumeSlider.value / 100;

function animateVisualizer() {
    if (isPlaying) visualizerBars.forEach(bar => { const h = Math.random() * 40 + 10; bar.style.height = `${h}px`; });
    else visualizerBars.forEach(bar => bar.style.height = '5px');
    requestAnimationFrame(() => setTimeout(animateVisualizer, 200));
}
animateVisualizer();

document.getElementById('btnPlay').addEventListener('click', togglePlay);
document.getElementById('btnNext').addEventListener('click', playNext);
document.getElementById('btnPrev').addEventListener('click', playPrev);
document.getElementById('btnShuffle').addEventListener('click', () => { isShuffle = !isShuffle; document.getElementById('btnShuffle').style.color = isShuffle ? 'var(--accent)' : ''; });
document.getElementById('btnLoop').addEventListener('click', toggleLoop);

const musicFab = document.getElementById('musicFab'), musicPlayer = document.getElementById('musicPlayer'), musicPlayerClose = document.getElementById('musicPlayerClose');
musicFab.addEventListener('click', () => musicPlayer.classList.toggle('open'));
musicPlayerClose.addEventListener('click', () => musicPlayer.classList.remove('open'));

renderPlaylist();
loadTrack(currentTrackIndex);
// 初始化循环按钮文字
document.getElementById('btnLoop').innerHTML = '<span style="font-size:0.8rem;">顺序</span>';