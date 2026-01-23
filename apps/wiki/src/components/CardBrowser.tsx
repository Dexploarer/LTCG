import { useState, useMemo } from 'react';

interface Card {
  id: string;
  cardNumber: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cardType: 'monster' | 'spell' | 'trap' | 'equipment' | 'field' | 'ritual' | 'fusion' | 'token';
  archetype?: string;
  monsterStats?: {
    attack: number;
    defense: number;
    level: number;
    attribute?: string;
  };
  effects?: Array<{ name: string; description: string }>;
}

interface CardBrowserProps {
  cards: Card[];
}

type SortField = 'name' | 'attack' | 'defense' | 'level' | 'rarity';
type SortDirection = 'asc' | 'desc';

const RARITY_ORDER = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export default function CardBrowser({ cards }: CardBrowserProps) {
  // Filters
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('all');
  const [attributeFilter, setAttributeFilter] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // View
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Extract unique values for filter dropdowns
  const archetypes = useMemo(() => {
    const set = new Set(cards.map((c) => c.archetype).filter(Boolean));
    return Array.from(set).sort();
  }, [cards]);

  const attributes = useMemo(() => {
    const set = new Set(
      cards.map((c) => c.monsterStats?.attribute).filter(Boolean)
    );
    return Array.from(set).sort();
  }, [cards]);

  const cardTypes = useMemo(() => {
    const set = new Set(cards.map((c) => c.cardType));
    return Array.from(set).sort();
  }, [cards]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let result = cards;

    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (card) =>
          card.name.toLowerCase().includes(search) ||
          card.effects?.some((e) => e.description.toLowerCase().includes(search))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((card) => card.cardType === typeFilter);
    }

    // Rarity filter
    if (rarityFilter !== 'all') {
      result = result.filter((card) => card.rarity === rarityFilter);
    }

    // Archetype filter
    if (archetypeFilter !== 'all') {
      result = result.filter((card) => card.archetype === archetypeFilter);
    }

    // Attribute filter
    if (attributeFilter !== 'all') {
      result = result.filter(
        (card) => card.monsterStats?.attribute === attributeFilter
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'attack':
          comparison =
            (a.monsterStats?.attack ?? 0) - (b.monsterStats?.attack ?? 0);
          break;
        case 'defense':
          comparison =
            (a.monsterStats?.defense ?? 0) - (b.monsterStats?.defense ?? 0);
          break;
        case 'level':
          comparison =
            (a.monsterStats?.level ?? 0) - (b.monsterStats?.level ?? 0);
          break;
        case 'rarity':
          comparison = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    cards,
    searchText,
    typeFilter,
    rarityFilter,
    archetypeFilter,
    attributeFilter,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="card-browser">
      {/* Filters */}
      <div className="browser-filters">
        <div className="filter-row">
          <input
            type="text"
            placeholder="Search cards..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-row">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            {cardTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="filter-select"
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
            className="filter-select"
          >
            <option value="all">All Archetypes</option>
            {archetypes.map((arch) => (
              <option key={arch} value={arch}>
                {arch}
              </option>
            ))}
          </select>

          <select
            value={attributeFilter}
            onChange={(e) => setAttributeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Attributes</option>
            {attributes.map((attr) => (
              <option key={attr} value={attr}>
                {(attr as string).charAt(0).toUpperCase() + (attr as string).slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-row controls">
          <div className="sort-controls">
            <span>Sort by:</span>
            {(['name', 'attack', 'defense', 'level', 'rarity'] as SortField[]).map(
              (field) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`sort-btn ${sortField === field ? 'active' : ''}`}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  {sortField === field && (
                    <span className="sort-arrow">
                      {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </button>
              )
            )}
          </div>

          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'active' : ''}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'active' : ''}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="results-count">
        Showing {filteredCards.length} of {cards.length} cards
      </div>

      {/* Card display */}
      {viewMode === 'grid' ? (
        <div className="card-grid">
          {filteredCards.map((card) => (
            <a
              key={card.id}
              href={`/cards/${card.cardNumber.toLowerCase()}/`}
              className="card-tile"
            >
              <div
                className="card-frame"
                style={{ borderColor: RARITY_COLORS[card.rarity] }}
              >
                <div className="card-art-placeholder">
                  <span className="card-type-icon">{card.cardType[0].toUpperCase()}</span>
                </div>
                <div className="card-info">
                  <div className="card-name">{card.name}</div>
                  <div className="card-meta">
                    <span
                      className="rarity-badge"
                      style={{ backgroundColor: RARITY_COLORS[card.rarity] }}
                    >
                      {card.rarity}
                    </span>
                    {card.archetype && (
                      <span className="archetype-badge">{card.archetype}</span>
                    )}
                  </div>
                  {card.monsterStats && (
                    <div className="card-stats">
                      <span>ATK: {card.monsterStats.attack}</span>
                      <span>DEF: {card.monsterStats.defense}</span>
                      <span>LV: {card.monsterStats.level}</span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="card-list">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Type</th>
                <th onClick={() => handleSort('rarity')} className="sortable">
                  Rarity {sortField === 'rarity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Archetype</th>
                <th onClick={() => handleSort('attack')} className="sortable">
                  ATK {sortField === 'attack' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('defense')} className="sortable">
                  DEF {sortField === 'defense' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('level')} className="sortable">
                  LV {sortField === 'level' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card) => (
                <tr key={card.id}>
                  <td>
                    <a href={`/cards/${card.cardNumber.toLowerCase()}/`}>
                      {card.name}
                    </a>
                  </td>
                  <td>{card.cardType}</td>
                  <td>
                    <span
                      className="rarity-badge"
                      style={{ backgroundColor: RARITY_COLORS[card.rarity] }}
                    >
                      {card.rarity}
                    </span>
                  </td>
                  <td>{card.archetype || '-'}</td>
                  <td>{card.monsterStats?.attack ?? '-'}</td>
                  <td>{card.monsterStats?.defense ?? '-'}</td>
                  <td>{card.monsterStats?.level ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCards.length === 0 && (
        <div className="no-results">
          No cards match your filters. Try adjusting your search criteria.
        </div>
      )}

      <style>{`
        .card-browser {
          padding: 1rem 0;
        }

        .browser-filters {
          background: var(--sl-color-gray-6);
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .filter-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .filter-row:last-child {
          margin-bottom: 0;
        }

        .filter-row.controls {
          justify-content: space-between;
          align-items: center;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 0.5rem;
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 0.25rem;
          background: var(--sl-color-bg);
          color: var(--sl-color-text);
        }

        .filter-select {
          padding: 0.5rem;
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 0.25rem;
          background: var(--sl-color-bg);
          color: var(--sl-color-text);
          min-width: 140px;
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .sort-btn {
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 0.25rem;
          background: var(--sl-color-bg);
          color: var(--sl-color-text);
          cursor: pointer;
          font-size: 0.875rem;
        }

        .sort-btn.active {
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
          border-color: var(--sl-color-accent);
        }

        .view-toggle {
          display: flex;
          gap: 0.25rem;
        }

        .view-toggle button {
          padding: 0.25rem 0.75rem;
          border: 1px solid var(--sl-color-gray-5);
          background: var(--sl-color-bg);
          color: var(--sl-color-text);
          cursor: pointer;
        }

        .view-toggle button:first-child {
          border-radius: 0.25rem 0 0 0.25rem;
        }

        .view-toggle button:last-child {
          border-radius: 0 0.25rem 0.25rem 0;
        }

        .view-toggle button.active {
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
        }

        .results-count {
          margin-bottom: 1rem;
          color: var(--sl-color-gray-3);
          font-size: 0.875rem;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }

        .card-tile {
          text-decoration: none;
          color: inherit;
        }

        .card-frame {
          border: 3px solid;
          border-radius: 0.5rem;
          overflow: hidden;
          background: var(--sl-color-gray-6);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .card-tile:hover .card-frame {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .card-art-placeholder {
          height: 120px;
          background: linear-gradient(135deg, var(--sl-color-gray-5), var(--sl-color-gray-4));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-type-icon {
          font-size: 2rem;
          font-weight: bold;
          color: var(--sl-color-gray-3);
        }

        .card-info {
          padding: 0.5rem;
        }

        .card-name {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-meta {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
          margin-bottom: 0.25rem;
        }

        .rarity-badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          text-transform: uppercase;
          color: white;
          font-weight: 600;
        }

        .archetype-badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          background: var(--sl-color-gray-4);
          color: var(--sl-color-text);
        }

        .card-stats {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--sl-color-gray-2);
        }

        .card-list table {
          width: 100%;
          border-collapse: collapse;
        }

        .card-list th,
        .card-list td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .card-list th {
          background: var(--sl-color-gray-6);
          font-weight: 600;
        }

        .card-list th.sortable {
          cursor: pointer;
        }

        .card-list th.sortable:hover {
          background: var(--sl-color-gray-5);
        }

        .card-list a {
          color: var(--sl-color-accent);
          text-decoration: none;
        }

        .card-list a:hover {
          text-decoration: underline;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          color: var(--sl-color-gray-3);
        }

        @media (max-width: 768px) {
          .filter-row.controls {
            flex-direction: column;
            align-items: flex-start;
          }

          .sort-controls {
            margin-bottom: 0.5rem;
          }

          .card-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
