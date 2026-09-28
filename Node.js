const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const EVENTS_FILE = path.join(__dirname, 'events.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint pour LIRE les événements
app.get('/api/events', (req, res) => {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Erreur lecture events.json:', error);
    res.status(500).json({ error: 'Erreur lecture' });
  }
});

// Endpoint pour AJOUTER un événement
app.post('/api/events', (req, res) => {
  try {
    const { date, title } = req.body;

    if (!date || !title) {
      return res.status(400).json({ error: 'Date et titre requis' });
    }

    let events = [];
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, 'utf8');
      events = JSON.parse(data);
    }

    const exists = events.some(e => e.date === date && e.title === title);
    if (exists) {
      return res.status(400).json({ error: 'Événement déjà existant' });
    }

    events.push({ date, title });
    events.sort((a, b) => a.date.localeCompare(b.date));

    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
    res.json({ success: true, events });
  } catch (error) {
    console.error('Erreur ajout événement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour SUPPRIMER un événement
app.delete('/api/events', (req, res) => {
  try {
    const { date, title } = req.body;

    if (!date || !title) {
      return res.status(400).json({ error: 'Date et titre requis' });
    }

    let events = [];
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, 'utf8');
      events = JSON.parse(data);
    }

    events = events.filter(e => !(e.date === date && e.title === title));
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));

    res.json({ success: true, events });
  } catch (error) {
    console.error('Erreur suppression événement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour VIDER tous les événements
app.delete('/api/events/all', (req, res) => {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression tous:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
