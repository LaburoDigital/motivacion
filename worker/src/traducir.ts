/** Traduce del inglés al español con MyMemory. null si falla o se pasó del límite. */
export async function traducir(texto: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|es`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const cuerpo = (await res.json()) as { responseStatus: number; responseData?: { translatedText?: string } };
    const traducido = cuerpo.responseData?.translatedText?.trim();
    if (cuerpo.responseStatus !== 200 || !traducido || traducido.toUpperCase().includes("MYMEMORY WARNING")) return null;
    return traducido;
  } catch {
    return null;
  }
}
