import { randomSalt, randomIv, encryptFile } from "./crypto.js";

const form = document.getElementById("upload-form");
const statusEl = document.getElementById("status");

function setStatus(msg, type = "info") {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
}

async function readApiResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (text.startsWith("<!") || text.startsWith("<html")) {
      throw new Error(
        "Server returned HTML instead of JSON. Rebuild Docker: docker compose up --build — then open https://localhost:3000/upload (not http, not file://)."
      );
    }
    throw new Error(text.slice(0, 120) || `Server error (${res.status})`);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("file").files[0];
  const passphrase = document.getElementById("passphrase").value;

  if (!file || !passphrase) {
    setStatus("Select a file and enter an encryption password.", "error");
    return;
  }

  try {
    setStatus("Encrypting in your browser (E2E)…", "info");
    const salt = randomSalt();
    const iv = randomIv();
    const encryptedBlob = await encryptFile(file, passphrase, salt, iv);

    setStatus("Uploading encrypted file to MinIO…", "info");
    const body = new FormData();
    body.append("encryptedFile", encryptedBlob, `${file.name}.enc`);
    body.append("originalName", file.name);
    body.append("mimeType", file.type || "application/octet-stream");
    body.append("iv", iv);
    body.append("salt", salt);

    const res = await fetch("/api/files/upload", { method: "POST", body });
    const data = await readApiResponse(res);
    if (!res.ok) throw new Error(data.error || "Upload failed");

    setStatus(
      `Uploaded: ${data.originalName} (ID: ${data.fileId}). Go to Download page to get it back.`,
      "success"
    );
    form.reset();
  } catch (err) {
    setStatus(err.message, "error");
  }
});
