# MinIO setup guide

MinIO is **S3-compatible** cloud storage that runs **free on your PC** inside Docker.  
This is the **default** for this project — no AWS account or credit card needed.

---

## Option A — Docker (recommended, already configured)

Everything is in `docker-compose.yml`. You only run:

```powershell
cd secure-file-sharing
docker compose up --build
```

### What Docker starts

| Service | Port | Purpose |
|---------|------|---------|
| **minio** | 9000 (API), 9001 (console) | File storage |
| **minio-init** | — | Creates bucket `secure-files` |
| **app** | 3000 | Upload / Download website |

### URLs

| What | URL |
|------|-----|
| Upload page | https://localhost:3000/upload |
| Download page | https://localhost:3000/download |
| MinIO console | http://localhost:9001 |

**Console login:** `minioadmin` / `minioadmin`

### `.env` (MinIO defaults)

```env
AWS_S3_BUCKET=secure-files
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://127.0.0.1:9000
```

Docker **overrides** `S3_ENDPOINT` to `http://minio:9000` for the app container (internal network).

---

## Option B — MinIO without Docker (Windows CMD)

Use this only if you cannot run Docker.

### 1. Download MinIO

https://dl.min.io/server/minio/release/windows-amd64/minio.exe  

Save to `C:\minio\minio.exe`

### 2. Start MinIO

```cmd
mkdir C:\minio\data
cd C:\minio
set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin
minio.exe server C:\minio\data --console-address ":9001"
```

Keep this window open.

### 3. Create bucket

Open http://127.0.0.1:9001 → login → **Create bucket** → name: `secure-files`

### 4. Configure `.env`

```env
S3_ENDPOINT=http://127.0.0.1:9000
AWS_REGION=us-east-1
AWS_S3_BUCKET=secure-files
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
PORT=3000
HOST=0.0.0.0
ENABLE_HTTPS=true
```

### 5. Run app (separate terminal)

```powershell
cd secure-file-sharing
npm install
npm start
```

Open https://localhost:3000/upload

---

## Verify MinIO works

1. **Health check:** https://localhost:3000/api/health  

   Expected: `{"ok":true,"storage":"minio","bucket":"secure-files"}`

2. **Upload** a small test file on `/upload`

3. **MinIO console:** bucket `secure-files` → folder `encrypted/` → new object appears

4. **Download** page → select file → decrypt with same password

---

## Large files (100MB+)

The app has **no file size limit**, but the whole encrypted file is loaded in RAM during upload.

If upload fails or Docker crashes:

1. **Docker Desktop** → ensure enough memory  
2. On **WSL2**, create `C:\Users\YourName\.wslconfig`:

```ini
[wsl2]
memory=4GB
processors=4
```

3. Admin PowerShell: `wsl --shutdown` → restart Docker

---

## Stop / reset

```powershell
docker compose down
```

Delete all stored files and volumes:

```powershell
docker compose down -v
```

---

## MinIO vs AWS

| | MinIO (this guide) | AWS S3 |
|--|-------------------|--------|
| Cost | Free local | Free tier / paid |
| Card | Not required | Usually required |
| Setup | `docker compose up` | See [AWS-SETUP.md](AWS-SETUP.md) |


