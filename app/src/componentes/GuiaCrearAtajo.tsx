/** Mientras no haya un atajo para instalar con un toque, los pasos para armarlo en Atajos. */
export function GuiaCrearAtajo() {
  return (
    <ol className="guia">
      <li>Tocá <strong>Copiar mi link</strong>, acá arriba.</li>
      <li>Abrí la app <strong>Atajos</strong> → <strong>+</strong> → ponele de nombre <strong>Frase del día</strong>.</li>
      <li>Agregá la acción <strong>Texto</strong> y pegá tu link.</li>
      <li>Agregá <strong>Obtener contenido de URL</strong> (usa el Texto de arriba).</li>
      <li>Agregá <strong>Establecer foto de fondo de pantalla</strong> → <strong>Pantalla bloqueada</strong> y apagá <strong>Mostrar previsualización</strong>.</li>
      <li>Tocá <strong>▶︎</strong> para probarlo: tu pantalla bloqueada cambia a la frase del día.</li>
      <li>
        Para que cambie solo: <strong>Automatización → Nueva automatización → Hora del día</strong>, <strong>07:00</strong>, todos los
        días → elegí <strong>Frase del día</strong> → <strong>Ejecutar inmediatamente</strong>.
      </li>
    </ol>
  );
}
