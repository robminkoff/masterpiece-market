/**
 * upload — push derivatives to Supabase Storage.
 *
 * Bucket: "artworks"
 * Paths:
 *   artworks/originals/{slug}.jpg
 *   artworks/web/{slug}.jpg
 *   artworks/thumbs/{slug}.jpg
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in env.
 */

import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import type { NormalizeResult } from "./types";
import { delay } from "./types";

const BUCKET = "artworks";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in environment");
  }
  return createClient(url, key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uploadFile(
  supabase: any,
  storagePath: string,
  localPath: string,
): Promise<string> {
  const fileData = fs.readFileSync(localPath);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileData, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return urlData.publicUrl;
}

export interface UploadResult {
  slug: string;
  originalUrl: string;
  webUrl: string;
  thumbUrl: string;
}

export async function uploadOne(norm: NormalizeResult): Promise<UploadResult> {
  const supabase = getSupabase();

  const originalUrl = await uploadFile(supabase, `originals/${norm.slug}.jpg`, norm.originalPath);
  await delay(200);
  const webUrl = await uploadFile(supabase, `web/${norm.slug}.jpg`, norm.webPath);
  await delay(200);
  const thumbUrl = await uploadFile(supabase, `thumbs/${norm.slug}.jpg`, norm.thumbPath);

  console.log(`  [${norm.slug}] Uploaded 3 files to Supabase Storage`);

  return { slug: norm.slug, originalUrl, webUrl, thumbUrl };
}

export async function uploadPack(normals: NormalizeResult[]): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  for (const norm of normals) {
    const result = await uploadOne(norm);
    results.push(result);
    await delay(300);
  }
  return results;
}
