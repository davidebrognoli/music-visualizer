let audioElement;
let audioSource = null;
let isPlaying = false;
let filters = [];
let sensitivity = 5;
let visualizationStyle = "bars";

const audioContext = new window.AudioContext();
const analyser = audioContext.createAnalyser();
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const dataArray = new Uint8Array(analyser.frequencyBinCount);

let barColor = document.getElementById("colorPicker").value;

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

// Event listeners
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
visualizationStyleSelector.addEventListener("change", (e) => {
  if (e.target.value === "spectrogram") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawOptions.style.display = "none";
  } else {
    drawOptions.style.display = "block";
  }
  visualizationStyle = e.target.value;
});
document
  .getElementById("colorPicker")
  .addEventListener("input", (e) => (barColor = e.target.value));

document.querySelectorAll(".gain").forEach((slider, index) => {
  slider.addEventListener("input", (event) => {
    setGain(index, parseFloat(event.target.value));
  });
});

seekBar.addEventListener("input", (e) => {
  if (audioElement) {
    const currentTime = (e.target.value * audioElement.duration) / 100;
    audioElement.currentTime = currentTime;
  }
});

document.querySelectorAll("[data-volume]").forEach((element) => {
  element.addEventListener("click", () => {
    volumeSlider.value = element.dataset.volume;
    audioElement.volume = element.dataset.volume;
  });
});

clearTrackButton.addEventListener("click", () => {
  controls.style.display = "none";
  fileInputSection.style.display = "block";
  pauseAudio();
  albumCover.src = "placeholder.webp";
  trackTitle.textContent = "Title: Unknown";
  trackArtist.textContent = "Artist: Unknown";
  trackAlbum.textContent = "Album: Unknown";
  fileInput.value = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// functions
function loadAudioFile(event) {
  const file = event.target.files[0];
  if (file) {
    fileInputSection.style.display = "none";
    controls.style.display = "block";

    const reader = new FileReader();
    reader.onload = function (e) {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
        audioElement.remove();
      }

      audioElement = new Audio(e.target.result);
      audioElement.volume = volumeSlider.value;

      audioElement.addEventListener("loadedmetadata", () => {
        totalTimeDisplay.textContent = formatTime(audioElement.duration);
      });

      audioElement.addEventListener("timeupdate", () => {
        currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
      });

      if (audioSource) {
        audioSource.disconnect();
      }

      audioSource = audioContext.createMediaElementSource(audioElement);

      // Collega la nuova catena audio
      audioSource.connect(filters[0]);
      filters[filters.length - 1].connect(analyser);
      analyser.connect(audioContext.destination);

      getAudioMetadata(file);
    };
    reader.readAsDataURL(file);
  }
}

function resizeCanvas() {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getAudioMetadata(file) {
  jsmediatags.read(file, {
    onSuccess: (tag) => {
      const { title, artist, album, picture } = tag.tags;
      trackTitle.textContent = `Title: ${title || "Unknown"}`;
      trackArtist.textContent = `Artist: ${artist || "Unknown"}`;
      trackAlbum.textContent = `Album: ${album || "Unknown"}`;
      if (picture) {
        const data = picture.data;
        const format = picture.format;
        const base64String = data.reduce(
          (acc, byte) => acc + String.fromCharCode(byte),
          ""
        );
        albumCover.src = `data:${format};base64,${btoa(base64String)}`;
      } else {
        albumCover.src = "placeholder.webp";
      }
    },
    onError: () => {
      albumCover.src = "placeholder.webp";
      trackTitle.textContent = "Title: Unknown";
      trackAlbum.textContent = "Album: Unknown";
    },
  });
}

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

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
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
  const radius = Math.min(canvas.width, canvas.height) / 4;
  for (let i = 0; i < dataArray.length; i++) {
    const angle = (i / dataArray.length) * Math.PI * 2;
    const x = canvas.width / 2 + Math.cos(angle) * radius;
    const y = canvas.height / 2 + Math.sin(angle) * radius;
    const size = (dataArray[i] / 255) * sensitivity;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = barColor;
    ctx.fill();
  }
}

function drawWave() {
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  for (let i = 0; i < dataArray.length; i++) {
    const y = canvas.height / 2 + ((dataArray[i] - 128) * sensitivity) / 5;
    const x = (i / dataArray.length) * canvas.width;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = barColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSpectrogram() {
  const { width, height } = canvas;

  // Scorri l'immagine a sinistra per aggiornare il disegno
  const imageData = ctx.getImageData(1, 0, width - 1, height);
  ctx.putImageData(imageData, 0, 0);

  for (let i = 0; i < dataArray.length; i++) {
    const value = dataArray[i];
    const percent = value / 255;
    const hue = (percent * 360 + 200) % 360;

    // Disegna dal basso verso l'alto
    const y = height - Math.floor((i / dataArray.length) * height);

    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(width - 1, y, 1, 1);
  }
}

function drawTriangle() {
  const centerX = canvas.width / 2; // Centro del canvas
  const centerY = canvas.height / 2; // Centro del canvas
  const baseSize = Math.min(canvas.width, canvas.height) / 4; // Dimensione di base del triangolo

  // Calcolo dei vertici del triangolo
  const x1 = centerX; // Primo vertice (in alto)
  const y1 = centerY - baseSize;

  const x2 = centerX - baseSize * Math.cos(Math.PI / 3); // Secondo vertice (in basso a sinistra)
  const y2 = centerY + baseSize * Math.sin(Math.PI / 3);

  const x3 = centerX + baseSize * Math.cos(Math.PI / 3); // Terzo vertice (in basso a destra)
  const y3 = centerY + baseSize * Math.sin(Math.PI / 3);

  // Disegna i bordi colorati in base ai dati audio
  ctx.lineWidth = 3; // Spessore del bordo

  const edges = [
    { startX: x1, startY: y1, endX: x2, endY: y2, dataIndex: 0 }, // Primo bordo
    { startX: x2, startY: y2, endX: x3, endY: y3, dataIndex: 1 }, // Secondo bordo
    { startX: x3, startY: y3, endX: x1, endY: y1, dataIndex: 2 }, // Terzo bordo
  ];

  edges.forEach((edge) => {
    const { startX, startY, endX, endY, dataIndex } = edge;
    const value = (dataArray[dataIndex] / 255) * (sensitivity / 10); // Normalizza il valore e applica la sensibilità
    const clampedValue = Math.min(value, 1); // Limita il valore massimo a 1

    const gradientLength = clampedValue; // Porzione del bordo da colorare
    const gradientEndX = startX + (endX - startX) * gradientLength;
    const gradientEndY = startY + (endY - startY) * gradientLength;

    // Disegna la parte colorata
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(gradientEndX, gradientEndY);
    ctx.strokeStyle = barColor;
    ctx.stroke();

    // Disegna la parte non colorata
    ctx.beginPath();
    ctx.moveTo(gradientEndX, gradientEndY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)"; // Colore tenue per la parte non colorata
    ctx.stroke();
  });
}

function setupEqualizer() {
  const frequencies = [60, 250, 1000, 4000, 10000];

  frequencies.forEach((freq) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = freq;
    filter.Q.value = freq < 500 ? 0.7 : 1.5; // Fattore Q dinamico
    filter.gain.value = 0;
    filters.push(filter);
  });

  // Collega i filtri in serie
  for (let i = 0; i < filters.length - 1; i++) {
    filters[i].connect(filters[i + 1]);
  }

  // Collega l'uscita finale all'audioContext.destination
  filters[filters.length - 1].connect(audioContext.destination);
}

function setGain(index, value) {
  if (filters[index]) {
    filters[index].gain.value = value;
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

function updateSeekBar() {
  if (audioElement && !isNaN(audioElement.duration)) {
    const { currentTime, duration } = audioElement;
    const progress = (currentTime / duration) * 100;
    seekBar.value = progress;
    if (duration === currentTime) {
      pauseAudio();
    }
  }
  requestAnimationFrame(updateSeekBar);
}

// Initialize the app
setupEqualizer();
drawVisualizer();
resizeCanvas();
updateSeekBar();
