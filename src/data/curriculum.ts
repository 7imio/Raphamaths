export const AREA_META = {
  numeration: { title: 'Numération', emoji: '🔢', color: '#7856c9', description: 'Comprendre les nombres et les décimaux' },
  calcul: { title: 'Calcul', emoji: '➕', color: '#ef8a55', description: 'Additionner, multiplier et partager' },
  fractions: { title: 'Fractions', emoji: '🍫', color: '#388d84', description: 'Comprendre les parts d’un tout' },
  mesures: { title: 'Mesures', emoji: '📏', color: '#3a83b9', description: 'Utiliser les unités au quotidien' },
  problemes: { title: 'Problèmes', emoji: '🧩', color: '#be6d93', description: 'Raisonner dans des situations concrètes' },
  donnees: { title: 'Données', emoji: '📊', color: '#899148', description: 'Lire des graphiques et comparer' },
} as const;

export type AreaId = keyof typeof AREA_META;
export type SkillId =
  | 'base10' | 'compare-integers' | 'decimals'
  | 'addition' | 'multiplication' | 'sharing'
  | 'fraction-parts' | 'fraction-compare'
  | 'lengths' | 'shopping' | 'charts' | 'proportion';

export type Skill = {
  id: SkillId;
  area: AreaId;
  title: string;
  description: string;
  prerequisites: SkillId[];
  schoolLevel: 'CE2' | 'CM1' | 'CM2';
};

export const SKILLS: Skill[] = [
  { id: 'base10', area: 'numeration', title: 'Unités, dizaines, centaines', description: 'Construire un nombre avec des blocs.', prerequisites: [], schoolLevel: 'CE2' },
  { id: 'compare-integers', area: 'numeration', title: 'Comparer deux nombres', description: 'Voir lequel est le plus grand.', prerequisites: ['base10'], schoolLevel: 'CM1' },
  { id: 'decimals', area: 'numeration', title: 'Dixièmes et centièmes', description: 'Comprendre les nombres à virgule.', prerequisites: ['base10'], schoolLevel: 'CM2' },
  { id: 'addition', area: 'calcul', title: 'Additionner en comprenant', description: 'Réunir des quantités.', prerequisites: ['base10'], schoolLevel: 'CE2' },
  { id: 'multiplication', area: 'calcul', title: 'Multiplier avec des groupes', description: 'Compter des rangées identiques.', prerequisites: ['addition'], schoolLevel: 'CE2' },
  { id: 'sharing', area: 'calcul', title: 'Partager équitablement', description: 'Répartir des objets en parts égales.', prerequisites: ['multiplication'], schoolLevel: 'CM1' },
  { id: 'fraction-parts', area: 'fractions', title: 'Découvrir les fractions', description: 'Lire les parts d’un chocolat.', prerequisites: [], schoolLevel: 'CM1' },
  { id: 'fraction-compare', area: 'fractions', title: 'Comparer des fractions', description: 'Comparer des bandes de même taille.', prerequisites: ['fraction-parts'], schoolLevel: 'CM2' },
  { id: 'lengths', area: 'mesures', title: 'Mètres et centimètres', description: 'Transformer une longueur.', prerequisites: ['base10'], schoolLevel: 'CM1' },
  { id: 'shopping', area: 'problemes', title: 'Les petits achats', description: 'Résoudre une situation du quotidien.', prerequisites: ['addition'], schoolLevel: 'CE2' },
  { id: 'charts', area: 'donnees', title: 'Lire un diagramme', description: 'Comprendre un graphique en barres.', prerequisites: ['compare-integers'], schoolLevel: 'CM2' },
  { id: 'proportion', area: 'problemes', title: 'Multiplier une quantité', description: 'Relier une quantité à son prix.', prerequisites: ['multiplication'], schoolLevel: 'CM2' },
];

export const findSkill = (id: string) => SKILLS.find((skill) => skill.id === id);
export const AREA_IDS = Object.keys(AREA_META) as AreaId[];
