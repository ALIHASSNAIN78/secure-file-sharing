import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import * as s3 from "../storage/s3.js";
import * as metadata from "../storage/metadata.js";

const router = Router();
// No file size cap — large files (100MB+) allowed. Ensure Docker has enough RAM.
const upload = multer({
  storage: multer.memoryStorage(),
});

router.get("/health", async (_req, res) => {
  try {
    await s3.ensureBucket();
    res.json({ ok: true, storage: s3.storageType(), bucket: process.env.AWS_S3_BUCKET });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

router.get("/files", async (_req, res) => {
  try {
    const files = await metadata.listUploaded();
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/files/upload", (req, res, next) => {
  upload.single("encryptedFile")(req, res, (err) => {
    if (err) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large for server limit"
          : err.message || "Upload parse failed";
      return res.status(400).json({ error: msg });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { originalName, iv, salt, mimeType } = req.body;
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ error: "Encrypted file is required" });
    }
    if (!originalName || !iv || !salt) {
      return res.status(400).json({ error: "originalName, iv, and salt are required" });
    }

    const id = uuidv4();
    await s3.putObject(id, req.file.buffer, mimeType || "application/octet-stream");

    const record = await metadata.createRecord({
      id,
      originalName,
      mimeType: mimeType || "application/octet-stream",
      sizeBytes: req.file.buffer.length,
      iv,
      salt,
      status: "uploaded",
      uploadedAt: new Date().toISOString(),
    });

    res.json({ fileId: record.id, originalName: record.originalName });
  } catch (err) {
    console.error("upload:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

router.get("/files/:fileId/meta", async (req, res) => {
  try {
    const record = await metadata.getById(req.params.fileId);
    if (!record || record.status !== "uploaded") {
      return res.status(404).json({ error: "File not found" });
    }
    res.json({
      fileId: record.id,
      originalName: record.originalName,
      mimeType: record.mimeType,
      iv: record.iv,
      salt: record.salt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/files/:fileId/encrypted", async (req, res) => {
  try {
    const record = await metadata.getById(req.params.fileId);
    if (!record || record.status !== "uploaded") {
      return res.status(404).json({ error: "File not found" });
    }
    const buffer = await s3.getObjectBuffer(record.id);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(buffer);
  } catch (err) {
    console.error("encrypted:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
