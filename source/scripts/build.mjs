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
// v25: dist usa el arte del título a 1280 px (el lienzo lleva uno ligero de 768 px) y, si existe, la música del título.
if (fs.existsSync(P("assets/title-art-hq.webp"))) PATCHES.push({ name: "title art HQ", find: 'const TITLE_ART = "data:image/webp;base64," + TITLE_ART_PARTS_V25.join("");',
  repl: `const TITLE_ART = "data:image/webp;base64,${fs.readFileSync(P("assets/title-art-hq.webp")).toString("base64")}";` });
for (const [ext, mime] of [["mp3", "audio/mpeg"], ["ogg", "audio/ogg"], ["m4a", "audio/mp4"]]) if (fs.existsSync(P(`assets/title-music.${ext}`))) {
  PATCHES.push({ name: "title music", find: 'const TITLE_MUSIC = "";', repl: `const TITLE_MUSIC = "data:${mime};base64,${fs.readFileSync(P(`assets/title-music.${ext}`)).toString("base64")}";` }); break; }
// v26: atlas de tiles 32×32 (DCSS CC0) y, si existe, un mapa publicado hecho con el editor (assets/map.json).
const TILESET_URL = fs.existsSync(P("assets/tileset.png")) ? "data:image/png;base64," + fs.readFileSync(P("assets/tileset.png")).toString("base64") : "";
if (TILESET_URL) PATCHES.push({ name: "tileset", find: 'const TILESET_SRC = "";', repl: `const TILESET_SRC = ${JSON.stringify(TILESET_URL)};` });
const MAP_JSON = fs.existsSync(P("assets/map.json")) ? fs.readFileSync(P("assets/map.json"), "utf8") : "";
if (MAP_JSON) PATCHES.push({ name: "published map", find: 'const MAP_FILE = "";', repl: `const MAP_FILE = ${JSON.stringify(MAP_JSON)};` });
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
// v26: editor de mapas (dist/editor.html). Sus datos salen de la lógica del juego (sección Tipos…Interfaz) ejecutada en node.
async function buildEditor() {
  const src = fs.readFileSync(P("src/game.canvas.tsx"), "utf8"); const a = src.indexOf("// ===================== Tipos"), b = src.indexOf("// ===================== Interfaz");
  const footer = `
const __mf: string = ${JSON.stringify(MAP_JSON)}; if (__mf) { const __r = parseMapFile(__mf); if (typeof __r !== "string") CUSTOM_MAP = __r; } // v27: zonas y respawns de referencia salen del mapa publicado
const __g = newGame((Object.values(CLASSES) as ClassDef[])[0]!, "Editor");
const __zn: string[] = []; const __zm = new Map<string, number>(); const __zi: number[] = []; const __zs: Array<[number, number, number]> = [];
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const z = zoneName(__g, x, y); let k = __zm.get(z); if (k === undefined) { k = __zn.length; __zn.push(z); __zm.set(z, k); __zs.push([0, 0, 0]); } __zi.push(k); const q = __zs[k]!; q[0] += x; q[1] += y; q[2]++; }
const __zc = __zs.map((q) => [Math.round(q[0] / q[2]), Math.round(q[1] / q[2])]);
process.stdout.write(JSON.stringify({ W: MW, H: MH, map: exportMapFile(buildMap(), null, [], "Mapa original de Edisar"), tiles: TILE_INFO,
  mons: (Object.values(MONS) as MonDef[]).map((m) => ({ id: m.id, n: m.name, boss: !!m.boss })).sort((x, y) => Number(x.boss) - Number(y.boss) || x.n.localeCompare(y.n, "es")),
  ref: __g.mons.map((m) => [m.x, m.y, m.def.id]), zn: __zn, zr: rleEnc(__zi), zc: __zc, temple: [TEMPLE_X, TEMPLE_Y], town: [TX0, TY0, TX1, TY1], ver: GAME_VER_ED }));
`;
  const ver = (src.match(/const GAME_VER = `([^`]*)`/) || ["", "Edisar"])[1].replace(/\$\{[^}]*\}/g, "2");
  const r1 = await esbuild.build({ stdin: { contents: src.slice(a, b) + `\nconst GAME_VER_ED = ${JSON.stringify("Edisar · " + ver)};\n` + footer, loader: "ts", resolveDir: root }, bundle: true, platform: "node", format: "cjs", write: false, logLevel: "error" });
  const tmp = P("dist/.editor-data.cjs"); fs.writeFileSync(tmp, r1.outputFiles[0].text);
  const data = JSON.parse(execSync(`node "${tmp}"`, { maxBuffer: 64 << 20 }).toString()); fs.rmSync(tmp);
  if (MAP_JSON) data.map = MAP_JSON; // el editor arranca desde el mapa publicado
  data.tileset = TILESET_URL;
  const r2 = await esbuild.build({ entryPoints: [P("src/editor/editor.ts")], bundle: true, minify: true, write: false, format: "iife", target: ["es2020"], logLevel: "warning" });
  const tpl = fs.readFileSync(P("src/editor/editor.html"), "utf8");
  const out = tpl.replace("<!--DATA-->", () => `<script>window.__ED=${JSON.stringify(data).replace(/<\//g, "<\\/")}</script>`).replace("<!--SCRIPT-->", () => `<script>${r2.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script>`);
  fs.writeFileSync(P("dist/editor.html"), out); console.log(`dist/editor.html ${(out.length / 1024).toFixed(0)} KB`);
}
if (TEST) { fs.mkdirSync(P("dist-test"), { recursive: true }); fs.writeFileSync(P("dist-test/index.html"), html); console.log(`dist-test/index.html ${(html.length / 1024).toFixed(0)} KB (test hook)`); process.exit(0); }
fs.mkdirSync(P("dist"), { recursive: true }); fs.writeFileSync(P("dist/index.html"), html); await buildEditor();
fs.rmSync(P("dist/edisar.zip"), { force: true });
execSync(`python3 -c "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED); z.write(sys.argv[2],'index.html'); z.close()" edisar.zip index.html`, { cwd: P("dist") });
console.log(`dist/index.html ${(html.length / 1024).toFixed(0)} KB, dist/edisar.zip ${(fs.statSync(P("dist/edisar.zip")).size / 1024).toFixed(0)} KB`);
