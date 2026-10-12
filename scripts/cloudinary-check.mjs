/*
 * Diagnose Cloudinary credentials: npm run check:cloudinary
 *
 * Uploading needs an API key with the "create" permission. A key that can ping
 * and list but not upload produces a 403 at product-add time, which looks like
 * an application bug and is not one.
 */
const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud || !key || !secret) {
  console.error("Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in .env");
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const line = (label, status, note = "") =>
  console.log(`  ${status === 200 ? "OK  " : "FAIL"}  ${label.padEnd(22)} ${status} ${note}`);

console.log(`\nCloudinary cloud: ${cloud}  key: ${key}\n`);

const ping = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/ping`, {
  headers: { Authorization: auth },
});
line("credentials", ping.status, ping.ok ? "" : "cloud name / key / secret do not match");

const read = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/resources/image?max_results=1`, {
  headers: { Authorization: auth },
});
line("read media", read.status);

const { createHash } = await import("node:crypto");
const timestamp = Math.floor(Date.now() / 1000);
const signature = createHash("sha1").update(`timestamp=${timestamp}${secret}`).digest("hex");

const form = new FormData();
form.set("file", new Blob([PNG], { type: "image/png" }), "probe.png");
form.set("api_key", key);
form.set("timestamp", String(timestamp));
form.set("signature", signature);

const upload = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
  method: "POST",
  body: form,
});
const uploadBody = await upload.json().catch(() => ({}));
line("upload", upload.status, upload.ok ? "" : uploadBody?.error?.message || "");

if (upload.ok) {
  /* Clean up the probe image so it never shows up in the media library. */
  const destroyTs = Math.floor(Date.now() / 1000);
  const destroySig = createHash("sha1")
    .update(`public_id=${uploadBody.public_id}&timestamp=${destroyTs}${secret}`)
    .digest("hex");
  const destroyForm = new FormData();
  destroyForm.set("public_id", uploadBody.public_id);
  destroyForm.set("api_key", key);
  destroyForm.set("timestamp", String(destroyTs));
  destroyForm.set("signature", destroySig);
  await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
    method: "POST",
    body: destroyForm,
  });

  console.log("\nUploads work. Product images will save.\n");
  process.exit(0);
}

console.log(`
Uploads are blocked, so adding a product will fail.

If the message mentions actions=["create"], this API key is read-only. Fix it in
the Cloudinary console:

  Settings -> API Keys -> the key named above
    - grant it the "create" permission (Full access / read-write), or
    - Generate New API Key with full access and replace
      CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env

Then re-run: npm run check:cloudinary
`);
process.exit(1);
