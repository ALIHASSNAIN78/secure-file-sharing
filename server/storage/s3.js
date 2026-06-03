import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

const useMinio = Boolean(process.env.S3_ENDPOINT);

function buildClient() {
  const config = {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };
  if (useMinio) {
    config.endpoint = process.env.S3_ENDPOINT;
    config.forcePathStyle = true;
  }
  return new S3Client(config);
}

const client = buildClient();

const bucketName = () => process.env.AWS_S3_BUCKET || "secure-files";

export function storageType() {
  return useMinio ? "minio" : "aws-s3";
}

export function objectKey(fileId) {
  return `encrypted/${fileId}`;
}

export async function ensureBucket() {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucketName() }));
  } catch (err) {
    if (!useMinio) {
      throw new Error(
        `S3 bucket "${bucketName()}" not found or no access. Create it in AWS Console first.`
      );
    }
    await client.send(new CreateBucketCommand({ Bucket: bucketName() }));
  }
}

export async function putObject(fileId, buffer, contentType) {
  await ensureBucket();
  const input = {
    Bucket: bucketName(),
    Key: objectKey(fileId),
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
  };
  if (!useMinio) {
    input.ServerSideEncryption = "AES256";
  }
  await client.send(new PutObjectCommand(input));
}

export async function getObjectBuffer(fileId) {
  const res = await client.send(
    new GetObjectCommand({
      Bucket: bucketName(),
      Key: objectKey(fileId),
    })
  );
  return Buffer.from(await res.Body.transformToByteArray());
}

export async function waitForStorage(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await ensureBucket();
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return false;
}
