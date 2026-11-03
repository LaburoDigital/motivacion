import type { Frase } from "shared";
import type { Apariencia } from "../visual/Fondo";
import { urlFoto } from "../visual/fondos";

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

/** Dibuja la frase sobre su foto, con la letra elegida, en un PNG listo para compartir. */
export async function generarImagenFrase(frase: Frase, { foto, letra }: Apariencia, w = 1080, h = 1920): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#14161b";
  ctx.fillRect(0, 0, w, h);
  try {
    ctx.drawImage(await cargarImagen(urlFoto(foto, w, h)), 0, 0, w, h);
  } catch {
    // Sin la foto queda el fondo oscuro.
  }
  const velo = ctx.createLinearGradient(0, 0, 0, h);
  velo.addColorStop(0, "rgba(8,9,12,0.55)");
  velo.addColorStop(0.45, "rgba(8,9,12,0.38)");
  velo.addColorStop(1, "rgba(8,9,12,0.7)");
  ctx.fillStyle = velo;
  ctx.fillRect(0, 0, w, h);

  const texto = letra.mayusculas ? frase.texto.toUpperCase() : frase.texto;
  const base = frase.texto.length > 180 ? 50 : frase.texto.length > 90 ? 62 : 78;
  const tam = Math.round(base * letra.escala);
  await document.fonts?.load(`${letra.peso} ${tam}px ${letra.familia}`).catch(() => undefined);
  ctx.font = `${letra.peso} ${tam}px ${letra.familia}`;
  ctx.fillStyle = "#f6f3ee";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 18;
  const lineas = partirEnLineas(ctx, texto, w * 0.8);
  let y = (h - lineas.length * tam * 1.25) / 2 + tam;
  for (const l of lineas) {
    ctx.fillText(l, w / 2, y);
    y += tam * 1.25;
  }
  if (frase.autor) {
    ctx.font = `500 ${Math.round(tam * 0.42)}px 'Outfit', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(246,243,238,0.8)";
    ctx.fillText(frase.autor.toUpperCase(), w / 2, y + tam * 0.45);
  }
  return new Promise((ok) => canvas.toBlob((b) => ok(b!), "image/png"));
}

/** Abre el menú de compartir de iOS; si no hay soporte, descarga el PNG. */
export async function compartirFrase(frase: Frase, apariencia: Apariencia): Promise<void> {
  const blob = await generarImagenFrase(frase, apariencia);
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
