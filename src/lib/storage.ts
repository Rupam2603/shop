import { supabase } from "./supabase";

const BUCKET_NAME = "store-assets";

/**
 * Uploads a File or Blob or Base64 string to the public Supabase storage bucket 'store-assets'.
 * Returns the permanent public CDN URL.
 */
export async function uploadImageToSupabase(
  fileOrBase64: File | Blob | string,
  folder: string = "uploads"
): Promise<{ url: string | null; error: string | null }> {
  try {
    let fileBody: File | Blob;
    let fileExt = "jpg";
    let contentType = "image/jpeg";

    if (typeof fileOrBase64 === "string") {
      if (fileOrBase64.startsWith("http://") || fileOrBase64.startsWith("https://")) {
        return { url: fileOrBase64, error: null };
      }

      if (fileOrBase64.startsWith("data:")) {
        const matches = fileOrBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return { url: null, error: "Invalid base64 image data" };
        }
        contentType = matches[1];
        fileExt = contentType.split("/")[1] || "png";
        if (fileExt === "jpeg") fileExt = "jpg";

        const byteCharacters = atob(matches[2]);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        fileBody = new Blob(byteArrays, { type: contentType });
      } else {
        return { url: fileOrBase64, error: null };
      }
    } else {
      fileBody = fileOrBase64;
      if ("type" in fileOrBase64 && fileOrBase64.type) {
        contentType = fileOrBase64.type;
        fileExt = fileOrBase64.type.split("/")[1] || "jpg";
      }
      if ("name" in fileOrBase64 && fileOrBase64.name) {
        const parts = (fileOrBase64.name as string).split(".");
        if (parts.length > 1) fileExt = parts.pop() || fileExt;
      }
    }

    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBody, {
        cacheControl: "3600",
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return { url: null, error: uploadError.message };
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return { url: publicData.publicUrl, error: null };
  } catch (err: any) {
    console.error("Storage upload exception:", err);
    return { url: null, error: err?.message || "Image upload failed" };
  }
}
