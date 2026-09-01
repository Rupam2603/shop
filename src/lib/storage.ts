export async function uploadImageToSupabase(
  fileOrBase64: File | Blob | string,
  folder: string = "uploads"
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (typeof fileOrBase64 === "string") {
      if (fileOrBase64.startsWith("http://") || fileOrBase64.startsWith("https://")) {
        return { url: fileOrBase64, error: null };
      }
      if (!fileOrBase64.startsWith("data:")) {
        return { url: fileOrBase64, error: null };
      }
    }

    // Only base64 data URLs need uploading — send to our server-side API route
    if (typeof fileOrBase64 !== "string") {
      return { url: null, error: "Only base64 image data is currently supported" };
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: fileOrBase64, folder }),
    });

    const json = await res.json();
    if (!res.ok) {
      return { url: null, error: json.error || "Upload failed" };
    }
    return { url: json.url, error: null };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { url: null, error: error?.message || "Failed to upload image" };
  }
}