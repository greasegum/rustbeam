const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing by serving index-react.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index-react.html'));
});

app.listen(PORT, () => {
  console.log(`VisualBeam Inspector running on port ${PORT}`);
});