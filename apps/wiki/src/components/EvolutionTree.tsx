import { useMemo, type ReactElement } from 'react';

interface Card {
  id: string;
  cardNumber: string;
  name: string;
  rarity: string;
  evolutionStage?: 'base' | 'ascended' | 'apex';
  evolvesFrom?: string[];
  canEvolveInto?: string[];
  evolutionLineId?: string;
  monsterStats?: {
    attack: number;
    defense: number;
    level: number;
    attribute?: string;
  };
}

interface EvolutionTreeProps {
  cards: Card[];
  currentCardId?: string;
  evolutionLineId?: string;
}

interface TreeNode {
  card: Card;
  children: TreeNode[];
  depth: number;
}

const STAGE_COLORS = {
  base: '#22c55e',
  ascended: '#3b82f6',
  apex: '#f59e0b',
};

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export default function EvolutionTree({
  cards,
  currentCardId,
  evolutionLineId,
}: EvolutionTreeProps) {
  // Build the evolution tree
  const tree = useMemo(() => {
    // Filter cards in this evolution line
    const lineCards = evolutionLineId
      ? cards.filter((c) => c.evolutionLineId === evolutionLineId)
      : cards;

    if (lineCards.length === 0) return null;

    // Find root cards (cards that don't evolve from anything)
    const roots = lineCards.filter(
      (c) => !c.evolvesFrom || c.evolvesFrom.length === 0
    );

    // Build tree recursively
    const buildNode = (card: Card, depth: number): TreeNode => {
      const children = lineCards
        .filter((c) => c.evolvesFrom?.includes(card.cardNumber))
        .map((c) => buildNode(c, depth + 1));

      return { card, children, depth };
    };

    return roots.map((root) => buildNode(root, 0));
  }, [cards, evolutionLineId]);

  if (!tree || tree.length === 0) {
    return (
      <div className="evolution-tree-empty">
        <p>No evolution data available for this card.</p>
      </div>
    );
  }

  // Render a single node
  const renderNode = (node: TreeNode): ReactElement => {
    const { card, children } = node;
    const isCurrent = card.id === currentCardId;
    const stageColor = STAGE_COLORS[card.evolutionStage || 'base'];
    const rarityColor = RARITY_COLORS[card.rarity] || '#9ca3af';

    return (
      <div key={card.id} className="tree-branch">
        <div className={`tree-node ${isCurrent ? 'current' : ''}`}>
          <a
            href={`/cards/${card.cardNumber.toLowerCase()}/`}
            className="node-card"
            style={{ borderColor: rarityColor }}
          >
            <div
              className="node-stage"
              style={{ backgroundColor: stageColor }}
            >
              {card.evolutionStage || 'base'}
            </div>
            <div className="node-content">
              <div className="node-name">{card.name}</div>
              {card.monsterStats && (
                <div className="node-stats">
                  <span>ATK {card.monsterStats.attack}</span>
                  <span>DEF {card.monsterStats.defense}</span>
                  <span>LV {card.monsterStats.level}</span>
                </div>
              )}
            </div>
            <div
              className="node-rarity"
              style={{ backgroundColor: rarityColor }}
            >
              {card.rarity[0].toUpperCase()}
            </div>
          </a>
          {isCurrent && <div className="current-indicator">You are here</div>}
        </div>

        {children.length > 0 && (
          <div className="tree-children">
            <div className="evolution-arrow">
              <svg viewBox="0 0 24 40" className="arrow-svg">
                <path
                  d="M12 0 L12 30 M6 24 L12 30 L18 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              <span className="evolve-text">Evolves to</span>
            </div>
            <div className="children-container">
              {children.map((child) => renderNode(child))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="evolution-tree">
      <div className="tree-legend">
        <span className="legend-title">Evolution Stages:</span>
        {Object.entries(STAGE_COLORS).map(([stage, color]) => (
          <span key={stage} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color }} />
            {stage.charAt(0).toUpperCase() + stage.slice(1)}
          </span>
        ))}
      </div>

      <div className="tree-container">
        {tree.map((root) => renderNode(root))}
      </div>

      <style>{`
        .evolution-tree {
          padding: 1rem;
          background: var(--sl-color-gray-6);
          border-radius: 8px;
          overflow-x: auto;
        }

        .evolution-tree-empty {
          padding: 2rem;
          text-align: center;
          color: var(--sl-color-gray-3);
          background: var(--sl-color-gray-6);
          border-radius: 8px;
        }

        .tree-legend {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--sl-color-gray-5);
          flex-wrap: wrap;
        }

        .legend-title {
          font-weight: 600;
          color: var(--sl-color-gray-2);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .tree-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .tree-branch {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .tree-node {
          position: relative;
        }

        .node-card {
          display: flex;
          align-items: stretch;
          background: var(--sl-color-bg);
          border: 3px solid;
          border-radius: 8px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          min-width: 200px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .node-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .tree-node.current .node-card {
          box-shadow: 0 0 0 3px var(--sl-color-accent);
        }

        .current-indicator {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--sl-color-accent);
          color: var(--sl-color-black);
          font-size: 0.625rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .node-stage {
          writing-mode: vertical-lr;
          text-orientation: mixed;
          transform: rotate(180deg);
          padding: 0.5rem 0.375rem;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          color: white;
          letter-spacing: 0.05em;
        }

        .node-content {
          flex: 1;
          padding: 0.75rem;
        }

        .node-name {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .node-stats {
          display: flex;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: var(--sl-color-gray-2);
        }

        .node-rarity {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 0.5rem;
          color: white;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .tree-children {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 0.5rem;
        }

        .evolution-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: var(--sl-color-gray-3);
        }

        .arrow-svg {
          width: 24px;
          height: 40px;
        }

        .evolve-text {
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .children-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        @media (max-width: 640px) {
          .node-card {
            min-width: 160px;
          }

          .node-stats {
            flex-direction: column;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}
