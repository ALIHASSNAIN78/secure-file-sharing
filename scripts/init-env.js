import { existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

if (existsSync("/.dockerenv") || process.env.SKIP_ENV_INIT === "1") {
  process.exit(0);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

if (existsSync(envPath)) {
  console.log(".env already exists — nothing to do.");
  process.exit(0);
}

const content = `# Auto-created by npm run setup (not stored on GitHub)
PORT=3000
HOST=0.0.0.0
ENABLE_HTTPS=true
DATA_DIR=/app/data

AWS_REGION=us-east-1
AWS_S3_BUCKET=secure-files
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://127.0.0.1:9000
`;

writeFileSync(envPath, content, "utf8");
console.log("Created .env with default MinIO settings.");
console.log("For AWS S3, edit .env — see docs/AWS-SETUP.md");
