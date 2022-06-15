const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../apps')));

app.listen(port, () => {
  console.log(`Server Listening on port ${port}`);
});