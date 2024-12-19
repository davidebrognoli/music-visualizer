// Audio context and visualization setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioElement;
let audioSource = null;
let isPlaying = false;
let filters = [];
const analyser = audioContext.createAnalyser();
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const dataArray = new Uint8Array(analyser.frequencyBinCount);

// UI elements
const fileInput = document.getElementById("audioFile");
const controls = document.getElementById("controls");
const playButton = document.getElementById("playButton");
const sensitivitySlider = document.getElementById("sensitivitySlider");
const volumeSlider = document.getElementById("volumeSlider");
const fullscreenButton = document.getElementById("fullscreenButton");
const progressBar = document.getElementById("progressBar");
const visualizationStyleSelector =
  document.getElementById("visualizationStyle");
const currentTimeDisplay = document.getElementById("currentTime");
const totalTimeDisplay = document.getElementById("totalTime");
const clearTrackButton = document.getElementById("clearTrackButton");
const albumCover = document.getElementById("albumCover");
const trackTitle = document.getElementById("trackTitle");
const trackArtist = document.getElementById("trackArtist");
const trackAlbum = document.getElementById("trackAlbum");
let sensitivity = 5;
let barColor = document.getElementById("colorPicker").value;
let visualizationStyle = "bars";

// Canvas resizing
function resizeCanvas() {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
resizeCanvas();

// Event listeners setup
fileInput.addEventListener("change", loadAudioFile);
playButton.addEventListener("click", togglePlayPause);
sensitivitySlider.addEventListener(
  "input",
  (e) => (sensitivity = e.target.value)
);
volumeSlider.addEventListener(
  "input",
  (e) => (audioElement.volume = e.target.value)
);
fullscreenButton.addEventListener("click", toggleFullscreen);
visualizationStyleSelector.addEventListener("change", updateVisualizationStyle);
document
  .getElementById("colorPicker")
  .addEventListener("input", (e) => (barColor = e.target.value));
clearTrackButton.addEventListener("click", clearTrack);
document.querySelectorAll(".gain").forEach((slider, index) => {
  slider.addEventListener("input", (e) =>
    setGain(index, parseFloat(e.target.value))
  );
});
document.querySelectorAll("[data-volume]").forEach((element) => {
  element.addEventListener("click", () => {
    volumeSlider.value = element.dataset.volume;
    audioElement.volume = element.dataset.volume;
  });
});
progressBar.addEventListener("input", seekAudio);

// Core audio file management
function loadAudioFile(event) {
  const file = event.target.files[0];
  if (file) {
    fileInputSection.style.display = "none";
    controls.style.display = "block";

    const reader = new FileReader();
    reader.onload = (e) => {
      resetAudioElement(e.target.result);
      setupAudioChain();
      getAudioMetadata(file);
    };
    reader.readAsDataURL(file);
  }
}

function resetAudioElement(src) {
  if (audioElement) {
    audioElement.pause();
    audioElement.src = "";
    audioElement.remove();
  }
  audioElement = new Audio(src);
  audioElement.volume = volumeSlider.value;
  setupAudioListeners();
}

function setupAudioListeners() {
  audioElement.addEventListener("loadedmetadata", () => {
    totalTimeDisplay.textContent = formatTime(audioElement.duration);
  });
  audioElement.addEventListener("timeupdate", () => {
    currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
  });
}

function setupAudioChain() {
  if (audioSource) {
    audioSource.disconnect();
  }
  audioSource = audioContext.createMediaElementSource(audioElement);

  audioSource.connect(filters[0]);
  filters[filters.length - 1].connect(analyser);
  analyser.connect(audioContext.destination);
}

function getAudioMetadata(file) {
  jsmediatags.read(file, {
    onSuccess: (tag) => {
      const { title, artist, album, picture } = tag.tags;
      trackTitle.textContent = `Title: ${title || "Unknown"}`;
      trackArtist.textContent = `Artist: ${artist || "Unknown"}`;
      trackAlbum.textContent = `Album: ${album || "Unknown"}`;
      updateAlbumCover(picture);
    },
    onError: () => {
      resetMetadataDisplay();
    },
  });
}

function updateAlbumCover(picture) {
  if (picture) {
    const data = picture.data;
    const format = picture.format;
    const base64String = data.reduce(
      (acc, byte) => acc + String.fromCharCode(byte),
      ""
    );
    albumCover.src = `data:${format};base64,${btoa(base64String)}`;
  } else {
    albumCover.src = "placeholder.jpg";
  }
}

function resetMetadataDisplay() {
  albumCover.src = "placeholder.jpg";
  trackTitle.textContent = "Title: Unknown";
  trackArtist.textContent = "Artist: Unknown";
  trackAlbum.textContent = "Album: Unknown";
}

// Playback controls
function togglePlayPause() {
  if (!isPlaying && audioElement.src) {
    playAudio();
  } else {
    pauseAudio();
  }
}

function playAudio() {
  audioContext.resume().then(() => {
    audioElement.play();
    isPlaying = true;
    playButton.classList.add("pause");
  });
}

function pauseAudio() {
  audioElement.pause();
  isPlaying = false;
  playButton.classList.remove("pause");
}

function seekAudio(e) {
  if (audioElement) {
    const currentTime = (e.target.value * audioElement.duration) / 100;
    audioElement.currentTime = currentTime;
  }
}

// Visualization controls
function updateVisualizationStyle(e) {
  visualizationStyle = e.target.value;
  if (visualizationStyle === "spectrogram") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawOptions.style.display = "none";
  } else {
    drawOptions.style.display = "block";
  }
}

function drawVisualizer() {
  if (isPlaying) {
    if (visualizationStyle !== "spectrogram") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    analyser.getByteFrequencyData(dataArray);

    switch (visualizationStyle) {
      case "bars":
        drawBars();
        break;
      case "circle":
        drawCircle();
        break;
      case "wave":
        drawWave();
        break;
      case "triangle":
        drawTriangle();
        break;
      case "spectrogram":
        drawSpectrogram();
        break;
    }
  }
  requestAnimationFrame(drawVisualizer);
}

// Visualization styles
function drawBars() {
  const barWidth = (canvas.width / dataArray.length) * 2.5;
  let x = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] * sensitivity) / 5;
    ctx.fillStyle = barColor;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

function drawCircle() {
  // Implementation omitted for brevity
}

function drawWave() {
  // Implementation omitted for brevity
}

function drawTriangle() {
  // Implementation omitted for brevity
}

function drawSpectrogram() {
  // Implementation omitted for brevity
}

// Equalizer setup
function setupEqualizer() {
  const frequencies = [60, 250, 1000, 4000, 10000];

  frequencies.forEach((freq) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = freq;
    filter.Q.value = freq < 500 ? 0.7 : 1.5;
    filter.gain.value = 0;
    filters.push(filter);
  });

  for (let i = 0; i < filters.length - 1; i++) {
    filters[i].connect(filters[i + 1]);
  }
  filters[filters.length - 1].connect(audioContext.destination);
}

function setGain(index, value) {
  if (filters[index]) {
    filters[index].gain.value = value;
  }
}

setupEqualizer();
drawVisualizer();
updateSeekBar();

// Utility functions
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

function updateSeekBar() {
  if (audioElement && !isNaN(audioElement.duration)) {
    const { currentTime, duration } = audioElement;
    const progress = (currentTime / duration) * 100;
    progressBar.value = progress;
    if (duration === currentTime) {
      pauseAudio();
    }
  }
  requestAnimationFrame(updateSeekBar);
}

function clearTrack() {
  if (audioElement) {
    audioElement.pause();
    audioElement.src = "";
    audioSource = null;
    isPlaying = false;
    playButton.classList.remove("pause");
    resetMetadataDisplay();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    controls.style.display = "none";
    fileInputSection.style.display = "block";
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen().catch((err) => {
      console.error(
        `Error attempting to enable full-screen mode: ${err.message}`
      );
    });
  } else {
    document.exitFullscreen();
  }
}
