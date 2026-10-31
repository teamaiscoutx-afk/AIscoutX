export type PreparedImageAttachment = {
  previewUrl: string;
  base64: string;
  mimeType: string;
};

const MAX_EDGE = 1600;
const MAX_BYTES = 3_500_000;

export async function prepareImageAttachment(file: File): Promise<PreparedImageAttachment> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;
  const longest = Math.max(width, height);
  if (longest > MAX_EDGE) {
    const scale = MAX_EDGE / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  let quality = mimeType === "image/jpeg" ? 0.88 : undefined;
  let dataUrl = canvas.toDataURL(mimeType, quality);

  if (dataUrl.length > MAX_BYTES && mimeType !== "image/jpeg") {
    mimeType = "image/jpeg";
    quality = 0.85;
    dataUrl = canvas.toDataURL(mimeType, quality);
  }

  let q = quality ?? 0.85;
  while (dataUrl.length > MAX_BYTES && q > 0.45) {
    q -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", q);
    mimeType = "image/jpeg";
  }

  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : "";
  if (!base64) {
    throw new Error("Could not read image data.");
  }

  return { previewUrl: dataUrl, base64, mimeType };
}
