import { AREA_META, AREA_IDS, SKILLS, type SkillId } from '../data/curriculum';
import { areaLevel, skillHistory, skillLevel, type Attempt } from '../lib/learning';

export function AreaBars({ attempts }: { attempts: Attempt[] }) {
  return <div className="area-bars">
    {AREA_IDS.map((id) => {
      const area = AREA_META[id]; const level = areaLevel(attempts, id);
      return <div className="area-bar-row" key={id}>
        <div className="area-bar-name"><span>{area.emoji} {area.title}</span><strong>{level} %</strong></div>
        <div className="bar-track"><span className="bar-fill" style={{ width: `${level}%`, background: area.color }} /></div>
      </div>;
    })}
  </div>;
}

const STATES = ['À découvrir', 'Avec des objets', 'Avec un dessin', 'Sans aide', 'Consolidé'];

export function LearningCurve({ attempts, skillId }: { attempts: Attempt[]; skillId: SkillId }) {
  const history = skillHistory(attempts, skillId);
  const samples = history.slice(-24);
  const w = 600, h = 225, left = 48, right = 26, top = 24, bottom = 42;
  const cw = w - left - right, ch = h - top - bottom;
  const y = (value: number) => top + ch - (value / 4) * ch;
  const x = (index: number) => left + (samples.length <= 1 ? cw / 2 : index * cw / (samples.length - 1));
  const points = samples.map((row, index) => `${x(index)},${y(row.level)}`).join(' ');
  return <div className="curve-wrap">
    <svg viewBox={`0 0 ${w} ${h}`} className="learning-chart" role="img" aria-label={samples.length ? `Courbe de progression, niveau actuel ${skillLevel(attempts, skillId)} sur 4 après ${history.length} tentative(s).` : 'Aucune tentative enregistrée pour le moment.'}>
      {[0, 1, 2, 3, 4].map((n) => <g key={n}>
        <line x1={left} x2={w - right} y1={y(n)} y2={y(n)} stroke="#dde5e5" strokeDasharray="5 5" />
        <text x={left - 15} y={y(n) + 5} textAnchor="middle" fill="#7d8789" fontSize="14">{n}</text>
      </g>)}
      <text x={w / 2} y={h - 6} textAnchor="middle" fill="#7d8789" fontSize="13">Tentatives (de gauche à droite)</text>
      {samples.length > 1 && <polyline fill="none" stroke="#6e5ad9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} />}
      {samples.map((row, i) => <circle key={i} cx={x(i)} cy={y(row.level)} r="6" fill="#6e5ad9" stroke="white" strokeWidth="3"><title>{`Tentative ${history.length - samples.length + i + 1}, niveau ${row.level} : ${new Date(row.date).toLocaleDateString('fr-FR')}`}</title></circle>)}
      {!samples.length && <text x={w / 2} y={h / 2} textAnchor="middle" fill="#818e92" fontSize="18">La courbe commencera au premier exercice</text>}
    </svg>
    <div className="chart-level-labels">{STATES.map((label, i) => <span key={label}><b>{i}</b> {label}</span>)}</div>
  </div>;
}

export function SkillProgressList({ attempts, onPractice }: { attempts: Attempt[]; onPractice: (id: SkillId) => void }) {
  return <div className="skills-compact-list">{SKILLS.map((skill) => {
    const level = skillLevel(attempts, skill.id);
    return <button className="skill-compact" type="button" key={skill.id} onClick={() => onPractice(skill.id)}>
      <span className="skill-compact-name"><strong>{skill.title}</strong><small>{skill.schoolLevel} · {AREA_META[skill.area].title}</small></span>
      <span className="skill-dots" aria-label={`Niveau ${level} sur 4`}>
        {[1, 2, 3, 4].map((n) => <i key={n} className={n <= level ? 'filled' : ''} />)}
      </span>
    </button>;
  })}</div>;
}
