(() => {
  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const formatTime = (date, timezone) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone || undefined }).format(date);
  };
  const compass = (degrees) => ['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees / 45) % 8];
  const astronomy = window.Astronomy;
  let observer = null;
  let location = null;
  let timezone = undefined;
  let selectedDay = new Date().toISOString().slice(0, 10);
  let sunRise = null;
  let sunSet = null;
  let issMap = null;
  let issMarker = null;
  let issTimer = null;

  function localDateStart(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }

  function position(body, date) {
    if (!astronomy || !observer) return null;
    const equatorial = astronomy.Equator(body, date, observer, true, true);
    return astronomy.Horizon(date, observer, equatorial.ra, equatorial.dec, 'normal');
  }

  function renderSunPosition(date) {
    const sun = position(astronomy.Body.Sun, date);
    if (!sun) return;
    const altitude = sun.altitude;
    const state = altitude > 0 ? 'Above horizon' : altitude > -6 ? 'Civil twilight' : altitude > -12 ? 'Nautical twilight' : altitude > -18 ? 'Astronomical twilight' : 'Night';
    setText('sun-altitude', altitude.toFixed(1) + '°');
    setText('sun-azimuth', sun.azimuth.toFixed(1) + '°');
    setText('sun-compass', compass(sun.azimuth));
    setText('sun-state', state);
    setText('sun-direction', altitude >= 0 ? 'Above your local horizon' : Math.abs(altitude).toFixed(1) + '° below the horizon');
    setText('sun-live-status', location ? (timezone || 'Local time') : 'Choose a location');
    const slider = $('sun-time');
    if (slider) {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone || undefined, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
      const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
      const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
      slider.value = String(hour * 60 + minute);
      setText('sun-time-label', formatTime(date, timezone));
    }
  }

  function renderTwilight() {
    if (!astronomy || !observer || !sunRise || !sunSet) return;
    const dawnStart = new Date(sunRise.getTime() - 3 * 60 * 60 * 1000);
    const duskStart = sunSet;
    const getEvent = (direction, altitude, start) => {
      try {
        const result = astronomy.SearchAltitude(astronomy.Body.Sun, observer, direction, start, 0.6, altitude);
        return result ? result.date : null;
      } catch (error) { return null; }
    };
    const events = [
      ['civil-dawn', getEvent(1, -6, dawnStart)],
      ['nautical-dawn', getEvent(1, -12, dawnStart)],
      ['astro-dawn', getEvent(1, -18, dawnStart)],
      ['civil-dusk', getEvent(-1, -6, duskStart)],
      ['nautical-dusk', getEvent(-1, -12, duskStart)],
      ['astro-dusk', getEvent(-1, -18, duskStart)]
    ];
    events.forEach(([id, date]) => setText(id, date ? formatTime(date, timezone) : 'No crossing'));
    try {
      const noon = astronomy.SearchHourAngle(astronomy.Body.Sun, observer, 0, sunRise, 1);
      setText('solar-transit', noon ? formatTime(noon.date, timezone) : '—');
    } catch (error) { setText('solar-transit', '—'); }
  }

  function renderPlanets() {
    if (!astronomy || !observer) return;
    const bodies = [
      ['Mercury', astronomy.Body.Mercury, '☿'], ['Venus', astronomy.Body.Venus, '♀'],
      ['Mars', astronomy.Body.Mars, '♂'], ['Jupiter', astronomy.Body.Jupiter, '♃'],
      ['Saturn', astronomy.Body.Saturn, '♄'], ['Uranus', astronomy.Body.Uranus, '♅'],
      ['Neptune', astronomy.Body.Neptune, '♆']
    ];
    const now = new Date();
    const cards = bodies.map(([name, body, symbol]) => {
      try {
        const horizontal = position(body, now);
        const above = horizontal.altitude > 0;
        return '<article class="panel planet-card"><span class="planet-symbol">' + symbol + '</span><div><h3>' + name + '</h3><small>' + (above ? 'Above horizon now' : 'Below horizon now') + '</small></div><b>' + horizontal.altitude.toFixed(1) + '°</b><p>Azimuth ' + horizontal.azimuth.toFixed(1) + '° · ' + compass(horizontal.azimuth) + '</p></article>';
      } catch (error) {
        return '<article class="panel planet-card"><span class="planet-symbol">' + symbol + '</span><div><h3>' + name + '</h3><small>Position unavailable</small></div></article>';
      }
    });
    $('planet-grid').innerHTML = cards.join('');
  }

  function renderMoonPosition() {
    if (!astronomy || !observer) return;
    const now = new Date();
    try {
      const moon = position(astronomy.Body.Moon, now);
      setText('moon-altitude', moon.altitude.toFixed(1) + '°');
      setText('moon-azimuth', moon.azimuth.toFixed(1) + '° · ' + compass(moon.azimuth));
      const start = localDateStart(selectedDay);
      const rise = astronomy.SearchRiseSet(astronomy.Body.Moon, observer, 1, start, 1, 0);
      const setting = astronomy.SearchRiseSet(astronomy.Body.Moon, observer, -1, start, 1, 0);
      setText('moonrise-time', rise ? formatTime(rise.date, timezone) : 'No rise today');
      setText('moonset-time', setting ? formatTime(setting.date, timezone) : 'No set today');
    } catch (error) {
      setText('moonrise-time', 'Unavailable');
      setText('moonset-time', 'Unavailable');
    }
  }

  function updateSolarSlider() {
    if (!location || !astronomy) return;
    const minutes = Number($('sun-time').value);
    const [year, month, day] = selectedDay.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 0, minutes, 0));
    renderSunPosition(date);
  }

  function updateLocation(detail) {
    location = detail;
    timezone = detail.timezone || undefined;
    observer = new astronomy.Observer(Number(detail.lat), Number(detail.lon), 0);
    selectedDay = $('astro-date').value;
    renderTwilight();
    renderPlanets();
    renderMoonPosition();
    renderSunPosition(new Date());
  }

  window.addEventListener('astro:location', (event) => updateLocation(event.detail));
  window.addEventListener('astro:date', (event) => {
    selectedDay = event.detail.date;
    if (location) {
      renderTwilight();
      renderMoonPosition();
    }
  });
  $('sun-time').addEventListener('input', updateSolarSlider);

  const showers = [
    ['Quadrantids', 1, 3, 'Early January', 'Short, sharp peak; best before dawn.'],
    ['Lyrids', 4, 22, 'Late April', 'A spring shower with occasional bright meteors.'],
    ['Eta Aquariids', 5, 6, 'Early May', 'Often favourable in the hours before dawn.'],
    ['Perseids', 8, 12, 'Mid-August', 'A popular northern-summer shower.'],
    ['Orionids', 10, 21, 'Late October', 'Meteors associated with Halley’s Comet.'],
    ['Leonids', 11, 17, 'Mid-November', 'Usually modest, with rare stronger outbursts.'],
    ['Geminids', 12, 14, 'Mid-December', 'Often one of the year’s more active showers.'],
    ['Ursids', 12, 22, 'Late December', 'A smaller shower near the end of the year.']
  ];
  function renderShowers() {
    const today = new Date();
    const upcoming = showers.map(([name, month, day, window, note]) => {
      let date = new Date(today.getFullYear(), month - 1, day, 12);
      if (date < today) date = new Date(today.getFullYear() + 1, month - 1, day, 12);
      return { name, date, window, note };
    }).sort((a, b) => a.date - b.date).slice(0, 6);
    $('meteor-grid').innerHTML = upcoming.map((item, index) => {
      const date = item.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      const days = Math.ceil((new Date(item.date.getFullYear(), item.date.getMonth(), item.date.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
      return '<article class="panel meteor-card"><span class="meteor-number">' + String(index + 1).padStart(2, '0') + '</span><small>' + item.window + '</small><h3>' + item.name + '</h3><b>' + date + '</b><p>' + (days === 0 ? 'Peak is today' : 'In ' + days + ' days') + ' · ' + item.note + '</p></article>';
    }).join('');
  }

  async function loadApod() {
    const media = $('apod-media');
    try {
      const response = await fetch('https://science.nasa.gov/wp-json/wp/v2/apod-basic/');
      if (!response.ok) throw new Error('NASA image service unavailable');
      const payload = await response.json();
      const item = Array.isArray(payload) ? payload[0] : payload;
      if (!item) throw new Error('No feature returned');
      setText('apod-date', item.date || 'NASA FEATURE');
      setText('apod-title', item.title || 'Astronomy picture of the day');
      setText('apod-description', item.explanation || item.description || 'Explore the featured astronomy image on NASA.');
      setText('apod-credit', item.copyright ? 'Image: ' + item.copyright : (item.credit || 'NASA'));
      const link = item.permalink || item.url || 'https://science.nasa.gov/solar-system/';
      $('apod-link').href = link;
      const imageUrl = item.hdurl || item.image_url || (item.media_type === 'image' ? item.url : '');
      if (imageUrl && /^https:\/\//.test(imageUrl)) {
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = item.alt || item.title || 'NASA astronomy picture of the day';
        image.loading = 'lazy';
        media.replaceChildren(image);
      } else {
        media.textContent = item.media_type === 'video' ? 'Today’s feature is a video. Open NASA’s feature to watch it.' : 'Open NASA’s feature to view today’s astronomy image.';
      }
    } catch (error) {
      media.textContent = 'NASA’s daily feature is temporarily unavailable.';
      setText('apod-description', 'The rest of the astronomy tools are still available. Try again later for NASA’s daily feature.');
    }
  }

  function initIssMap() {
    if (!window.L || !$('iss-map')) return;
    issMap = L.map('iss-map', { worldCopyJump: true, scrollWheelZoom: false }).setView([15, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 7,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(issMap);
    issMarker = L.marker([0, 0]).addTo(issMap).bindPopup('International Space Station');
    refreshIss();
    issTimer = window.setInterval(refreshIss, 10000);
  }

  async function refreshIss() {
    try {
      const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      if (!response.ok) throw new Error('ISS service unavailable');
      const data = await response.json();
      const point = [Number(data.latitude), Number(data.longitude)];
      issMarker.setLatLng(point);
      setText('iss-lat', data.latitude.toFixed(2) + '°');
      setText('iss-lon', data.longitude.toFixed(2) + '°');
      setText('iss-alt', data.altitude.toFixed(1) + ' km');
      setText('iss-speed', Math.round(data.velocity).toLocaleString() + ' km/h');
      setText('iss-visibility', data.visibility || '—');
      setText('iss-updated', new Date(data.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (error) {
      setText('iss-updated', 'Temporarily unavailable');
    }
  }

  renderShowers();
  loadApod();
  initIssMap();
  window.addEventListener('beforeunload', () => { if (issTimer) clearInterval(issTimer); });
})();