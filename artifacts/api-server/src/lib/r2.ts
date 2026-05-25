import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let r2Client: S3Client | null = null;

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("Configuration R2 incomplète (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)");
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL,
  );
}

function getR2Client(): S3Client {
  if (!r2Client) {
    const { accountId, accessKeyId, secretAccessKey } = getR2Config();
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return r2Client;
}

function buildPublicUrl(key: string): string {
  const apiBase = (process.env.API_PUBLIC_URL ?? "https://api.davilla-rondeur.fr").replace(/\/+$/, "");

  // Par défaut : proxy API (media.davilla-rondeur.fr renvoie 404 tant que le domaine R2 n'est pas lié)
  if (process.env.R2_SERVE_VIA_API !== "false") {
    return `${apiBase}/api/media/${key}`;
  }

  const custom = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "") ?? apiBase;
  return `${custom}/${key}`;
}

export async function getR2Object(key: string): Promise<{
  body: ReadableStream | NodeJS.ReadableStream | Blob | undefined;
  contentType: string | undefined;
}> {
  const { bucketName } = getR2Config();
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );

  return {
    body: response.Body,
    contentType: response.ContentType,
  };
}

function sanitizeFilename(filename: string): string {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function createPresignedUpload(input: {
  filename: string;
  contentType: string;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const { bucketName, publicUrl } = getR2Config();
  const safeName = sanitizeFilename(input.filename) || "image.jpg";
  const key = `products/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 });

  return {
    uploadUrl,
    publicUrl: buildPublicUrl(key),
    key,
  };
}

export async function uploadObjectToR2(input: {
  buffer: Buffer;
  filename: string;
  contentType: string;
}): Promise<{ publicUrl: string; key: string }> {
  const { bucketName } = getR2Config();
  const safeName = sanitizeFilename(input.filename) || "image.jpg";
  const key = `products/${Date.now()}-${safeName}`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType,
    }),
  );

  return {
    publicUrl: buildPublicUrl(key),
    key,
  };
}
