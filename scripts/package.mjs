import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";

await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
const indexHtml = await readFile("dist/index.html", "utf8");
const assetNames = await readdir("dist/assets");
const cssName = assetNames.find((name) => name.endsWith(".css"));
const jsName = assetNames.find((name) => name.endsWith(".js"));
const cssBundle = await readFile(`dist/assets/${cssName}`, "utf8");
const jsBundle = await readFile(`dist/assets/${jsName}`, "utf8");
const logoDark = (await readFile("dist/motion-only-logo-dark.png")).toString("base64");
const logoOriginal = (await readFile("dist/motion-only-logo-original.png")).toString("base64");
const manifest = await readFile("dist/manifest.webmanifest", "utf8");
const serviceWorker = await readFile("dist/sw.js", "utf8");
await writeFile(
  "dist/server/index.js",
  `const INDEX_HTML = ${JSON.stringify(indexHtml)};
const CSS_BUNDLE = ${JSON.stringify(cssBundle)};
const JS_BUNDLE = ${JSON.stringify(jsBundle)};
const MANIFEST = ${JSON.stringify(manifest)};
const SERVICE_WORKER = ${JSON.stringify(serviceWorker)};
const IMAGE_ASSETS = {
  "/motion-only-logo-dark.png": ${JSON.stringify(logoDark)},
  "/motion-only-logo-original.png": ${JSON.stringify(logoOriginal)}
};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/index.html" || ["/join", "/magic", "/reset-password"].includes(url.pathname)) {
      return new Response(INDEX_HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }
    if (url.pathname === "/manifest.webmanifest") {
      return new Response(MANIFEST, {
        headers: {
          "content-type": "application/manifest+json; charset=utf-8",
          "cache-control": "public, max-age=3600"
        }
      });
    }
    if (url.pathname === "/sw.js") {
      return new Response(SERVICE_WORKER, {
        headers: {
          "content-type": "text/javascript; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }
    if (url.pathname === "/assets/${cssName}") {
      return new Response(CSS_BUNDLE, {
        headers: {
          "content-type": "text/css; charset=utf-8",
          "cache-control": "public, max-age=31536000, immutable"
        }
      });
    }
    if (url.pathname === "/assets/${jsName}") {
      return new Response(JS_BUNDLE, {
        headers: {
          "content-type": "text/javascript; charset=utf-8",
          "cache-control": "public, max-age=31536000, immutable"
        }
      });
    }
    if (IMAGE_ASSETS[url.pathname]) {
      return new Response(decodeBase64(IMAGE_ASSETS[url.pathname]), {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=31536000, immutable"
        }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
`
);
