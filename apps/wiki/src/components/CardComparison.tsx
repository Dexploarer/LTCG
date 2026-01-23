import { useState, useMemo } from 'react';

interface Card {
  id: string;
  cardNumber: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cardType: string;
  archetype?: string;
  monsterStats?: {
    attack: number;
    defense: number;
    level: number;
    attribute?: string;
  };
  effects?: Array<{ name: string; description: string }>;
  isLimited?: boolean;
  isBanned?: boolean;
  evolutionStage?: string;
}

interface CardComparisonProps {
  allCards: Card[];
  initialCards?: string[]; // Card IDs to start with
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const ATTRIBUTE_COLORS: Record<string, string> = {
  fire: '#ef4444',
  water: '#3b82f6',
  earth: '#84cc16',
  wind: '#06b6d4',
  light: '#fbbf24',
  dark: '#8b5cf6',
  divine: '#f59e0b',
};

const DUST_COSTS: Record<string, number> = {
  common: 40,
  uncommon: 100,
  rare: 400,
  epic: 1600,
  legendary: 3200,
};

export default function CardComparison({
  allCards,
  initialCards = [],
}: CardComparisonProps) {
  const [selectedCards, setSelectedCards] = useState<string[]>(
    initialCards.slice(0, 4)
  );
  const [searchText, setSearchText] = useState('');
  const [showSelector, setShowSelector] = useState(false);
  const [selectorSlot, setSelectorSlot] = useState<number | null>(null);

  // Filter cards for selector
  const filteredCards = useMemo(() => {
    if (!searchText) return allCards.slice(0, 50);
    const search = searchText.toLowerCase();
    return allCards
      .filter(
        (card) =>
          card.name.toLowerCase().includes(search) ||
          card.cardNumber.toLowerCase().includes(search)
      )
      .slice(0, 50);
  }, [allCards, searchText]);

  // Get selected card objects
  const cards = useMemo(() => {
    return selectedCards
      .map((id) => allCards.find((c) => c.id === id))
      .filter(Boolean) as Card[];
  }, [selectedCards, allCards]);

  const openSelector = (slot: number) => {
    setSelectorSlot(slot);
    setShowSelector(true);
    setSearchText('');
  };

  const selectCard = (cardId: string) => {
    if (selectorSlot !== null) {
      const newSelected = [...selectedCards];
      newSelected[selectorSlot] = cardId;
      setSelectedCards(newSelected.filter(Boolean));
    }
    setShowSelector(false);
    setSelectorSlot(null);
  };

  const removeCard = (index: number) => {
    setSelectedCards(selectedCards.filter((_, i) => i !== index));
  };

  const addSlot = () => {
    if (selectedCards.length < 4) {
      openSelector(selectedCards.length);
    }
  };

  // Calculate stat comparisons
  const getStatComparison = (stat: 'attack' | 'defense' | 'level') => {
    const values = cards
      .filter((c) => c.monsterStats)
      .map((c) => c.monsterStats![stat]);
    if (values.length === 0) return { max: 0, min: 0 };
    return { max: Math.max(...values), min: Math.min(...values) };
  };

  const attackComparison = getStatComparison('attack');
  const defenseComparison = getStatComparison('defense');
  const levelComparison = getStatComparison('level');

  const getStatClass = (
    value: number | undefined,
    comparison: { max: number; min: number }
  ) => {
    if (value === undefined) return '';
    if (cards.length < 2) return '';
    if (value === comparison.max) return 'stat-best';
    if (value === comparison.min && comparison.max !== comparison.min)
      return 'stat-worst';
    return '';
  };

  return (
    <div className="card-comparison">
      <div className="comparison-header">
        <h3>Card Comparison</h3>
        <p>Compare up to 4 cards side by side</p>
      </div>

      <div className="comparison-grid">
        {[0, 1, 2, 3].map((slot) => {
          const card = cards[slot];
          if (!card && slot >= selectedCards.length) {
            if (slot === selectedCards.length && slot < 4) {
              return (
                <div key={slot} className="comparison-slot empty" onClick={addSlot}>
                  <div className="add-card">
                    <span className="add-icon">+</span>
                    <span>Add Card</span>
                  </div>
                </div>
              );
            }
            return null;
          }

          if (!card) {
            return (
              <div
                key={slot}
                className="comparison-slot empty"
                onClick={() => openSelector(slot)}
              >
                <div className="add-card">
                  <span className="add-icon">+</span>
                  <span>Select Card</span>
                </div>
              </div>
            );
          }

          const rarityColor = RARITY_COLORS[card.rarity];
          const attributeColor = card.monsterStats?.attribute
            ? ATTRIBUTE_COLORS[card.monsterStats.attribute]
            : '#666';

          return (
            <div
              key={slot}
              className="comparison-slot filled"
              style={{ borderColor: rarityColor }}
            >
              <button
                className="remove-card"
                onClick={() => removeCard(slot)}
                title="Remove"
              >
                ×
              </button>
              <button
                className="change-card"
                onClick={() => openSelector(slot)}
                title="Change"
              >
                ↔
              </button>

              {/* Card Header */}
              <div className="card-header">
                <a
                  href={`/cards/${card.cardNumber.toLowerCase()}/`}
                  className="card-name"
                >
                  {card.name}
                </a>
                <span
                  className="card-rarity"
                  style={{ backgroundColor: rarityColor }}
                >
                  {card.rarity}
                </span>
              </div>

              {/* Card Info */}
              <div className="card-info-section">
                <div className="info-row">
                  <span className="label">Type</span>
                  <span className="value">{card.cardType}</span>
                </div>
                {card.archetype && (
                  <div className="info-row">
                    <span className="label">Archetype</span>
                    <span className="value">{card.archetype}</span>
                  </div>
                )}
                {card.monsterStats?.attribute && (
                  <div className="info-row">
                    <span className="label">Attribute</span>
                    <span
                      className="value attribute"
                      style={{ backgroundColor: attributeColor }}
                    >
                      {card.monsterStats.attribute}
                    </span>
                  </div>
                )}
              </div>

              {/* Monster Stats */}
              {card.monsterStats && (
                <div className="card-stats-section">
                  <div
                    className={`stat-box ${getStatClass(
                      card.monsterStats.attack,
                      attackComparison
                    )}`}
                  >
                    <span className="stat-label">ATK</span>
                    <span className="stat-value">{card.monsterStats.attack}</span>
                  </div>
                  <div
                    className={`stat-box ${getStatClass(
                      card.monsterStats.defense,
                      defenseComparison
                    )}`}
                  >
                    <span className="stat-label">DEF</span>
                    <span className="stat-value">{card.monsterStats.defense}</span>
                  </div>
                  <div
                    className={`stat-box ${getStatClass(
                      card.monsterStats.level,
                      levelComparison
                    )}`}
                  >
                    <span className="stat-label">LV</span>
                    <span className="stat-value">{card.monsterStats.level}</span>
                  </div>
                </div>
              )}

              {/* Effects */}
              <div className="card-effects-section">
                <span className="section-label">Effects</span>
                {card.effects && card.effects.length > 0 ? (
                  <div className="effects-list">
                    {card.effects.map((effect, i) => (
                      <div key={i} className="effect-item">
                        <strong>{effect.name}</strong>
                        <p>{effect.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-effects">No effects</p>
                )}
              </div>

              {/* Crafting Cost */}
              <div className="card-footer">
                <span className="dust-cost">
                  Craft: {DUST_COSTS[card.rarity]} dust
                </span>
                {card.evolutionStage && (
                  <span className="evo-stage">{card.evolutionStage}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Selector Modal */}
      {showSelector && (
        <div className="selector-overlay" onClick={() => setShowSelector(false)}>
          <div className="selector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="selector-header">
              <h4>Select a Card</h4>
              <button
                className="close-btn"
                onClick={() => setShowSelector(false)}
              >
                ×
              </button>
            </div>
            <input
              type="text"
              placeholder="Search cards..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="selector-search"
              autoFocus
            />
            <div className="selector-list">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="selector-item"
                  onClick={() => selectCard(card.id)}
                >
                  <span
                    className="selector-rarity"
                    style={{ backgroundColor: RARITY_COLORS[card.rarity] }}
                  />
                  <span className="selector-name">{card.name}</span>
                  <span className="selector-type">{card.cardType}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .card-comparison {
          background: var(--sl-color-gray-6);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .comparison-header {
          margin-bottom: 1.5rem;
        }

        .comparison-header h3 {
          margin: 0 0 0.25rem 0;
        }

        .comparison-header p {
          margin: 0;
          color: var(--sl-color-gray-3);
          font-size: 0.875rem;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .comparison-slot {
          background: var(--sl-color-bg);
          border: 3px solid var(--sl-color-gray-5);
          border-radius: 8px;
          min-height: 400px;
          position: relative;
        }

        .comparison-slot.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }

        .comparison-slot.empty:hover {
          border-color: var(--sl-color-accent);
          background: var(--sl-color-gray-6);
        }

        .add-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--sl-color-gray-3);
        }

        .add-icon {
          font-size: 2rem;
          font-weight: 300;
        }

        .remove-card,
        .change-card {
          position: absolute;
          top: 0.5rem;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-card {
          right: 0.5rem;
          background: #ef4444;
          color: white;
        }

        .change-card {
          right: 2rem;
          background: var(--sl-color-gray-4);
          color: var(--sl-color-text);
        }

        .card-header {
          padding: 1rem;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .card-name {
          display: block;
          font-weight: 700;
          font-size: 1rem;
          color: var(--sl-color-text);
          text-decoration: none;
          margin-bottom: 0.5rem;
        }

        .card-name:hover {
          color: var(--sl-color-accent);
        }

        .card-rarity {
          font-size: 0.625rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          color: white;
          font-weight: 600;
        }

        .card-info-section {
          padding: 1rem;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .label {
          color: var(--sl-color-gray-3);
        }

        .value {
          font-weight: 500;
          text-transform: capitalize;
        }

        .value.attribute {
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .card-stats-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          padding: 1rem;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .stat-box {
          text-align: center;
          padding: 0.5rem;
          background: var(--sl-color-gray-6);
          border-radius: 4px;
        }

        .stat-box.stat-best {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid #22c55e;
        }

        .stat-box.stat-worst {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
        }

        .stat-label {
          display: block;
          font-size: 0.625rem;
          color: var(--sl-color-gray-3);
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .card-effects-section {
          padding: 1rem;
          flex: 1;
        }

        .section-label {
          display: block;
          font-size: 0.75rem;
          color: var(--sl-color-gray-3);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .effects-list {
          font-size: 0.8125rem;
        }

        .effect-item {
          margin-bottom: 0.75rem;
        }

        .effect-item strong {
          color: var(--sl-color-accent);
        }

        .effect-item p {
          margin: 0.25rem 0 0 0;
          color: var(--sl-color-gray-2);
          line-height: 1.4;
        }

        .no-effects {
          color: var(--sl-color-gray-3);
          font-style: italic;
          margin: 0;
        }

        .card-footer {
          padding: 0.75rem 1rem;
          background: var(--sl-color-gray-6);
          font-size: 0.75rem;
          display: flex;
          justify-content: space-between;
          border-radius: 0 0 5px 5px;
        }

        .dust-cost {
          color: var(--sl-color-gray-2);
        }

        .evo-stage {
          text-transform: capitalize;
          color: var(--sl-color-accent);
          font-weight: 500;
        }

        .selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .selector-modal {
          background: var(--sl-color-bg);
          border-radius: 8px;
          width: 90%;
          max-width: 400px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .selector-header h4 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--sl-color-gray-3);
        }

        .selector-search {
          margin: 1rem;
          padding: 0.75rem;
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 4px;
          background: var(--sl-color-gray-6);
          color: var(--sl-color-text);
          font-size: 1rem;
        }

        .selector-list {
          overflow-y: auto;
          flex: 1;
          padding: 0 1rem 1rem;
        }

        .selector-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .selector-item:hover {
          background: var(--sl-color-gray-6);
        }

        .selector-rarity {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .selector-name {
          flex: 1;
          font-weight: 500;
        }

        .selector-type {
          color: var(--sl-color-gray-3);
          font-size: 0.875rem;
          text-transform: capitalize;
        }

        @media (max-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
