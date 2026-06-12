const https = require('https');
require('dotenv').config();
const key = process.env.VITE_GOOGLE_MAPS_API_KEY;

const origin = '22.7196,75.8577';
const destination = 'Bholaram, Indore, Madhya Pradesh - 452001';
const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${key}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(JSON.parse(data).status);
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
