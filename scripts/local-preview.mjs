import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = normalize(join(process.cwd(), "dist"));
const port = Number(process.env.MOTION_ONLY_PREVIEW_PORT ?? 5173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png"
};

const headersFor = (filePath) => ({
  "content-type": types[extname(filePath)] ?? "application/octet-stream",
  "cache-control": "no-store, max-age=0"
});

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  const cleanPath = normalize(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = normalize(join(root, cleanPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, headersFor(filePath));
    response.end(body);
  } catch {
    const body = await readFile(join(root, "index.html"));
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store, max-age=0" });
    response.end(body);
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Motion Only preview: http://127.0.0.1:${port}`);
});
