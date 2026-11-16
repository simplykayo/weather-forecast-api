(() => {
const $ = id => document.getElementById(id);
const DEFAULT = { name: 'Naka Hindola, Lucknow', region: 'Uttar Pradesh, India', lat: 26.8467, lon: 80.9462 };
const WAQI_TOKEN = '06749c1561d5f4e092b3737a048ff656d569d234';

/* ---------- weather codes ---------- */
function describe(c) {
  if (c === 0) return { l: 'Clear sky', sun: 1, ic: '☀️' };
  if (c === 1) return { l: 'Mostly clear', sun: 1, cl: 1, ic: '🌤️' };
  if (c === 2) return { l: 'Partly cloudy', sun: 1, cl: 2, ic: '⛅' };
  if (c === 3) return { l: 'Overcast', cl: 3, ic: '☁️' };
  if (c <= 48) return { l: 'Fog', fog: 1, cl: 1, ic: '🌫️' };
  if (c <= 57) return { l: 'Drizzle', cl: 2, dark: 1, rain: 40, ic: '🌦️' };
  if (c <= 65) return { l: c === 65 ? 'Heavy rain' : 'Rain', cl: 3, dark: 1, rain: c === 65 ? 130 : 80, ic: '🌧️' };
  if (c <= 67) return { l: 'Freezing rain', cl: 3, dark: 1, rain: 80, ic: '🌧️' };
  if (c <= 77) return { l: 'Snow', cl: 2, snow: 70, ic: '🌨️' };
  if (c <= 82) return { l: c === 82 ? 'Violent showers' : 'Rain showers', cl: 3, dark: 1, rain: c === 82 ? 140 : 90, ic: '🌧️' };
  if (c <= 86) return { l: 'Snow showers', cl: 2, snow: 90, ic: '🌨️' };
  return { l: 'Thunderstorm', cl: 3, dark: 1, rain: 120, storm: 1, ic: '⛈️' };
}

/* ---------- animated scene ---------- */
const cv = $('scene'), ctx = cv.getContext('2d');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPOTS = [[.72, .3, 1], [.9, .5, .7], [.56, .52, .65]];
const BLOBS = [[-.9, .1, .55], [-.4, -.25, .7], [.15, -.4, .85], [.7, -.1, .65], [1.1, .15, .45]];

let W = 0, H = 0, U = 1, cfg = describe(3), night = false;
let drops = [], splashes = [], stars = [];
let t = 0, flash = 0, bolt = null, raf = 0, last = 0;
let liveTemp = 26, liveWind = 8, liveAqi = 50;

function resize() {
  const d = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
  W = r.width; H = r.height; U = H / 300;
  cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  stars = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H * .7, r: Math.random() * 1.2 + .3, p: Math.random() * 6 }));
  seed();
  if (still) draw(0);
}

function spot(i) {
  const s = SPOTS[i % 3];
  return { x: W * s[0] + Math.sin(t * .008 + i * 2) * 14 * U, y: H * s[1] * .62, s: s[2] };
}

function seed() {
  const n = cfg.rain || cfg.snow || 0, scale = W < 500 ? .6 : 1;
  drops = Array.from({ length: Math.round(n * scale) }, () => newDrop(Math.random() * H));
  splashes = [];
}

function newDrop(y) {
  const c = spot(Math.floor(Math.random() * (cfg.cl || 1))), w = 85 * U * c.s;
  return {
    x: c.x + (Math.random() * 2 - 1) * w,
    y: y ?? c.y + 28 * U * c.s,
    v: cfg.snow ? .6 + Math.random() * .8 : 7 + Math.random() * 6,
    l: 8 + Math.random() * 10,
    p: Math.random() * 6
  };
}

function cloud(x, y, s, a, dark) {
  const tone = dark ? '74,78,90' : '160,166,178', k = night ? .6 : 1;
  for (const [dx, dy, r] of BLOBS) {
    const R = r * 50 * U * s, cx = x + dx * 50 * U * s, cy = y + dy * 50 * U * s;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, `rgba(${tone},${a * k})`);
    g.addColorStop(1, `rgba(${tone},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 7);
    ctx.fill();
  }
}

/* ---------- cute weather character ---------- */
function drawMascot(cx, baseY) {
  const s = U * (W < 480 ? 0.78 : 0.95);
  const bob = Math.sin(t * 0.05) * 1.8 * s;
  const isRain = Boolean(cfg.rain || cfg.storm);
  const isSnow = Boolean(cfg.snow || liveTemp <= 11);
  const isFog = Boolean(cfg.fog);
  const badAir = liveAqi > 150;
  const isSleep = night && !isRain && !isSnow && !isFog;
  const isSunny = !night && cfg.sun && !isRain;

  ctx.save();
  ctx.translate(cx, baseY);

  // soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22 * s, 4.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // mini snowman buddy when cold/snowing
  if (isSnow) {
    const sx = -32 * s;
    ctx.fillStyle = '#dfe3ec';
    ctx.beginPath(); ctx.arc(sx, -8 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx, -19 * s, 5.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e08b4f';
    ctx.beginPath(); ctx.moveTo(sx + 4 * s, -19 * s); ctx.lineTo(sx + 10 * s, -18 * s); ctx.lineTo(sx + 4 * s, -17 * s); ctx.fill();
  }

  ctx.translate(0, bob);

  // body (cozy rounded shape)
  ctx.fillStyle = '#ececee';
  ctx.beginPath();
  ctx.moveTo(-13 * s, -3 * s);
  ctx.quadraticCurveTo(-15 * s, -22 * s, 0, -24 * s);
  ctx.quadraticCurveTo(15 * s, -22 * s, 13 * s, -3 * s);
  ctx.closePath();
  ctx.fill();

  // winter scarf
  if (isSnow) {
    ctx.fillStyle = '#cc5f4c';
    ctx.beginPath();
    ctx.roundRect(-11 * s, -23 * s, 22 * s, 5 * s, 2.5 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(4 * s, -21 * s, 4.5 * s, 11 * s, 2 * s);
    ctx.fill();
  }

  // head
  const headY = -34 * s;
  ctx.fillStyle = '#ececee';
  ctx.beginPath();
  ctx.arc(0, headY, 12.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // tiny cute ears
  ctx.beginPath();
  ctx.arc(-8.5 * s, headY - 9 * s, 3.6 * s, 0, Math.PI * 2);
  ctx.arc(8.5 * s, headY - 9 * s, 3.6 * s, 0, Math.PI * 2);
  ctx.fill();

  // face expression
  ctx.strokeStyle = '#18181c';
  ctx.fillStyle = '#18181c';
  ctx.lineWidth = 1.6 * s;
  ctx.lineCap = 'round';

  if (isSunny && liveTemp >= 25) {
    // cool sunglasses
    ctx.fillRect(-9 * s, headY - 3 * s, 7.5 * s, 5 * s);
    ctx.fillRect(1.5 * s, headY - 3 * s, 7.5 * s, 5 * s);
    ctx.beginPath();
    ctx.moveTo(-1.5 * s, headY - 1.5 * s);
    ctx.lineTo(1.5 * s, headY - 1.5 * s);
    ctx.stroke();
  } else if (isSleep) {
    // closed sleeping eyes + floating z's
    ctx.beginPath();
    ctx.arc(-4.5 * s, headY - 1 * s, 2.2 * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(4.5 * s, headY - 1 * s, 2.2 * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    const zDrift = (t * 0.35) % 16;
    ctx.fillStyle = `rgba(223,227,238,${1 - zDrift / 16})`;
    ctx.font = `600 ${Math.round(9 * s)}px Manrope, sans-serif`;
    ctx.fillText('z', (11 + zDrift * 0.4) * s, (headY - 8 - zDrift) * s);
  } else {
    // blinking eyes
    const blink = Math.sin(t * 0.04) > 0.97;
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(-6.5 * s, headY - 1 * s); ctx.lineTo(-2.5 * s, headY - 1 * s);
      ctx.moveTo(2.5 * s, headY - 1 * s); ctx.lineTo(6.5 * s, headY - 1 * s);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-4.5 * s, headY - 1 * s, 1.6 * s, 0, Math.PI * 2);
      ctx.arc(4.5 * s, headY - 1 * s, 1.6 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // face mask when air is unhealthy, otherwise tiny smile
  if (badAir) {
    ctx.fillStyle = '#9aa3b5';
    ctx.beginPath();
    ctx.roundRect(-6.5 * s, headY + 1.5 * s, 13 * s, 7 * s, 3 * s);
    ctx.fill();
  } else if (!isSleep) {
    ctx.beginPath();
    ctx.arc(0, headY + 2.5 * s, 2 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  // props: umbrella in rain, glowing lantern in fog, spinning pinwheel in sun/wind
  if (isRain) {
    const ux = 13 * s, uy = -54 * s;
    ctx.strokeStyle = '#9aa3b5';
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(ux, -14 * s);
    ctx.lineTo(ux, uy);
    ctx.stroke();

    // umbrella canopy
    ctx.fillStyle = cfg.storm ? '#7a8cab' : '#6e92b5';
    ctx.beginPath();
    ctx.arc(ux, uy + 4 * s, 25 * s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  } else if (isFog) {
    // tiny warm lantern
    const lx = -17 * s, ly = -14 * s;
    const glow = ctx.createRadialGradient(lx, ly, 1, lx, ly, 18 * s);
    glow.addColorStop(0, 'rgba(255, 207, 133, 0.45)');
    glow.addColorStop(1, 'rgba(255, 207, 133, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(lx, ly, 18 * s, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffcf85';
    ctx.beginPath(); ctx.roundRect(lx - 3 * s, ly - 4 * s, 6 * s, 8 * s, 2 * s); ctx.fill();
  } else if (isSunny) {
    // wind-powered pinwheel
    const px = 17 * s, py = -32 * s;
    ctx.strokeStyle = '#8d8d96';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath(); ctx.moveTo(px, -12 * s); ctx.lineTo(px, py); ctx.stroke();

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(t * (0.03 + Math.min(liveWind, 40) * 0.004));
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = i % 2 ? '#ffcf85' : '#d58f4d';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(7 * s, -3 * s);
      ctx.lineTo(5 * s, 4 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();

  // return umbrella collision zone so raindrops bounce off it
  if (isRain) {
    return { x: cx + 13 * s, y: baseY + bob - 50 * s, r: 25 * s };
  }
  return null;
}

function draw(dt) {
  ctx.clearRect(0, 0, W, H);
  t += dt;

  const clear = !cfg.rain && !cfg.snow && !cfg.fog;
  if (night && clear) {
    for (const s of stars) {
      ctx.globalAlpha = .25 + .5 * Math.abs(Math.sin(t * .02 + s.p));
      ctx.fillStyle = '#dfe3ee';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
  }
  ctx.globalAlpha = 1;

  if (cfg.sun) {
    const x = W * .8, y = H * .28, r = 34 * U, pulse = 1 + Math.sin(t * .02) * .04;
    const g = ctx.createRadialGradient(x, y, r * .4, x, y, r * 4 * pulse);
    g.addColorStop(0, night ? 'rgba(190,200,225,.22)' : 'rgba(255,196,110,.38)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 4 * pulse, 0, 7); ctx.fill();
    ctx.fillStyle = night ? '#d9dce6' : '#ffcf85';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (night) {
      ctx.fillStyle = '#0f0f11';
      ctx.beginPath(); ctx.arc(x + r * .45, y - r * .2, r * .92, 0, 7); ctx.fill();
    }
  }

  if (cfg.fog) {
    for (let i = 0; i < 4; i++) {
      const y = H * (.35 + i * .14), x = Math.sin(t * .004 + i) * 60 * U;
      const g = ctx.createLinearGradient(x, 0, x + W, 0);
      g.addColorStop(0, 'rgba(150,155,165,0)');
      g.addColorStop(.5, 'rgba(150,155,165,.13)');
      g.addColorStop(1, 'rgba(150,155,165,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, W, 34 * U);
    }
  }

  for (let i = 0; i < (cfg.cl || 0); i++) {
    const c = spot(i);
    cloud(c.x, c.y, c.s, cfg.dark ? .75 : .5, cfg.dark);
  }

  // draw character in bottom-right of hero banner
  const mascotX = W < 480 ? W * 0.82 : W * 0.78;
  const mascotY = H - 22 * U;
  const umbrella = drawMascot(mascotX, mascotY);

  if (cfg.rain) {
    ctx.strokeStyle = 'rgba(160,185,225,.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const d of drops) {
      d.y += d.v * dt;
      d.x -= d.v * .12 * dt;

      // bounce off the character's umbrella
      if (umbrella && d.y > umbrella.y - umbrella.r && d.y < umbrella.y + 4) {
        const dx = d.x - umbrella.x, dy = d.y - umbrella.y;
        if (dx * dx + dy * dy < umbrella.r * umbrella.r) {
          splashes.push({ x: d.x, y: d.y, age: 0 });
          Object.assign(d, newDrop());
          continue;
        }
      }

      if (d.y > H - 6) {
        if (Math.random() < 0.35) splashes.push({ x: d.x, y: H - 6, age: 0 });
        Object.assign(d, newDrop());
      }
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.l * .12, d.y - d.l);
    }
    ctx.stroke();

    // tiny splash ripples
    for (let i = splashes.length - 1; i >= 0; i--) {
      const sp = splashes[i];
      sp.age += dt;
      if (sp.age > 10) { splashes.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(160,185,225,${(1 - sp.age / 10) * 0.45})`;
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, sp.age * 0.8, sp.age * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (cfg.snow) {
    ctx.fillStyle = 'rgba(235,240,250,.8)';
    for (const d of drops) {
      d.y += d.v * dt;
      d.x += Math.sin(t * .03 + d.p) * .4;
      if (d.y > H) Object.assign(d, newDrop());
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.6, 0, 7);
      ctx.fill();
    }
  }

  if (cfg.storm) {
    if (flash <= 0 && Math.random() < .006 * dt) {
      flash = 1;
      const c = spot(0);
      let x = c.x, y = c.y + 30 * U;
      bolt = [[x, y]];
      while (y < H * .8) {
        x += (Math.random() - .5) * 30 * U;
        y += 18 * U;
        bolt.push([x, y]);
      }
    }
    if (flash > 0) {
      ctx.fillStyle = `rgba(200,215,255,${flash * .1})`;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = `rgba(235,240,255,${flash})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      bolt.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();
      flash -= .07 * dt;
    }
  }
}

function frame(ts) {
  raf = requestAnimationFrame(frame);
  if (ts - last < 32) return;
  const dt = Math.min((ts - last) / 16.7, 3);
  last = ts;
  draw(dt);
}
function play() { if (!still && !raf) raf = requestAnimationFrame(frame); }
function pause() { cancelAnimationFrame(raf); raf = 0; }
document.addEventListener('visibilitychange', () => document.hidden ? pause() : play());
addEventListener('resize', resize);

function setScene(code, isNight) {
  cfg = describe(code);
  night = isNight;
  flash = 0;
  seed();
  if (still) draw(0);
}

/* ---------- data ---------- */
const AQ = [
  [50, 'Good', '#5fae7f', 'The air is clean. Enjoy time outdoors.'],
  [100, 'Moderate', '#d2b556', 'Acceptable. Unusually sensitive people may want lighter outdoor effort.'],
  [150, 'Unhealthy for sensitive groups', '#d58f4d', 'Children, older adults and people with asthma should cut down on outdoor exertion.'],
  [200, 'Unhealthy', '#cc5f4c', 'Everyone may feel effects. Keep outdoor time short; a mask helps.'],
  [300, 'Very unhealthy', '#a2559f', 'Avoid outdoor exercise and keep windows closed.'],
  [Infinity, 'Hazardous', '#9a4558', 'Stay indoors and use an air purifier if you have one.']
];
const hr = s => { const h = +s.slice(11, 13); return (h % 12 || 12) + (h < 12 ? ' am' : ' pm'); };
const hm = s => { const h = +s.slice(11, 13); return (h % 12 || 12) + ':' + s.slice(14, 16) + (h < 12 ? ' am' : ' pm'); };
const compass = d => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(d / 45) % 8];
const get = u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
const status = m => { $('status').textContent = m || ''; };

async function getAir(p, geo) {
  if (WAQI_TOKEN) {
    try {
      const response = await get(`https://api.waqi.info/feed/geo:${p.lat};${p.lon}/?token=${WAQI_TOKEN}`);
      const data = response.data;
      if (response.status === 'ok' && data?.aqi != null && Number.isFinite(Number(data.aqi))) {
        const iaqi = data.iaqi || {};
        return { current: {
          us_aqi: Number(data.aqi),
          pm2_5: iaqi.pm25?.v,
          pm10: iaqi.pm10?.v,
          nitrogen_dioxide: iaqi.no2?.v,
          ozone: iaqi.o3?.v,
          sulphur_dioxide: iaqi.so2?.v,
          carbon_monoxide: iaqi.co?.v
        }};
      }
    } catch (e) { /* fall back to model */ }
  }
  return get(`https://air-quality-api.open-meteo.com/v1/air-quality?${geo}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide`).catch(() => null);
}

async function load(p) {
  status('Loading…');
  const geo = `latitude=${p.lat}&longitude=${p.lon}&timezone=auto`;
  try {
    const [w, a] = await Promise.all([
      get(`https://api.open-meteo.com/v1/forecast?${geo}&forecast_days=7&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max`),
      getAir(p, geo)
    ]);
    showWeather(p, w);
    showAir(a);
    status('');
    try { localStorage.setItem('place', JSON.stringify(p)); } catch (e) { /* storage unavailable */ }
  } catch (e) {
    status('Could not load data. Check your connection and try again.');
  }
}

function showWeather(p, w) {
  const c = w.current, d = describe(c.weather_code), day = w.daily;
  liveTemp = c.temperature_2m;
  liveWind = c.wind_speed_10m;

  $('place').textContent = p.region ? `${p.name}, ${p.region}` : p.name;
  $('temp').textContent = Math.round(c.temperature_2m) + '°';
  $('cond').textContent = d.l;
  $('sub').textContent = `Feels like ${Math.round(c.apparent_temperature)}°. High ${Math.round(day.temperature_2m_max[0])}°, low ${Math.round(day.temperature_2m_min[0])}°.`;
  setScene(c.weather_code, !c.is_day);

  const i0 = Math.max(0, w.hourly.time.findIndex(x => x >= c.time.slice(0, 13) + ':00'));
  const vis = w.hourly.visibility[i0];
  const tiles = [
    ['Humidity', c.relative_humidity_2m + '%', ''],
    ['Wind', Math.round(c.wind_speed_10m) + ' km/h', compass(c.wind_direction_10m)],
    ['Pressure', Math.round(c.surface_pressure) + ' hPa', ''],
    ['UV index', Math.round(day.uv_index_max[0]), 'today’s peak'],
    ['Visibility', vis == null ? '–' : (vis / 1000).toFixed(1) + ' km', ''],
    ['Sunrise', hm(day.sunrise[0]), 'Sunset ' + hm(day.sunset[0])]
  ];
  $('tiles').innerHTML = tiles.map(([k, v, s]) => `<div class="tile"><small>${k}</small><b>${v}</b><span>${s}</span></div>`).join('');

  $('hours').innerHTML = Array.from({ length: 24 }, (_, n) => i0 + n).filter(i => w.hourly.time[i]).map((i, n) =>
    `<div class="h"><small>${n ? hr(w.hourly.time[i]) : 'Now'}</small><div class="ic">${describe(w.hourly.weather_code[i]).ic}</div><b>${Math.round(w.hourly.temperature_2m[i])}°</b></div>`).join('');

  const lo = Math.min(...day.temperature_2m_min), hi = Math.max(...day.temperature_2m_max), span = hi - lo || 1;
  $('days').innerHTML = day.time.map((s, i) => {
    const name = i ? new Date(s + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short' }) : 'Today';
    const l = day.temperature_2m_min[i], h = day.temperature_2m_max[i], rain = day.precipitation_probability_max[i];
    return `<li><span>${name}</span><span class="c">${describe(day.weather_code[i]).l}${rain >= 20 ? ', ' + rain + '% rain' : ''}</span><span class="lo">${Math.round(l)}°</span><div class="bar"><i style="left:${(l - lo) / span * 100}%;right:${100 - (h - lo) / span * 100}%"></i></div><span>${Math.round(h)}°</span></li>`;
  }).join('');
}

function showAir(a) {
  const el = $('air');
  if (!a || !a.current || a.current.us_aqi == null) {
    liveAqi = 50;
    el.innerHTML = '<p class="advice">Air quality data is not available for this place.</p>';
    return;
  }
  const c = a.current, v = Math.round(c.us_aqi), lvl = AQ.find(x => v <= x[0]);
  liveAqi = v;
  const pol = [['PM2.5', c.pm2_5], ['PM10', c.pm10], ['NO₂', c.nitrogen_dioxide], ['O₃', c.ozone], ['SO₂', c.sulphur_dioxide], ['CO', c.carbon_monoxide]];
  el.innerHTML = `<div class="air-top"><span class="aqi-num">${v}</span><span class="aqi-cat" style="color:${lvl[2]}">${lvl[1]}</span></div>
    <div class="scale"><i style="left:${Math.min(v, 300) / 300 * 100}%"></i></div>
    <p class="advice">${lvl[3]}</p>
    <div class="pol">${pol.map(([k, x]) => `<div><small>${k}</small><b>${x == null ? '–' : Math.round(x)}</b> <small>µg/m³</small></div>`).join('')}</div>`;
}

/* ---------- search & locality suggestions ---------- */
const qInput = $('q'), sugBox = $('suggestions');
let timer = null, matches = [], pickedIdx = -1;

async function findPlaces(query) {
  const [om, osm] = await Promise.all([
    get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=4&language=en`).catch(() => ({ results: [] })),
    get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`).catch(() => [])
  ]);

  const list = [];
  const seen = new Set();

  // Open-Meteo cities/towns first
  for (const x of (om.results || [])) {
    const key = `${x.name.toLowerCase()}-${Math.round(x.latitude * 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const parts = [x.admin2, x.admin1, x.country].filter(Boolean);
    list.push({
      name: x.name,
      region: parts.join(', '),
      lat: x.latitude,
      lon: x.longitude
    });
  }

  // OpenStreetMap neighborhoods, localities, sectors, villages
  for (const x of (osm || [])) {
    const addr = x.address || {};
    const main = x.name || addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.village;
    if (!main) continue;
    const key = `${main.toLowerCase()}-${Math.round(Number(x.lat) * 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const area = [addr.suburb, addr.city || addr.town || addr.village || addr.county, addr.state, addr.country]
      .filter((v, i, arr) => v && v !== main && arr.indexOf(v) === i);
    list.push({
      name: main,
      region: area.join(', '),
      lat: Number(x.lat),
      lon: Number(x.lon)
    });
  }

  return list.slice(0, 7);
}

function renderSuggestions() {
  if (!matches.length) {
    sugBox.hidden = true;
    return;
  }
  sugBox.innerHTML = matches.map((m, i) =>
    `<li class="${i === pickedIdx ? 'active' : ''}" data-i="${i}"><strong>${m.name}</strong><span>${m.region || 'Location'}</span></li>`
  ).join('');
  sugBox.hidden = false;
}

function choosePlace(p) {
  if (!p) return;
  qInput.value = '';
  matches = [];
  pickedIdx = -1;
  sugBox.hidden = true;
  load(p);
}

qInput.addEventListener('input', () => {
  clearTimeout(timer);
  const val = qInput.value.trim();
  pickedIdx = -1;
  if (val.length < 2) {
    matches = [];
    sugBox.hidden = true;
    return;
  }
  timer = setTimeout(async () => {
    matches = await findPlaces(val);
    renderSuggestions();
  }, 260);
});

qInput.addEventListener('keydown', e => {
  if (sugBox.hidden || !matches.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    pickedIdx = (pickedIdx + 1) % matches.length;
    renderSuggestions();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    pickedIdx = (pickedIdx - 1 + matches.length) % matches.length;
    renderSuggestions();
  } else if (e.key === 'Enter' && pickedIdx >= 0) {
    e.preventDefault();
    choosePlace(matches[pickedIdx]);
  } else if (e.key === 'Escape') {
    sugBox.hidden = true;
  }
});

sugBox.addEventListener('mousedown', e => {
  const li = e.target.closest('li');
  if (li) choosePlace(matches[Number(li.dataset.i)]);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#search')) sugBox.hidden = true;
});

$('search').addEventListener('submit', async e => {
  e.preventDefault();
  if (pickedIdx >= 0 && matches[pickedIdx]) {
    choosePlace(matches[pickedIdx]);
    return;
  }
  const q = qInput.value.trim();
  if (!q) return;
  status('Searching…');
  sugBox.hidden = true;
  try {
    const found = await findPlaces(q);
    if (!found.length) {
      status('No place found. Try another spelling.');
      return;
    }
    choosePlace(found[0]);
  } catch (err) {
    status('Search failed. Check your connection.');
  }
});

/* ---------- start ---------- */
let start = DEFAULT;
try { start = JSON.parse(localStorage.getItem('place')) || DEFAULT; } catch (e) { /* use default */ }
resize(); play(); load(start);
})();
