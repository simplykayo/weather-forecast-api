# City Search Weather

A responsive weather dashboard built with plain HTML, CSS and JavaScript. It brings current conditions, forecasts, air quality, astronomy and recent precipitation radar together without a build step or a front-end framework.

The interface is intentionally simple: search for a place, use your device location, and move between the weather, radar and astronomy pages. A light/dark theme preference is shared across all three pages.

## What it includes

- **Current weather:** temperature, feels-like temperature, humidity, wind, pressure, UV and visibility.
- **Forecasts:** an hourly outlook and a seven-day forecast.
- **Air quality:** US AQI and pollutant readings from Open-Meteo, with optional WAQI support.
- **Weather radar:** an interactive Leaflet map with recent RainViewer precipitation frames, playback controls and adjustable overlay opacity.
- **Astronomy:** solar position tracker with a time slider, sunrise and sunset, civil/nautical/astronomical twilight, solar noon, lunar phases and calendar, moonrise and moonset, calculated positions for the seven planets, meteor-shower calendar, live ISS map and NASA's astronomy picture of the day.
- **Location search:** city and place lookup, plus browser geolocation where permission is granted.
- **Theme:** light and dark modes, with the choice remembered in the browser.
- **Responsive layout:** the pages adapt to phones, tablets and desktop screens.

## Run it locally

There is no package installation or build command.

1. Clone or download this repository.
2. Open the folder in your editor.
3. Serve the folder with a local web server. VS Code's Live Server extension works well.
4. Open index.html in the browser through that local server.

Some browser features, especially geolocation, require HTTPS or localhost. Opening the files directly may prevent those features from working.

## Deploy on Cloudflare Pages

This is a static site, so it does not need a build step.

1. Open **Workers & Pages** in the Cloudflare dashboard.
2. Create a Pages project and connect this GitHub repository.
3. Set the production branch to main.
4. Leave the build command empty.
5. Set the build output directory to . (the repository root).
6. Deploy.

When the connected branch is updated, Cloudflare Pages can publish the static files automatically. The site does not require a server-side runtime.

## Data sources and attribution

- **Weather, air quality and geocoding:** [Open-Meteo](https://open-meteo.com/).
- **Radar imagery:** [RainViewer Weather Maps API](https://www.rainviewer.com/api/weather-maps-api.html).
- **Map library:** [Leaflet](https://leafletjs.com/).
- **Base map:** [OpenStreetMap](https://www.openstreetmap.org/copyright).
- **Astronomical calculations:** [Astronomy Engine](https://github.com/cosinekitty/astronomy), running in the browser.
- **ISS position:** [Where the ISS at? API](https://docs.wheretheiss.at/w/developer).
- **Astronomy picture of the day:** [NASA APOD feed](https://science.nasa.gov/wp-json/wp/v2/apod-basic/).

The free RainViewer radar feed is intended for personal and educational use. It provides past radar frames rather than a precipitation forecast, and its coverage and availability can vary by region. The radar page credits RainViewer and OpenStreetMap.

## Air quality notes

Open-Meteo is used as the default air-quality source. The code can also use a WAQI token if one is configured, but a token placed in browser JavaScript is public. Do not commit private credentials to this repository. If you need a private WAQI token, put it behind a server-side endpoint such as a Cloudflare Worker and keep the secret in Cloudflare's environment settings.

## Project structure

- index.html, style.css, app.js — main weather dashboard.
- radar.html, radar.css, radar.js — precipitation radar and playback controls.
- astronomy.html, astronomy.css, astronomy.js, astronomy-extra.js — astronomy dashboard, solar and planetary calculations, ISS tracking and NASA feature.
- theme.css, theme.js — shared theme styles and preference handling.

## Notes

This project is deliberately framework-free. Keep features focused, use small files with clear responsibilities, and prefer browser APIs or existing project dependencies when they are enough. External data providers can change their APIs or availability, so the interface should handle missing data gracefully. The ISS position refreshes every 10 seconds to stay below the provider's approximate one-request-per-second limit. The ISS map uses OpenStreetMap tiles and Leaflet. Planet and solar positions are computed client-side with Astronomy Engine. Meteor-shower dates are annual approximations, not observing guarantees. The stargazing score is a simple cloud-and-moonlight estimate, not a light-pollution measurement.
