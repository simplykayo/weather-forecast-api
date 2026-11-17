# Lucknow Weather

A minimal, dark-themed weather and air quality app built with plain HTML, CSS, and JavaScript. It displays live conditions, hourly and 7-day forecasts, and US AQI readings with individual pollutant breakdowns.

The header scene updates dynamically based on current conditions—rain falls from the clouds, snow drifts, storms flash, and clear nights show stars. It defaults to Naka Hindola, Lucknow, with search support for any city worldwide.

## Features

- **Live Weather & Forecasts:** Real-time temperature, conditions, hourly breakdown, and a 7-day outlook.
- **Air Quality (AQI):** US AQI index along with specific pollutant levels.
- **Dynamic Header Animations:** Visual weather effects that match the active forecast.
- **City Search:** Defaults to Naka Hindola, Lucknow, with instant search for any global location.
- **Device Location:** Select “Select my location” to request browser permission and load weather for your current coordinates.
- **Zero Dependencies:** Written in vanilla HTML, CSS, and JS with no build tools or frameworks required.

## Air Quality Setup (Optional)

Out of the box, air quality data uses model estimates from Open-Meteo. If you want live readings from the nearest government monitoring station instead:

1. Get a free API token from [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/).
2. Open `app.js` and paste your token into the `WAQI_TOKEN` variable at the top of the file.

*(Note: Since this is a client-side app, any token added to `app.js` will be visible in the browser. Use a server-side proxy if you need to keep your key private.)*

## Running Locally

No installation or build step is needed:

- Double-click `index.html` to open it directly in your browser, or
- Open the folder in VS Code and launch `index.html` using the **Live Server** extension.

## Deployment

- **Netlify:** Click **Add new site** > **Import an existing project**, select this repository, leave the build command empty, set the publish directory to `.`, and deploy.
- **GitHub Pages:** Go to **Settings** > **Pages**, and set the source to the `main` branch and `/ (root)` folder.

## Data Sources

- **Weather & Geocoding:** [Open-Meteo API](https://open-meteo.com/)
- **Air Quality:** [World Air Quality Index (WAQI)](https://aqicn.org/) (when `WAQI_TOKEN` is set) with Open-Meteo as the default fallback.
