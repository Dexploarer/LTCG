/**
 * Proper type definitions for seed data
 * NO type assertions needed - everything is explicitly typed
 */

// Card property types matching schema exactly
export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type CardType = "creature" | "spell" | "trap" | "equipment";
export type Archetype =
  | "infernal_dragons"
  | "abyssal_horrors"
  | "nature_spirits"
  | "storm_elementals"
  | "shadow_assassins"
  | "celestial_guardians";
export type DeckArchetype = "fire" | "water" | "earth" | "wind" | "neutral";

// Monster card definition
export interface MonsterCardSeed {
  readonly name: string;
  readonly rarity: CardRarity;
  readonly cardType: "creature";
  readonly archetype: Archetype;
  readonly cost: number;
  readonly attack: number;
  readonly defense: number;
  readonly ability?: string;
}

// Spell card definition
export interface SpellCardSeed {
  readonly name: string;
  readonly rarity: CardRarity;
  readonly cardType: "spell";
  readonly archetype: Archetype;
  readonly cost: number;
  readonly ability?: string;
}

// Trap card definition
export interface TrapCardSeed {
  readonly name: string;
  readonly rarity: CardRarity;
  readonly cardType: "trap";
  readonly archetype: Archetype;
  readonly cost: number;
  readonly ability?: string;
}

// Equipment card definition
export interface EquipmentCardSeed {
  readonly name: string;
  readonly rarity: CardRarity;
  readonly cardType: "equipment";
  readonly archetype: Archetype;
  readonly cost: number;
  readonly attack?: number;
  readonly defense?: number;
  readonly ability?: string;
}

// Union of all card types
export type CardSeed = MonsterCardSeed | SpellCardSeed | TrapCardSeed | EquipmentCardSeed;

// Starter deck definition
export interface StarterDeckDefinition {
  readonly deckCode: string;
  readonly name: string;
  readonly archetype: DeckArchetype;
  readonly description: string;
  readonly playstyle: string;
  readonly cardCount: number;
}
