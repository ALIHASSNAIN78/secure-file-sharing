# AWS S3 Setup Guide

[← Back to README](../README.md)

This guide explains how to connect the Secure File Sharing application to **Amazon S3** instead of MinIO. The application code is unchanged—only environment configuration differs.

---

## Table of contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Create an S3 bucket](#step-1-create-an-s3-bucket)
- [Step 2: Create an IAM user](#step-2-create-an-iam-user)
- [Step 3: Configure local environment](#step-3-configure-local-environment)
- [Step 4: Run the application](#step-4-run-the-application)
- [Step 5: Verify deployment](#step-5-verify-deployment)
- [Security best practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [Revert to MinIO](#revert-to-minio)

---

## Overview

| Component | MinIO (default) | AWS S3 |
|-----------|-----------------|--------|
| Endpoint | `S3_ENDPOINT=http://...` | No `S3_ENDPOINT` (AWS default) |
| Credentials | `minioadmin` | IAM access keys |
| Docker stack | `docker-compose.yml` | `docker-compose.aws.yml` |
| Health `storage` | `minio` | `aws-s3` |

Files remain **encrypted in the browser** before upload. S3 stores ciphertext under the `encrypted/` prefix.

---

## Prerequisites

- Active [AWS account](https://aws.amazon.com/)
- Permission to create S3 buckets and IAM users
- Node.js 18+ (for `npm run setup` and optional local run)
- Docker Desktop (optional, for containerized app-only deploy)

> AWS may require payment verification even when using the free tier.

---

## Step 1: Create an S3 bucket

1. Sign in to the [Amazon S3 console](https://s3.console.aws.amazon.com/s3/home).
2. Choose **Create bucket**.
3. **Bucket name:** use a globally unique name, e.g. `internee-secure-files-alihussnain`.
4. **AWS Region:** select a region (e.g. `us-east-1`, `ap-south-1`) and record it—you will need it for `AWS_REGION`.
5. **Block all public access:** enabled (recommended).
6. Create the bucket.

---

## Step 2: Create an IAM user

Never use root account access keys for applications.

### Create the user

1. Open [IAM → Users](https://console.aws.amazon.com/iam/home#/users).
2. **Create user** → name: `secure-file-sharing`.
3. Skip console access unless required.

### Attach a least-privilege policy

Create a custom policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecureFileSharingObjects",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Sid": "SecureFileSharingBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:HeadBucket"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

Attach the policy to the user.

### Generate access keys

1. Open the user → **Security credentials**.
2. **Create access key** → use case: application running outside AWS.
3. Save the **Access key ID** and **Secret access key** securely.

---

## Step 3: Configure local environment

The repository does **not** ship a `.env` file. Generate one locally:

```bash
npm run setup
```

Edit `.env` in the project root:

```env
PORT=3000
HOST=0.0.0.0
ENABLE_HTTPS=true
DATA_DIR=/app/data

AWS_REGION=us-east-1
AWS_S3_BUCKET=internee-secure-files-alihussnain
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=your-secret-key-here
```

### Critical: remove MinIO endpoint

Delete or comment out this line for AWS:

```env
# S3_ENDPOINT=http://127.0.0.1:9000
```

When `S3_ENDPOINT` is unset, the SDK uses the official AWS S3 endpoint for your region.

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | Must match the bucket region exactly |
| `AWS_S3_BUCKET` | Bucket name only (no `s3://` prefix) |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |

---

## Step 4: Run the application

### Option A — Docker (app only, no MinIO)

```bash
docker compose -f docker-compose.aws.yml up --build
```

This compose file reads credentials from your local `.env` and does not start MinIO.

### Option B — Node.js directly

```bash
npm install
npm start
```

Open https://localhost:3000/upload

---

## Step 5: Verify deployment

### Health endpoint

Visit: https://localhost:3000/api/health

Expected response:

```json
{
  "ok": true,
  "storage": "aws-s3",
  "bucket": "internee-secure-files-alihussnain"
}
```

### End-to-end test

1. Upload a file on `/upload` with a password.
2. In the S3 console, open your bucket → prefix `encrypted/` → confirm a new object exists.
3. On `/download`, select the file, enter the password, and confirm decryption succeeds.

---

## Security best practices

- If keys were ever pushed to GitHub, **rotate them immediately** in IAM.
- Use IAM policies scoped to a single bucket and the `encrypted/` prefix when possible.
- Client-side encryption ensures S3 never receives plaintext file content.
- The server stores IV and salt only; it does not store the user password.
- AWS uploads use **SSE-S3 (AES256)** in addition to client-side encryption.

---

## Troubleshooting

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| `"storage":"minio"` in health | `S3_ENDPOINT` still set | Remove `S3_ENDPOINT` from `.env`; restart app |
| Bucket not found | Wrong name or region | Match `AWS_S3_BUCKET` and `AWS_REGION` to console |
| Access Denied | IAM policy too narrow | Verify bucket ARN in policy |
| Signature / region errors | Region mismatch | Bucket region = `AWS_REGION` |
| `.env` not found | Skipped setup | Run `npm run setup` |

---

## Revert to MinIO

1. Update `.env`:

```env
S3_ENDPOINT=http://127.0.0.1:9000
AWS_REGION=us-east-1
AWS_S3_BUCKET=secure-files
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

2. Start the full stack:

```bash
docker compose up --build
```

See [MINIO-SETUP.md](MINIO-SETUP.md) for details.

---


<p align="center">
  <sub>Secure File Sharing · AWS S3 Setup · Ali Hussnain</sub>
</p>
