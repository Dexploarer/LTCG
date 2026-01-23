import { useState, useRef, useEffect, type ReactNode } from 'react';

interface CardData {
  name: string;
  cardNumber: string;
  rarity: string;
  cardType: string;
  archetype?: string;
  monsterStats?: {
    attack: number;
    defense: number;
    level: number;
    attribute?: string;
  };
  effects?: Array<{ name: string; description: string }>;
  flavorText?: string;
}

interface CardTooltipProps {
  card: CardData;
  children: ReactNode;
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

export default function CardTooltip({ card, children }: CardTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      let x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      let y = triggerRect.top - tooltipRect.height - 8;

      // Keep tooltip within viewport
      if (x < 10) x = 10;
      if (x + tooltipRect.width > viewportWidth - 10) {
        x = viewportWidth - tooltipRect.width - 10;
      }
      if (y < 10) {
        y = triggerRect.bottom + 8;
      }

      setPosition({ x, y });
    }
  }, [isVisible]);

  const rarityColor = RARITY_COLORS[card.rarity] || '#9ca3af';
  const attributeColor = card.monsterStats?.attribute
    ? ATTRIBUTE_COLORS[card.monsterStats.attribute] || '#666'
    : '#666';

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="card-tooltip-trigger"
      >
        {children}
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="card-tooltip"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            zIndex: 9999,
          }}
        >
          <div className="tooltip-card" style={{ borderColor: rarityColor }}>
            {/* Card Header */}
            <div className="tooltip-header">
              <span className="tooltip-name">{card.name}</span>
              <span
                className="tooltip-rarity"
                style={{ backgroundColor: rarityColor }}
              >
                {card.rarity}
              </span>
            </div>

            {/* Card Type & Archetype */}
            <div className="tooltip-meta">
              <span className="tooltip-type">{card.cardType}</span>
              {card.archetype && (
                <span className="tooltip-archetype">{card.archetype}</span>
              )}
            </div>

            {/* Monster Stats */}
            {card.monsterStats && (
              <div className="tooltip-stats">
                <div
                  className="stat-attribute"
                  style={{ backgroundColor: attributeColor }}
                >
                  {card.monsterStats.attribute || 'Unknown'}
                </div>
                <div className="stat-row">
                  <span className="stat">
                    <strong>ATK</strong> {card.monsterStats.attack}
                  </span>
                  <span className="stat">
                    <strong>DEF</strong> {card.monsterStats.defense}
                  </span>
                  <span className="stat">
                    <strong>LV</strong> {card.monsterStats.level}
                  </span>
                </div>
              </div>
            )}

            {/* Effects */}
            {card.effects && card.effects.length > 0 && (
              <div className="tooltip-effects">
                {card.effects.slice(0, 2).map((effect, i) => (
                  <div key={i} className="effect">
                    <strong>{effect.name}:</strong>{' '}
                    {effect.description.length > 100
                      ? effect.description.slice(0, 100) + '...'
                      : effect.description}
                  </div>
                ))}
                {card.effects.length > 2 && (
                  <div className="more-effects">
                    +{card.effects.length - 2} more effect(s)
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="tooltip-footer">
              <span className="card-number">{card.cardNumber}</span>
              <span className="view-link">Click to view →</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .card-tooltip-trigger {
          cursor: pointer;
          color: var(--sl-color-accent);
          text-decoration: underline;
          text-decoration-style: dotted;
        }

        .card-tooltip-trigger:hover {
          text-decoration-style: solid;
        }

        .tooltip-card {
          width: 280px;
          background: var(--sl-color-gray-6);
          border: 3px solid;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          font-size: 0.875rem;
        }

        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--sl-color-gray-5);
        }

        .tooltip-name {
          font-weight: 700;
          font-size: 1rem;
        }

        .tooltip-rarity {
          font-size: 0.625rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          color: white;
          font-weight: 600;
        }

        .tooltip-meta {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--sl-color-gray-5);
          border-top: 1px solid var(--sl-color-gray-4);
        }

        .tooltip-type {
          text-transform: capitalize;
          color: var(--sl-color-gray-2);
        }

        .tooltip-archetype {
          color: var(--sl-color-accent);
          font-weight: 500;
        }

        .tooltip-stats {
          padding: 0.75rem;
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .stat-attribute {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .stat-row {
          display: flex;
          gap: 1rem;
        }

        .stat {
          font-size: 0.875rem;
        }

        .stat strong {
          color: var(--sl-color-gray-2);
          font-size: 0.75rem;
        }

        .tooltip-effects {
          padding: 0.75rem;
          font-size: 0.8125rem;
          line-height: 1.4;
          max-height: 120px;
          overflow: hidden;
        }

        .effect {
          margin-bottom: 0.5rem;
          color: var(--sl-color-gray-2);
        }

        .effect strong {
          color: var(--sl-color-text);
        }

        .more-effects {
          color: var(--sl-color-gray-3);
          font-style: italic;
          font-size: 0.75rem;
        }

        .tooltip-footer {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: var(--sl-color-gray-5);
          font-size: 0.75rem;
        }

        .card-number {
          color: var(--sl-color-gray-3);
          font-family: monospace;
        }

        .view-link {
          color: var(--sl-color-accent);
        }
      `}</style>
    </>
  );
}
