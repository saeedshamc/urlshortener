require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const path = require('path');

const app = express();

const urlsById = new Map();
const idsByUrl = new Map();
let counter = 0;

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const parseHttpUrl = (value) => {
  if (typeof value !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch (err) {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (!parsed.hostname) return null;
  return parsed;
};

const hostExists = (hostname) =>
  new Promise((resolve) => {
    dns.lookup(hostname, (err) => resolve(!err));
  });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/api/shorturl', async (req, res) => {
  const original = req.body.url;
  const parsed = parseHttpUrl(original);

  if (!parsed || !(await hostExists(parsed.hostname))) {
    return res.json({ error: 'invalid url' });
  }

  const normalized = original.trim();

  if (idsByUrl.has(normalized)) {
    return res.json({
      original_url: normalized,
      short_url: idsByUrl.get(normalized)
    });
  }

  counter += 1;
  urlsById.set(counter, normalized);
  idsByUrl.set(normalized, counter);

  res.json({ original_url: normalized, short_url: counter });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const id = Number(req.params.short_url);

  if (!Number.isInteger(id) || !urlsById.has(id)) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(urlsById.get(id));
});

const port = process.env.PORT || 3000;

const listener = app.listen(port, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});