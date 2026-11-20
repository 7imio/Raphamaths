import type { SkillId } from '../data/curriculum';

export type Visual =
  | { kind: 'base10'; hundreds: number; tens: number; ones: number }
  | { kind: 'numberline'; a: number; b: number; max: number }
  | { kind: 'decimal'; hundredths: number }
  | { kind: 'add'; a: number; b: number }
  | { kind: 'array'; rows: number; columns: number }
  | { kind: 'share'; total: number; groups: number }
  | { kind: 'fractions'; first: [number, number]; second?: [number, number] }
  | { kind: 'length'; meters: number; centimeters: number }
  | { kind: 'money'; count: number; price: number; item: string }
  | { kind: 'chart'; labels: string[]; values: number[]; targetIndex: number }
  | { kind: 'proportion'; packs: number; each: number };

export type Exercise = {
  id: string;
  skillId: SkillId;
  question: string;
  instruction: string;
  expected: string;
  explanation: string;
  visual: Visual;
  placeholder?: string;
};

const between = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(items: T[]) => items[between(0, items.length - 1)];
const base = (skillId: SkillId, overrides: Omit<Exercise, 'id' | 'skillId'>): Exercise => ({
  id: crypto.randomUUID(), skillId, ...overrides,
});
const fr = (number: number) => String(number).replace('.', ',');

export function createExercise(skillId: SkillId): Exercise {
  switch (skillId) {
    case 'base10': {
      const hundreds = between(1, 4), tens = between(0, 7), ones = between(1, 9);
      const number = hundreds * 100 + tens * 10 + ones;
      return base(skillId, { question: 'Quel nombre représentent ces blocs ?', instruction: 'Compte les centaines, les dizaines puis les unités.', expected: String(number), explanation: `${hundreds} centaine(s) = ${hundreds * 100}, ${tens} dizaine(s) = ${tens * 10} et ${ones} unité(s). Donc ${number}.`, visual: { kind: 'base10', hundreds, tens, ones }, placeholder: 'Ex. : 235' });
    }
    case 'compare-integers': {
      const a = between(10, 80), b = between(10, 80);
      const second = a === b ? (b === 80 ? b - 1 : b + 1) : b;
      return base(skillId, { question: `Quel nombre est le plus grand : ${a} ou ${second} ?`, instruction: 'Observe la place de chaque nombre sur la droite.', expected: String(Math.max(a, second)), explanation: `Sur une droite graduée, le nombre le plus à droite est le plus grand : ${Math.max(a, second)}.`, visual: { kind: 'numberline', a, b: second, max: 100 } });
    }
    case 'decimals': {
      const hundredths = between(11, 89);
      return base(skillId, { question: 'Quel nombre décimal représente cette grille ?', instruction: 'Chaque petit carré représente un centième.', expected: fr(hundredths / 100), explanation: `${hundredths} cases sur 100, c’est ${hundredths}/100, donc ${fr(hundredths / 100)}.`, visual: { kind: 'decimal', hundredths }, placeholder: 'Ex. : 0,25' });
    }
    case 'addition': {
      const a = between(12, 42), b = between(11, 37);
      return base(skillId, { question: `Combien font ${a} + ${b} ?`, instruction: 'Rassemble les deux collections.', expected: String(a + b), explanation: `On réunit ${a} et ${b}, ce qui donne ${a + b}. Tu peux additionner les dizaines et les unités séparément.`, visual: { kind: 'add', a, b } });
    }
    case 'multiplication': {
      const rows = between(2, 6), columns = between(2, 6);
      return base(skillId, { question: `Combien font ${rows} × ${columns} ?`, instruction: 'Regarde les rangées et compte les points.', expected: String(rows * columns), explanation: `${rows} rangées de ${columns} points, c’est ${Array.from({ length: rows }, () => columns).join(' + ')} = ${rows * columns}.`, visual: { kind: 'array', rows, columns } });
    }
    case 'sharing': {
      const groups = pick([2, 3, 4]), each = between(2, 5), total = groups * each;
      return base(skillId, { question: `On partage ${total} jetons entre ${groups} personnes. Combien chacun reçoit-il ?`, instruction: 'Dans le mode Manipuler, distribue les jetons un par un.', expected: String(each), explanation: `${total} jetons partagés en ${groups} groupes égaux : chacun reçoit ${each} jetons.`, visual: { kind: 'share', total, groups } });
    }
    case 'fraction-parts': {
      const denominator = pick([2, 4, 5, 8, 10]), numerator = between(1, denominator - 1);
      return base(skillId, { question: 'Quelle fraction de la tablette est colorée ?', instruction: 'Compte les morceaux colorés puis tous les morceaux.', expected: `${numerator}/${denominator}`, explanation: `Il y a ${numerator} morceau(x) coloré(s) sur ${denominator} morceaux égaux. On écrit ${numerator}/${denominator}.`, visual: { kind: 'fractions', first: [numerator, denominator] }, placeholder: 'Ex. : 3/4' });
    }
    case 'fraction-compare': {
      const denominator = pick([4, 5, 6, 8]), a = between(1, denominator - 2), b = between(a + 1, denominator - 1);
      return base(skillId, { question: `Quelle fraction est la plus grande : ${a}/${denominator} ou ${b}/${denominator} ?`, instruction: 'Les deux tablettes ont la même taille.', expected: `${b}/${denominator}`, explanation: `Avec le même dénominateur ${denominator}, ${b} parts sont plus grandes que ${a} parts.`, visual: { kind: 'fractions', first: [a, denominator], second: [b, denominator] }, placeholder: 'Ex. : 3/4' });
    }
    case 'lengths': {
      const meters = between(1, 3), centimeters = pick([10, 20, 30, 40, 50, 60, 70, 80]);
      return base(skillId, { question: `Combien de centimètres font ${meters} m et ${centimeters} cm ?`, instruction: 'Un mètre contient 100 centimètres.', expected: String(meters * 100 + centimeters), explanation: `${meters} m = ${meters * 100} cm. On ajoute ${centimeters} cm : ${meters * 100 + centimeters} cm.`, visual: { kind: 'length', meters, centimeters } });
    }
    case 'shopping': {
      const price = between(2, 6), count = between(2, 4);
      return base(skillId, { question: `Tu achètes ${count} carnets à ${price} € chacun. Combien paies-tu en tout ?`, instruction: 'Compte les pièces de chaque carnet.', expected: String(count * price), explanation: `${count} groupes de ${price} € font ${count * price} €.`, visual: { kind: 'money', price, count, item: 'carnet' } });
    }
    case 'charts': {
      const labels = ['Lundi', 'Mardi', 'Mercredi'], values = [between(2, 6), between(4, 9), between(1, 5)], targetIndex = between(0, 2);
      return base(skillId, { question: `Combien de livres ont été lus ${labels[targetIndex].toLowerCase()} ?`, instruction: 'Repère la bonne barre puis sa hauteur.', expected: String(values[targetIndex]), explanation: `La barre « ${labels[targetIndex]} » atteint la graduation ${values[targetIndex]}.`, visual: { kind: 'chart', labels, values, targetIndex } });
    }
    case 'proportion': {
      const each = between(2, 5), packs = between(3, 6);
      return base(skillId, { question: `Une boîte contient ${each} crayons. Combien de crayons contiennent ${packs} boîtes ?`, instruction: 'Chaque boîte contient exactement la même quantité.', expected: String(each * packs), explanation: `${packs} boîtes de ${each} crayons font ${packs * each} crayons.`, visual: { kind: 'proportion', each, packs } });
    }
  }
}

export function normalizeAnswer(raw: string): string {
  const value = raw.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
  // 03 et 3, ou 0,50 et 0.5, sont équivalents.
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return String(Number(value));
  return value;
}

export function checkAnswer(input: string, expected: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(expected);
}

/** En mode « Sans aide », les données nécessaires restent dans l'énoncé.
 * On retire uniquement les illustrations, jamais les informations du problème. */
export function exercisePromptForMode(exercise: Exercise, mode: 'concrete' | 'visual' | 'symbolic'): string {
  if (mode !== 'symbolic') return exercise.question;
  const v = exercise.visual;
  switch (v.kind) {
    case 'base10':
      return `Quel nombre forment ${v.hundreds} centaines, ${v.tens} dizaines et ${v.ones} unités ?`;
    case 'decimal':
      return `Écris en nombre décimal : ${v.hundredths} centièmes.`;
    case 'fractions':
      if (!v.second) return `Une tablette est partagée en ${v.first[1]} parts égales. ${v.first[0]} parts sont mangées. Quelle fraction a été mangée ?`;
      return exercise.question;
    case 'chart':
      return `${v.labels.map((label, i) => `${label} : ${v.values[i]} livres`).join(' ; ')}. ${exercise.question}`;
    default:
      return exercise.question;
  }
}

export function exerciseInstructionForMode(exercise: Exercise, mode: 'concrete' | 'visual' | 'symbolic'): string {
  if (mode !== 'symbolic') return exercise.instruction;
  return 'Tu peux réfléchir directement avec les nombres. Si tu bloques, change de mode pour retrouver les objets ou le dessin.';
}
