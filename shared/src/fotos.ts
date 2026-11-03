// Fotos de Unsplash (licencia libre: uso gratis, sin atribución obligatoria), elegidas a mano.
import type { CategoriaId } from "./tipos";

export type PackId = "ciudad" | "gym" | "boxeo" | "lluvia" | "ruta" | "montana" | "estrellas" | "neon" | "correr";

export const PACKS: { id: PackId; nombre: string }[] = [
  { id: "ciudad", nombre: "Ciudad de noche" },
  { id: "gym", nombre: "Gym" },
  { id: "boxeo", nombre: "Boxeo" },
  { id: "correr", nombre: "Correr" },
  { id: "ruta", nombre: "Ruta de noche" },
  { id: "lluvia", nombre: "Lluvia" },
  { id: "neon", nombre: "Neón" },
  { id: "montana", nombre: "Amanecer" },
  { id: "estrellas", nombre: "Estrellas" },
];

export interface Foto {
  id: string;
  pack: PackId;
}

const DATOS: [PackId, string][] = [
  ["ciudad", "1580895456895-cfdf02e4c23f"],
  ["ciudad", "1514439827219-9137a0b99245"],
  ["ciudad", "1498036882173-b41c28a8ba34"],
  ["ciudad", "1605702012553-e954fbde66eb"],
  ["ciudad", "1577450775949-58ec8d02cad9"],
  ["ciudad", "1531819177115-428566ccfb50"],
  ["ciudad", "1606152536277-5aa1fd33e150"],
  ["ciudad", "1611416370495-50fac9e1b382"],
  ["ciudad", "1519010470956-6d877008eaa4"],
  ["ciudad", "1586165877141-3dbcfc059283"],
  ["ciudad", "1453413453658-27fec8f43f29"],
  ["ciudad", "1516900557549-41557d405adf"],
  ["ciudad", "1571182092747-f3491824b90a"],
  ["ciudad", "1502514276381-1ea51dfe201c"],
  ["ciudad", "1541702467897-41915a07d3a7"],
  ["gym", "1637430308606-86576d8fef3c"],
  ["gym", "1648235692910-947cb90ddd97"],
  ["gym", "1590487988256-9ed24133863e"],
  ["gym", "1526506118085-60ce8714f8c5"],
  ["gym", "1637870473618-8c9fa7d11f0a"],
  ["gym", "1693214674477-1159bddf1598"],
  ["gym", "1542684377-0b875fde9563"],
  ["gym", "1613845205719-8c87760ab728"],
  ["gym", "1722925541321-f52d45b29c17"],
  ["gym", "1693214674451-d6bd02e642d1"],
  ["boxeo", "1549719386-74dfcbf7dbed"],
  ["boxeo", "1546711076-85a7923432ab"],
  ["boxeo", "1622599511051-16f55a1234d0"],
  ["boxeo", "1681203888755-bd61fe3558eb"],
  ["boxeo", "1606059100110-4230429584fe"],
  ["boxeo", "1618517048289-4646902edaf5"],
  ["boxeo", "1575747503976-5e6e96a13504"],
  ["boxeo", "1645458300302-976c183ef23c"],
  ["lluvia", "1515694346937-94d85e41e6f0"],
  ["lluvia", "1501186758051-167ca3c0fde8"],
  ["lluvia", "1508204175610-118a256b862d"],
  ["lluvia", "1638782779161-50f17e851787"],
  ["lluvia", "1520187135890-e8023d253f5c"],
  ["ruta", "1566276423184-a8c13d2a88a1"],
  ["ruta", "1495709165577-351d14380bdd"],
  ["ruta", "1618941240535-234c3212e3e7"],
  ["ruta", "1619204715997-1367fe5812f1"],
  ["ruta", "1637863611072-7441a3609d28"],
  ["ruta", "1597419587733-c0318f1a93ff"],
  ["ruta", "1606944568600-56ea07065fb7"],
  ["ruta", "1547769725-b95b3ae93d42"],
  ["montana", "1554629947-334ff61d85dc"],
  ["montana", "1540979388789-6cee28a1cdc9"],
  ["montana", "1542662565-7e4b66bae529"],
  ["montana", "1594329852649-012d9528deda"],
  ["montana", "1610892415063-d89a504ce049"],
  ["montana", "1595495745827-85bcc5c9a028"],
  ["montana", "1533387520709-752d83de3630"],
  ["montana", "1574726252024-83b799196f99"],
  ["montana", "1517437478710-db9151f07d20"],
  ["estrellas", "1535418126925-0bfb3a0ee0d7"],
  ["estrellas", "1619665481428-101a5daa4d15"],
  ["estrellas", "1600806343209-d8f624917fbe"],
  ["estrellas", "1633946395810-9e6c68a61150"],
  ["estrellas", "1597140720834-d5ae34905dfa"],
  ["neon", "1515693516428-3c89b92d3220"],
  ["neon", "1608690158878-1a96b29b455b"],
  ["neon", "1541537103745-ea3429c65dc4"],
  ["neon", "1551726742-e7fef3db157e"],
  ["neon", "1542416409-400da26855b5"],
  ["neon", "1671877297416-1b15b5de5b1e"],
  ["neon", "1606614751257-4450f1270130"],
  ["neon", "1670960671813-dd06c55b5411"],
  ["neon", "1596892205285-0a362dfc00aa"],
  ["correr", "1522040942177-269680274214"],
  ["correr", "1705468616275-616b7c01d317"],
  ["correr", "1650537167988-5a295c5fdde6"],
  ["correr", "1626949458437-10eda353b7c0"],
  ["correr", "1736614209691-ec57a396f1cf"],
  ["correr", "1739952899166-6fb816f39411"],
  ["correr", "1619408985784-fee9f291eb02"],
];

export const FOTOS: Foto[] = DATOS.map(([pack, id]) => ({ id, pack }));

/** Qué fondos combinan con cada tema de frases (modo "Automático"). */
export const PACKS_POR_CATEGORIA: Record<CategoriaId, PackId[]> = {
  disciplina: ["gym", "ruta", "ciudad", "boxeo"],
  estudio: ["lluvia", "ciudad", "neon"],
  gym: ["gym", "boxeo", "correr"],
  estoicismo: ["estrellas", "montana", "ruta"],
  "amor-propio": ["montana", "estrellas", "lluvia"],
  exito: ["ciudad", "neon", "montana"],
  calma: ["lluvia", "estrellas", "montana"],
  superacion: ["boxeo", "correr", "montana", "ruta"],
};

export const urlFotoUnsplash = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=entropy&fm=jpg&q=75`;
