
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const dist = path.join(__dirname, 'client', 'dist');
const indexHtml = path.join(dist, 'index.html');

if (fs.existsSync(indexHtml)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(indexHtml));
} else {
  app.get('*', (req, res) => {
    res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BraFit</title></head><body style="font-family:Arial,Helvetica,sans-serif;margin:40px;"><h1>BraFit</h1><p>No frontend build detected. Re-deploy after building the client (npm run build) or add the prebuilt client/dist files.</p></body></html>`);
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('listening on', PORT));
