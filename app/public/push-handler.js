// Lo importa el service worker: muestra las notificaciones y abre la app en esa frase.
self.addEventListener("push", (evento) => {
  let datos = { titulo: "Motivación", cuerpo: "Tenés una frase nueva.", fraseId: "" };
  try {
    datos = { ...datos, ...evento.data.json() };
  } catch (_) {
    // Payload vacío o inválido: mostramos el texto por defecto.
  }
  evento.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: "/icono-192.png",
      badge: "/icono-192.png",
      data: { fraseId: datos.fraseId },
    }),
  );
});

async function abrirEn(url) {
  const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const v of ventanas) {
    try {
      const navegada = await v.navigate(url);
      if (navegada) return navegada.focus();
    } catch (_) {
      // navigate falla en ventanas que el service worker no controla: probamos abrir una nueva.
    }
  }
  return self.clients.openWindow(url);
}

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const id = evento.notification.data && evento.notification.data.fraseId;
  evento.waitUntil(abrirEn(id ? `/?frase=${encodeURIComponent(id)}` : "/"));
});
