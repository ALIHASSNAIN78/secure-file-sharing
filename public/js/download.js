import { decryptBlob } from "./crypto.js";

const fileList = document.getElementById("file-list");
const emptyMsg = document.getElementById("empty-msg");
const panel = document.getElementById("decrypt-panel");
const selectedName = document.getElementById("selected-name");
const passphraseInput = document.getElementById("passphrase");
const downloadBtn = document.getElementById("download-btn");
const statusEl = document.getElementById("status");

let selectedId = null;
let filesCache = [];

function setStatus(msg, type = "info") {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
}

async function readApiResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server error — rebuild Docker and use https://localhost:3000/download");
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function renderList(files) {
  fileList.innerHTML = "";
  if (!files.length) {
    emptyMsg.hidden = false;
    panel.hidden = true;
    return;
  }
  emptyMsg.hidden = true;

  for (const f of files) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "file-item" + (selectedId === f.id ? " active" : "");
    btn.innerHTML = `<strong>${f.originalName}</strong><span>${formatDate(f.uploadedAt)} · ${(f.sizeBytes / 1024).toFixed(1)} KB</span>`;
    btn.addEventListener("click", () => selectFile(f));
    li.appendChild(btn);
    fileList.appendChild(li);
  }
}

function selectFile(file) {
  selectedId = file.id;
  panel.hidden = false;
  selectedName.textContent = file.originalName;
  passphraseInput.value = "";
  setStatus("Enter the encryption password you used when uploading.", "info");
  renderList(filesCache);
}

async function loadFiles() {
  try {
    const res = await fetch("/api/files");
    const data = await readApiResponse(res);
    if (!res.ok) throw new Error(data.error || "Could not load files");
    filesCache = data.files || [];
    renderList(filesCache);
  } catch (err) {
    setStatus(err.message, "error");
  }
}

downloadBtn.addEventListener("click", async () => {
  if (!selectedId) return;
  const passphrase = passphraseInput.value;
  if (!passphrase) {
    setStatus("Enter decryption password.", "error");
    return;
  }

  try {
    setStatus("Loading file metadata…", "info");
    const metaRes = await fetch(`/api/files/${selectedId}/meta`);
    const meta = await readApiResponse(metaRes);
    if (!metaRes.ok) throw new Error(meta.error);

    setStatus("Downloading encrypted data…", "info");
    const blobRes = await fetch(`/api/files/${selectedId}/encrypted`);
    if (!blobRes.ok) throw new Error("Download failed");

    const encryptedBlob = await blobRes.blob();
    setStatus("Decrypting in your browser…", "info");

    const plaintext = await decryptBlob(
      encryptedBlob,
      passphrase,
      meta.salt,
      meta.iv
    );

    const out = new Blob([plaintext], { type: meta.mimeType || "application/octet-stream" });
    const url = URL.createObjectURL(out);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta.originalName;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("File decrypted and saved.", "success");
  } catch (err) {
    const msg = err.message?.includes("operation")
      ? "Wrong password — cannot decrypt."
      : err.message;
    setStatus(msg, "error");
  }
});

loadFiles();
