// Genera los íconos PNG de la app (fondo oscuro con una llama naranja), sin dependencias.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const crcTabla = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTabla[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const bloque = (tipo, datos) => {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo), datos]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([largo, td, c]);
};

function png(size) {
  const filas = [];
  for (let y = 0; y < size; y++) {
    const fila = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x++) {
      const u = x / size - 0.5;
      const v = y / size - 0.5;
      // Llama: gota invertida (círculo abajo + punta arriba).
      const enCirculo = u * u + (v - 0.08) ** 2 < 0.045;
      const enPunta = v < 0.08 && v > -0.32 && Math.abs(u) < (v + 0.32) * 0.53;
      const nucleo = u * u + (v - 0.12) ** 2 < 0.012;
      let rgb = [11 + Math.round(10 * (0.5 - v)), 11, 18 + Math.round(14 * (0.5 - v))];
      if (enCirculo || enPunta) rgb = [255, 122 - Math.round(60 * (0.3 - v)), 61];
      if (nucleo) rgb = [255, 214, 120];
      rgb.forEach((c, i) => (fila[1 + x * 3 + i] = Math.max(0, Math.min(255, c))));
    }
    filas.push(fila);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque("IHDR", ihdr),
    bloque("IDAT", deflateSync(Buffer.concat(filas))),
    bloque("IEND", Buffer.alloc(0)),
  ]);
}

const pub = fileURLToPath(new URL("../public/", import.meta.url));
writeFileSync(pub + "icono-192.png", png(192));
writeFileSync(pub + "icono-512.png", png(512));
writeFileSync(pub + "apple-touch-icon.png", png(180));
console.log("íconos listos");
