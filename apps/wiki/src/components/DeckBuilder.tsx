import { useState, useMemo } from 'react';

interface Card {
  id: string;
  cardNumber: string;
  name: string;
  rarity: string;
  cardType: string;
  archetype?: string;
  isLimited?: boolean;
  isBanned?: boolean;
  monsterStats?: {
    attack: number;
    defense: number;
    level: number;
    attribute?: string;
  };
}

interface DeckBuilderProps {
  allCards: Card[];
}

interface DeckCard {
  card: Card;
  count: number;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const DUST_COSTS: Record<string, number> = {
  common: 40,
  uncommon: 100,
  rare: 400,
  epic: 1600,
  legendary: 3200,
};

const MIN_DECK_SIZE = 45;
const MAX_DECK_SIZE = 60;
const MAX_COPIES = 3;

export default function DeckBuilder({ allCards }: DeckBuilderProps) {
  const [deck, setDeck] = useState<Map<string, DeckCard>>(new Map());
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('all');
  const [deckName, setDeckName] = useState('My Deck');
  const [showExport, setShowExport] = useState(false);

  // Extract unique archetypes
  const archetypes = useMemo(() => {
    const set = new Set(allCards.map((c) => c.archetype).filter(Boolean));
    return Array.from(set).sort();
  }, [allCards]);

  // Filter available cards
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (card.isBanned) return false;
      if (searchText) {
        const search = searchText.toLowerCase();
        if (
          !card.name.toLowerCase().includes(search) &&
          !card.cardNumber.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (typeFilter !== 'all' && card.cardType !== typeFilter) return false;
      if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false;
      if (archetypeFilter !== 'all' && card.archetype !== archetypeFilter)
        return false;
      return true;
    });
  }, [allCards, searchText, typeFilter, rarityFilter, archetypeFilter]);

  // Deck stats
  const deckStats = useMemo(() => {
    const cards = Array.from(deck.values());
    const totalCards = cards.reduce((sum, dc) => sum + dc.count, 0);
    const totalDust = cards.reduce(
      (sum, dc) => sum + DUST_COSTS[dc.card.rarity] * dc.count,
      0
    );

    const byType: Record<string, number> = {};
    const byRarity: Record<string, number> = {};
    const manaCurve: number[] = [0, 0, 0, 0, 0, 0, 0, 0]; // 0-7+

    cards.forEach((dc) => {
      byType[dc.card.cardType] = (byType[dc.card.cardType] || 0) + dc.count;
      byRarity[dc.card.rarity] = (byRarity[dc.card.rarity] || 0) + dc.count;

      if (dc.card.monsterStats) {
        const level = Math.min(dc.card.monsterStats.level, 7);
        manaCurve[level] += dc.count;
      }
    });

    const isValid = totalCards >= MIN_DECK_SIZE && totalCards <= MAX_DECK_SIZE;

    return { totalCards, totalDust, byType, byRarity, manaCurve, isValid };
  }, [deck]);

  const addCard = (card: Card) => {
    const existing = deck.get(card.id);
    const maxCopies = card.isLimited ? 1 : MAX_COPIES;

    if (existing && existing.count >= maxCopies) return;
    if (deckStats.totalCards >= MAX_DECK_SIZE) return;

    const newDeck = new Map(deck);
    if (existing) {
      newDeck.set(card.id, { ...existing, count: existing.count + 1 });
    } else {
      newDeck.set(card.id, { card, count: 1 });
    }
    setDeck(newDeck);
  };

  const removeCard = (cardId: string) => {
    const existing = deck.get(cardId);
    if (!existing) return;

    const newDeck = new Map(deck);
    if (existing.count > 1) {
      newDeck.set(cardId, { ...existing, count: existing.count - 1 });
    } else {
      newDeck.delete(cardId);
    }
    setDeck(newDeck);
  };

  const clearDeck = () => {
    setDeck(new Map());
  };

  const exportDeck = () => {
    const cards = Array.from(deck.values());
    const deckCode = btoa(
      JSON.stringify({
        name: deckName,
        cards: cards.map((dc) => ({ id: dc.card.cardNumber, count: dc.count })),
      })
    );
    return deckCode;
  };

  const copyDeckCode = () => {
    const code = exportDeck();
    navigator.clipboard.writeText(code);
    alert('Deck code copied to clipboard!');
  };

  const deckCards = Array.from(deck.values()).sort((a, b) => {
    // Sort by type, then by level/cost, then by name
    if (a.card.cardType !== b.card.cardType) {
      return a.card.cardType.localeCompare(b.card.cardType);
    }
    const levelA = a.card.monsterStats?.level || 0;
    const levelB = b.card.monsterStats?.level || 0;
    if (levelA !== levelB) return levelA - levelB;
    return a.card.name.localeCompare(b.card.name);
  });

  return (
    <div className="deck-builder">
      <div className="builder-layout">
        {/* Card Pool */}
        <div className="card-pool">
          <div className="pool-header">
            <h3>Card Pool</h3>
            <span className="pool-count">{filteredCards.length} cards</span>
          </div>

          <div className="pool-filters">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            <div className="filter-row">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="monster">Monster</option>
                <option value="spell">Spell</option>
                <option value="trap">Trap</option>
                <option value="equipment">Equipment</option>
                <option value="field">Field</option>
              </select>
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
              <select
                value={archetypeFilter}
                onChange={(e) => setArchetypeFilter(e.target.value)}
              >
                <option value="all">All Archetypes</option>
                {archetypes.map((arch) => (
                  <option key={arch} value={arch}>
                    {arch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pool-cards">
            {filteredCards.slice(0, 100).map((card) => {
              const inDeck = deck.get(card.id);
              const maxCopies = card.isLimited ? 1 : MAX_COPIES;
              const atMax = inDeck && inDeck.count >= maxCopies;

              return (
                <div
                  key={card.id}
                  className={`pool-card ${atMax ? 'at-max' : ''}`}
                  onClick={() => !atMax && addCard(card)}
                >
                  <span
                    className="card-rarity-dot"
                    style={{ backgroundColor: RARITY_COLORS[card.rarity] }}
                  />
                  <span className="card-name">{card.name}</span>
                  {card.monsterStats && (
                    <span className="card-level">LV{card.monsterStats.level}</span>
                  )}
                  {inDeck && <span className="in-deck-badge">×{inDeck.count}</span>}
                  {card.isLimited && <span className="limited-badge">L</span>}
                </div>
              );
            })}
            {filteredCards.length > 100 && (
              <div className="more-cards">
                ...and {filteredCards.length - 100} more
              </div>
            )}
          </div>
        </div>

        {/* Deck View */}
        <div className="deck-view">
          <div className="deck-header">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="deck-name-input"
            />
            <div className="deck-actions">
              <button onClick={() => setShowExport(!showExport)}>Export</button>
              <button onClick={clearDeck} className="clear-btn">
                Clear
              </button>
            </div>
          </div>

          {/* Deck Stats */}
          <div className="deck-stats">
            <div
              className={`stat-card ${
                deckStats.isValid ? 'valid' : 'invalid'
              }`}
            >
              <span className="stat-value">
                {deckStats.totalCards}/{MIN_DECK_SIZE}
              </span>
              <span className="stat-label">Cards</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{deckStats.totalDust}</span>
              <span className="stat-label">Dust</span>
            </div>
          </div>

          {/* Mana Curve */}
          <div className="mana-curve">
            <span className="curve-label">Level Curve</span>
            <div className="curve-bars">
              {deckStats.manaCurve.map((count, level) => (
                <div key={level} className="curve-bar-container">
                  <div
                    className="curve-bar"
                    style={{
                      height: `${Math.min(count * 12, 60)}px`,
                    }}
                  >
                    {count > 0 && <span className="bar-count">{count}</span>}
                  </div>
                  <span className="bar-label">{level === 7 ? '7+' : level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deck Cards */}
          <div className="deck-cards">
            {deckCards.length === 0 ? (
              <div className="empty-deck">
                <p>Click cards on the left to add them to your deck</p>
                <p className="hint">
                  Deck must have {MIN_DECK_SIZE}-{MAX_DECK_SIZE} cards
                </p>
              </div>
            ) : (
              deckCards.map((dc) => (
                <div key={dc.card.id} className="deck-card">
                  <span
                    className="card-rarity-dot"
                    style={{ backgroundColor: RARITY_COLORS[dc.card.rarity] }}
                  />
                  <span className="card-name">{dc.card.name}</span>
                  <span className="card-count">×{dc.count}</span>
                  <button
                    className="remove-btn"
                    onClick={() => removeCard(dc.card.id)}
                  >
                    −
                  </button>
                  <button className="add-btn" onClick={() => addCard(dc.card)}>
                    +
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Export Panel */}
          {showExport && (
            <div className="export-panel">
              <h4>Deck Code</h4>
              <textarea readOnly value={exportDeck()} className="deck-code" />
              <button onClick={copyDeckCode}>Copy to Clipboard</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .deck-builder {
          background: var(--sl-color-gray-6);
          border-radius: 8px;
          padding: 1rem;
        }

        .builder-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1rem;
          min-height: 600px;
        }

        .card-pool {
          display: flex;
          flex-direction: column;
          background: var(--sl-color-bg);
          border-radius: 8px;
          overflow: hidden;
        }

        .pool-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--sl-color-gray-5);
        }

        .pool-header h3 {
          margin: 0;
        }

        .pool-count {
          color: var(--sl-color-gray-3);
          font-size: 0.875rem;
        }

        .pool-filters {
          padding: 1rem;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .search-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 4px;
          background: var(--sl-color-gray-6);
          color: var(--sl-color-text);
          margin-bottom: 0.5rem;
        }

        .filter-row {
          display: flex;
          gap: 0.5rem;
        }

        .filter-row select {
          flex: 1;
          padding: 0.375rem;
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 4px;
          background: var(--sl-color-gray-6);
          color: var(--sl-color-text);
          font-size: 0.875rem;
        }

        .pool-cards {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .pool-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .pool-card:hover {
          background: var(--sl-color-gray-6);
        }

        .pool-card.at-max {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .card-rarity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .pool-card .card-name {
          flex: 1;
          font-size: 0.875rem;
        }

        .card-level {
          font-size: 0.75rem;
          color: var(--sl-color-gray-3);
        }

        .in-deck-badge {
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .limited-badge {
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .more-cards {
          padding: 1rem;
          text-align: center;
          color: var(--sl-color-gray-3);
          font-size: 0.875rem;
        }

        .deck-view {
          display: flex;
          flex-direction: column;
          background: var(--sl-color-bg);
          border-radius: 8px;
          overflow: hidden;
        }

        .deck-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--sl-color-gray-5);
        }

        .deck-name-input {
          flex: 1;
          padding: 0.375rem 0.5rem;
          border: 1px solid transparent;
          border-radius: 4px;
          background: transparent;
          color: var(--sl-color-text);
          font-weight: 600;
          font-size: 1rem;
        }

        .deck-name-input:hover,
        .deck-name-input:focus {
          background: var(--sl-color-gray-6);
          border-color: var(--sl-color-gray-4);
        }

        .deck-actions {
          display: flex;
          gap: 0.5rem;
        }

        .deck-actions button {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
        }

        .deck-actions .clear-btn {
          background: var(--sl-color-gray-4);
          color: var(--sl-color-text);
        }

        .deck-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          padding: 1rem;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .stat-card {
          text-align: center;
          padding: 0.75rem;
          background: var(--sl-color-gray-6);
          border-radius: 4px;
        }

        .stat-card.valid {
          border: 1px solid #22c55e;
        }

        .stat-card.invalid {
          border: 1px solid #ef4444;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--sl-color-gray-3);
        }

        .mana-curve {
          padding: 1rem;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .curve-label {
          display: block;
          font-size: 0.75rem;
          color: var(--sl-color-gray-3);
          margin-bottom: 0.5rem;
        }

        .curve-bars {
          display: flex;
          gap: 0.25rem;
          height: 80px;
          align-items: flex-end;
        }

        .curve-bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .curve-bar {
          width: 100%;
          background: var(--sl-color-accent);
          border-radius: 2px 2px 0 0;
          min-height: 4px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .bar-count {
          font-size: 0.625rem;
          color: var(--sl-color-black);
          font-weight: 600;
          margin-top: 2px;
        }

        .bar-label {
          font-size: 0.625rem;
          color: var(--sl-color-gray-3);
          margin-top: 0.25rem;
        }

        .deck-cards {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .empty-deck {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--sl-color-gray-3);
          text-align: center;
        }

        .empty-deck .hint {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .deck-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .deck-card:hover {
          background: var(--sl-color-gray-6);
        }

        .deck-card .card-name {
          flex: 1;
          font-size: 0.875rem;
        }

        .card-count {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .remove-btn,
        .add-btn {
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-btn {
          background: #ef4444;
          color: white;
        }

        .add-btn {
          background: #22c55e;
          color: white;
        }

        .export-panel {
          padding: 1rem;
          border-top: 1px solid var(--sl-color-gray-5);
        }

        .export-panel h4 {
          margin: 0 0 0.5rem 0;
        }

        .deck-code {
          width: 100%;
          height: 80px;
          padding: 0.5rem;
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 4px;
          background: var(--sl-color-gray-6);
          color: var(--sl-color-text);
          font-family: monospace;
          font-size: 0.75rem;
          resize: none;
          margin-bottom: 0.5rem;
        }

        .export-panel button {
          width: 100%;
          padding: 0.5rem;
          border: none;
          border-radius: 4px;
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
          cursor: pointer;
          font-weight: 500;
        }

        @media (max-width: 900px) {
          .builder-layout {
            grid-template-columns: 1fr;
          }

          .deck-view {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}
