const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Register API routes
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
