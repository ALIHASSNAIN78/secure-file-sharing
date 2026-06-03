# MinIO Setup Guide

[← Back to README](../README.md)

MinIO is an open-source, **S3-compatible** object store. This project uses MinIO as the **default** storage backend: free to run locally, no AWS account required, and ideal for development and demos.

---

## Table of contents

- [When to use MinIO](#when-to-use-minio)
- [Option 1: Docker (recommended)](#option-1-docker-recommended)
- [Option 2: Standalone on Windows](#option-2-standalone-on-windows)
- [Verification](#verification)
- [Large file uploads](#large-file-uploads)
- [Operations](#operations)
- [MinIO vs AWS S3](#minio-vs-aws-s3)

---

## When to use MinIO

| Use MinIO if… | Consider AWS S3 if… |
|---------------|---------------------|
| You want zero cloud cost for demos | You need production AWS infrastructure |
| You do not have a payment card for AWS | Your assignment requires live AWS |
| You run everything on your own PC | You need global CDN / AWS ecosystem |

---

## Option 1: Docker (recommended)

The repository ships a complete stack in `docker-compose.yml`.

### Prerequisites

- Docker Desktop installed and running

### Steps

```bash
git clone <your-repo-url>
cd secure-file-sharing
npm run setup
docker compose up --build
```

### Services started

| Service | Ports | Role |
|---------|-------|------|
| `minio` | `9000` (API), `9001` (console) | Object storage |
| `minio-init` | — | Creates bucket `secure-files` (one-shot) |
| `app` | `3000` | Web application (HTTPS) |

### Access points

| Resource | URL |
|----------|-----|
| Upload UI | https://localhost:3000/upload |
| Download UI | https://localhost:3000/download |
| MinIO Console | http://localhost:9001 |
| API health | https://localhost:3000/api/health |

**Console credentials:** `minioadmin` / `minioadmin`

### Configuration notes

- **`.env` is not in Git.** Run `npm run setup` after clone to generate it locally.
- `docker-compose.yml` embeds the same MinIO defaults, so Docker can start even before `.env` exists.
- Inside Docker, the app connects to MinIO at `http://minio:9000` (internal network).

---

## Option 2: Standalone on Windows

Use this path only if Docker is unavailable.

### 1. Download MinIO

Download the Windows binary:

https://dl.min.io/server/minio/release/windows-amd64/minio.exe

Save as: `C:\minio\minio.exe`

### 2. Start the server

Open **Command Prompt** (not PowerShell syntax for `set`):

```cmd
mkdir C:\minio\data
cd C:\minio
set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin
minio.exe server C:\minio\data --console-address ":9001"
```

Leave this terminal open while MinIO runs.

### 3. Create a bucket

1. Open http://127.0.0.1:9001  
2. Sign in with `minioadmin` / `minioadmin`  
3. **Create Bucket** → name: `secure-files`

### 4. Configure the application

```bash
cd secure-file-sharing
npm run setup
```

Ensure `.env` contains:

```env
S3_ENDPOINT=http://127.0.0.1:9000
AWS_REGION=us-east-1
AWS_S3_BUCKET=secure-files
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

### 5. Start the Node.js server

```bash
npm install
npm start
```

Open https://localhost:3000/upload

---

## Verification

Complete this checklist after setup:

- [ ] `GET /api/health` returns `"storage":"minio"` and `"ok":true`
- [ ] A test file uploads successfully on `/upload`
- [ ] MinIO Console shows objects under `secure-files/encrypted/`
- [ ] The same file decrypts on `/download` with the correct password

**Example health response:**

```json
{
  "ok": true,
  "storage": "minio",
  "bucket": "secure-files"
}
```

---

## Large file uploads

The application does not impose a fixed upload size limit. However, encrypted files are buffered in memory during upload, so the host must have sufficient RAM.

If uploads fail or containers crash (e.g. 100MB+ files):

1. **Docker Desktop** → **Settings** → **Resources** → increase **Memory** (e.g. 4 GB+).
2. On **WSL2**, create or edit `C:\Users\<YourName>\.wslconfig`:

```ini
[wsl2]
memory=4GB
processors=4
swap=2GB
```

3. Run in an elevated PowerShell:

```powershell
wsl --shutdown
```

4. Restart Docker Desktop and run `docker compose up` again.

---

## Operations

| Action | Command |
|--------|---------|
| Stop containers | `docker compose down` |
| Stop and delete all data | `docker compose down -v` |
| Rebuild after code changes | `docker compose up --build` |

---

## MinIO vs AWS S3

| Criteria | MinIO | AWS S3 |
|----------|-------|--------|
| Cost | Free (self-hosted) | Free tier limits, then paid |
| Account | None | AWS account (card often required) |
| Setup time | Minutes (Docker) | ~30 minutes (IAM, bucket) |
| S3 API | Compatible | Native |
| Guide | This document | [AWS-SETUP.md](AWS-SETUP.md) |

For the Internee.pk task, MinIO satisfies the requirement for **cloud storage with an S3-compatible API**. AWS is optional and documented separately.

---

<p align="center">
  <sub>Secure File Sharing · MinIO Setup · Ali Hussnain</sub>
</p>
