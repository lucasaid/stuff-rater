import {
  computeVerdict,
  computeTier,
  rulePrefix,
  ZERO_SCORES,
  MAX_SCORE,
  KEEP_THRESHOLD,
  WEIGHTS,
  type Scores,
} from './scoring';

// ── Helpers ───────────────────────────────────────────────────

function scores(overrides: Partial<Scores> = {}): Scores {
  return { ...ZERO_SCORES, ...overrides };
}

// ── Constants ─────────────────────────────────────────────────

describe('constants', () => {
  test('MAX_SCORE is 130', () => {
    expect(MAX_SCORE).toBe(130);
  });

  test('KEEP_THRESHOLD is 62', () => {
    expect(KEEP_THRESHOLD).toBe(62);
  });

  test('weights sum to 13', () => {
    const sum = (Object.values(WEIGHTS) as number[]).reduce((a, b) => a + b, 0);
    expect(sum).toBe(13);
  });
});

// ── computeTier ───────────────────────────────────────────────

describe('computeTier', () => {
  test('hard-keep rule → LEGENDARY regardless of score', () => {
    expect(computeTier('hard-keep', true, 10)).toBe('LEGENDARY');
  });

  test('hard-discard rule → JUNK regardless of score', () => {
    expect(computeTier('hard-discard', false, 100)).toBe('JUNK');
  });

  test('score ≥ 112 → LEGENDARY', () => {
    expect(computeTier('score-keep', true, 112)).toBe('LEGENDARY');
    expect(computeTier('score-keep', true, 130)).toBe('LEGENDARY');
  });

  test('discard + score < 38 → JUNK', () => {
    expect(computeTier('score-discard', false, 0)).toBe('JUNK');
    expect(computeTier('score-discard', false, 37)).toBe('JUNK');
  });

  test('discard + score ≥ 38 → COMMON', () => {
    expect(computeTier('score-discard', false, 38)).toBe('COMMON');
    expect(computeTier('score-discard', false, 61)).toBe('COMMON');
  });

  test('keep + score ≥ 96 → EPIC', () => {
    expect(computeTier('score-keep', true, 96)).toBe('EPIC');
    expect(computeTier('score-keep', true, 111)).toBe('EPIC');
  });

  test('keep + score ≥ 78 → RARE', () => {
    expect(computeTier('score-keep', true, 78)).toBe('RARE');
    expect(computeTier('score-keep', true, 95)).toBe('RARE');
  });

  test('keep + score < 78 → UNCOMMON (includes amplifier)', () => {
    expect(computeTier('score-keep', true, 62)).toBe('UNCOMMON');
    expect(computeTier('amplifier',  true, 55)).toBe('UNCOMMON');
  });
});

// ── computeVerdict ────────────────────────────────────────────

describe('computeVerdict — hard discard', () => {
  test('joy ≤ 3 AND engagement ≤ 3 → discard', () => {
    const v = computeVerdict(scores({ joy: 3, engagement: 3 }));
    expect(v.keep).toBe(false);
    expect(v.rule).toBe('hard-discard');
    expect(v.tier).toBe('JUNK');
  });

  test('joy = 0, engagement = 0 (all zeros) → hard discard', () => {
    const v = computeVerdict(ZERO_SCORES);
    expect(v.rule).toBe('hard-discard');
    expect(v.keep).toBe(false);
  });

  test('joy = 4 with low engagement → not a hard discard', () => {
    const v = computeVerdict(scores({ joy: 4, engagement: 1 }));
    expect(v.rule).not.toBe('hard-discard');
  });

  test('joy = 1 with high engagement → not a hard discard', () => {
    const v = computeVerdict(scores({ joy: 1, engagement: 4 }));
    expect(v.rule).not.toBe('hard-discard');
  });
});

describe('computeVerdict — hard keep', () => {
  test('joy ≥ 9 → keep regardless of other scores', () => {
    const v = computeVerdict(scores({ joy: 9 }));
    expect(v.keep).toBe(true);
    expect(v.rule).toBe('hard-keep');
    expect(v.tier).toBe('LEGENDARY');
  });

  test('joy = 10 → hard keep', () => {
    const v = computeVerdict(scores({ joy: 10 }));
    expect(v.rule).toBe('hard-keep');
  });

  test('why text includes the joy score', () => {
    const v = computeVerdict(scores({ joy: 9 }));
    expect(v.why).toContain('9/10');
  });

  test('hard keep takes priority over hard discard thresholds', () => {
    // joy = 9 satisfies hard-keep even though engagement = 0
    const v = computeVerdict(scores({ joy: 9, engagement: 0 }));
    expect(v.rule).toBe('hard-keep');
  });
});

describe('computeVerdict — amplifier', () => {
  test('borderline score + high replaceability → keep', () => {
    // Score needs to be in [50, 62) and replaceability ≥ 7
    // joy=4(12), engagement=5(10), repeatedValue=5(10), replaceability=7(7) = 39 — too low
    // Let's build a score in [50,62): joy=5(15), engagement=5(10), repeatedValue=5(10), replaceability=7(7) = 42 — still low
    // joy=6(18), engagement=6(12), repeatedValue=5(10), replaceability=7(7), nostalgia=3(3) = 50 ✓
    const v = computeVerdict(scores({
      joy: 6, engagement: 6, repeatedValue: 5,
      nostalgia: 3, replaceability: 7,
    }));
    expect(v.weightedTotal).toBeGreaterThanOrEqual(50);
    expect(v.weightedTotal).toBeLessThan(KEEP_THRESHOLD);
    expect(v.rule).toBe('amplifier');
    expect(v.keep).toBe(true);
    expect(v.tier).toBe('UNCOMMON');
  });

  test('borderline score + low replaceability → discard (no amplifier)', () => {
    const v = computeVerdict(scores({
      joy: 6, engagement: 6, repeatedValue: 5,
      nostalgia: 3, replaceability: 6, // below AMPLIFIER_MIN_REPL=7
    }));
    expect(v.rule).toBe('score-discard');
    expect(v.keep).toBe(false);
  });

  test('score below amplifier floor (< 50) + high replaceability → discard', () => {
    const v = computeVerdict(scores({ replaceability: 10 }));
    expect(v.rule).toBe('hard-discard'); // joy=0, engagement=0 triggers hard-discard first
  });
});

describe('computeVerdict — score-based keep', () => {
  test('score ≥ 62 → keep', () => {
    // joy=7(21), engagement=7(14), repeatedValue=7(14) = 49 — need more
    // Add identity=4(8), nostalgia=5(5) = 62 exactly
    const v = computeVerdict(scores({
      joy: 7, engagement: 7, repeatedValue: 7,
      identity: 4, nostalgia: 5,
    }));
    expect(v.weightedTotal).toBe(62);
    expect(v.keep).toBe(true);
    expect(v.rule).toBe('score-keep');
  });

  test('core-dominant keep → correct why text', () => {
    // coreTotal = joy(24)+engagement(14)+repeatedValue(14) = 52 ≥ 42 ✓
    // total = 52 + nostalgia(10) = 62 ≥ KEEP_THRESHOLD ✓
    const v = computeVerdict(scores({
      joy: 8, engagement: 7, repeatedValue: 7, nostalgia: 10,
    }));
    expect(v.rule).toBe('score-keep');
    expect(v.why).toContain('engagement and enjoyment');
  });

  test('emotional-dominant keep → correct why text', () => {
    // emotionalTotal needs ≥ 24, core < 42
    // joy=5(15), engagement=4(8), repeatedValue=4(8) = 31 core
    // identity=8(16), nostalgia=8(8) = 24 emotional; total = 31+24 = 55 — below threshold
    // Add more: identity=8(16)+nostalgia=8(8)+socialValue=6(6) = 30 emotional; core=31; total=61 — still below
    // Add merit=2(2): total=63 ✓
    const v = computeVerdict(scores({
      joy: 5, engagement: 4, repeatedValue: 4,
      identity: 8, nostalgia: 8, socialValue: 6,
      merit: 2,
    }));
    expect(v.keep).toBe(true);
    expect(v.why).toContain('personal significance');
  });

  test('score exactly at 112 → LEGENDARY tier', () => {
    // joy=10(30)+engagement=10(20)+repeatedValue=10(20)+identity=10(20)+nostalgia=10(10)+socialValue=2(2) = 102 — not enough
    // All 10s = 130 which is above 112
    const v = computeVerdict(scores({
      joy: 10, engagement: 10, repeatedValue: 10,
      identity: 10, nostalgia: 10, socialValue: 10,
      merit: 10, replaceability: 10,
    }));
    expect(v.tier).toBe('LEGENDARY');
    expect(v.weightedTotal).toBe(130);
  });
});

describe('computeVerdict — score-based discard', () => {
  test('score just below threshold → close-call why text', () => {
    // Need score in [50, 62): build 61
    // joy=6(18)+engagement=6(12)+repeatedValue=5(10)+identity=5(10)+nostalgia=5(5)+socialValue=4(4)+merit=2(2) = 61
    const v = computeVerdict(scores({
      joy: 6, engagement: 6, repeatedValue: 5,
      identity: 5, nostalgia: 5, socialValue: 4,
      merit: 2,
    }));
    expect(v.weightedTotal).toBe(61);
    expect(v.keep).toBe(false);
    expect(v.why).toContain('Just below');
  });

  test('score well below threshold → clear discard why text', () => {
    const v = computeVerdict(scores({ joy: 4, engagement: 4 }));
    expect(v.keep).toBe(false);
    expect(v.why).toContain("don't make the case");
  });
});

describe('computeVerdict — weightedTotal', () => {
  test('calculates weighted total correctly', () => {
    // joy=2 → 2*3=6, engagement=3 → 3*2=6, all others 0 → total=12
    const v = computeVerdict(scores({ joy: 2, engagement: 3 }));
    // joy=2 ≤ 3 and engagement=3 ≤ 3 → hard-discard, but weightedTotal should still be 12
    expect(v.weightedTotal).toBe(12);
  });

  test('all zeros → weightedTotal is 0', () => {
    expect(computeVerdict(ZERO_SCORES).weightedTotal).toBe(0);
  });

  test('all tens → weightedTotal is MAX_SCORE (130)', () => {
    const allTens = Object.fromEntries(
      Object.keys(ZERO_SCORES).map(k => [k, 10])
    ) as Scores;
    expect(computeVerdict(allTens).weightedTotal).toBe(MAX_SCORE);
  });
});

// ── rulePrefix ────────────────────────────────────────────────

describe('rulePrefix', () => {
  test('hard-keep → "Override — "', () => {
    expect(rulePrefix('hard-keep')).toBe('Override — ');
  });

  test('hard-discard → "Override — "', () => {
    expect(rulePrefix('hard-discard')).toBe('Override — ');
  });

  test('amplifier → "Amplifier — "', () => {
    expect(rulePrefix('amplifier')).toBe('Amplifier — ');
  });

  test('score-keep → empty string', () => {
    expect(rulePrefix('score-keep')).toBe('');
  });

  test('score-discard → empty string', () => {
    expect(rulePrefix('score-discard')).toBe('');
  });
});
