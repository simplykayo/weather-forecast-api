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

  function parsePlaceTime(value) {
    if (!value) return null;
    const [datePart, timePart] = value.split('T');
    const [hour, minute] = timePart.split(':').map(Number);
    const base = new Date(datePart + 'T' + String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0') + ':00Z');
    if (!timezone) return base;
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(base);
    const actual = Number(parts.find((part) => part.type === 'hour')?.value || 0) * 60 + Number(parts.find((part) => part.type === 'minute')?.value || 0);
    const desired = hour * 60 + minute;
    let difference = desired - actual;
    if (difference > 720) difference -= 1440;
    if (difference < -720) difference += 1440;
    return new Date(base.getTime() + difference * 60000);
  }

  function localDateStart(dateString) {
    return parsePlaceTime(dateString + 'T00:00') || new Date(dateString + 'T00:00:00Z');
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
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone || undefined, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
    const actual = Number(parts.find((part) => part.type === 'hour')?.value || 0) * 60 + Number(parts.find((part) => part.type === 'minute')?.value || 0);
    let difference = minutes - actual;
    if (difference > 720) difference -= 1440;
    if (difference < -720) difference += 1440;
    renderSunPosition(new Date(date.getTime() + difference * 60000));
  }

  function updateLocation(detail) {
    if (!astronomy) { setText('sun-live-status', 'Astronomy calculations could not load'); return; }
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
    sunRise = parsePlaceTime(event.detail.sunrise);
    sunSet = parsePlaceTime(event.detail.sunset);
    if (location) {
      renderTwilight();
      renderMoonPosition();
      if (selectedDay === new Date().toISOString().slice(0, 10)) renderSunPosition(new Date());
      else {
        $('sun-time').value = '720';
        updateSolarSlider();
      }
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

  function plainTextFromHtml(markup) {
    const template = document.createElement('template');
    template.innerHTML = String(markup || '');
    template.content.querySelectorAll('script,style').forEach((node) => node.remove());
    return (template.content.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function extractApodImage(item, contentHtml) {
    const candidates = [
      item?.image_url, item?.image, item?.hdurl, item?.url,
      item?._embedded?.['wp:featuredmedia']?.[0]?.source_url
    ].filter((value) => typeof value === 'string' && /^https:\/\//i.test(value));

    const doc = new DOMParser().parseFromString(String(contentHtml || ''), 'text/html');
    const contentImage = doc.querySelector('img[src]');
    if (contentImage?.src) candidates.push(contentImage.src);
    const linkedImage = [...doc.querySelectorAll('a[href]')]
      .map((anchor) => anchor.href)
      .find((href) => /^https:\/\//i.test(href) && /\.(jpe?g|png|webp)(\?|$)/i.test(href));
    if (linkedImage) candidates.push(linkedImage);

    return candidates.find((url) => /\.(jpe?g|png|webp)(\?|$)/i.test(url)) || candidates[0] || '';
  }

  async function loadApod() {
    const media = $('apod-media');
    const titleNode = $('apod-title');
    const descriptionNode = $('apod-description');
    try {
      const response = await fetch('https://science.nasa.gov/wp-json/wp/v2/apod-basic/?per_page=1&_embed=1');
      if (!response.ok) throw new Error('NASA image service returned ' + response.status);
      const payload = await response.json();
      const item = Array.isArray(payload) ? payload[0] : payload;
      if (!item) throw new Error('NASA did not return an astronomy feature');

      // NASA's WordPress feed uses rendered title/content fields; keep support
      // for the simpler APOD-style fields as well.
      const title = item.title?.rendered || item.title || 'Astronomy picture of the day';
      const contentHtml = item.content?.rendered || item.explanation || item.description || '';
      const description = plainTextFromHtml(contentHtml) || 'Explore today’s astronomy feature on NASA.';
      const dateValue = item.date || item.date_gmt || item.apod_date || '';
      const imageUrl = extractApodImage(item, contentHtml);
      const pageUrl = item.link || item.permalink || item.guid?.rendered || 'https://science.nasa.gov/';

      setText('apod-date', dateValue ? new Date(dateValue).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'NASA FEATURE');
      setText('apod-title', plainTextFromHtml(title));
      setText('apod-description', description);
      setText('apod-credit', item.credit || item.copyright ? 'Image: ' + (item.credit || item.copyright) : 'Image and explanation: NASA / credited contributor');
      $('apod-link').href = pageUrl;

      if (imageUrl && /^https:\\/\\//i.test(imageUrl)) {
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = plainTextFromHtml(title) || 'NASA astronomy picture of the day';
        image.loading = 'lazy';
        image.referrerPolicy = 'no-referrer';
        image.addEventListener('error', () => {
          media.textContent = 'NASA’s image could not be loaded right now. Open the feature on NASA’s website to view it.';
        }, { once: true });
        media.replaceChildren(image);
      } else {
        media.textContent = 'NASA’s feature loaded, but it did not include a direct image. Open the feature on NASA’s website to view its media.';
      }
    } catch (error) {
      media.textContent = 'NASA’s daily feature is temporarily unavailable.';
      setText('apod-title', 'Astronomy picture of the day');
      setText('apod-description', 'NASA’s feed could not be read just now. The rest of the astronomy tools are still available.');
      setText('apod-credit', '');
    }
  }

  function initIssMap() {
    if (!$('iss-map')) return;
    if (!window.L) {
      $('iss-map').textContent = 'The map library could not load. ISS readings will be unavailable.';
      return;
    }
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