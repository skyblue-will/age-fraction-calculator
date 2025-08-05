const express = require('express');
const app = express();
app.get('/', (req, res) => res.json({
  app: 'age-fraction-calculator',
  status: 'live',
  message: 'Instant deploy successful!',
  time: new Date()
}));
app.listen(process.env.PORT || 10000);
