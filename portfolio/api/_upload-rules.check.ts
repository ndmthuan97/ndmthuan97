// Self-check for the upload trust boundary (type + magic bytes + size caps).
// Run from the portfolio folder:  npx tsx api/_upload-rules.check.ts
// Deliberately NOT a test framework — plain asserts, non-zero exit on failure.
// "_" prefix keeps Vercel from turning this into a route.
import assert from "node:assert/strict";
import {
  validateUpload,
  base64Bytes,
  CV_PUBLIC_NAME,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
} from "./_upload-rules.js";

const b64 = (s: string) => Buffer.from(s, "latin1").toString("base64");

/** base64 string that decodes to `bytes` bytes and starts with the given prefix. */
function padded(prefix: string, bytes: number): string {
  const head = b64(prefix);
  const chars = Math.ceil((bytes * 4) / 3 / 4) * 4; // keep length 4-aligned
  return head + "A".repeat(Math.max(0, chars - head.length));
}

const realPdf = b64("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
const pngBytes = b64("\x89PNG\r\n\x1a\n" + "x".repeat(64));

// 1. A real PDF passes and is forced onto the fixed CV name, whatever it was called.
const ok = validateUpload("resume_v3_final.pdf", realPdf);
assert.equal(ok.ok, true);
assert.ok(ok.ok && ok.kind === "pdf");
assert.equal(ok.ok && ok.name, CV_PUBLIC_NAME);

// 1b. Extension case does not matter.
assert.equal(validateUpload("CV.PDF", realPdf).ok, true);

// 2. ".pdf" extension with non-PDF bytes is rejected (extension is not evidence).
const fake = validateUpload("evil.pdf", b64("<script>alert(1)</script>"));
assert.equal(fake.ok, false);
assert.equal(!fake.ok && fake.status, 400);
assert.match(!fake.ok ? fake.message : "", /not a real PDF/i);

// 3. PDF over its own cap is rejected with 413 (checked before the magic bytes pass).
const bigPdf = validateUpload("cv.pdf", padded("%PDF-1.7\n", MAX_PDF_BYTES + 1024));
assert.equal(bigPdf.ok, false);
assert.equal(!bigPdf.ok && bigPdf.status, 413);

// 4. Images still pass, still capped at 5MB, and still get a sanitized name.
const img = validateUpload("my project shot.png", pngBytes);
assert.equal(img.ok, true);
assert.equal(img.ok && img.kind, "image");
assert.equal(img.ok && img.name, "my-project-shot.png");

const okSizeImage = validateUpload("a.png", padded("\x89PNG", MAX_IMAGE_BYTES - 4096));
assert.equal(okSizeImage.ok, true);

const bigImage = validateUpload("a.png", padded("\x89PNG", MAX_IMAGE_BYTES + 4096));
assert.equal(bigImage.ok, false);
assert.equal(!bigImage.ok && bigImage.status, 413);

// 4b. A PDF between the image cap and the PDF cap must still pass (caps are per-type).
assert.equal(validateUpload("cv.pdf", padded("%PDF-1.7\n", MAX_IMAGE_BYTES + 1024 * 1024)).ok, true);

// 5. Anything else is refused, including junk input types and empty bodies.
for (const bad of [
  validateUpload("payload.exe", realPdf),
  validateUpload("noext", realPdf),
  validateUpload(undefined, realPdf),
  validateUpload({ evil: true }, realPdf),
  validateUpload("cv.pdf", ""),
  validateUpload("cv.pdf", "   \n  "),
]) {
  assert.equal(bad.ok, false);
  assert.equal(!bad.ok && bad.status, 400);
}

// 6. Traversal attempts cannot escape portfolio/public.
const traversal = validateUpload("../../../.github/workflows/x.png", pngBytes);
assert.ok(traversal.ok && !traversal.name.includes("/") && !traversal.name.includes("\\"));

// 7. base64Bytes accounts for padding.
assert.equal(base64Bytes(b64("abc")), 3);
assert.equal(base64Bytes(b64("ab")), 2);
assert.equal(base64Bytes(b64("a")), 1);

console.log("upload-rules self-check: all assertions passed");
