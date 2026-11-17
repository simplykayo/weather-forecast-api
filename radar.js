(() => {
  const $ = (id) => document.getElementById(id);
  const apiUrl = 'https://api.rainviewer.com/public/weather-maps.json';
  const defaultLocation = { name: 'Lucknow', lat: 26.8467, lon: 80.9462 };

  let map;
  let frames = [];
  let frameIndex = 0;
  let radarLayer = null;
  let playTimer = null;
  let radarHost = '';
  let opacity = 0.75;

  const status = (message) => { $('radar-status').textContent = message || ''; };

  function formatFrameTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleString([], {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function initMap() {
    if (!window.L) {
      status('The map library could not load. Check your connection and refresh the page.');
      return false;
    }

    map = L.map('radar-map', { zoomControl: true, maxZoom: 12, minZoom: 2 })
      .setView([defaultLocation.lat, defaultLocation.lon], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.control.scale({ imperial: false }).addTo(map);
    return true;
  }

  function stopPlayback() {
    if (playTimer) {
      window.clearInterval(playTimer);
      playTimer = null;
    }
    $('play-radar').textContent = '▶ Play loop';
    $('play-radar').setAttribute('aria-pressed', 'false');
  }

  function showFrame(index) {
    if (!frames.length || !map) return;

    frameIndex = Math.max(0, Math.min(index, frames.length - 1));
    const frame = frames[frameIndex];
    const tileUrl = radarHost + frame.path + '/256/{z}/{x}/{y}/2/1_1.png';

    if (radarLayer) map.removeLayer(radarLayer);
    radarLayer = L.tileLayer(tileUrl, {
      tileSize: 256,
      opacity: opacity,
      maxNativeZoom: 7,
      maxZoom: 12,
      attribution: 'Radar: <a href="https://www.rainviewer.com/">RainViewer</a>'
    }).addTo(map);

    $('frame-slider').value = String(frameIndex);
    $('frame-time').textContent = formatFrameTime(frame.time);
    $('frame-count').textContent = 'Frame ' + (frameIndex + 1) + ' of ' + frames.length;
  }

  function moveFrame(step) {
    if (!frames.length) return;
    showFrame((frameIndex + step + frames.length) % frames.length);
  }

  function startPlayback() {
    if (frames.length < 2) return;
    stopPlayback();
    $('play-radar').textContent = 'Ⅱ Pause';
    $('play-radar').setAttribute('aria-pressed', 'true');

    playTimer = window.setInterval(() => {
      showFrame(frameIndex >= frames.length - 1 ? 0 : frameIndex + 1);
    }, 850);
  }

  async function loadFrames() {
    status('Checking for recent radar scans…');
    try {
      const response = await fetch(apiUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('Radar service returned ' + response.status);

      const data = await response.json();
      const availableFrames = data.radar && Array.isArray(data.radar.past) ? data.radar.past : [];
      if (!data.host || !availableFrames.length) throw new Error('No recent radar scans are available right now.');

      const wasPlaying = Boolean(playTimer);
      stopPlayback();
      radarHost = data.host;
      frames = availableFrames.slice().sort((a, b) => a.time - b.time);
      $('frame-slider').max = String(frames.length - 1);
      showFrame(frames.length - 1);
      status('Showing ' + frames.length + ' recent scans. Radar availability varies by location.');
      if (wasPlaying) startPlayback();
    } catch (error) {
      status('Radar data is temporarily unavailable. Please try again in a little while.');
      $('frame-time').textContent = 'Radar unavailable';
      console.error('Could not load radar frames:', error);
    }
  }

  async function searchLocation(query) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(query) + '&count=1&language=en&format=json';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Location search failed');

    const data = await response.json();
    if (!data.results || !data.results.length) throw new Error('No matching place was found.');

    const place = data.results[0];
    map.setView([place.latitude, place.longitude], 7);
    status('Map centred on ' + place.name + (place.country ? ', ' + place.country : '') + '.');
  }

  $('radar-search').addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = $('radar-place').value.trim();
    if (!query) return;

    status('Searching for ' + query + '…');
    try {
      await searchLocation(query);
    } catch (error) {
      status(error.message || 'Could not find that place. Try another search.');
    }
  });

  $('radar-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
      status('Location is not supported by this browser. Search for a place instead.');
      return;
    }

    status('Waiting for location permission…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView([position.coords.latitude, position.coords.longitude], 8);
        status('Map centred on your current location.');
      },
      () => status('Location was unavailable or permission was declined. You can search for a place instead.'),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });

  $('frame-slider').addEventListener('input', (event) => {
    stopPlayback();
    showFrame(Number(event.target.value));
  });
  $('previous-frame').addEventListener('click', () => { stopPlayback(); moveFrame(-1); });
  $('next-frame').addEventListener('click', () => { stopPlayback(); moveFrame(1); });
  $('play-radar').addEventListener('click', () => playTimer ? stopPlayback() : startPlayback());

  $('radar-opacity').addEventListener('input', (event) => {
    opacity = Number(event.target.value) / 100;
    $('opacity-value').textContent = event.target.value + '%';
    if (radarLayer) radarLayer.setOpacity(opacity);
  });

  if (initMap()) {
    loadFrames();
    window.setInterval(loadFrames, 10 * 60 * 1000);
  }
})();