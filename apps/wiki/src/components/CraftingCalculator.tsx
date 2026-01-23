import { useState, useMemo } from 'react';

const DUST_COSTS: Record<string, number> = {
  common: 40,
  uncommon: 100,
  rare: 400,
  epic: 1600,
  legendary: 3200,
};

const DISENCHANT_VALUES: Record<string, number> = {
  common: 5,
  uncommon: 20,
  rare: 100,
  epic: 400,
  legendary: 1600,
};

const PRISMATIC_MULTIPLIER = 4;

interface CardCounts {
  common: number;
  uncommon: number;
  rare: number;
  epic: number;
  legendary: number;
}

export default function CraftingCalculator() {
  const [mode, setMode] = useState<'craft' | 'disenchant'>('craft');
  const [isPrismatic, setIsPrismatic] = useState(false);
  const [counts, setCounts] = useState<CardCounts>({
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  });

  const updateCount = (rarity: keyof CardCounts, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [rarity]: Math.max(0, prev[rarity] + delta),
    }));
  };

  const results = useMemo(() => {
    const values = mode === 'craft' ? DUST_COSTS : DISENCHANT_VALUES;
    const multiplier = isPrismatic ? PRISMATIC_MULTIPLIER : 1;

    let total = 0;
    const breakdown: { rarity: string; count: number; value: number }[] = [];

    Object.entries(counts).forEach(([rarity, count]) => {
      if (count > 0) {
        const value = values[rarity] * count * multiplier;
        total += value;
        breakdown.push({ rarity, count, value });
      }
    });

    return { total, breakdown };
  }, [counts, mode, isPrismatic]);

  const resetCounts = () => {
    setCounts({
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    });
  };

  const RARITY_COLORS: Record<string, string> = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
  };

  return (
    <div className="crafting-calculator">
      <div className="calc-header">
        <h3>Dust Calculator</h3>
        <div className="mode-toggle">
          <button
            className={mode === 'craft' ? 'active' : ''}
            onClick={() => setMode('craft')}
          >
            Craft Cost
          </button>
          <button
            className={mode === 'disenchant' ? 'active' : ''}
            onClick={() => setMode('disenchant')}
          >
            Disenchant Value
          </button>
        </div>
      </div>

      <div className="prismatic-toggle">
        <label>
          <input
            type="checkbox"
            checked={isPrismatic}
            onChange={(e) => setIsPrismatic(e.target.checked)}
          />
          <span>Prismatic cards (4x values)</span>
        </label>
      </div>

      <div className="rarity-inputs">
        {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map(
          (rarity) => {
            const baseValue =
              mode === 'craft' ? DUST_COSTS[rarity] : DISENCHANT_VALUES[rarity];
            const value = isPrismatic ? baseValue * PRISMATIC_MULTIPLIER : baseValue;

            return (
              <div key={rarity} className="rarity-row">
                <span
                  className="rarity-dot"
                  style={{ backgroundColor: RARITY_COLORS[rarity] }}
                />
                <span className="rarity-name">{rarity}</span>
                <span className="rarity-value">{value} each</span>
                <div className="count-controls">
                  <button onClick={() => updateCount(rarity, -1)}>−</button>
                  <span className="count">{counts[rarity]}</span>
                  <button onClick={() => updateCount(rarity, 1)}>+</button>
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="calc-results">
        <div className="total">
          <span className="total-label">
            Total {mode === 'craft' ? 'Cost' : 'Value'}
          </span>
          <span className="total-value">{results.total.toLocaleString()} Dust</span>
        </div>

        {results.breakdown.length > 0 && (
          <div className="breakdown">
            {results.breakdown.map(({ rarity, count, value }) => (
              <div key={rarity} className="breakdown-row">
                <span
                  className="rarity-dot"
                  style={{ backgroundColor: RARITY_COLORS[rarity] }}
                />
                <span>
                  {count}× {rarity}
                </span>
                <span className="breakdown-value">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="reset-btn" onClick={resetCounts}>
        Reset
      </button>

      <style>{`
        .crafting-calculator {
          background: var(--sl-color-gray-6);
          border-radius: 8px;
          padding: 1.5rem;
          max-width: 400px;
        }

        .calc-header {
          margin-bottom: 1rem;
        }

        .calc-header h3 {
          margin: 0 0 0.75rem 0;
        }

        .mode-toggle {
          display: flex;
          gap: 0.25rem;
        }

        .mode-toggle button {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--sl-color-gray-5);
          background: var(--sl-color-bg);
          color: var(--sl-color-text);
          cursor: pointer;
          font-size: 0.875rem;
        }

        .mode-toggle button:first-child {
          border-radius: 4px 0 0 4px;
        }

        .mode-toggle button:last-child {
          border-radius: 0 4px 4px 0;
        }

        .mode-toggle button.active {
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
          border-color: var(--sl-color-accent);
        }

        .prismatic-toggle {
          margin-bottom: 1rem;
        }

        .prismatic-toggle label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .prismatic-toggle input {
          accent-color: var(--sl-color-accent);
        }

        .rarity-inputs {
          margin-bottom: 1rem;
        }

        .rarity-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 4px;
        }

        .rarity-row:hover {
          background: var(--sl-color-gray-5);
        }

        .rarity-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .rarity-name {
          flex: 1;
          text-transform: capitalize;
          font-weight: 500;
        }

        .rarity-value {
          font-size: 0.75rem;
          color: var(--sl-color-gray-3);
          width: 70px;
          text-align: right;
        }

        .count-controls {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .count-controls button {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          background: var(--sl-color-gray-4);
          color: var(--sl-color-text);
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .count-controls button:hover {
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
        }

        .count {
          width: 32px;
          text-align: center;
          font-weight: 600;
        }

        .calc-results {
          background: var(--sl-color-bg);
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .total-label {
          font-weight: 600;
        }

        .total-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--sl-color-accent);
        }

        .breakdown {
          border-top: 1px solid var(--sl-color-gray-5);
          padding-top: 0.75rem;
        }

        .breakdown-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          padding: 0.25rem 0;
        }

        .breakdown-value {
          margin-left: auto;
          color: var(--sl-color-gray-2);
        }

        .reset-btn {
          width: 100%;
          padding: 0.5rem;
          border: none;
          border-radius: 4px;
          background: var(--sl-color-gray-4);
          color: var(--sl-color-text);
          cursor: pointer;
          font-size: 0.875rem;
        }

        .reset-btn:hover {
          background: var(--sl-color-gray-3);
        }
      `}</style>
    </div>
  );
}
