import sharp from "sharp";
import { env } from "../env.js";

export async function optimizeImageForVision(input: Buffer) {
  if (input.byteLength > env.imageMaxBytes) {
    throw Object.assign(new Error("IMAGE_TOO_LARGE"), { statusCode: 413 });
  }

  const buffer = await sharp(input)
    .rotate()
    .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return {
    buffer,
    mimeType: "image/jpeg"
  };
}
