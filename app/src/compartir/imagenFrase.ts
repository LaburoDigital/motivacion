import type { Frase } from "shared";
import { urlFoto, type EstiloVisual } from "../visual/estilos";

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });
}

function partirEnLineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(" ")) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > ancho && actual) {
      lineas.push(actual);
      actual = palabra;
    } else actual = prueba;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

async function pintarFondo(ctx: CanvasRenderingContext2D, estilo: EstiloVisual, w: number, h: number) {
  ctx.fillStyle = "#0b0b0f";
  ctx.fillRect(0, 0, w, h);
  if (estilo.tipo === "foto") {
    try {
      ctx.drawImage(await cargarImagen(urlFoto(estilo, w, h)), 0, 0, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, w, h);
    } catch {
      // Sin la foto queda el fondo oscuro.
    }
    return;
  }
  const colores = estilo.fondoCss?.match(/#[0-9a-f]{3,6}/gi) ?? ["#0b0b0f"];
  if (colores.length === 1) {
    ctx.fillStyle = colores[0];
  } else {
    const g = ctx.createLinearGradient(0, 0, w * 0.4, h);
    colores.forEach((c, i) => g.addColorStop(i / (colores.length - 1), c));
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, w, h);
}

/** Dibuja la frase con su fondo en un PNG listo para compartir. */
export async function generarImagenFrase(frase: Frase, estilo: EstiloVisual, w = 1080, h = 1920): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  await pintarFondo(ctx, estilo, w, h);

  const tam = frase.texto.length > 180 ? 52 : frase.texto.length > 90 ? 64 : 80;
  ctx.font = `600 ${tam}px ${estilo.fuente}`;
  ctx.fillStyle = estilo.colorTexto;
  ctx.textAlign = "center";
  const lineas = partirEnLineas(ctx, frase.texto, w * 0.8);
  let y = (h - lineas.length * tam * 1.3) / 2 + tam;
  for (const l of lineas) {
    ctx.fillText(l, w / 2, y);
    y += tam * 1.3;
  }
  if (frase.autor) {
    ctx.font = `400 ${Math.round(tam * 0.55)}px ${estilo.fuente}`;
    ctx.fillText(`— ${frase.autor}`, w / 2, y + tam * 0.4);
  }
  return new Promise((ok) => canvas.toBlob((b) => ok(b!), "image/png"));
}

/** Abre el menú de compartir de iOS; si no hay soporte, descarga el PNG. */
export async function compartirFrase(frase: Frase, estilo: EstiloVisual): Promise<void> {
  const blob = await generarImagenFrase(frase, estilo);
  const archivo = new File([blob], "frase.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo] });
    } catch {
      // El usuario canceló.
    }
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "frase.png";
  a.click();
  URL.revokeObjectURL(a.href);
}
