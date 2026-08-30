/**
 * Uploads a File or Blob or Base64 string and returns its permanent public URL.
 *
 * NOTE: real file storage is not wired up yet. The Neon Data API has no file
 * storage of its own — this needs Neon Object Storage (currently public
 * beta) or another object store, provisioned and wired up as a follow-up.
 * A plain URL or an already-hosted string is still passed through as-is.
 */
export async function uploadImageToSupabase(
  fileOrBase64: File | Blob | string,
  _folder: string = "uploads"
): Promise<{ url: string | null; error: string | null }> {
  if (typeof fileOrBase64 === "string") {
    if (fileOrBase64.startsWith("http://") || fileOrBase64.startsWith("https://")) {
      return { url: fileOrBase64, error: null };
    }
    if (!fileOrBase64.startsWith("data:")) {
      return { url: fileOrBase64, error: null };
    }
  }

  return {
    url: null,
    error: "Image upload isn't available yet — file storage hasn't been set up for this project.",
  };
}
