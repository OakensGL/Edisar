// Usage: node scripts/extract-canvas.mjs <ReadCanvas output file> [out=src/game.canvas.tsx]
// Strips the ReadCanvas wrapper (untrusted-data fence + 'Canvas "…" (url):' header) and keeps the TSX.
import fs from "node:fs";
const [inp, out = "src/game.canvas.tsx"] = process.argv.slice(2);
if (!inp) { console.error("usage: extract-canvas.mjs <readcanvas.txt> [out]"); process.exit(1); }
let lines = fs.readFileSync(inp, "utf8").split("\n");
lines = lines.filter((l) => !/^<\/?cursor_untrusted_data[^>]*>\s*$/.test(l));
const hdr = lines.findIndex((l) => /^Canvas ".*" \(https:\/\/cursor\.com\/canvas\/.*\):\s*$/.test(l));
if (hdr >= 0 && hdr < 5) lines = lines.slice(hdr + 1);
const src = lines.join("\n").trim() + "\n";
if (!/from\s+["']grok\/canvas["']/.test(src) || !/export default/.test(src)) { console.error("Doesn't look like the Edisar canvas source"); process.exit(1); }
fs.writeFileSync(out, src); console.log(`wrote ${out} (${src.split("\n").length} lines)`);
