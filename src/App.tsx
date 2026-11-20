import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, BarChart3, BookOpen, Check, ChevronRight, Compass, Download, Eye, EyeOff, Heart, Lightbulb, LockKeyhole, LogOut, Menu, RotateCcw, Send, Sparkles, TrendingUp, WandSparkles } from 'lucide-react';
import { AREA_IDS, AREA_META, SKILLS, findSkill, type AreaId, type SkillId } from './data/curriculum';
import { createExercise, checkAnswer, exerciseInstructionForMode, exercisePromptForMode, type Exercise } from './lib/exercises';
import { countActiveDays, nextMode, recommendSkill, skillLevel, type Attempt, type LearningMode } from './lib/learning';
import { APP_USERNAME, clearDemoAttempts, configError, demoMode, getAttempts, getDemoAttempts, isAllowedUser, saveAttempt, supabase } from './lib/supabase';
import VisualAid, { BaseTenLab, FractionsLab, MultiplicationLab } from './components/VisualAid';
import { AreaBars, LearningCurve, SkillProgressList } from './components/ProgressCharts';

type Tab = 'home' | 'practice' | 'lab' | 'progress';
function exportAttemptsCsv(rows: Attempt[]) {
  const columns: (keyof Attempt)[] = ['createdAt', 'skillId', 'exerciseId', 'mode', 'success', 'hintsUsed', 'answer', 'expected'];
  const safeCell = (value: unknown) => {
    const text = String(value ?? '');
    // Empêche l'exécution de formules si ce CSV est ouvert dans un tableur.
    const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv = [columns.join(';'), ...rows.map((r) => columns.map((c) => safeCell(r[c])).join(';'))].join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `raphamaths-tentatives-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const MODE_INFO: Record<LearningMode, { title: string; subtitle: string }> = {
  concrete: { title: 'Manipuler', subtitle: 'J’utilise des objets' },
  visual: { title: 'Observer', subtitle: 'Je regarde un dessin' },
  symbolic: { title: 'Sans aide', subtitle: 'J’essaie avec les nombres' },
};

function AuthScreen({ onLogin }: { onLogin: () => Promise<void> }) {
  const [username, setUsername] = useState(APP_USERNAME);
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (username.trim().toLowerCase() !== APP_USERNAME.toLowerCase()) {
      setError('Identifiant ou mot de passe incorrect.'); return;
    }
    setBusy(true);
    try {
      const { error: authError } = await supabase!.auth.signInWithPassword({
        email: import.meta.env.VITE_APP_LOGIN_EMAIL,
        password,
      });
      if (authError) throw new Error('Identifiant ou mot de passe incorrect.');
      const allowed = await isAllowedUser();
      if (!allowed) {
        await supabase!.auth.signOut();
        throw new Error('Ce compte n’est pas encore autorisé. Vérifie la table app_access dans Supabase.');
      }
      await onLogin();
    } catch (e) { setError(e instanceof Error ? e.message : 'Connexion impossible.'); }
    finally { setBusy(false); }
  }
  return <div className="auth-bg"><main className="auth-card">
    <div className="logo-big"><span className="brand-mark">✳</span><span>rapha<span className="logo-accent">maths</span><small>les maths prennent forme</small></span></div>
    <div className="auth-art" aria-hidden="true"><span className="art-square">10</span><span className="art-circle">½</span><span className="art-triangle">+</span></div>
    <div className="eyebrow">TON ESPACE À TOI</div>
    <h1>Prête à explorer les maths ?</h1>
    <p>Tu avances à ton rythme. Ici, tu as le droit d'essayer, d'hésiter et de recommencer.</p>
    <form className="login-form" onSubmit={submit}>
      <label>Ton identifiant<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required /></label>
      <label>Ton mot de passe<div className="password-field"><input value={password} onChange={(e) => setPassword(e.target.value)} type={visible ? 'text' : 'password'} autoComplete="current-password" required /><button type="button" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setVisible((n) => !n)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary full" disabled={busy} type="submit"><LockKeyhole size={18} /> {busy ? 'Connexion…' : 'Entrer dans mon espace'} <ArrowRight size={18} /></button>
    </form>
    <p className="auth-footer">Les progrès restent privés et sont conservés dans ton espace.</p>
  </main></div>;
}

function Home({ attempts, onPractice, onTab }: { attempts: Attempt[]; onPractice: (id: SkillId) => void; onTab: (tab: Tab) => void }) {
  const suggestion = recommendSkill(attempts);
  const skill = findSkill(suggestion)!;
  const completed = SKILLS.filter((s) => skillLevel(attempts, s.id) >= 3).length;
  const countSuccesses = attempts.filter((a) => a.success).length;
  const reviews = attempts.length;
  const days = countActiveDays(attempts);
  return <div className="page-content">
    <div className="greeting"><div><div className="eyebrow greeting-eyebrow">TON PETIT COIN POUR APPRENDRE</div><h1>Bonjour, Raphaëlle <span className="greeting-sun">☀</span></h1><p>Chaque petit pas compte. Aujourd'hui, on avance ensemble !</p></div><div className="greeting-illustration" aria-hidden="true"><span className="floating shape1">⅓</span><span className="floating shape2">✦</span><span className="floating shape3">6</span></div></div>
    <section className="mission-card">
      <div className="mission-head"><span className="pill mission-pill"><Sparkles size={15} /> TA MISSION DU JOUR</span><span className="mission-time">À ton rythme · environ 10 min</span></div>
      <div className="mission-main"><div><h2>{skill.title}</h2><p>{skill.description} On va commencer par le mode qui te convient.</p><div className="mission-tag"><span>{AREA_META[skill.area].emoji}</span> {AREA_META[skill.area].title} · {skill.schoolLevel}</div></div><div className="mission-art" aria-hidden="true">{AREA_META[skill.area].emoji}</div></div>
      <button type="button" className="btn primary mission-btn" onClick={() => onPractice(suggestion)}>Commencer cette mission <ArrowRight size={18} /></button>
    </section>
    <section className="stats-row" aria-label="Statistiques personnelles">
      <div className="stat-box"><span className="stat-symbol purple"><BookOpen size={21} /></span><strong>{completed}<small> / {SKILLS.length}</small></strong><span>Compétences autonomes</span></div>
      <div className="stat-box"><span className="stat-symbol orange"><Check size={21} /></span><strong>{countSuccesses}</strong><span>Exercices réussis</span></div>
      <div className="stat-box"><span className="stat-symbol green"><TrendingUp size={21} /></span><strong>{days}</strong><span>Jours de pratique</span></div>
    </section>
    <div className="dashboard-grid">
      <section className="panel"><div className="section-title"><div><span className="eyebrow">À TON RYTHME</span><h2>Mes domaines</h2></div><button type="button" className="text-link" onClick={() => onTab('progress')}>Tout voir <ChevronRight size={18} /></button></div><AreaBars attempts={attempts} /></section>
      <section className="panel explore-promo"><div className="section-title"><div><span className="eyebrow">ESSAYER POUR COMPRENDRE</span><h2>L'atelier des découvertes</h2></div></div><div className="promo-shapes" aria-hidden="true"><div>100</div><div>½</div><div>×</div></div><p>Construis des nombres, découpe des fractions et joue avec les multiplications. Ici, il n'y a pas de note.</p><button className="btn secondary" type="button" onClick={() => onTab('lab')}>Entrer dans l'atelier <ArrowRight size={17} /></button></section>
    </div>
    {reviews === 0 && <div className="gentle-note"><Heart size={19} /><span>Pas encore de résultats ? C'est normal. Ton parcours commence au premier exercice, sans pression.</span></div>}
  </div>;
}

function Practice({ attempts, selectedSkill, onSkillChange, onSaved }: { attempts: Attempt[]; selectedSkill: SkillId; onSkillChange: (id: SkillId) => void; onSaved: (attempt: Attempt) => Promise<void> }) {
  const [exercise, setExercise] = useState<Exercise>(() => createExercise(selectedSkill));
  const [mode, setMode] = useState<LearningMode>(() => nextMode(attempts, selectedSkill));
  const [answer, setAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const skill = findSkill(selectedSkill)!;
  const level = skillLevel(attempts, selectedSkill);
  const count = attempts.filter((a) => a.skillId === selectedSkill).length;
  function fresh(id: SkillId = selectedSkill) {
    setExercise(createExercise(id)); setMode(nextMode(attempts, id));
    setAnswer(''); setHintsUsed(0); setFeedback(null); setError('');
  }
  function selectSkill(id: SkillId) { onSkillChange(id); fresh(id); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answer.trim() || busy || feedback === 'correct') return;
    setError(''); setBusy(true);
    const correct = checkAnswer(answer, exercise.expected);
    const newAttempt: Attempt = {
      id: crypto.randomUUID(), skillId: selectedSkill, exerciseId: exercise.id,
      mode, success: correct, hintsUsed, answer, expected: exercise.expected,
      createdAt: new Date().toISOString(),
    };
    try {
      await onSaved(newAttempt);
      setFeedback(correct ? 'correct' : 'incorrect');
      if (!correct) setHintsUsed((n) => n + 1);
    } catch (e) { setError(`Impossible d’enregistrer la réponse : ${e instanceof Error ? e.message : 'erreur inconnue'}. Réessaie.`); }
    finally { setBusy(false); }
  }
  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow">JE M'ENTRAÎNE</div><h1>À toi de jouer !</h1><p>Choisis une notion et avance à ton rythme.</p></div></div>
    <div className="practice-grid"><aside className="panel skill-picker"><h3>Les notions</h3><div className="picker-groups">
      {AREA_IDS.map((area) => <div key={area} className="picker-group"><div className="picker-heading">{AREA_META[area].emoji} {AREA_META[area].title}</div>
        {SKILLS.filter((s) => s.area === area).map((s) => <button type="button" key={s.id} className={`picker-item ${selectedSkill === s.id ? 'active' : ''}`} onClick={() => selectSkill(s.id)}><span>{s.title}</span><small>{skillLevel(attempts, s.id)}/4</small></button>)}
      </div>)}
    </div></aside>
    <div className="exercise-column"><article className="panel exercise-card">
      <div className="exercise-top"><span className="pill"><span>{AREA_META[skill.area].emoji}</span> {AREA_META[skill.area].title}</span><span className="attempts-count">{count} tentative(s) enregistrée(s)</span></div>
      <h2>{skill.title}</h2><p className="exercise-description">{skill.description}</p>
      <div className="mode-picker" role="group" aria-label="Choisir l'aide visuelle">
        {(Object.keys(MODE_INFO) as LearningMode[]).map((m) => <button type="button" key={m} aria-pressed={m === mode} className={m === mode ? 'selected' : ''} onClick={() => { setMode(m); setFeedback(null); setError(''); }}><span>{m === 'concrete' ? '🧱' : m === 'visual' ? '👀' : '✏️'} {MODE_INFO[m].title}</span><small>{MODE_INFO[m].subtitle}</small></button>)}
      </div>
      <div className="question-box"><div className="eyebrow">LE DÉFI</div><h3>{exercisePromptForMode(exercise, mode)}</h3><p>{exerciseInstructionForMode(exercise, mode)}</p></div>
      <VisualAid key={`${exercise.id}-${mode}`} exercise={exercise} mode={mode} />
      <form onSubmit={submit} className="answer-form"><label htmlFor="exercise-answer">Ta réponse</label><div className="answer-line"><input id="exercise-answer" name="answer" type="text" inputMode={exercise.expected.includes('/') ? 'text' : 'decimal'} autoComplete="off" spellCheck="false" placeholder={exercise.placeholder || 'Écris ta réponse ici'} value={answer} onChange={(e) => { setAnswer(e.target.value); if (feedback === 'incorrect') setFeedback(null); }} disabled={busy || feedback === 'correct'} /><button type="submit" className="btn primary" disabled={!answer.trim() || busy || feedback === 'correct'}><Send size={17} /> {busy ? 'Enregistrement…' : 'Vérifier'}</button></div></form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!feedback && <button type="button" className="hint-btn" onClick={() => setHintsUsed((n) => n + 1)}><Lightbulb size={17} /> J'ai besoin d'un indice</button>}
      {hintsUsed > 0 && !feedback && <div className="hint-box"><Lightbulb size={18} /><span>{hintsUsed === 1 ? `Regarde attentivement : ${exercise.instruction}` : exercise.explanation}</span></div>}
      {feedback === 'correct' && <div className="feedback good" role="status"><strong><Check size={19} /> Bien joué !</strong><p>{exercise.explanation}</p><span>Réponse enregistrée. Une réussite de plus dans ton parcours.</span></div>}
      {feedback === 'incorrect' && <div className="feedback retry" role="status"><strong><Lightbulb size={18} /> On cherche encore !</strong><p>Tu peux regarder les objets et essayer autrement. Ce n'est pas grave de se tromper.</p><button type="button" className="text-btn" onClick={() => setHintsUsed(2)}>Voir une explication</button>{hintsUsed >= 2 && <p className="correction-text">{exercise.explanation}</p>}</div>}
      <div className="exercise-footer"><span>Niveau acquis : <strong>{level}/4</strong></span><button type="button" className="btn secondary" onClick={() => fresh()}><RotateCcw size={16} /> Autre exercice</button></div>
    </article><section className="panel mini-curve-panel"><div className="section-title"><div><span className="eyebrow">LES PETITES VICTOIRES</span><h3>Ma progression sur cette notion</h3></div><span className="level-pill">{level} / 4</span></div><LearningCurve attempts={attempts} skillId={selectedSkill} /></section></div></div>
  </div>;
}

function Lab() {
  const [lab, setLab] = useState<'base10' | 'fractions' | 'mult'>('base10');
  return <div className="page-content"><div className="page-heading"><div><div className="eyebrow">MANIPULER POUR COMPRENDRE</div><h1>L'atelier des découvertes</h1><p>Ici, aucun test et aucune note. Tu peux expérimenter autant que tu veux.</p></div></div>
    <div className="lab-picker" role="group" aria-label="Choisir un atelier">
      <button type="button" aria-pressed={lab === 'base10'} className={lab === 'base10' ? 'active' : ''} onClick={() => setLab('base10')}>🧱 Fabrique des nombres</button>
      <button type="button" aria-pressed={lab === 'fractions'} className={lab === 'fractions' ? 'active' : ''} onClick={() => setLab('fractions')}>🍫 Découpe des fractions</button>
      <button type="button" aria-pressed={lab === 'mult'} className={lab === 'mult' ? 'active' : ''} onClick={() => setLab('mult')}>✴️ Construis des multiplications</button>
    </div>
    <section className="panel lab-panel"><div className="lab-header"><div><span className="pill"><WandSparkles size={14} /> ATELIER INTERACTIF</span><h2>{lab === 'base10' ? 'Les blocs de nombres' : lab === 'fractions' ? 'Les morceaux de chocolat' : 'Les groupes de jetons'}</h2><p>{lab === 'base10' ? 'Déplace les curseurs pour voir comment se construit un nombre.' : lab === 'fractions' ? 'Partage une tablette en morceaux égaux, puis colorie-les.' : 'Change le nombre de rangées et de colonnes pour comprendre la multiplication.'}</p></div><div className="lab-symbol" aria-hidden="true">{lab === 'base10' ? '10' : lab === 'fractions' ? '½' : '×'}</div></div>
      {lab === 'base10' && <BaseTenLab />}{lab === 'fractions' && <FractionsLab />}{lab === 'mult' && <MultiplicationLab />}
    </section>
  </div>;
}

function Progress({ attempts, onPractice }: { attempts: Attempt[]; onPractice: (id: SkillId) => void }) {
  const [area, setArea] = useState<AreaId>('numeration');
  const [skillId, setSkillId] = useState<SkillId>('base10');
  const [confirmReset, setConfirmReset] = useState(false);
  const total = SKILLS.reduce((n, s) => n + skillLevel(attempts, s.id), 0);
  function chooseArea(id: AreaId) {
    setArea(id); setSkillId(SKILLS.find((s) => s.area === id)!.id);
  }
  return <div className="page-content"><div className="page-heading"><div><div className="eyebrow">CHAQUE PETIT PAS COMPTE</div><h1>Mon chemin parcouru</h1><p>Voici ce que tu as déjà exploré et les notions que tu peux continuer à découvrir.</p></div></div>
    <div className="progress-summary"><div className="progress-ring" style={{ background: `conic-gradient(#6f5ace ${total / (SKILLS.length * 4) * 360}deg, #e9ece8 0)` }}><div><strong>{Math.round(total / (SKILLS.length * 4) * 100)}%</strong><small>du parcours</small></div></div><div><span className="eyebrow">UNE AVANCÉE À TON RYTHME</span><h2>{attempts.length ? 'Tu as déjà commencé à construire tes acquis !' : 'L’aventure commence ici !'}</h2><p>Tu n’as pas à tout savoir aujourd’hui. Chaque réussite compte, et chaque notion peut être reprise autant de fois que nécessaire.</p><div className="summary-bits"><span>{attempts.length} tentatives</span><span>{countActiveDays(attempts)} jours de pratique</span><span>{SKILLS.filter((s) => skillLevel(attempts, s.id) === 4).length} notions consolidées</span></div></div></div>
    <div className="dashboard-grid"><section className="panel"><div className="section-title"><div><span className="eyebrow">VUE D'ENSEMBLE</span><h2>Progression par domaine</h2></div></div><AreaBars attempts={attempts} /></section><section className="panel"><div className="section-title"><div><span className="eyebrow">TOUTES LES NOTIONS</span><h2>Carte des compétences</h2></div></div><SkillProgressList attempts={attempts} onPractice={onPractice} /></section></div>
    <section className="panel progress-detail"><div className="section-title"><div><span className="eyebrow">ZOOM SUR UNE NOTION</span><h2>Ma courbe de progression</h2></div></div>
      <div className="progress-selectors"><label>Domaine<select value={area} onChange={(e) => chooseArea(e.target.value as AreaId)}>{AREA_IDS.map((id) => <option value={id} key={id}>{AREA_META[id].title}</option>)}</select></label><label>Compétence<select value={skillId} onChange={(e) => setSkillId(e.target.value as SkillId)}>{SKILLS.filter((s) => s.area === area).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label></div>
      <LearningCurve attempts={attempts} skillId={skillId} /><div className="curve-footnote"><BarChart3 size={17} /><span>0 : à découvrir · 1 : avec objets · 2 : avec un dessin · 3 : sans aide · 4 : revu sans aide après au moins 24 h. Une erreur ne supprime pas les acquis déjà montrés.</span></div>
    </section>
    <section className="export-section"><div><strong>Garder une copie de ton parcours</strong><p>Exporte les tentatives au format CSV, par exemple pour conserver une sauvegarde sur ton ordinateur.</p></div><button type="button" className="btn secondary" disabled={!attempts.length} onClick={() => exportAttemptsCsv(attempts)}><Download size={17} /> Exporter mes données</button></section>
    {demoMode && <section className="demo-admin"><h3>Mode démo local</h3><p>Les résultats d'essai sont uniquement enregistrés dans ce navigateur, pas dans Supabase.</p>{confirmReset ? <div className="reset-controls"><span>Effacer toutes les tentatives de démonstration ?</span><button className="btn danger" type="button" onClick={() => { clearDemoAttempts(); window.location.reload(); }}>Oui, effacer</button><button className="btn secondary" type="button" onClick={() => setConfirmReset(false)}>Annuler</button></div> : <button type="button" className="text-btn" onClick={() => setConfirmReset(true)}>Remettre la démo à zéro</button>}</section>}
  </div>;
}

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [selectedSkill, setSelectedSkill] = useState<SkillId>('base10');
  const [attempts, setAttempts] = useState<Attempt[]>(() => demoMode ? getDemoAttempts() : []);
  const [auth, setAuth] = useState<'loading' | 'signedOut' | 'signedIn'>(demoMode ? 'signedIn' : 'loading');
  const [loadError, setLoadError] = useState('');
  const [bigText, setBigText] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const recommended = useMemo(() => recommendSkill(attempts), [attempts]);
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    async function initialize() {
      try {
        const { data, error } = await supabase!.auth.getSession();
        if (error) throw error;
        if (!data.session) { if (!cancelled) setAuth('signedOut'); return; }
        if (!(await isAllowedUser())) {
          await supabase!.auth.signOut();
          throw new Error('Ce compte n’a pas accès au parcours. Vérifie la table app_access.');
        }
        const rows = await getAttempts();
        if (!cancelled) { setAttempts(rows); setAuth('signedIn'); }
      } catch (e) { if (!cancelled) { setAuth('signedOut'); setLoadError(e instanceof Error ? e.message : 'Impossible de charger la session.'); } }
    }
    void initialize();
    return () => { cancelled = true; };
  }, []);
  async function onLogin() {
    const rows = await getAttempts();
    setAttempts(rows); setLoadError(''); setAuth('signedIn');
  }
  async function onSaved(attempt: Attempt) {
    await saveAttempt(attempt);
    setAttempts((prev) => [...prev, attempt]);
  }
  async function logout() {
    await supabase?.auth.signOut(); setAuth('signedOut'); setAttempts([]); setTab('home');
  }
  function practice(id: SkillId) { setSelectedSkill(id); setTab('practice'); setNavOpen(false); }
  function navigate(next: Tab) { setTab(next); setNavOpen(false); }
  if (configError) return <div className="config-error"><LockKeyhole size={32} /><h1>Configuration incomplète</h1><p>{configError}</p><p>Lis le fichier <code>README.md</code> fourni dans le projet.</p></div>;
  if (auth === 'loading') return <div className="loading-screen">Chargement de ton espace…</div>;
  if (auth === 'signedOut') return <><AuthScreen onLogin={onLogin} />{loadError && <p className="auth-global-error" role="alert">{loadError}</p>}</>;
  return <div className={`app-shell ${bigText ? 'large-text' : ''}`}>
    <header className="site-header"><div className="header-inner"><button className="brand" type="button" onClick={() => navigate('home')} aria-label="Accueil Raphamaths"><span className="brand-mark">✳</span><span>rapha<span className="logo-accent">maths</span></span></button>
      <nav className={`main-nav ${navOpen ? 'open' : ''}`} aria-label="Navigation principale">
        <button type="button" className={tab === 'home' ? 'active' : ''} onClick={() => navigate('home')}><Compass size={17} /> Mon accueil</button>
        <button type="button" className={tab === 'practice' ? 'active' : ''} onClick={() => practice(recommended)}><BookOpen size={17} /> Mes exercices</button>
        <button type="button" className={tab === 'lab' ? 'active' : ''} onClick={() => navigate('lab')}><WandSparkles size={17} /> L'atelier</button>
        <button type="button" className={tab === 'progress' ? 'active' : ''} onClick={() => navigate('progress')}><BarChart3 size={17} /> Ma progression</button>
      </nav>
      <div className="header-actions"><span className="mode-indicator" title={demoMode ? 'Sauvegarde locale dans ce navigateur' : 'Données sauvegardées sur Supabase'}>{demoMode ? '● Démo locale' : '● Synchronisé'}</span><button type="button" className="text-size-btn" aria-label="Agrandir ou réduire les textes" aria-pressed={bigText} onClick={() => setBigText((n) => !n)}>A<sup>+</sup></button>{!demoMode && <button type="button" className="logout-btn" onClick={() => void logout()} title="Se déconnecter" aria-label="Se déconnecter"><LogOut size={18} /></button>}<button className="mobile-menu" type="button" onClick={() => setNavOpen((n) => !n)} aria-label="Ouvrir le menu"><Menu size={22} /></button></div>
    </div></header>
    <main id="main-content">
      {tab === 'home' && <Home attempts={attempts} onPractice={practice} onTab={navigate} />}
      {tab === 'practice' && <Practice key={selectedSkill} attempts={attempts} selectedSkill={selectedSkill} onSkillChange={setSelectedSkill} onSaved={onSaved} />}
      {tab === 'lab' && <Lab />}
      {tab === 'progress' && <Progress attempts={attempts} onPractice={practice} />}
    </main>
    <footer className="site-footer"><div><span>✳</span> rapha<span className="logo-accent">maths</span></div><p>Tu as le droit de te tromper. C'est comme ça qu'on apprend. <Heart size={14} /></p><small>Version 0.1 · Un pas après l'autre</small></footer>
  </div>;
}

export default App;
