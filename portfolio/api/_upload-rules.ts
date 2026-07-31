// Pure validation rules for /api/upload — no I/O, no env, no GitHub calls.
// This is the upload trust boundary, so it lives on its own and stays testable:
// run `npx tsx api/_upload-rules.check.ts` to exercise it.
// Files prefixed with "_" are NOT turned into routes by Vercel.

/**
 * The CV is always written to this exact name so the public link "/CV.pdf"
 * never breaks: uploading "resume_v3_final.pdf" REPLACES the live CV.
 */
export const CV_PUBLIC_NAME = "CV.pdf";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * PDFs run bigger than images, so they get their own (larger) cap.
 * ponytail: Vercel caps a serverless request body at ~4.5MB, so a base64 payload
 * above that is rejected by the platform before this code runs — the practical
 * ceiling is ~3.3MB of raw PDF. Raise this only alongside a real streaming upload.
 */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"];

export type UploadCheck =
  | {
      ok: true;
      kind: "image" | "pdf";
      /** File name inside portfolio/public (PDFs are forced to CV_PUBLIC_NAME). */
      name: string;
      /** Whitespace-stripped base64, ready for the GitHub Contents API. */
      content: string;
    }
  | { ok: false; status: 400 | 413; message: string };

/** Decoded byte count of a base64 string, accounting for "=" padding. */
export function base64Bytes(b64: string): number {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

/** True when the DECODED content starts with the "%PDF-" signature. */
function hasPdfMagic(b64: string): boolean {
  // 8 base64 chars decode to 6 bytes — enough to cover the 5-byte signature.
  return Buffer.from(b64.slice(0, 8), "base64").toString("latin1").startsWith("%PDF-");
}

/**
 * Decide whether an upload is allowed and where it must be written.
 * Inputs are `unknown` on purpose: they come straight off the request body.
 */
export function validateUpload(filename: unknown, contentBase64: unknown): UploadCheck {
  if (typeof filename !== "string" || typeof contentBase64 !== "string") {
    return { ok: false, status: 400, message: "Missing 'filename' or 'contentBase64'" };
  }
  const content = contentBase64.replace(/\s+/g, "");
  if (!filename || !content) {
    return { ok: false, status: 400, message: "Missing 'filename' or 'contentBase64'" };
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    if (base64Bytes(content) > MAX_PDF_BYTES) {
      return { ok: false, status: 413, message: `PDF too large (max ${MAX_PDF_BYTES / 1024 / 1024}MB)` };
    }
    // Never trust the extension alone for the write path that overwrites the CV.
    if (!hasPdfMagic(content)) {
      return { ok: false, status: 400, message: "That file is not a real PDF (missing %PDF- signature)" };
    }
    return { ok: true, kind: "pdf", name: CV_PUBLIC_NAME, content };
  }

  if (!IMAGE_EXTS.includes(ext)) {
    return { ok: false, status: 400, message: `Unsupported file type ".${ext}" (images or PDF only)` };
  }
  if (base64Bytes(content) > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, message: "Image too large (max 5MB)" };
  }
  // Sanitize: strip path separators, keep a safe base name.
  return { ok: true, kind: "image", name: filename.replace(/[^a-z0-9._-]/gi, "-"), content };
}
