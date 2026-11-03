// Genera los íconos de la app en app/public/iconos/<id>-<tamaño>.png (correr: npm run iconos -w worker).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

const require = createRequire(import.meta.url);
await initWasm(readFileSync(require.resolve("@resvg/resvg-wasm/index_bg.wasm")));

const ventanas = Array.from({ length: 26 }, (_, i) => {
  const x = 170 + (i % 13) * 54;
  const y = 640 + Math.floor(i / 13) * 70 + (i % 3) * 18;
  return `<rect x="${x}" y="${y}" width="16" height="22" rx="3" fill="#f5c46a" opacity="${0.55 + (i % 4) * 0.12}"/>`;
}).join("");

const ICONOS: Record<string, string> = {
  llama: `
    <defs>
      <radialGradient id="f" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#3b2512"/><stop offset="1" stop-color="#110b07"/></radialGradient>
      <linearGradient id="l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e2732e"/><stop offset="1" stop-color="#f6c35f"/></linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#f)"/>
    <path d="M512 178 C 598 300 752 384 736 592 C 724 762 612 858 512 858 C 404 858 288 772 288 612 C 288 504 348 432 404 380 C 414 470 452 522 502 542 C 470 420 468 300 512 178 Z" fill="url(#l)"/>
    <path d="M512 520 C 560 590 626 630 618 724 C 612 796 566 840 512 840 C 454 840 406 798 406 730 C 406 676 436 642 466 620 C 474 668 494 690 518 700 C 504 640 498 580 512 520 Z" fill="#fde7b0"/>`,
  noche: `
    <defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1446"/><stop offset="1" stop-color="#08091a"/></linearGradient></defs>
    <rect width="1024" height="1024" fill="url(#c)"/>
    <circle cx="720" cy="290" r="96" fill="#f6d488"/><circle cx="756" cy="262" r="96" fill="#171140"/>
    <g fill="#0c0d1f"><rect x="140" y="560" width="120" height="464"/><rect x="250" y="470" width="110" height="554"/><rect x="350" y="600" width="100" height="424"/>
      <rect x="440" y="420" width="130" height="604"/><rect x="560" y="530" width="110" height="494"/><rect x="660" y="600" width="110" height="424"/><rect x="760" y="500" width="130" height="524"/></g>
    ${ventanas}`,
  cima: `
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1d55"/><stop offset="0.55" stop-color="#d9674a"/><stop offset="1" stop-color="#f7b65c"/></linearGradient></defs>
    <rect width="1024" height="1024" fill="url(#s)"/>
    <circle cx="512" cy="600" r="150" fill="#ffd98a"/>
    <path d="M0 1024 L 330 520 L 470 700 L 640 430 L 1024 1024 Z" fill="#26132f"/>
    <path d="M640 430 L 700 520 L 655 505 L 615 540 L 590 505 Z" fill="#f3e6e0" opacity="0.85"/>`,
  pesa: `
    <defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a1621"/><stop offset="1" stop-color="#14080b"/></linearGradient></defs>
    <rect width="1024" height="1024" fill="url(#p)"/>
    <g fill="#f3ece6" transform="rotate(-30 512 512)">
      <rect x="300" y="482" width="424" height="60" rx="18"/>
      <rect x="196" y="352" width="78" height="320" rx="26"/><rect x="266" y="402" width="56" height="220" rx="18"/>
      <rect x="750" y="352" width="78" height="320" rx="26"/><rect x="702" y="402" width="56" height="220" rx="18"/>
    </g>`,
};

const dir = new URL("../../app/public/iconos/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [id, cuerpo] of Object.entries(ICONOS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${cuerpo}</svg>`;
  for (const tam of [180, 192, 512]) {
    const png = new Resvg(svg, { fitTo: { mode: "width", value: tam } }).render().asPng();
    writeFileSync(new URL(`${id}-${tam}.png`, dir), png);
  }
}
// El ícono por defecto (manifest y apple-touch-icon) es la llama.
const pub = new URL("../../app/public/", import.meta.url);
writeFileSync(new URL("apple-touch-icon.png", pub), readFileSync(new URL("llama-180.png", dir)));
writeFileSync(new URL("icono-192.png", pub), readFileSync(new URL("llama-192.png", dir)));
writeFileSync(new URL("icono-512.png", pub), readFileSync(new URL("llama-512.png", dir)));
console.log(`${Object.keys(ICONOS).length} íconos listos`);
