// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeWeather();
    // Refresh weather data every 30 minutes
    setInterval(initializeWeather, 30 * 60 * 1000);
});

// Weather settings
const WEATHER_SETTINGS = {
    units: 'metric', // ensures temperature is in Celsius
    tempUnit: '°C',
    speedUnit: 'km/h',
    distanceUnit: 'km',
    precipitationUnit: 'mm'
};

function initializeApp() {
    setupMobileNav();
    setupScrollAnimation();
    initializeWeather();
}

// Weather data formatting
function formatTemperature(temp) {
    return `${Math.round(temp)}${WEATHER_SETTINGS.tempUnit}`;
}

function formatWindSpeed(speed) {
    return `${Math.round(speed)} ${WEATHER_SETTINGS.speedUnit}`;
}

function formatPrecipitation(amount) {
    return `${amount} ${WEATHER_SETTINGS.precipitationUnit}`;
}

// Mobile Navigation
function setupMobileNav() {
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const primaryNav = document.querySelector('#primary-navigation');

    if (mobileNavToggle && primaryNav) {
        mobileNavToggle.addEventListener('click', () => {
            const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
            mobileNavToggle.setAttribute('aria-expanded', !isExpanded);
            primaryNav.classList.toggle('active');
        });
    }
}

// Smooth Scroll Animation
function setupScrollAnimation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Add animation classes to elements
document.querySelectorAll('.events-grid, .map-container, .weather-container').forEach(element => {
    observer.observe(element);
});

// Weather API Integration
async function initializeWeather() {
    try {
        const [weatherData, forecastData] = await Promise.all([
            fetchCurrentWeather(),
            fetch4DayForecast()
        ]);
        updateWeatherDisplay(weatherData, forecastData);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showWeatherError();
    }
}

async function fetchCurrentWeather() {
    const response = await fetch('https://api.data.gov.sg/v1/environment/air-temperature');
    if (!response.ok) throw new Error('Failed to fetch current weather');
    const data = await response.json();
    return data.items[0];
}

async function fetch4DayForecast() {
    const response = await fetch('https://api.data.gov.sg/v1/environment/4-day-weather-forecast');
    if (!response.ok) throw new Error('Failed to fetch forecast');
    const data = await response.json();
    return data.items[0];
}

function updateWeatherDisplay(current, forecast) {
    updateCurrentWeather(current);
    updateForecastDisplay(forecast.forecasts);
}

function updateCurrentWeather(data) {
    const currentWeatherEl = document.getElementById('current-weather');
    if (!currentWeatherEl) return;

    // Find the reading for Pasir Ris
    const pasirRisReading = data.readings.find(r => r.station_id === 'S50') || data.readings[0];

    currentWeatherEl.innerHTML = `
        <div class="weather-metric">
            <div class="weather-temp">${formatTemperature(pasirRisReading.value)}</div>
        </div>
        <div class="weather-details">
            Last updated: ${new Date(data.timestamp).toLocaleTimeString()}
        </div>
    `;
}

function updateForecastDisplay(forecasts) {
    const forecastContainer = document.getElementById('forecast-container');
    if (!forecastContainer) return;

    forecastContainer.innerHTML = forecasts.map(forecast => `
        <div class="forecast-card">
            <div class="weather-date">${formatDate(forecast.date)}</div>
            <div class="weather-icon">${getWeatherIcon(forecast.forecast)}</div>
            <div class="weather-temp">
                ${formatTemperature(forecast.temperature.low)} - ${formatTemperature(forecast.temperature.high)}
            </div>
            <div class="weather-desc">${forecast.forecast}</div>
            <div class="weather-details">
                Humidity: ${forecast.relative_humidity.low}% - ${forecast.relative_humidity.high}%<br>
                Wind: ${forecast.wind.speed.low} - ${forecast.wind.speed.high} km/h
            </div>
        </div>
    `).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-SG', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getWeatherIcon(forecast) {
    // Map weather conditions to emojis
    const weatherIcons = {
        'Sunny': '☀️',
        'Partly Cloudy': '⛅',
        'Cloudy': '☁️',
        'Light Rain': '🌦️',
        'Moderate Rain': '🌧️',
        'Heavy Rain': '⛈️',
        'Light Showers': '🌦️',
        'Heavy Showers': '🌧️',
        'Thundery Showers': '⛈️',
        'Fair': '🌤️',
        'Fair & Warm': '🌤️',
        'Windy': '💨'
    };

    // Find the matching weather condition
    const condition = Object.keys(weatherIcons).find(key => 
        forecast.toLowerCase().includes(key.toLowerCase())
    );

    return weatherIcons[condition] || '🌤️';
}

function showWeatherError() {
    const elements = ['current-weather', 'forecast-container'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `
                <div class="weather-error">
                    Unable to load weather data. Please try again later.
                </div>
            `;
        }
    });
}
