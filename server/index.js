import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import { fileURLToPath } from "url";
import apiRouter from "./routes/api.js";
import * as s3 from "./storage/s3.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const ENABLE_HTTPS = process.env.ENABLE_HTTPS !== "false";
const CERT_DIR = path.join(__dirname, "../certs");
const publicDir = path.join(__dirname, "../public");

app.use(express.json({ limit: "1mb" }));
app.use("/css", express.static(path.join(publicDir, "css")));
app.use("/js", express.static(path.join(publicDir, "js")));

app.get("/", (_req, res) => res.redirect("/upload"));
app.get("/upload", (_req, res) => res.sendFile(path.join(publicDir, "upload.html")));
app.get("/download", (_req, res) => res.sendFile(path.join(publicDir, "download.html")));

app.use("/api", apiRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use((err, req, res, _next) => {
  console.error(err);
  if (req.path?.startsWith("/api")) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
  res.status(500).send("Server error");
});

function loadTls() {
  const keyPath = path.join(CERT_DIR, "key.pem");
  const certPath = path.join(CERT_DIR, "cert.pem");
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) return null;
  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

async function start() {
  await s3.waitForStorage();
  const tls = ENABLE_HTTPS ? loadTls() : null;
  const scheme = tls ? "https" : "http";

  const onListen = () => {
    console.log(`Upload:   ${scheme}://localhost:${PORT}/upload`);
    console.log(`Download: ${scheme}://localhost:${PORT}/download`);
  };

  if (tls) {
    https.createServer(tls, app).listen(PORT, HOST, onListen);
  } else {
    http.createServer(app).listen(PORT, HOST, onListen);
  }
}

start();
