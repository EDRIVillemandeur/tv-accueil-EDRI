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
let datePickers = {};

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateKey) {
  if (!dateKey) return '';
  const [year, month, day] = dateKey.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}

function updateDateInputDisplay(input, dateValue) {
  if (!input) return;
  input.value = formatDateDisplay(dateValue);
  input.dataset.value = dateValue || '';
}

function getDatePickerState(input) {
  if (!input || !input.dataset.value) {
    return { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() };
  }
  const [year, month, day] = input.dataset.value.split('-');
  return { year: Number(year), month: Number(month), day: Number(day) };
}

function createDatePicker(inputElement) {
  const wrapper = document.createElement('div');
  wrapper.className = 'date-picker-wrapper';

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.readOnly = true;
  textInput.placeholder = 'JJ/MM/YYYY';
  textInput.className = 'date-picker-input';

  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'date-picker-button';
  openButton.textContent = '📅';

  wrapper.appendChild(textInput);
  wrapper.appendChild(openButton);

  let modal = null;
  let selectedYear = null;
  let selectedMonth = null;
  let selectedDay = null;

  function buildModal() {
    const state = getDatePickerState(inputElement);
    selectedYear = state.year;
    selectedMonth = state.month;
    selectedDay = state.day;

    modal = document.createElement('div');
    modal.className = 'date-picker-modal';

    const content = document.createElement('div');
    content.className = 'date-picker-content';

    const header = document.createElement('div');
    header.className = 'date-picker-header';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'date-picker-nav';
    prevBtn.textContent = '◀';
    prevBtn.addEventListener('click', () => {
      selectedMonth -= 1;
      if (selectedMonth < 1) {
        selectedMonth = 12;
        selectedYear -= 1;
      }
      render();
    });

    const title = document.createElement('div');
    title.className = 'date-picker-title';
    title.textContent = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    }).replace(/^./, s => s.toUpperCase());

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'date-picker-nav';
    nextBtn.textContent = '▶';
    nextBtn.addEventListener('click', () => {
      selectedMonth += 1;
      if (selectedMonth > 12) {
        selectedMonth = 1;
        selectedYear += 1;
      }
      render();
    });

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);

    const daysGrid = document.createElement('div');
    daysGrid.className = 'date-picker-grid';

    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(label => {
      const headerCell = document.createElement('div');
      headerCell.className = 'date-picker-weekday';
      headerCell.textContent = label;
      daysGrid.appendChild(headerCell);
    });

    const calendarDays = document.createElement('div');
    calendarDays.className = 'date-picker-days';

    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const leading = (firstDay.getDay() + 6) % 7;
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

    for (let i = 0; i < leading; i += 1) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'date-picker-day empty';
      calendarDays.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'date-picker-day';
      button.textContent = day;

      if (selectedDay === day && Number(inputElement.dataset.value?.split('-')[1]) === selectedMonth && Number(inputElement.dataset.value?.split('-')[0]) === selectedYear) {
        button.classList.add('selected');
      }

      button.addEventListener('click', () => {
        selectedDay = day;
        render();
      });

      calendarDays.appendChild(button);
    }

    const actions = document.createElement('div');
    actions.className = 'date-picker-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'date-picker-cancel';
    cancelBtn.textContent = 'Annuler';
    cancelBtn.addEventListener('click', closeModal);

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'date-picker-confirm';
    confirmBtn.textContent = 'Valider';
    confirmBtn.addEventListener('click', () => {
      if (!selectedYear || !selectedMonth || !selectedDay) return;
      const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      inputElement.value = dateKey;
      inputElement.dataset.value = dateKey;
      updateDateInputDisplay(textInput, dateKey);
      closeModal();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);

    content.appendChild(header);
    content.appendChild(daysGrid);
    content.appendChild(calendarDays);
    content.appendChild(actions);
    modal.appendChild(content);

    document.body.appendChild(modal);
  }

  function render() {
    if (!modal) return;
    modal.innerHTML = '';

    const content = document.createElement('div');
    content.className = 'date-picker-content';

    const header = document.createElement('div');
    header.className = 'date-picker-header';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'date-picker-nav';
    prevBtn.textContent = '◀';
    prevBtn.addEventListener('click', () => {
      selectedMonth -= 1;
      if (selectedMonth < 1) {
        selectedMonth = 12;
        selectedYear -= 1;
      }
      render();
    });

    const title = document.createElement('div');
    title.className = 'date-picker-title';
    title.textContent = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    }).replace(/^./, s => s.toUpperCase());

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'date-picker-nav';
    nextBtn.textContent = '▶';
    nextBtn.addEventListener('click', () => {
      selectedMonth += 1;
      if (selectedMonth > 12) {
        selectedMonth = 1;
        selectedYear += 1;
      }
      render();
    });

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);

    const grid = document.createElement('div');
    grid.className = 'date-picker-grid';
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(label => {
      const cell = document.createElement('div');
      cell.className = 'date-picker-weekday';
      cell.textContent = label;
      grid.appendChild(cell);
    });

    const days = document.createElement('div');
    days.className = 'date-picker-days';

    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const leading = (firstDay.getDay() + 6) % 7;
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

    for (let i = 0; i < leading; i += 1) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'date-picker-day empty';
      days.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const dayBtn = document.createElement('button');
      dayBtn.type = 'button';
      dayBtn.className = 'date-picker-day';
      dayBtn.textContent = day;

      const isSelected = day === selectedDay;
      if (isSelected) dayBtn.classList.add('selected');

      dayBtn.addEventListener('click', () => {
        selectedDay = day;
        render();
      });

      days.appendChild(dayBtn);
    }

    const actions = document.createElement('div');
    actions.className = 'date-picker-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'date-picker-cancel';
    cancelBtn.textContent = 'Annuler';
    cancelBtn.addEventListener('click', closeModal);

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'date-picker-confirm';
    confirmBtn.textContent = 'Valider';
    confirmBtn.addEventListener('click', () => {
      const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      inputElement.value = dateKey;
      inputElement.dataset.value = dateKey;
      updateDateInputDisplay(textInput, dateKey);
      closeModal();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);

    content.appendChild(header);
    content.appendChild(grid);
    content.appendChild(days);
    content.appendChild(actions);
    modal.appendChild(content);
  }

  function openModal() {
    if (modal) {
      modal.remove();
      modal = null;
    }
    const state = getDatePickerState(inputElement);
    selectedYear = state.year;
    selectedMonth = state.month;
    selectedDay = state.day;
    modal = document.createElement('div');
    modal.className = 'date-picker-modal';
    document.body.appendChild(modal);
    render();
  }

  function closeModal() {
    if (modal) {
      modal.remove();
      modal = null;
    }
  }

  openButton.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });

  textInput.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });

  if (inputElement.value) {
    inputElement.dataset.value = inputElement.value;
    updateDateInputDisplay(textInput, inputElement.value);
  }

  inputElement.style.display = 'none';
  inputElement.parentNode.insertBefore(wrapper, inputElement);
  wrapper.appendChild(inputElement);

  return { input: textInput, open: openModal };
}

function initDatePickers() {
  datePickers.single = createDatePicker(eventDateInput);
  datePickers.start = createDatePicker(eventStartDateInput);
  datePickers.end = createDatePicker(eventEndDateInput);
}

function toggleEventType() {
  const isSingle = eventTypeSelect.value === 'single';
  singleDateGroup.style.display = isSingle ? 'block' : 'none';
  multiDateGroup.style.display = isSingle ? 'none' : 'block';

  if (isSingle) {
    eventStartDateInput.value = '';
    eventEndDateInput.value = '';
    if (datePickers.start) updateDateInputDisplay(datePickers.start.input, '');
    if (datePickers.end) updateDateInputDisplay(datePickers.end.input, '');
  } else {
    eventDateInput.value = '';
    if (datePickers.single) updateDateInputDisplay(datePickers.single.input, '');
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
      eventTypeSelect.value = 'single';
      toggleEventType();
      eventDateInput.value = dateKey;
      if (datePickers.single) updateDateInputDisplay(datePickers.single.input, dateKey);
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

  const today = formatDateKey(new Date());
  eventDateInput.value = today;
  if (datePickers.single) updateDateInputDisplay(datePickers.single.input, today);
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
      if (index >= 0 && index < currentEvents.length) {
        currentEvents[index] = payload;
        showMessage('Événement modifié avec succès.');
      } else {
        showMessage('Erreur: index d\'événement invalide.', true);
        return;
      }
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

    if (!saveEvents(currentEvents)) {
      showMessage('Erreur lors de la sauvegarde.', true);
      return;
    }

    resetForm();
    renderCalendar();
    renderEventsList();
  } catch (error) {
    console.error('Erreur:', error);
    showMessage('Erreur lors de la sauvegarde: ' + error.message, true);
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
    if (datePickers.single) updateDateInputDisplay(datePickers.single.input, event.date);
  } else {
    eventTypeSelect.value = 'multi';
    eventStartDateInput.value = event.startDate;
    eventEndDateInput.value = event.endDate;
    if (datePickers.start) updateDateInputDisplay(datePickers.start.input, event.startDate);
    if (datePickers.end) updateDateInputDisplay(datePickers.end.input, event.endDate);
  }

  eventTitleInput.value = event.title;
  toggleEventType();
  eventTitleInput.focus();
}

function deleteEvent(index) {
  if (!window.confirm('Supprimer cet événement ?')) return;

  const currentEvents = getSavedEvents();
  currentEvents.splice(index, 1);
  if (!saveEvents(currentEvents)) {
    showMessage('Erreur lors de la suppression.', true);
    return;
  }
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

  if (!saveEvents([])) {
    showMessage('Erreur lors de la suppression.', true);
    return;
  }
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
  initDatePickers();

  const today = formatDateKey(new Date());
  eventDateInput.value = today;
  if (datePickers.single) updateDateInputDisplay(datePickers.single.input, today);

  toggleEventType();
  renderCalendar();
  renderEventsList();
})();
