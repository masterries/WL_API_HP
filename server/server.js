const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 3000;
const API_TARGET = 'https://m.qando.at';

app.use(cors());

app.get('/proxy', async (req, res) => {
    const url = API_TARGET + req.query.url;
    try {
        const apiResponse = await fetch(url);
        const data = await apiResponse.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
