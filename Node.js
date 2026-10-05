const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const EVENTS_FILE = path.join(__dirname, 'events.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readEvents() {
  try {
    if (!fs.existsSync(EVENTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(EVENTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erreur lecture events.json:', error);
    return [];
  }
}

function writeEvents(events) {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erreur écriture events.json:', error);
    return false;
  }
}

function normalizeEvent(payload) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';

  if (!title) {
    throw new Error('Titre requis');
  }

  if (payload.date) {
    return { date: payload.date, title };
  }

  if (payload.startDate && payload.endDate) {
    return { startDate: payload.startDate, endDate: payload.endDate, title };
  }

  throw new Error('Date ou période invalide');
}

app.get('/api/events', (req, res) => {
  res.json(readEvents());
});

app.post('/api/events', (req, res) => {
  try {
    const event = normalizeEvent(req.body);
    const events = readEvents();

    const exists = events.some(existing => {
      if (event.date && existing.date) return existing.date === event.date && existing.title === event.title;
      if (event.startDate && existing.startDate) {
        return existing.startDate === event.startDate && existing.endDate === event.endDate && existing.title === event.title;
      }
      return false;
    });

    if (exists) {
      return res.status(400).json({ error: 'Événement déjà existant' });
    }

    events.push(event);
    events.sort((a, b) => {
      const first = a.startDate || a.date || '';
      const second = b.startDate || b.date || '';
      return first.localeCompare(second);
    });

    if (!writeEvents(events)) {
      return res.status(500).json({ error: 'Impossible d\'écrire le fichier events.json' });
    }

    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erreur serveur' });
  }
});

app.put('/api/events/:index', (req, res) => {
  try {
    const index = Number(req.params.index);
    const events = readEvents();

    if (!Number.isInteger(index) || index < 0 || index >= events.length) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    const event = normalizeEvent(req.body);
    events[index] = event;
    events.sort((a, b) => {
      const first = a.startDate || a.date || '';
      const second = b.startDate || b.date || '';
      return first.localeCompare(second);
    });

    if (!writeEvents(events)) {
      return res.status(500).json({ error: 'Impossible d\'écrire le fichier events.json' });
    }

    res.json({ success: true, event });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erreur serveur' });
  }
});

app.delete('/api/events/:index', (req, res) => {
  try {
    const index = Number(req.params.index);
    const events = readEvents();

    if (!Number.isInteger(index) || index < 0 || index >= events.length) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }

    const [deletedEvent] = events.splice(index, 1);

    if (!writeEvents(events)) {
      return res.status(500).json({ error: 'Impossible d\'écrire le fichier events.json' });
    }

    res.json({ success: true, event: deletedEvent });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/events/all', (req, res) => {
  try {
    if (!writeEvents([])) {
      return res.status(500).json({ error: 'Impossible de vider events.json' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
