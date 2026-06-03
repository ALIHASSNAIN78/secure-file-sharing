# AWS S3 setup guide

Use **real Amazon S3** instead of MinIO when you have an AWS account (free tier or production).

---

## Prerequisites

- AWS account ([aws.amazon.com](https://aws.amazon.com/))
- Payment verification may be required even for free tier
- This project already uses the **S3 API** — only configuration changes

---

## Step 1 — Create S3 bucket

1. Open [S3 Console](https://s3.console.aws.amazon.com/s3/home)
2. **Create bucket**
3. Example name: `internee-secure-files-yourname` (globally unique)
4. **Region:** note it (e.g. `us-east-1`, `ap-south-1`)
5. **Block all public access:** ON (recommended)
6. Create bucket

---

## Step 2 — IAM user (access keys)

Do **not** use root account keys.

1. [IAM Users](https://console.aws.amazon.com/iam/home#/users) → **Create user**
2. Name: `secure-file-sharing`
3. Attach policy — **Create policy** → JSON:

Replace `YOUR-BUCKET-NAME`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:HeadObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```

4. Save policy → attach to user
5. User → **Security credentials** → **Create access key** → copy **Access key ID** and **Secret access key**

---

## Step 3 — Update `.env`

Edit `.env` in project root:

```env
PORT=3000
HOST=0.0.0.0
ENABLE_HTTPS=true
DATA_DIR=/app/data

AWS_REGION=us-east-1
AWS_S3_BUCKET=internee-secure-files-yourname
AWS_ACCESS_KEY_ID=AKIA........................
AWS_SECRET_ACCESS_KEY=........................................

# IMPORTANT: comment out or DELETE this line for AWS:
# S3_ENDPOINT=http://127.0.0.1:9000
```

**No `S3_ENDPOINT`** = app uses real AWS S3.

| Variable | Example |
|----------|---------|
| `AWS_REGION` | Same as bucket region |
| `AWS_S3_BUCKET` | Your bucket name only |

---

## Step 4 — Run app with AWS (without MinIO)

### Option A — App only in Docker

Project includes **`docker-compose.aws.yml`** (app without MinIO).

1. Set `.env` for AWS (no `S3_ENDPOINT` line)
2. Run:

```powershell
docker compose -f docker-compose.aws.yml up --build
```

### Option B — Node on PC (simplest for AWS test)

```powershell
cd secure-file-sharing
npm install
npm start
```

Ensure `.env` has AWS values and **no** `S3_ENDPOINT`.

Open https://localhost:3000/upload

---

## Step 5 — Verify

**Health:**

https://localhost:3000/api/health

Expected:

```json
{"ok":true,"storage":"aws-s3","bucket":"your-bucket-name"}
```

Upload a file → check S3 console → prefix `encrypted/` → object with UUID name.

---

## Security notes

- Never commit real secret keys to public GitHub — use `.env` locally only  
- Files are **encrypted in the browser** before upload; S3 stores ciphertext only  
- Server stores **IV + salt** (not your password) for decryption  
- S3 **SSE-AES256** is enabled on AWS uploads (server-side, in addition to client E2E)

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `storage: minio` in health | Remove `S3_ENDPOINT` from `.env`, restart app |
| Bucket not found | Create bucket; match `AWS_REGION` |
| Access Denied | Fix IAM policy bucket name |
| Wrong region | `AWS_REGION` must match bucket region |

---

## Switch back to MinIO

1. Restore in `.env`:

```env
S3_ENDPOINT=http://127.0.0.1:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET=secure-files
```

2. Run full stack:

```powershell
docker compose up --build
```

See [MINIO-SETUP.md](MINIO-SETUP.md).

---

