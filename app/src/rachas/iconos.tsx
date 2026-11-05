import {
  IconBarbell, IconBook, IconCandyOff, IconCoinOff, IconDeviceMobileOff, IconEyeOff, IconFlame, IconGlassOff,
  IconMoon, IconPencil, IconRun, IconSalad, IconSchool, IconSmokingNo, IconYoga, type Icon,
} from "@tabler/icons-react";

const ICONOS: Record<string, Icon> = {
  pajas: IconEyeOff, fumar: IconSmokingNo, alcohol: IconGlassOff, redes: IconDeviceMobileOff, azucar: IconCandyOff,
  apuestas: IconCoinOff, gym: IconBarbell, comida: IconSalad, leer: IconBook, estudiar: IconSchool, meditar: IconYoga,
  correr: IconRun, dormir: IconMoon, otra: IconPencil,
};

export const iconoRacha = (clase: string | null | undefined): Icon => (clase && ICONOS[clase]) || IconFlame;
