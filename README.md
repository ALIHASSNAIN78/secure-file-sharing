# Secure File Sharing System

**secure file exchange** with **end-to-end encryption** and **cloud storage** (MinIO or AWS S3).

## Features

| Requirement | Implementation |
|-------------|----------------|
| Secure portal | `/upload` and `/download` pages |
| End-to-end encryption | AES-256-GCM in browser; password never sent to server |
| Cloud storage | MinIO (default, Docker) or **AWS S3** |
| Encrypt upload & download | Encrypt before upload; decrypt after download in browser |
| Large files | No upload size limit in app (Docker needs enough RAM) |

## Pages

| Page | URL |
|------|-----|
| Upload | https://localhost:3000/upload |
| Download | https://localhost:3000/download |

## Quick start (MinIO + Docker — recommended)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Open terminal in project folder:

```powershell
cd secure-file-sharing
docker compose up --build
```

3. Browser: **https://localhost:3000/upload** (accept certificate warning once)
4. Upload a file with a password → open **Download** → same password → decrypt

**Stop:** `docker compose down`

## Configuration

Single file: **[`.env`](.env)** — read by Docker automatically.

Default setup uses **MinIO** inside Docker (no AWS account, no credit card).

## Storage setup guides

| Guide | When to use |
|-------|-------------|
| **[docs/MINIO-SETUP.md](docs/MINIO-SETUP.md)** | Local / Docker / free (default) |
| **[docs/AWS-SETUP.md](docs/AWS-SETUP.md)** | Real AWS S3 for production or submission |

## How it works

```
Browser (encrypt) → Node.js API → MinIO or AWS S3
                  ↓
            metadata (file list) in /app/data
```

1. **Upload:** file + password → encrypted in browser → server stores ciphertext in cloud  
2. **Download:** list files → select file + password → server sends encrypted bytes → decrypt in browser  



## Project structure

```
secure-file-sharing/
├── docker-compose.yml      # MinIO + app (default)
├── docker-compose.aws.yml  # App only, for AWS S3
├── Dockerfile
├── .env                  # Config (one file)
├── docs/
│   ├── MINIO-SETUP.md
│   └── AWS-SETUP.md
├── server/
│   ├── index.js
│   ├── routes/api.js
│   └── storage/
│       ├── s3.js
│       └── metadata.js
└── public/
    ├── upload.html
    ├── download.html
    ├── css/style.css
    └── js/
        ├── crypto.js
        ├── upload.js
        └── download.js
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Certificate warning | Normal for local HTTPS — click Advanced → Proceed |
| `app` exit 255 | Run `docker compose build --no-cache` |
| Large file fails / slow | Increase Docker/WSL memory (see MINIO-SETUP.md) |
| Switch to AWS | Follow [docs/AWS-SETUP.md](docs/AWS-SETUP.md) |

## Tech stack

- **Frontend:** HTML, CSS, vanilla JS (Web Crypto API)  
- **Backend:** Node.js, Express, Multer  
- **Storage:** MinIO or AWS S3 via `@aws-sdk/client-s3`  
- **Deploy:** Docker Compose  

## Contributor

**Ali Hussnain**
