export const WEIGHTS = {
  joy:            3,
  engagement:     2,
  repeatedValue:  2,
  identity:       2,
  nostalgia:      1,
  socialValue:    1,
  merit:          1,
  replaceability: 1,
} as const;

export type CriterionKey = keyof typeof WEIGHTS;
export type Scores = Record<CriterionKey, number>;

export const ZERO_SCORES: Scores = {
  joy: 0, engagement: 0, repeatedValue: 0,
  identity: 0, nostalgia: 0, socialValue: 0,
  merit: 0, replaceability: 0,
};

export const MAX_SCORE           = (Object.values(WEIGHTS) as number[]).reduce((a, b) => a + b, 0) * 10; // 130
export const KEEP_THRESHOLD      = 62;
export const AMPLIFIER_MIN_BASE  = 50;
export const AMPLIFIER_MIN_REPL  = 7;
export const HARD_KEEP_JOY       = 9;
export const HARD_DISCARD_JOY    = 3;
export const HARD_DISCARD_ENGAGE = 3;

export type QualityTier = 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON' | 'JUNK';
export type VerdictRule = 'hard-discard' | 'hard-keep' | 'amplifier' | 'score-keep' | 'score-discard';

export interface Verdict {
  keep: boolean;
  rule: VerdictRule;
  why: string;
  weightedTotal: number;
  tier: QualityTier;
}

export function computeTier(rule: VerdictRule, keep: boolean, score: number): QualityTier {
  if (rule === 'hard-keep' || score >= 112) return 'LEGENDARY';
  if (rule === 'hard-discard')              return 'JUNK';
  if (!keep)        return score < 38 ? 'JUNK' : 'COMMON';
  if (score >= 96)  return 'EPIC';
  if (score >= 78)  return 'RARE';
  return 'UNCOMMON';
}

export function computeVerdict(scores: Scores): Verdict {
  const w = (key: CriterionKey) => scores[key] * WEIGHTS[key];
  const weightedTotal = (Object.keys(WEIGHTS) as CriterionKey[]).reduce((sum, key) => sum + w(key), 0);

  let rule: VerdictRule;
  let keep: boolean;
  let why: string;

  if (scores.joy <= HARD_DISCARD_JOY && scores.engagement <= HARD_DISCARD_ENGAGE) {
    rule = 'hard-discard'; keep = false;
    why  = "No love and no engagement — letting go is the right call.";
  } else if (scores.joy >= HARD_KEEP_JOY) {
    rule = 'hard-keep'; keep = true;
    why  = `Joy rated ${scores.joy}/10 — you genuinely love this. Keep it.`;
  } else if (weightedTotal < KEEP_THRESHOLD && weightedTotal >= AMPLIFIER_MIN_BASE && scores.replaceability >= AMPLIFIER_MIN_REPL) {
    rule = 'amplifier'; keep = true;
    why  = "Borderline score, but this is genuinely hard to replace — worth holding onto.";
  } else if (weightedTotal >= KEEP_THRESHOLD) {
    rule = 'score-keep'; keep = true;
    const coreTotal      = w('joy') + w('engagement') + w('repeatedValue');
    const emotionalTotal = w('identity') + w('nostalgia') + w('socialValue');
    if (coreTotal >= 42)           why = "Strong engagement and enjoyment — this earns its place.";
    else if (emotionalTotal >= 24) why = "Deep personal significance carries this one.";
    else                           why = "Solid overall score — a well-rounded case for keeping it.";
  } else {
    rule = 'score-discard'; keep = false;
    const margin = KEEP_THRESHOLD - weightedTotal;
    why = margin <= 12
      ? "Just below the threshold — ask yourself if the engagement is really there."
      : "Scores don't make the case for keeping this one.";
  }

  const tier = computeTier(rule, keep, weightedTotal);
  return { keep, rule, why, weightedTotal, tier };
}

export function rulePrefix(rule: VerdictRule): string {
  if (rule === 'hard-keep' || rule === 'hard-discard') return 'Override — ';
  if (rule === 'amplifier') return 'Amplifier — ';
  return '';
}
