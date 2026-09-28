const VILLEMANDEUR = { latitude: 48.003, longitude: 2.697, timezone: 'Europe/Paris' };

const weatherText = {
  0: ['Ciel dégagé', '☀️'],
  1: ['Peu nuageux', '🌤️'],
  2: ['Partiellement nuageux', '⛅'],
  3: ['Couvert', '☁️'],
  45: ['Brouillard', '🌫️'],
  48: ['Brouillard givrant', '🌫️'],
  51: ['Bruine légère', '🌦️'],
  53: ['Bruine', '🌦️'],
  55: ['Bruine forte', '🌧️'],
  61: ['Pluie légère', '🌦️'],
  63: ['Pluie', '🌧️'],
  65: ['Forte pluie', '🌧️'],
  71: ['Neige légère', '🌨️'],
  73: ['Neige', '❄️'],
  75: ['Forte neige', '❄️'],
  80: ['Averses', '🌦️'],
  81: ['Averses', '🌦️'],
  82: ['Fortes averses', '⛈️'],
  95: ['Orage', '⛈️'],
  99: ['Orage et grêle', '⛈️']
};

const $ = (id) => document.getElementById(id);

function updateClock() {
  try {
    const now = new Date();
    const clockEl = $('clock');
    const todayEl = $('today');
    
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (todayEl) {
      todayEl.textContent = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  } catch (e) {
    console.error('Erreur updateClock:', e);
  }
}

async function loadWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${VILLEMANDEUR.latitude}&longitude=${VILLEMANDEUR.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis`;
    
    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) throw new Error('Réponse météo invalide');
    
    const data = await response.json();
    const current = data.current;
    const daily = data.daily;
    const info = weatherText[current.weather_code] || ['Conditions variables', '🌤️'];

    const tempEl = $('temperature');
    const descEl = $('weather-description');
    const iconEl = $('weather-icon');
    const feelsEl = $('feels-like');
    const maxEl = $('max-temp');
    const minEl = $('min-temp');
    const humidEl = $('humidity');

    if (tempEl) tempEl.textContent = `${Math.round(current.temperature_2m)}°`;
    if (descEl) descEl.textContent = info[0];
    if (iconEl) iconEl.textContent = info[1];
    if (feelsEl) feelsEl.textContent = `Ressenti ${Math.round(current.apparent_temperature)}°`;
    if (maxEl) maxEl.textContent = `${Math.round(daily.temperature_2m_max[0])}°`;
    if (minEl) minEl.textContent = `${Math.round(daily.temperature_2m_min[0])}°`;
    if (humidEl) humidEl.textContent = `${current.relative_humidity_2m}%`;
  } catch (e) {
    console.error('Erreur météo:', e);
    const descEl = $('weather-description');
    if (descEl) descEl.textContent = 'Météo indisponible';
  }
}

async function loadEvents() {
  try {
    const response = await fetch('events.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Réponse événements invalide');
    
    const events = await response.json();
    if (!Array.isArray(events)) throw new Error('Format événements invalide');
    
    const now = new Date();
    const upcoming = events
      .filter(e => new Date(`${e.date}T23:59:59`) >= now)
      .sort((a, b) => a.date.localeCompare(b.date));

    const eventsEl = $('events');
    if (!eventsEl) return;
    
    eventsEl.innerHTML = upcoming.length
      ? upcoming.map(e => {
          const date = new Date(`${e.date}T12:00:00`);
          const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
          return `
            <article class="event" data-date="${e.date}">
              <div class="event-date">
                <strong>${date.getDate()}</strong>${monthLabel}
              </div>
              <div class="event-title">${e.title}</div>
            </article>
          `;
        }).join('')
      : '<p class="muted">Aucun événement à venir.</p>';

    document.querySelectorAll('.event').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        window.location.href = 'calendar.html';
      });
    });

  } catch (e) {
    console.error('Erreur événements:', e);
    const eventsEl = $('events');
    if (eventsEl) eventsEl.innerHTML = '<p class="muted">Impossible de charger les événements.</p>';
  }
}

function initializeUI() {
  try {
    updateClock();
    loadWeather();
    loadEvents();

    setInterval(updateClock, 1000);
    setInterval(() => loadWeather().catch(e => console.error('Erreur rafraîchissement météo:', e)), 30 * 60 * 1000);
    setInterval(() => loadEvents().catch(e => console.error('Erreur rafraîchissement événements:', e)), 5 * 60 * 1000);

    const eventsCard = document.querySelector('.events-card');
    if (eventsCard) {
      eventsCard.style.cursor = 'pointer';
      eventsCard.addEventListener('click', () => {
        window.location.href = 'calendar.html';
      });
    }
  } catch (e) {
    console.error('Erreur initialisation:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}
