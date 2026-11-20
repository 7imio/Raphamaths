import { SKILLS, type SkillId, type AreaId } from '../data/curriculum';

export type LearningMode = 'concrete' | 'visual' | 'symbolic';
export type Attempt = {
  id: string;
  skillId: SkillId;
  exerciseId: string;
  mode: LearningMode;
  success: boolean;
  hintsUsed: number;
  answer: string;
  expected: string;
  createdAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const ordered = (rows: Attempt[]) => [...rows].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

/**
 * 0 = à découvrir ; 1 = réussi en manipulant ; 2 = réussi avec un visuel ;
 * 3 = réussi sans aide ; 4 = confirmé sans aide un autre jour (> 24 h).
 * Un échec ne fait pas baisser le niveau historique ; la recommandation tient
 * compte de l'inactivité et des erreurs récentes séparément.
 */
export function skillLevel(rows: Attempt[], skillId: SkillId): number {
  const successes = ordered(rows).filter((a) => a.skillId === skillId && a.success && a.hintsUsed === 0);
  if (!successes.length) return 0;
  const concrete = successes.some((a) => a.mode === 'concrete');
  const visual = successes.some((a) => a.mode === 'visual');
  const symbolic = successes.filter((a) => a.mode === 'symbolic');
  // On ne peut pas sauter les étapes : chaque représentation a son intérêt.
  if (!concrete) return 0;
  if (!visual) return 1;
  if (!symbolic.length) return 2;
  if (symbolic.some((a) => Date.parse(a.createdAt) - Date.parse(symbolic[0].createdAt) >= DAY_MS)) return 4;
  return 3;
}

export function skillHistory(rows: Attempt[], skillId: SkillId) {
  const related = ordered(rows).filter((a) => a.skillId === skillId);
  return related.map((_, i) => ({
    label: `${i + 1}`,
    level: skillLevel(related.slice(0, i + 1), skillId),
    date: related[i].createdAt,
  }));
}

export function areaLevel(rows: Attempt[], area: AreaId) {
  const relevant = SKILLS.filter((s) => s.area === area);
  const total = relevant.reduce((acc, skill) => acc + skillLevel(rows, skill.id), 0);
  return Math.round((total / (relevant.length * 4)) * 100);
}

export function nextMode(rows: Attempt[], id: SkillId): LearningMode {
  const level = skillLevel(rows, id);
  if (level === 0) return 'concrete';
  if (level === 1) return 'visual';
  return 'symbolic';
}

export function recommendSkill(rows: Attempt[]): SkillId {
  // D'abord les prérequis. Les erreurs récentes et les révisions en retard
  // font remonter une notion, mais aucune compétence n'est inaccessible.
  const now = Date.now();
  const scores = SKILLS.map((skill, index) => {
    const level = skillLevel(rows, skill.id);
    const related = ordered(rows).filter((a) => a.skillId === skill.id);
    const last = related.at(-1);
    const daysAgo = last ? (now - Date.parse(last.createdAt)) / DAY_MS : Infinity;
    const prereqMissing = skill.prerequisites.some((id) => skillLevel(rows, id) < 2);
    let score = 20 - level * 4 - index * 0.15;
    if (prereqMissing) score -= 30;
    if (last && !last.success) score += 3;
    if (level >= 3 && daysAgo >= 7) score += 14;
    if (level === 4 && daysAgo < 7) score -= 30;
    if (!last && !prereqMissing) score += 5;
    return { id: skill.id, score };
  });
  return scores.sort((a, b) => b.score - a.score)[0].id;
}

export function countActiveDays(rows: Attempt[]): number {
  return new Set(rows.map((a) => a.createdAt.slice(0, 10))).size;
}
