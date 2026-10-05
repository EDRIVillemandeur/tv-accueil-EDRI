const STORAGE_KEY = 'edri-events';

const monthYearEl = document.getElementById('month-year');
const calendarDaysEl = document.getElementById('calendar-days');
const eventForm = document.getElementById('event-form');
const formMessageEl = document.getElementById('form-message');
const allEventsEl = document.getElementById('all-events');
const clearAllButton = document.getElementById('clear-all');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const backButton = document.getElementById('back-button');

const eventTypeSelect = document.getElementById('event-type');
const eventDateInput = document.getElementById('event-date');
const eventStartDateInput = document.getElementById('event-start-date');
const eventEndDateInput = document.getElementById('event-end-date');
const eventTitleInput = document.getElementById('event-title');
const singleDateGroup = document.getElementById('single-date-group');
const multiDateGroup = document.getElementById('multi-date-group');
const editEventIdInput = document.getElementById('edit-event-id');

let currentMonth = new Date();
currentMonth.setDate(1);
let events = [];

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toggleEventType() {
  const isSingle = eventTypeSelect.value === 'single';
  singleDateGroup.style.display = isSingle ? 'block' : 'none';
  multiDateGroup.style.display = isSingle ? 'none' : 'block';
  
  if (isSingle) {
    eventStartDateInput.value = '';
    eventEndDateInput.value = '';
  } else {
    eventDateInput.value = '';
  }
}

eventTypeSelect.addEventListener('change', toggleEventType);

function getSavedEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erreur lecture localStorage:', error);
    return [];
  }
}

function saveEvents(eventsArray) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsArray));
    return true;
  } catch (error) {
    console.error('Erreur écriture localStorage:', error);
    return false;
  }
}

async function loadInitialEvents() {
  try {
    const localEvents = getSavedEvents();
    const response = await fetch('events.json?t=' + new Date().getTime(), { cache: 'no-store' });
    if (!response.ok) throw new Error('Impossible de charger events.json');

    const fileEvents = await response.json();
    if (!Array.isArray(fileEvents)) return;

    if (localEvents.length === 0) {
      const seeded = [...fileEvents].sort((a, b) => {
        const dateA = a.startDate || a.date;
        const dateB = b.startDate || b.date;
        return dateA.localeCompare(dateB);
      });
      saveEvents(seeded);
    }

    events = getSavedEvents();
  } catch (error) {
    console.error('Erreur chargement initial:', error);
    events = getSavedEvents();
  }
}

function getEventsForDate(dateKey) {
  return getSavedEvents().filter(event => {
    if (event.date) return event.date === dateKey;
    if (event.startDate && event.endDate) {
      return dateKey >= event.startDate && dateKey <= event.endDate;
    }
    return false;
  });
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
    const dayEvents = getEventsForDate(dateKey);  // Récupère les événements du jour
    const eventCount = dayEvents.length;
    const todayKey = formatDateKey(new Date());

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    if (dateKey === todayKey) cell.classList.add('today-cell');
    if (eventCount > 0) cell.classList.add('has-events');
    
    // Ajouter une classe si c'est un événement multi-jour
    const hasMultiDay = dayEvents.some(e => e.startDate && e.endDate);
    if (hasMultiDay) cell.classList.add('has-multi-day');

    cell.innerHTML = `
      <span class="day-number">${day}</span>
      ${eventCount ? `<span class="day-badge">${eventCount}</span>` : ''}
    `;

    cell.addEventListener('click', () => {
      eventTypeSelect.value = 'single';
      toggleEventType();
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
  const sorted = getSavedEvents().sort((a, b) => {
    const dateA = a.startDate || a.date;
    const dateB = b.startDate || b.date;
    return dateA.localeCompare(dateB);
  });

  if (!sorted.length) {
    allEventsEl.innerHTML = '<p class="muted">Aucun événement enregistré.</p>';
    return;
  }

  allEventsEl.innerHTML = sorted.map((event, index) => {
    const startDate = event.startDate || event.date;
    const endDate = event.endDate;

    const date = new Date(`${startDate}T12:00:00`);
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);

    let displayDate = formattedDate;
    if (endDate) {
      const end = new Date(`${endDate}T12:00:00`);
      const formattedEndDate = new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(end);
      displayDate = `${formattedDate} → ${formattedEndDate}`;
    }

    return `
      <div class="list-event">
        <div class="list-event-date">${displayDate}</div>
        <div class="list-event-title">${event.title}</div>
        <div class="list-event-actions">
          <button class="edit-event" type="button" data-index="${index}">Modifier</button>
          <button class="delete-event" type="button" data-index="${index}">Supprimer</button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.edit-event').forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.dataset.index, 10);
      editEvent(index);
    });
  });

  document.querySelectorAll('.delete-event').forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.dataset.index, 10);
      deleteEvent(index);
    });
  });
}

function showMessage(message, isError = false) {
  formMessageEl.textContent = message;
  formMessageEl.classList.toggle('error', isError);
  if (!isError) {
    setTimeout(() => {
      formMessageEl.textContent = '';
    }, 3000);
  }
}

function resetForm() {
  eventForm.reset();
  editEventIdInput.value = '';
  eventTypeSelect.value = 'single';
  toggleEventType();
  eventDateInput.value = formatDateKey(new Date());
}

function submitEvent(eventDate, eventStartDate, eventEndDate, eventTitle) {
  const trimmedTitle = eventTitle.trim();
  
  if (!trimmedTitle) {
    showMessage('Veuillez entrer un titre.', true);
    return;
  }

  const isSingle = eventTypeSelect.value === 'single';
  
  if (isSingle && !eventDate) {
    showMessage('Veuillez sélectionner une date.', true);
    return;
  }

  if (!isSingle && (!eventStartDate || !eventEndDate)) {
    showMessage('Veuillez sélectionner les dates de début et fin.', true);
    return;
  }

  if (!isSingle && eventStartDate > eventEndDate) {
    showMessage('La date de fin doit être après la date de début.', true);
    return;
  }

  const editId = editEventIdInput.value;
  const currentEvents = getSavedEvents();

  try {
    let payload;
    if (isSingle) {
      payload = { date: eventDate, title: trimmedTitle };
    } else {
      payload = { startDate: eventStartDate, endDate: eventEndDate, title: trimmedTitle };
    }

    if (editId !== '') {
      const index = parseInt(editId, 10);
      currentEvents[index] = payload;
      showMessage('Événement modifié avec succès.');
    } else {
      const exists = currentEvents.some(e => {
        if (e.date && payload.date) return e.date === payload.date && e.title === payload.title;
        if (e.startDate && payload.startDate) {
          return e.startDate === payload.startDate && e.endDate === payload.endDate && e.title === payload.title;
        }
        return false;
      });

      if (exists) {
        showMessage('Cet événement existe déjà.', true);
        return;
      }

      currentEvents.push(payload);
      showMessage('Événement ajouté avec succès.');
    }

    currentEvents.sort((a, b) => {
      const dateA = a.startDate || a.date;
      const dateB = b.startDate || b.date;
      return dateA.localeCompare(dateB);
    });

    saveEvents(currentEvents);
    resetForm();
    renderCalendar();
    renderEventsList();
  } catch (error) {
    console.error('Erreur:', error);
    showMessage('Erreur lors de la sauvegarde.', true);
  }
}

function editEvent(index) {
  const currentEvents = getSavedEvents();
  const event = currentEvents[index];
  if (!event) return;

  editEventIdInput.value = index;

  if (event.date) {
    eventTypeSelect.value = 'single';
    eventDateInput.value = event.date;
  } else {
    eventTypeSelect.value = 'multi';
    eventStartDateInput.value = event.startDate;
    eventEndDateInput.value = event.endDate;
  }

  eventTitleInput.value = event.title;
  toggleEventType();
  eventTitleInput.focus();
}

function deleteEvent(index) {
  if (!window.confirm('Supprimer cet événement ?')) return;

  const currentEvents = getSavedEvents();
  currentEvents.splice(index, 1);
  saveEvents(currentEvents);
  showMessage('Événement supprimé.');
  renderCalendar();
  renderEventsList();
}

eventForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const isSingle = eventTypeSelect.value === 'single';
  submitEvent(
    isSingle ? eventDateInput.value : '',
    !isSingle ? eventStartDateInput.value : '',
    !isSingle ? eventEndDateInput.value : '',
    eventTitleInput.value
  );
});

clearAllButton.addEventListener('click', () => {
  if (!window.confirm('Supprimer tous les événements ?')) return;

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
  await loadInitialEvents();
  eventDateInput.value = formatDateKey(new Date());
  toggleEventType();
  renderCalendar();
  renderEventsList();
})();
