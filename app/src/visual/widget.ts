import type { Preferencias } from "../datos/almacen";

/**
 * Código para la app gratis Scriptable: un widget de pantalla bloqueada (o de inicio)
 * que muestra la frase del día en texto, para quien no quiere cambiar su fondo.
 */
export function scriptWidget(prefs: Preferencias, workerUrl: string): string {
  const q = new URLSearchParams({ temas: prefs.temas.join(","), zona: prefs.zonaHoraria });
  return `// Motivación: frase del día
const URL_FRASE = "${workerUrl}/frase-del-dia?${q}";
const frase = await new Request(URL_FRASE).loadJSON();
const chico = config.widgetFamily === "accessoryRectangular" || config.widgetFamily === "accessoryInline";

const w = new ListWidget();
if (!chico) {
  w.backgroundColor = new Color("#101114");
  w.setPadding(14, 14, 14, 14);
}
const texto = w.addText(frase.texto);
texto.font = Font.semiboldSystemFont(chico ? 12 : 17);
texto.minimumScaleFactor = 0.6;
if (!chico) {
  texto.textColor = new Color("#f3f0ea");
  if (frase.autor) {
    w.addSpacer(6);
    const autor = w.addText(frase.autor.toUpperCase());
    autor.font = Font.mediumSystemFont(10);
    autor.textColor = new Color("#e9b45c");
  }
}
w.refreshAfterDate = new Date(Date.now() + 3 * 60 * 60 * 1000);
Script.setWidget(w);
Script.complete();
`;
}
