import "./main.js";
import "./shiva.js";

import path from "path";
import express from "express";
import { fileURLToPath } from "url";

const app = express();
const port = 8888;

/* __dirname fix za ESM */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
    const imagePath = path.join(__dirname, "index.html");
    res.sendFile(imagePath);
});

app.listen(port, () => {
    console.log(`🔗 Listening to GlaceYT : http://localhost:${port}`);
});
