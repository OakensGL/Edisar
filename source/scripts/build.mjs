// Bundles src/game.canvas.tsx + shim into ONE self-contained dist/index.html and dist/edisar.zip.
import * as esbuild from "esbuild";
import fs from "node:fs"; import path from "node:path"; import { execSync } from "node:child_process";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const P = (...a) => path.join(root, ...a);

// Build-time patches (the canvas itself is never edited). Each anchor must match exactly once.
const PATCHES = [
  { name: "save on hide/close (register)", find: "const autoIv = window.setInterval(autosave, 30000);",
    repl: "const autoIv = window.setInterval(autosave, 30000); const __unSave: () => void = ((globalThis as any).__edisarHookSave ? (globalThis as any).__edisarHookSave(autosave) : () => undefined);" },
  { name: "save on hide/close (cleanup)", find: "window.clearInterval(autoIv);", repl: "window.clearInterval(autoIv); __unSave();" },
];
// Test-only build (TESTHOOK=1 → dist-test/index.html): exposes the live game ref so headless tests can set up a boss phase quickly.
const TEST = !!process.env.TESTHOOK;
if (TEST) PATCHES.push({ name: "test hook", find: "const gRef = useRef<Game | null>(null);", repl: "const gRef = useRef<Game | null>(null); (globalThis as any).__edisarG = gRef;" });
const patchPlugin = { name: "edisar-patch", setup(b) {
  b.onLoad({ filter: /game\.canvas\.tsx$/ }, (args) => {
    let s = fs.readFileSync(args.path, "utf8"); const warnings = [];
    for (const p of PATCHES) { const n = s.split(p.find).length - 1;
      if (n !== 1) warnings.push({ text: `patch "${p.name}" anchor found ${n}x – skipped (beforeunload/visibility save may be missing)` });
      else s = s.replace(p.find, p.repl); }
    return { contents: s, loader: "tsx", warnings };
  });
  b.onResolve({ filter: /^grok\/canvas$/ }, () => ({ path: P("src/grok-canvas-shim.tsx") }));
} };

const r = await esbuild.build({ entryPoints: [P("src/main.tsx")], bundle: true, minify: true, write: false, format: "iife",
  jsx: "automatic", target: ["es2020"], define: { "process.env.NODE_ENV": '"production"' }, plugins: [patchPlugin], logLevel: "warning", legalComments: "none" });
const js = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const favicon = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#181818"/><text x="32" y="46" font-size="40" text-anchor="middle">⚔️</text></svg>');
const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Edisar</title><link rel="icon" href="${favicon}"><meta name="theme-color" content="#070707">
<style>html,body,#root{margin:0;padding:0;min-height:100%;height:100%;background:#070707;color:#fcfcfc;font-family:-apple-system,BlinkMacSystemFont,system-ui,"Segoe UI",sans-serif;color-scheme:dark}*{-webkit-tap-highlight-color:transparent}:fullscreen{background:#181818}</style>
</head><body><div id="root"></div><script>${js}</script></body></html>
`;
if (TEST) { fs.mkdirSync(P("dist-test"), { recursive: true }); fs.writeFileSync(P("dist-test/index.html"), html); console.log(`dist-test/index.html ${(html.length / 1024).toFixed(0)} KB (test hook)`); process.exit(0); }
fs.mkdirSync(P("dist"), { recursive: true }); fs.writeFileSync(P("dist/index.html"), html);
fs.rmSync(P("dist/edisar.zip"), { force: true });
execSync(`python3 -c "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED); z.write(sys.argv[2],'index.html'); z.close()" edisar.zip index.html`, { cwd: P("dist") });
console.log(`dist/index.html ${(html.length / 1024).toFixed(0)} KB, dist/edisar.zip ${(fs.statSync(P("dist/edisar.zip")).size / 1024).toFixed(0)} KB`);
