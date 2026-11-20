import { useState } from 'react';
import type { Exercise, Visual } from '../lib/exercises';
import type { LearningMode } from '../lib/learning';

function Dots({ count, tone = 'coral' }: { count: number; tone?: string }) {
  return <div className="dot-wrap" aria-label={`${count} jetons`}>
    {Array.from({ length: count }, (_, i) => <span key={i} className={`dot ${tone}`} />)}
  </div>;
}

function TenBlocks({ hundreds, tens, ones }: Extract<Visual, { kind: 'base10' }>) {
  return <div className="blocks-set">
    <div className="block-family"><span className="block-caption">Centaines</span><div className="block-items">
      {Array.from({ length: hundreds }, (_, i) => <span key={i} className="block-hundred"><span>100</span></span>)}
    </div></div>
    <div className="block-family"><span className="block-caption">Dizaines</span><div className="block-items">
      {Array.from({ length: tens }, (_, i) => <span key={i} className="block-ten">10</span>)}
    </div></div>
    <div className="block-family"><span className="block-caption">Unités</span><div className="block-items">
      {Array.from({ length: ones }, (_, i) => <span key={i} className="block-one" />)}
      {ones === 0 && <small>Aucune</small>}
    </div></div>
  </div>;
}

function FractionStrip({ numerator, denominator, title, clickable = false, onChange }: { numerator: number; denominator: number; title?: string; clickable?: boolean; onChange?: (count: number) => void }) {
  return <div className="fraction-strip-wrap">
    {title && <div className="fraction-label">{title}</div>}
    <div className="fraction-strip" role={clickable ? 'group' : 'img'} aria-label={`${numerator} parts colorées sur ${denominator}`}>
      {Array.from({ length: denominator }, (_, i) => clickable
        ? <button type="button" key={i} className={`fraction-piece ${i < numerator ? 'filled' : ''}`} aria-label={`Morceau ${i + 1}`} aria-pressed={i < numerator} onClick={() => onChange?.(i < numerator ? i : i + 1)} />
        : <span key={i} className={`fraction-piece ${i < numerator ? 'filled' : ''}`} />)}
    </div>
    {clickable && <span className="fraction-counter">Tu as colorié {numerator} morceau(x) sur {denominator}.</span>}
  </div>;
}

function NumberLine({ a, b, max }: Extract<Visual, { kind: 'numberline' }>) {
  const x = (n: number) => 32 + (n / max) * 516;
  return <svg className="numberline" viewBox="0 0 580 120" role="img" aria-label={`Droite graduée de 0 à ${max}, repères ${a} et ${b}`}>
    <line x1="32" x2="548" y1="55" y2="55" stroke="#65747a" strokeWidth="3" />
    {Array.from({ length: 11 }, (_, i) => <g key={i}>
      <line x1={32 + i * 51.6} x2={32 + i * 51.6} y1="49" y2="61" stroke="#65747a" strokeWidth="2" />
      <text x={32 + i * 51.6} y="83" fontSize="13" textAnchor="middle" fill="#59666d">{i * max / 10}</text>
    </g>)}
    {[{ n: a, color: '#8b6cc8', label: 'A' }, { n: b, color: '#df8a4d', label: 'B' }].map(({ n, color, label }) => <g key={label}>
      <circle cx={x(n)} cy="55" r="9" fill={color} stroke="white" strokeWidth="3" />
      <text x={x(n)} y="31" fontSize="18" textAnchor="middle" fontWeight="800" fill={color}>{n}</text>
    </g>)}
  </svg>;
}

function DecimalGrid({ hundredths }: Extract<Visual, { kind: 'decimal' }>) {
  return <div className="decimal-layout">
    <div className="decimal-grid" role="img" aria-label={`${hundredths} centièmes coloriés sur cent cases`}>
      {Array.from({ length: 100 }, (_, i) => <span key={i} className={i < hundredths ? 'on' : ''} />)}
    </div>
    <div className="visual-tip"><strong>100</strong> cases au total.<p>Une ligne complète = 10 centièmes = 1 dixième.</p></div>
  </div>;
}

function ShareCounters({ total, groups, interactive }: Extract<Visual, { kind: 'share' }> & { interactive: boolean }) {
  const [placed, setPlaced] = useState(0);
  const count = interactive ? placed : total;
  return <div className="share-area">
    <div className="share-buckets">{Array.from({ length: groups }, (_, i) => <div key={i} className="share-bucket">
      <span>Personne {i + 1}</span>
      <Dots count={Math.floor(count / groups) + (i < count % groups ? 1 : 0)} tone="teal" />
    </div>)}</div>
    {interactive && <div className="share-controls">
      <span>{total - placed} jeton(s) à distribuer</span>
      <button type="button" className="subtle-btn" onClick={() => setPlaced((n) => Math.min(total, n + 1))} disabled={placed >= total}>Distribuer 1 jeton</button>
      <button type="button" className="text-btn" onClick={() => setPlaced(0)}>Recommencer</button>
    </div>}
  </div>;
}

function MiniBarChart({ labels, values, targetIndex }: Extract<Visual, { kind: 'chart' }>) {
  const max = 10;
  return <div className="mini-chart" role="img" aria-label={labels.map((label, i) => `${label} : ${values[i]}`).join(', ')}>
    <div className="mini-chart-y">{[10, 8, 6, 4, 2, 0].map((n) => <span key={n}>{n}</span>)}</div>
    <div className="mini-chart-canvas">{values.map((value, i) => <div className="mini-chart-column" key={labels[i]}>
      <div className={`mini-chart-bar ${i === targetIndex ? 'highlight' : ''}`} style={{ height: `${value / max * 100}%` }} />
      <span>{labels[i]}</span>
    </div>)}</div>
  </div>;
}

export default function VisualAid({ exercise, mode }: { exercise: Exercise; mode: LearningMode }) {
  const v = exercise.visual;
  if (mode === 'symbolic') return <div className="no-visual">Tu essaies sans modèle. Si ça bloque, tu peux revenir à <strong>Observer</strong> ou <strong>Manipuler</strong>.</div>;
  const interactive = mode === 'concrete';
  return <div className="visual-aid" key={exercise.id}>
    {v.kind === 'base10' && <TenBlocks {...v} />}
    {v.kind === 'numberline' && <NumberLine {...v} />}
    {v.kind === 'decimal' && <DecimalGrid {...v} />}
    {v.kind === 'add' && <div className="visual-two-groups">
      <div className="visual-group"><strong>Premier groupe · {v.a}</strong><TenBlocks hundreds={0} tens={Math.floor(v.a / 10)} ones={v.a % 10} /></div>
      <span className="operator-plus">+</span>
      <div className="visual-group"><strong>Deuxième groupe · {v.b}</strong><TenBlocks hundreds={0} tens={Math.floor(v.b / 10)} ones={v.b % 10} /></div>
    </div>}
    {v.kind === 'array' && <div className="array-wrap">
      <div className="array-grid" style={{ gridTemplateColumns: `repeat(${v.columns}, 32px)` }}>
        {Array.from({ length: v.rows * v.columns }, (_, i) => <span className="array-dot" key={i} />)}
      </div><div><strong>{v.rows} rangées</strong><p>Chaque rangée contient {v.columns} points.</p></div>
    </div>}
    {v.kind === 'share' && <ShareCounters {...v} interactive={interactive} />}
    {v.kind === 'fractions' && <div className="fractions-exercise">
      <FractionStrip numerator={v.first[0]} denominator={v.first[1]} title={v.second ? 'Tablette A' : 'La tablette'} clickable={false} />
      {v.second && <FractionStrip numerator={v.second[0]} denominator={v.second[1]} title="Tablette B" />}
      {interactive && <div className="fraction-play-note">Astuce : un morceau est une part égale de la tablette. Compare les longueurs colorées.</div>}
    </div>}
    {v.kind === 'length' && <div className="length-visual">
      {Array.from({ length: v.meters }, (_, i) => <div className="meter-block" key={i}><span>1 m</span><small>100 cm</small></div>)}
      <div className="centimeter-block" style={{ width: `${Math.max(55, v.centimeters * 1.3)}px` }}><span>{v.centimeters} cm</span></div>
    </div>}
    {v.kind === 'money' && <div className="purchase-items">
      {Array.from({ length: v.count }, (_, i) => <div className="purchase-card" key={i}><span className="purchase-icon">📓</span><span>{v.price} €</span></div>)}
    </div>}
    {v.kind === 'chart' && <MiniBarChart {...v} />}
    {v.kind === 'proportion' && <div className="purchase-items">
      {Array.from({ length: v.packs }, (_, i) => <div className="pencil-pack" key={i}><span>✏️</span><span>{v.each} crayons</span></div>)}
    </div>}
    <div className="visual-legend">{interactive ? 'Mode Manipuler : observe et utilise les objets pour raisonner.' : 'Mode Observer : les objets t’aident à préparer le calcul.'}</div>
  </div>;
}

export function BaseTenLab() {
  const [h, setH] = useState(2), [t, setT] = useState(3), [o, setO] = useState(4);
  return <div className="lab-content">
    <div className="lab-stats"><span className="eyebrow">Le nombre que tu construis</span><strong>{h * 100 + t * 10 + o}</strong><p>{h} × 100 + {t} × 10 + {o}</p></div>
    <TenBlocks hundreds={h} tens={t} ones={o} />
    <div className="lab-controls">
      {[{ label: 'Centaines', value: h, setter: setH, max: 5 }, { label: 'Dizaines', value: t, setter: setT, max: 9 }, { label: 'Unités', value: o, setter: setO, max: 9 }].map((item) => <label key={item.label} className="lab-control">
        <span>{item.label} : <strong>{item.value}</strong></span>
        <input type="range" min="0" max={item.max} value={item.value} onChange={(e) => item.setter(Number(e.target.value))} />
      </label>)}
    </div>
  </div>;
}

export function FractionsLab() {
  const [denominator, setDenominator] = useState(4), [numerator, setNumerator] = useState(2);
  return <div className="lab-content">
    <div className="lab-stats"><span className="eyebrow">La fraction que tu construis</span><strong>{numerator}/{denominator}</strong><p>{numerator} morceau(x) sur {denominator}</p></div>
    <FractionStrip numerator={numerator} denominator={denominator} title="Ta tablette de chocolat" clickable onChange={setNumerator} />
    <div className="lab-controls">
      <label className="lab-control"><span>Nombre de parts égales : <strong>{denominator}</strong></span>
        <select value={denominator} onChange={(e) => { setDenominator(Number(e.target.value)); setNumerator(0); }}>
          {[2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} parts</option>)}
        </select>
      </label>
      <label className="lab-control"><span>Nombre de parts colorées au départ : <strong>{numerator}</strong></span>
        <input type="range" min="0" max={denominator} value={numerator} onChange={(e) => setNumerator(Number(e.target.value))} />
      </label>
    </div>
    <p className="help-text">Tu peux aussi cliquer directement sur les morceaux pour les colorier ou les effacer. La bande est un outil d'exploration : aucun résultat n'est noté.</p>
  </div>;
}

export function MultiplicationLab() {
  const [rows, setRows] = useState(3), [columns, setColumns] = useState(4);
  return <div className="lab-content">
    <div className="lab-stats"><span className="eyebrow">Ce que tu viens de construire</span><strong>{rows} × {columns} = {rows * columns}</strong><p>{rows} groupe(s) de {columns} jetons</p></div>
    <div className="array-grid array-lab" style={{ gridTemplateColumns: `repeat(${columns}, 32px)` }}>
      {Array.from({ length: rows * columns }, (_, i) => <span className="array-dot" key={i} />)}
    </div>
    <div className="lab-controls">
      {[{ label: 'Nombre de rangées', value: rows, setter: setRows }, { label: 'Points par rangée', value: columns, setter: setColumns }].map((item) => <label className="lab-control" key={item.label}>
        <span>{item.label} : <strong>{item.value}</strong></span>
        <input type="range" min="1" max="8" value={item.value} onChange={(e) => item.setter(Number(e.target.value))} />
      </label>)}
    </div>
  </div>;
}
