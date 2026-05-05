import React, { useCallback, useMemo, useState } from 'react';
import Range from "./Range";
import './App.css';
import {
  WEIGHTS, ZERO_SCORES, MAX_SCORE,
  computeVerdict, rulePrefix,
  type CriterionKey, type Scores, type QualityTier,
} from './scoring';

// ── Criteria groups ───────────────────────────────────────────
const GROUPS = [
  {
    id: 'core', title: 'Core Attributes',
    items: [
      { key: 'joy'           as CriterionKey, label: 'Joy',            desc: 'Does it genuinely delight you?' },
      { key: 'engagement'    as CriterionKey, label: 'Engagement',     desc: 'How often do you use or interact with it?' },
      { key: 'repeatedValue' as CriterionKey, label: 'Repeated Value', desc: 'Does it offer something new each time?' },
    ],
  },
  {
    id: 'personal', title: 'Sentimental Stats',
    items: [
      { key: 'identity'    as CriterionKey, label: 'Identity',     desc: 'Is it part of who you are?' },
      { key: 'nostalgia'   as CriterionKey, label: 'Nostalgia',    desc: 'Personal memories tied to it' },
      { key: 'socialValue' as CriterionKey, label: 'Social Value', desc: 'Does it connect you with others?' },
    ],
  },
  {
    id: 'contextual', title: 'Item Properties',
    items: [
      { key: 'merit'          as CriterionKey, label: 'Merit',          desc: 'Is it well-made or culturally significant?' },
      { key: 'replaceability' as CriterionKey, label: 'Replaceability', desc: 'How hard would it be to get back?' },
    ],
  },
];

// ── UI mappings ───────────────────────────────────────────────
const TIER_CSS: Record<QualityTier, string> = {
  LEGENDARY: 'tier-legendary',
  EPIC:      'tier-epic',
  RARE:      'tier-rare',
  UNCOMMON:  'tier-uncommon',
  COMMON:    'tier-common',
  JUNK:      'tier-junk',
};

// Score fill color per tier
const TIER_COLOR: Record<QualityTier, string> = {
  LEGENDARY: '#ff8c00',
  EPIC:      '#b06aff',
  RARE:      '#4d9eff',
  UNCOMMON:  '#3dcc6e',
  COMMON:    '#9aabb8',
  JUNK:      '#4a5568',
};

// ── Component ─────────────────────────────────────────────────
const App = () => {
  const [scores, setScores] = useState<Scores>(ZERO_SCORES);

  const setScore = useCallback((key: CriterionKey) => (value: number) =>
    setScores(prev => ({ ...prev, [key]: value })), []);

  const verdict = useMemo(() => computeVerdict(scores), [scores]);
  const reset   = () => setScores(ZERO_SCORES);

  const scorePercent = Math.min(100, (verdict.weightedTotal / MAX_SCORE) * 100);
  const tierColor    = TIER_COLOR[verdict.tier];
  const ruleTag      = rulePrefix(verdict.rule);

  return (
    <div className="page">
      <div className="game-panel">
        <span className="corner corner-tl" aria-hidden="true" />
        <span className="corner corner-tr" aria-hidden="true" />
        <span className="corner corner-bl" aria-hidden="true" />
        <span className="corner corner-br" aria-hidden="true" />

        <header className="game-header">
          <div className="header-rule"><div className="header-diamond" /></div>
          <h1 className="game-title">Item Appraisal</h1>
          <p className="game-subtitle">Object Evaluation System</p>
          <div className="header-rule"><div className="header-diamond" /></div>
        </header>

        <main>
          {GROUPS.map(({ id, title, items }) => (
            <section className="criteria-section" key={id}>
              <div className="section-heading">
                <div className="section-diamond" />
                <span className="section-title">{title}</span>
                <div className="section-line" />
              </div>
              {items.map(({ key, label, desc }) => (
                <div className="criterion-row" key={key} data-testid={`criterion-${key}`}>
                  <div className="criterion-meta">
                    <div className="criterion-label">{label}</div>
                    <div className="criterion-desc">{desc}</div>
                  </div>
                  <span className="weight-badge">×{WEIGHTS[key]}</span>
                  <Range value={scores[key]} setValue={setScore(key)} />
                </div>
              ))}
            </section>
          ))}

          <section className="score-section">
            <div className="section-heading">
              <div className="section-diamond" />
              <span className="section-title">Power Level</span>
              <div className="section-line" />
            </div>
            <div className="score-display">
              <div className="score-track-wrap">
                <div className="score-track">
                  <div
                    className="score-fill"
                    style={{
                      width: `${scorePercent}%`,
                      background: `linear-gradient(to right, ${tierColor}55, ${tierColor})`,
                    }}
                  />
                </div>
              </div>
              <div className="score-readout">
                <div className="score-number">{verdict.weightedTotal}</div>
                <div className="score-denom">/ {MAX_SCORE}</div>
              </div>
            </div>
          </section>
        </main>

        <div className="verdict-divider">
          <span className="verdict-divider-text">◈ Quality Assessment ◈</span>
        </div>

        <div className="verdict-section">
          <div
            key={verdict.tier}
            className={`verdict-tier ${TIER_CSS[verdict.tier]}`}
          >
            {verdict.tier.charAt(0) + verdict.tier.slice(1).toLowerCase()}
          </div>

          <div
            key={`action-${verdict.keep}`}
            className={`verdict-action ${verdict.keep ? 'keep' : 'discard'}`}
          >
            {verdict.keep ? '◆  Retain  ◆' : '◇  Discard  ◇'}
          </div>

          <p key={verdict.why} className="verdict-why">
            {ruleTag && <span className="verdict-why-rule">{ruleTag}</span>}
            {verdict.why}
          </p>

          <button className="reset-btn" onClick={reset}>⟳  Reset</button>
        </div>
      </div>
    </div>
  );
};

export default App;
