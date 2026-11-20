import { createClient } from '@supabase/supabase-js';
import type { Attempt } from './learning';
import type { SkillId } from '../data/curriculum';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const email = import.meta.env.VITE_APP_LOGIN_EMAIL?.trim();
export const APP_USERNAME = import.meta.env.VITE_APP_LOGIN_USERNAME?.trim() || 'Raph2pl';
export const demoMode = !url && !key && !email;
export const configError = !demoMode && (!url || !key || !email)
  ? 'Configuration Supabase incomplète : vérifie ton fichier .env.local.'
  : null;

export const supabase = !demoMode && !configError
  ? createClient(url!, key!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null;

const LOCAL_KEY = 'raphamaths_demo_attempts_v1';
const parseAttempt = (r: Record<string, unknown>): Attempt => ({
  id: String(r.id),
  skillId: String(r.skill_id) as SkillId,
  exerciseId: String(r.exercise_id),
  mode: r.mode as Attempt['mode'],
  success: Boolean(r.success),
  hintsUsed: Number(r.hints_used),
  answer: String(r.answer_input ?? ''),
  expected: String(r.expected_answer ?? ''),
  createdAt: String(r.created_at),
});

export function getDemoAttempts(): Attempt[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as Attempt[]) : [];
  } catch { return []; }
}

export function clearDemoAttempts() {
  localStorage.removeItem(LOCAL_KEY);
}

export async function isAllowedUser(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.from('app_access').select('user_id').limit(1).maybeSingle();
  if (error) throw error;
  return Boolean(data?.user_id);
}

export async function getAttempts(): Promise<Attempt[]> {
  if (!supabase) return getDemoAttempts();
  const all: Attempt[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from('attempts')
      .select('id,skill_id,exercise_id,mode,success,hints_used,answer_input,expected_answer,created_at')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data ?? []).map(parseAttempt));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

export async function saveAttempt(attempt: Attempt): Promise<void> {
  if (!supabase) {
    const updated = [...getDemoAttempts(), attempt];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    return;
  }
  const { error } = await supabase.from('attempts').insert({
    id: attempt.id,
    skill_id: attempt.skillId,
    exercise_id: attempt.exerciseId,
    mode: attempt.mode,
    success: attempt.success,
    hints_used: attempt.hintsUsed,
    answer_input: attempt.answer,
    expected_answer: attempt.expected,
    created_at: attempt.createdAt,
  });
  if (error) throw error;
}
