const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Mock Database
const SHARES_FILE = path.join(__dirname, 'shares.json');
const LIBRARY_FILE = path.join(__dirname, 'library.json');

// Ensure shares file exists
if (!fs.existsSync(SHARES_FILE)) {
    fs.writeFileSync(SHARES_FILE, JSON.stringify({}));
}

// Ensure library file exists
if (!fs.existsSync(LIBRARY_FILE)) {
    // Basic default library
    const defaultLibrary = {
        "command_blocks": {
            "Default": {
                "Empty": { "name": "Empty Project", "date": Date.now() }
            }
        }
    };
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(defaultLibrary));
}

// Routes

// Get Library
app.get('/get/library', (req, res) => {
    fs.readFile(LIBRARY_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read library' });
        }
        res.json(JSON.parse(data));
    });
});

// Save Share (Paste)
app.post('/cba/share/send', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'No text provided' });
    }

    const id = crypto.randomBytes(5).toString('hex'); // Generate random ID

    fs.readFile(SHARES_FILE, 'utf8', (err, data) => {
        let shares = {};
        if (!err) {
            try {
                shares = JSON.parse(data);
            } catch (e) {
                shares = {};
            }
        }

        shares[id] = text;

        fs.writeFile(SHARES_FILE, JSON.stringify(shares, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to save share' });
            }
            res.json({ share: id });
        });
    });
});

// Get Share (Paste)
app.post('/cba/share/get', (req, res) => {
    const { fileID } = req.body;

    fs.readFile(SHARES_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read shares' });
        }
        try {
            const shares = JSON.parse(data);
            const content = shares[fileID];
            if (content) {
                res.json({ content: content });
            } else {
                res.status(404).json({ error: 'Share not found' });
            }
        } catch (e) {
            res.status(500).json({ error: 'Invalid shares file' });
        }
    });
});

// Serve data.json explicitly if needed, though express.static handles it.
// Just ensuring API compatibility if the frontend asks specifically.

// Blueprint Editor Route
app.get('/blueprint', (req, res) => {
    res.sendFile(path.join(__dirname, 'blueprint.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/main.html`);
});
