export type TipoOpcion = "dejar" | "hacer";

export interface OpcionRacha {
  id: string;
  tipo: TipoOpcion;
  /** Lo que se muestra en el botón. */
  etiqueta: string;
  /** El nombre de la racha creada. */
  nombre: string;
  /** Frases para la tarjeta de la racha, adentro de la app. */
  mensajes: string[];
  /** Para el aviso de la noche: discretas, nunca dicen de qué es la racha. */
  avisos: string[];
  /** Al llegar a un hito. */
  festejo: string;
}

export const OPCIONES_RACHA: OpcionRacha[] = [
  {
    id: "pajas", tipo: "dejar", etiqueta: "Pajas", nombre: "Sin pajas",
    mensajes: ["Cada día que ganás te devuelve energía y foco.", "La urgencia pasa en minutos. Vos te quedás.", "Estás entrenando el control, no la prohibición."],
    avisos: ["La energía que guardás hoy es tuya mañana.", "Un día más con la cabeza clara.", "La urgencia pasa. Vos te quedás."],
    festejo: "Más energía, más foco, más vos.",
  },
  {
    id: "fumar", tipo: "dejar", etiqueta: "Fumar", nombre: "Sin fumar",
    mensajes: ["Tus pulmones ya lo están notando.", "Las ganas duran unos minutos. Respirá y dejalas pasar.", "Cada día sin fumar es aire que recuperás."],
    avisos: ["Respirá hondo: eso también es ganar.", "Las ganas pasan. Tu racha queda.", "Hoy también, aire limpio."],
    festejo: "Tu cuerpo ya lo nota: cada respiro es más fácil.",
  },
  {
    id: "alcohol", tipo: "dejar", etiqueta: "Alcohol", nombre: "Sin alcohol",
    mensajes: ["Mañanas claras, noches tranquilas.", "Elegirte a vos también es una forma de festejar.", "Cada día sin tomar es un día con todo tu potencial."],
    avisos: ["Mañana te vas a despertar agradeciéndote.", "Hoy también, la cabeza clara.", "Elegirte a vos es el mejor plan."],
    festejo: "Mañanas claras y la cabeza en su lugar.",
  },
  {
    id: "redes", tipo: "dejar", etiqueta: "Redes sociales", nombre: "Menos redes",
    mensajes: ["El tiempo que no scrolleás es tiempo que vivís.", "Tu atención vale más que cualquier feed.", "Menos pantalla, más vida real."],
    avisos: ["Tu atención es tuya. Cuidala hoy también.", "Menos pantalla, más vida.", "Lo importante no está en el feed."],
    festejo: "Recuperaste horas de vida real.",
  },
  {
    id: "azucar", tipo: "dejar", etiqueta: "Azúcar", nombre: "Sin azúcar",
    mensajes: ["Las ganas de dulce bajan cada día que aguantás.", "Tu energía ya no depende de un pico de azúcar.", "Comer bien también es quererte."],
    avisos: ["Las ganas bajan cada día. Seguí.", "Tu energía te lo agradece.", "Un día más eligiendo bien."],
    festejo: "Más energía pareja y menos antojos.",
  },
  {
    id: "apuestas", tipo: "dejar", etiqueta: "Apuestas", nombre: "Sin apuestas",
    mensajes: ["La única apuesta segura es por vos.", "Cada día sin apostar es plata y paz que guardás.", "No necesitás suerte: tenés constancia."],
    avisos: ["La apuesta segura es por vos.", "Hoy también ganás vos.", "Paz y plata en el bolsillo."],
    festejo: "Ganaste algo que ninguna apuesta te da: control.",
  },
  {
    id: "gym", tipo: "hacer", etiqueta: "Gym", nombre: "Gym",
    mensajes: ["El cuerpo que querés se construye así, día a día.", "No hace falta motivación: hace falta ir.", "Una sesión más y el de la semana pasada queda atrás."],
    avisos: ["¿Ya entrenaste hoy? No la cortes.", "Una sesión más. Vos podés.", "El que va igual, gana."],
    festejo: "Tu cuerpo ya está cambiando. Seguí yendo.",
  },
  {
    id: "comida", tipo: "hacer", etiqueta: "Comer sano", nombre: "Comer sano",
    mensajes: ["Lo que comés hoy es cómo te sentís mañana.", "No es dieta, es respeto por tu cuerpo.", "Comida real, energía real."],
    avisos: ["¿Comiste bien hoy? Marcalo.", "Comida real, energía real.", "Tu cuerpo te lo agradece."],
    festejo: "Más energía, mejor descanso, mejor vos.",
  },
  {
    id: "leer", tipo: "hacer", etiqueta: "Leer", nombre: "Leer",
    mensajes: ["Unas páginas por día y en un año leíste un montón.", "Leer es hablar con gente más sabia que vos.", "Tu cabeza crece una página a la vez."],
    avisos: ["¿Leíste algo hoy? Aunque sea una página.", "Una página más.", "Alimentá la cabeza hoy también."],
    festejo: "Tu cabeza es otra desde que arrancaste.",
  },
  {
    id: "estudiar", tipo: "hacer", etiqueta: "Estudiar", nombre: "Estudiar",
    mensajes: ["Una hora hoy te ahorra diez la semana del examen.", "Entender de a poco gana a memorizar de golpe.", "El que estudia todos los días no se desespera."],
    avisos: ["¿Estudiaste hoy? Marcalo.", "Un rato hoy, tranquilidad mañana.", "Constancia le gana a talento."],
    festejo: "Constancia pura. Se va a notar.",
  },
  {
    id: "meditar", tipo: "hacer", etiqueta: "Meditar", nombre: "Meditar",
    mensajes: ["Diez minutos de calma cambian todo el día.", "No es poner la mente en blanco: es volver.", "Cada día te conocés un poco más."],
    avisos: ["¿Tomaste tus minutos de calma hoy?", "Respirá. Volvé a vos.", "Un rato de silencio."],
    festejo: "Más calma, menos ruido.",
  },
  {
    id: "correr", tipo: "hacer", etiqueta: "Correr", nombre: "Correr",
    mensajes: ["Cada kilómetro es una charla con vos mismo.", "No importa el ritmo, importa salir.", "Correr despeja lo que la cabeza no puede."],
    avisos: ["¿Saliste a correr hoy?", "No importa el ritmo, importa salir.", "Un kilómetro más."],
    festejo: "Cada kilómetro sumó. Mirá todo lo que corriste.",
  },
  {
    id: "dormir", tipo: "hacer", etiqueta: "Dormir temprano", nombre: "Dormir temprano",
    mensajes: ["Dormir bien es el entrenamiento que nadie ve.", "La mañana se gana la noche anterior.", "Tu mejor versión necesita descanso."],
    avisos: ["Hora de ir apagando todo.", "La mañana se gana esta noche.", "Descansar también es avanzar."],
    festejo: "Tu cuerpo y tu cabeza descansan como nunca.",
  },
];

export const opcionRacha = (id: string | null | undefined) => OPCIONES_RACHA.find((o) => o.id === id);
