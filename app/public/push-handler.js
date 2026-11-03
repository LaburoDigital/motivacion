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

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const id = evento.notification.data && evento.notification.data.fraseId;
  const url = id ? `/?frase=${encodeURIComponent(id)}` : "/";
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ("navigate" in v) return v.navigate(url).then((c) => c && c.focus());
      }
      return self.clients.openWindow(url);
    }),
  );
});
