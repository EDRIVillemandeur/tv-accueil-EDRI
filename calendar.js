const STORAGE_KEY = 'edri-events';

const monthYearEl = document.getElementById('month-year');
const calendarDaysEl = document.getElementById('calendar-days');
const eventDateInput = document.getElementById('event-date');
const eventTitleInput = document.getElementById('event-title');
const eventForm = document.getElementById('event-form');
const formMessageEl = document.getElementById('form-message');
const allEventsEl = document.getElementById('all-events');
const clearAllButton = document.getElementById('clear-all');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const backButton = document.getElementById('back-button');

let currentMonth = new Date();
currentMonth.setDate(1);

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getSavedEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

async function loadDefaultEvents() {
  try {
    const response = await fetch('events.json', { cache: 'no-store' });
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return;

    const saved = getSavedEvents();
    if (saved.length === 0) {
      saveEvents(data);
    }
  } catch (error) {
    // Ignore
  }
}

function getEventsForDate(dateKey) {
  return getSavedEvents().filter(event => event.date === dateKey);
}

function renderMonthTitle() {
  const title = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric'
  }).format(currentMonth);

  monthYearEl.textContent = title.charAt(0).toUpperCase() + title.slice(1);
}

function renderCalendar() {
  renderMonthTitle();
  calendarDaysEl.innerHTML = '';

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  for (let i = 0; i < leadingDays; i += 1) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty-cell';
    calendarDaysEl.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);
    const eventCount = getEventsForDate(dateKey).length;
    const todayKey = formatDateKey(new Date());

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    if (dateKey === todayKey) cell.classList.add('today-cell');
    if (eventCount > 0) cell.classList.add('has-events');

    cell.innerHTML = `
      <span class="day-number">${day}</span>
      ${eventCount ? `<span class="day-badge">${eventCount}</span>` : ''}
    `;

    cell.addEventListener('click', () => {
      eventDateInput.value = dateKey;
      eventTitleInput.focus();
    });

    calendarDaysEl.appendChild(cell);
  }

  const totalCells = leadingDays + totalDays;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remainingCells; i += 1) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty-cell';
    calendarDaysEl.appendChild(emptyCell);
  }
}

function renderEventsList() {
  const events = getSavedEvents().sort((a, b) => a.date.localeCompare(b.date));

  if (!events.length) {
    allEventsEl.innerHTML = '<p class="muted">Aucun événement enregistré.</p>';
    return;
  }

  allEventsEl.innerHTML = events.map(event => {
    const date = new Date(`${event.date}T12:00:00`);
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);

    return `
      <div class="list-event">
        <div class="list-event-date">${formattedDate}</div>
        <div class="list-event-title">${event.title}</div>
        <button class="delete-event" type="button" data-date="${event.date}" data-title="${event.title}">Supprimer</button>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.delete-event').forEach(button => {
    button.addEventListener('click', () => {
      const eventsAfterDelete = getSavedEvents().filter(event => !(event.date === button.dataset.date && event.title === button.dataset.title));
      saveEvents(eventsAfterDelete);
      renderCalendar();
      renderEventsList();
    });
  });
}

function showMessage(message, isError = false) {
  formMessageEl.textContent = message;
  formMessageEl.classList.toggle('error', isError);
}

function addEvent(eventDate, eventTitle) {
  const trimmedTitle = eventTitle.trim();
  if (!eventDate || !trimmedTitle) {
    showMessage('Veuillez remplir la date et le titre.', true);
    return;
  }

  const events = getSavedEvents();
  const exists = events.some(event => event.date === eventDate && event.title.toLowerCase() === trimmedTitle.toLowerCase());
  if (exists) {
    showMessage('Cet événement existe déjà pour cette date.', true);
    return;
  }

  events.push({ date: eventDate, title: trimmedTitle });
  saveEvents(events.sort((a, b) => a.date.localeCompare(b.date)));

  eventForm.reset();
  eventDateInput.value = eventDate;
  showMessage('Événement ajouté avec succès.');
  renderCalendar();
  renderEventsList();
}

eventForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addEvent(eventDateInput.value, eventTitleInput.value);
});

clearAllButton.addEventListener('click', () => {
  const shouldClear = window.confirm('Voulez-vous vraiment supprimer tous les événements ?');
  if (!shouldClear) return;

  saveEvents([]);
  showMessage('Tous les événements ont été supprimés.');
  renderCalendar();
  renderEventsList();
});

prevMonthButton.addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  renderCalendar();
});

backButton.addEventListener('click', () => {
  window.location.href = 'index.html';
});

(async function initCalendar() {
  await loadDefaultEvents();
  eventDateInput.value = formatDateKey(new Date());
  renderCalendar();
  renderEventsList();
})();
