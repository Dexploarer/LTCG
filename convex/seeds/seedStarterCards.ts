import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Seed the 4 starter deck cards from launch_cards.csv
 * Total: 180 cards (45 per archetype)
 *
 * Archetypes:
 * - Infernal Dragons (ID-001 to ID-045) - Fire
 * - Abyssal Depths (AD-001 to AD-045) - Water
 * - Iron Legion (IL-001 to IL-045) - Earth
 * - Storm Riders (SR-001 to SR-045) - Wind
 */

// CSV data from /Users/home/lunchtable/GDD/launch_cards.csv
// Extracted from the original game
const STARTER_CARDS = [
  // INFERNAL DRAGONS (Fire) - 45 cards
  { cardId: "ID-001", name: "Ember Wyrmling", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 1200, def: 800, lvl: 3, element: "fire" as const },
  { cardId: "ID-002", name: "Infernal Hatchling", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 800, def: 600, lvl: 2, element: "fire" as const },
  { cardId: "ID-003", name: "Scorched Serpent", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 1400, def: 1000, lvl: 4, element: "fire" as const },
  { cardId: "ID-004", name: "Flame Whelp", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 600, def: 400, lvl: 1, element: "fire" as const },
  { cardId: "ID-005", name: "Blazing Drake", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 1600, def: 1200, lvl: 4, element: "fire" as const },
  { cardId: "ID-006", name: "Cinder Wyrm", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 1100, def: 700, lvl: 3, element: "fire" as const },
  { cardId: "ID-007", name: "Magma Hatchling", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 900, def: 500, lvl: 2, element: "fire" as const },
  { cardId: "ID-008", name: "Infernal Scout", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 1000, def: 600, lvl: 3, element: "fire" as const },
  { cardId: "ID-009", name: "Pyroclast Wyvern", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 1300, def: 900, lvl: 4, element: "fire" as const },
  { cardId: "ID-010", name: "Smoldering Newt", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 700, def: 300, lvl: 2, element: "fire" as const },
  { cardId: "ID-011", name: "Ashen Dragonet", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 800, def: 800, lvl: 2, element: "fire" as const },
  { cardId: "ID-012", name: "Kindled Basilisk", archetype: "Infernal Dragons", cardType: "Monster", rarity: "common", atk: 1500, def: 1100, lvl: 4, element: "fire" as const },
  { cardId: "ID-013", name: "Infernal Vanguard", archetype: "Infernal Dragons", cardType: "Monster", rarity: "uncommon", atk: 1600, def: 1000, lvl: 4, element: "fire" as const },
  { cardId: "ID-014", name: "Blazetail Guardian", archetype: "Infernal Dragons", cardType: "Monster", rarity: "uncommon", atk: 1400, def: 1400, lvl: 4, element: "fire" as const },
  { cardId: "ID-015", name: "Crimson Firebreather", archetype: "Infernal Dragons", cardType: "Monster", rarity: "uncommon", atk: 1800, def: 800, lvl: 4, element: "fire" as const },
  { cardId: "ID-016", name: "Volcanic Striker", archetype: "Infernal Dragons", cardType: "Monster", rarity: "uncommon", atk: 1700, def: 900, lvl: 4, element: "fire" as const },
  { cardId: "ID-017", name: "Flame Herald", archetype: "Infernal Dragons", cardType: "Monster", rarity: "uncommon", atk: 1200, def: 1000, lvl: 3, element: "fire" as const },
  { cardId: "ID-018", name: "Magma Carrier", archetype: "Infernal Dragons", cardType: "Monster", rarity: "uncommon", atk: 2000, def: 1400, lvl: 5, element: "fire" as const },
  { cardId: "ID-019", name: "Pyre Sentinel", archetype: "Infernal Dragons", cardType: "Monster", rarity: "uncommon", atk: 1500, def: 1500, lvl: 4, element: "fire" as const },
  { cardId: "ID-020", name: "Infernal Charger", archetype: "Infernal Dragons", cardType: "Monster", rarity: "uncommon", atk: 1900, def: 600, lvl: 4, element: "fire" as const },
  { cardId: "ID-021", name: "Infernal Warlord", archetype: "Infernal Dragons", cardType: "Monster", rarity: "rare", atk: 2400, def: 1800, lvl: 6, element: "fire" as const },
  { cardId: "ID-022", name: "Volcanic Dragon", archetype: "Infernal Dragons", cardType: "Monster", rarity: "rare", atk: 2600, def: 2000, lvl: 7, element: "fire" as const },
  { cardId: "ID-023", name: "Infernal Ravager", archetype: "Infernal Dragons", cardType: "Monster", rarity: "rare", atk: 2200, def: 1600, lvl: 5, element: "fire" as const },
  { cardId: "ID-024", name: "Pyromancer Drake", archetype: "Infernal Dragons", cardType: "Monster", rarity: "rare", atk: 2000, def: 1200, lvl: 5, element: "fire" as const },
  { cardId: "ID-025", name: "Hellfire Wyrm", archetype: "Infernal Dragons", cardType: "Monster", rarity: "rare", atk: 2300, def: 1400, lvl: 6, element: "fire" as const },
  { cardId: "ID-026", name: "Infernal Tyrant", archetype: "Infernal Dragons", cardType: "Monster", rarity: "epic", atk: 2800, def: 2200, lvl: 7, element: "fire" as const },
  { cardId: "ID-027", name: "Volcanic Behemoth", archetype: "Infernal Dragons", cardType: "Monster", rarity: "epic", atk: 3000, def: 2400, lvl: 8, element: "fire" as const },
  { cardId: "ID-028", name: "Infernal Phoenix", archetype: "Infernal Dragons", cardType: "Monster", rarity: "epic", atk: 2500, def: 2000, lvl: 7, element: "fire" as const },
  { cardId: "ID-029", name: "Infernal Overlord Vyraxis", archetype: "Infernal Dragons", cardType: "Monster", rarity: "legendary", atk: 3200, def: 2500, lvl: 9, element: "fire" as const },
  { cardId: "ID-030", name: "Apocalypse Dragon", archetype: "Infernal Dragons", cardType: "Monster", rarity: "legendary", atk: 3500, def: 3000, lvl: 10, element: "fire" as const },
  { cardId: "ID-031", name: "Dragon's Fury", archetype: "Infernal Dragons", cardType: "Spell", rarity: "common", lvl: 0, element: "fire" as const },
  { cardId: "ID-032", name: "Volcanic Eruption", archetype: "Infernal Dragons", cardType: "Spell", rarity: "common", lvl: 0, element: "fire" as const },
  { cardId: "ID-033", name: "Infernal Recovery", archetype: "Infernal Dragons", cardType: "Spell", rarity: "common", lvl: 0, element: "fire" as const },
  { cardId: "ID-034", name: "Fire Breathing", archetype: "Infernal Dragons", cardType: "Spell", rarity: "common", lvl: 0, element: "fire" as const },
  { cardId: "ID-035", name: "Sudden Ignition", archetype: "Infernal Dragons", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "fire" as const },
  { cardId: "ID-036", name: "Infernal Barrier", archetype: "Infernal Dragons", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "fire" as const },
  { cardId: "ID-037", name: "Scorching Wind", archetype: "Infernal Dragons", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "fire" as const },
  { cardId: "ID-038", name: "Infernal Furnace", archetype: "Infernal Dragons", cardType: "Spell", rarity: "rare", lvl: 0, element: "fire" as const },
  { cardId: "ID-039", name: "Dragon's Hoard", archetype: "Infernal Dragons", cardType: "Spell", rarity: "rare", lvl: 0, element: "fire" as const },
  { cardId: "ID-040", name: "Volcanic Lair", archetype: "Infernal Dragons", cardType: "Field", rarity: "rare", lvl: 0, element: "fire" as const },
  { cardId: "ID-041", name: "Flame Trap", archetype: "Infernal Dragons", cardType: "Trap", rarity: "common", lvl: 0, element: "fire" as const },
  { cardId: "ID-042", name: "Burning Revenge", archetype: "Infernal Dragons", cardType: "Trap", rarity: "common", lvl: 0, element: "fire" as const },
  { cardId: "ID-043", name: "Ring of Fire", archetype: "Infernal Dragons", cardType: "Trap", rarity: "uncommon", lvl: 0, element: "fire" as const },
  { cardId: "ID-044", name: "Infernal Presence", archetype: "Infernal Dragons", cardType: "Trap", rarity: "uncommon", lvl: 0, element: "fire" as const },
  { cardId: "ID-045", name: "Dragon's Wrath", archetype: "Infernal Dragons", cardType: "Trap", rarity: "epic", lvl: 0, element: "fire" as const },

  // ABYSSAL DEPTHS (Water) - 45 cards
  { cardId: "AD-001", name: "Reef Crab", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 600, def: 800, lvl: 2, element: "water" as const },
  { cardId: "AD-002", name: "Coral Serpent", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 1000, def: 600, lvl: 3, element: "water" as const },
  { cardId: "AD-003", name: "Tidal Eel", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 800, def: 400, lvl: 2, element: "water" as const },
  { cardId: "AD-004", name: "Murky Triton", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 1200, def: 1000, lvl: 3, element: "water" as const },
  { cardId: "AD-005", name: "Deep Mermaid", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 1400, def: 800, lvl: 4, element: "water" as const },
  { cardId: "AD-006", name: "Glacial Crab", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 500, def: 1200, lvl: 2, element: "water" as const },
  { cardId: "AD-007", name: "Undertow Shark", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 1300, def: 700, lvl: 4, element: "water" as const },
  { cardId: "AD-008", name: "Frozen Hydra", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 1100, def: 900, lvl: 3, element: "water" as const },
  { cardId: "AD-009", name: "Sunken Squid", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 900, def: 500, lvl: 2, element: "water" as const },
  { cardId: "AD-010", name: "Riptide Whale", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 1500, def: 1300, lvl: 4, element: "water" as const },
  { cardId: "AD-011", name: "Abyssal Siren", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 700, def: 600, lvl: 2, element: "water" as const },
  { cardId: "AD-012", name: "Oceanic Jellyfish", archetype: "Abyssal Depths", cardType: "Monster", rarity: "common", atk: 400, def: 400, lvl: 1, element: "water" as const },
  { cardId: "AD-013", name: "Tidal Serpent", archetype: "Abyssal Depths", cardType: "Monster", rarity: "uncommon", atk: 1600, def: 1200, lvl: 4, element: "water" as const },
  { cardId: "AD-014", name: "Glacial Hydra", archetype: "Abyssal Depths", cardType: "Monster", rarity: "uncommon", atk: 1400, def: 1600, lvl: 5, element: "water" as const },
  { cardId: "AD-015", name: "Reef Guardian", archetype: "Abyssal Depths", cardType: "Monster", rarity: "uncommon", atk: 1200, def: 1800, lvl: 4, element: "water" as const },
  { cardId: "AD-016", name: "Deep Hunter", archetype: "Abyssal Depths", cardType: "Monster", rarity: "uncommon", atk: 1800, def: 800, lvl: 4, element: "water" as const },
  { cardId: "AD-017", name: "Frozen Leviathan", archetype: "Abyssal Depths", cardType: "Monster", rarity: "uncommon", atk: 1700, def: 1400, lvl: 5, element: "water" as const },
  { cardId: "AD-018", name: "Murky Stalker", archetype: "Abyssal Depths", cardType: "Monster", rarity: "uncommon", atk: 1500, def: 1000, lvl: 4, element: "water" as const },
  { cardId: "AD-019", name: "Coral Enchantress", archetype: "Abyssal Depths", cardType: "Monster", rarity: "uncommon", atk: 1300, def: 1100, lvl: 3, element: "water" as const },
  { cardId: "AD-020", name: "Undertow Kraken", archetype: "Abyssal Depths", cardType: "Monster", rarity: "uncommon", atk: 2000, def: 1600, lvl: 5, element: "water" as const },
  { cardId: "AD-021", name: "Abyssal Lord", archetype: "Abyssal Depths", cardType: "Monster", rarity: "rare", atk: 2200, def: 1800, lvl: 6, element: "water" as const },
  { cardId: "AD-022", name: "Tidal Dragon", archetype: "Abyssal Depths", cardType: "Monster", rarity: "rare", atk: 2400, def: 2000, lvl: 7, element: "water" as const },
  { cardId: "AD-023", name: "Glacial Monarch", archetype: "Abyssal Depths", cardType: "Monster", rarity: "rare", atk: 2000, def: 2400, lvl: 6, element: "water" as const },
  { cardId: "AD-024", name: "Deep Sea Terror", archetype: "Abyssal Depths", cardType: "Monster", rarity: "rare", atk: 2600, def: 1600, lvl: 7, element: "water" as const },
  { cardId: "AD-025", name: "Frozen Sovereign", archetype: "Abyssal Depths", cardType: "Monster", rarity: "rare", atk: 2100, def: 2100, lvl: 6, element: "water" as const },
  { cardId: "AD-026", name: "Leviathan Prime", archetype: "Abyssal Depths", cardType: "Monster", rarity: "epic", atk: 2800, def: 2400, lvl: 8, element: "water" as const },
  { cardId: "AD-027", name: "Abyssal Tyrant", archetype: "Abyssal Depths", cardType: "Monster", rarity: "epic", atk: 2600, def: 2800, lvl: 8, element: "water" as const },
  { cardId: "AD-028", name: "Kraken Overlord", archetype: "Abyssal Depths", cardType: "Monster", rarity: "epic", atk: 3000, def: 2200, lvl: 8, element: "water" as const },
  { cardId: "AD-029", name: "Tidal Emperor Nereus", archetype: "Abyssal Depths", cardType: "Monster", rarity: "legendary", atk: 3200, def: 2800, lvl: 9, element: "water" as const },
  { cardId: "AD-030", name: "Leviathan of the Abyss", archetype: "Abyssal Depths", cardType: "Monster", rarity: "legendary", atk: 3800, def: 4000, lvl: 10, element: "water" as const },
  { cardId: "AD-031", name: "Tidal Wave", archetype: "Abyssal Depths", cardType: "Spell", rarity: "common", lvl: 0, element: "water" as const },
  { cardId: "AD-032", name: "Glacial Blessing", archetype: "Abyssal Depths", cardType: "Spell", rarity: "common", lvl: 0, element: "water" as const },
  { cardId: "AD-033", name: "Deep Recovery", archetype: "Abyssal Depths", cardType: "Spell", rarity: "common", lvl: 0, element: "water" as const },
  { cardId: "AD-034", name: "Frozen Touch", archetype: "Abyssal Depths", cardType: "Spell", rarity: "common", lvl: 0, element: "water" as const },
  { cardId: "AD-035", name: "Sudden Freeze", archetype: "Abyssal Depths", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "water" as const },
  { cardId: "AD-036", name: "Abyssal Shield", archetype: "Abyssal Depths", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "water" as const },
  { cardId: "AD-037", name: "Riptide Counter", archetype: "Abyssal Depths", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "water" as const },
  { cardId: "AD-038", name: "Endless Depths", archetype: "Abyssal Depths", cardType: "Spell", rarity: "rare", lvl: 0, element: "water" as const },
  { cardId: "AD-039", name: "Frozen Prison", archetype: "Abyssal Depths", cardType: "Spell", rarity: "rare", lvl: 0, element: "water" as const },
  { cardId: "AD-040", name: "Abyssal Trench", archetype: "Abyssal Depths", cardType: "Field", rarity: "rare", lvl: 0, element: "water" as const },
  { cardId: "AD-041", name: "Frozen Ambush", archetype: "Abyssal Depths", cardType: "Trap", rarity: "common", lvl: 0, element: "water" as const },
  { cardId: "AD-042", name: "Tidal Revenge", archetype: "Abyssal Depths", cardType: "Trap", rarity: "common", lvl: 0, element: "water" as const },
  { cardId: "AD-043", name: "Icy Presence", archetype: "Abyssal Depths", cardType: "Trap", rarity: "uncommon", lvl: 0, element: "water" as const },
  { cardId: "AD-044", name: "Abyssal Barrier", archetype: "Abyssal Depths", cardType: "Trap", rarity: "uncommon", lvl: 0, element: "water" as const },
  { cardId: "AD-045", name: "Depth Rejection", archetype: "Abyssal Depths", cardType: "Trap", rarity: "epic", lvl: 0, element: "water" as const },

  // IRON LEGION (Earth) - 45 cards
  { cardId: "IL-001", name: "Iron Soldier", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 1000, def: 1200, lvl: 3, element: "earth" as const },
  { cardId: "IL-002", name: "Bronze Centurion", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 1200, def: 1000, lvl: 3, element: "earth" as const },
  { cardId: "IL-003", name: "Steel Knight", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 1400, def: 1400, lvl: 4, element: "earth" as const },
  { cardId: "IL-004", name: "Armored Recruit", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 600, def: 800, lvl: 2, element: "earth" as const },
  { cardId: "IL-005", name: "Battle Sentinel", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 1100, def: 1500, lvl: 4, element: "earth" as const },
  { cardId: "IL-006", name: "Plated Defender", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 800, def: 1600, lvl: 3, element: "earth" as const },
  { cardId: "IL-007", name: "Siege Tank", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 1500, def: 1100, lvl: 4, element: "earth" as const },
  { cardId: "IL-008", name: "Fortified Warden", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 700, def: 1400, lvl: 3, element: "earth" as const },
  { cardId: "IL-009", name: "Heavy Golem", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 1300, def: 1300, lvl: 4, element: "earth" as const },
  { cardId: "IL-010", name: "Iron Phalanx", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 900, def: 1100, lvl: 3, element: "earth" as const },
  { cardId: "IL-011", name: "Shield Bearer", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 500, def: 1800, lvl: 3, element: "earth" as const },
  { cardId: "IL-012", name: "Battle Automaton", archetype: "Iron Legion", cardType: "Monster", rarity: "common", atk: 1100, def: 1100, lvl: 3, element: "earth" as const },
  { cardId: "IL-013", name: "Fortress Guardian", archetype: "Iron Legion", cardType: "Monster", rarity: "uncommon", atk: 1500, def: 1700, lvl: 5, element: "earth" as const },
  { cardId: "IL-014", name: "Iron Juggernaut", archetype: "Iron Legion", cardType: "Monster", rarity: "uncommon", atk: 1800, def: 1600, lvl: 5, element: "earth" as const },
  { cardId: "IL-015", name: "Steel Colossus", archetype: "Iron Legion", cardType: "Monster", rarity: "uncommon", atk: 1600, def: 1800, lvl: 5, element: "earth" as const },
  { cardId: "IL-016", name: "Bronze Titan", archetype: "Iron Legion", cardType: "Monster", rarity: "uncommon", atk: 1700, def: 1500, lvl: 5, element: "earth" as const },
  { cardId: "IL-017", name: "Armored Champion", archetype: "Iron Legion", cardType: "Monster", rarity: "uncommon", atk: 1400, def: 1900, lvl: 5, element: "earth" as const },
  { cardId: "IL-018", name: "Siege General", archetype: "Iron Legion", cardType: "Monster", rarity: "uncommon", atk: 1900, def: 1400, lvl: 5, element: "earth" as const },
  { cardId: "IL-019", name: "Iron Vanguard", archetype: "Iron Legion", cardType: "Monster", rarity: "uncommon", atk: 1300, def: 2000, lvl: 5, element: "earth" as const },
  { cardId: "IL-020", name: "Battle Machina", archetype: "Iron Legion", cardType: "Monster", rarity: "uncommon", atk: 2000, def: 1500, lvl: 5, element: "earth" as const },
  { cardId: "IL-021", name: "Iron Overlord", archetype: "Iron Legion", cardType: "Monster", rarity: "rare", atk: 2200, def: 2000, lvl: 6, element: "earth" as const },
  { cardId: "IL-022", name: "Fortress Titan", archetype: "Iron Legion", cardType: "Monster", rarity: "rare", atk: 2000, def: 2400, lvl: 7, element: "earth" as const },
  { cardId: "IL-023", name: "Steel Behemoth", archetype: "Iron Legion", cardType: "Monster", rarity: "rare", atk: 2400, def: 1800, lvl: 6, element: "earth" as const },
  { cardId: "IL-024", name: "Siege Destroyer", archetype: "Iron Legion", cardType: "Monster", rarity: "rare", atk: 2600, def: 1600, lvl: 6, element: "earth" as const },
  { cardId: "IL-025", name: "Iron Emperor", archetype: "Iron Legion", cardType: "Monster", rarity: "rare", atk: 2100, def: 2200, lvl: 6, element: "earth" as const },
  { cardId: "IL-026", name: "Colossus Prime", archetype: "Iron Legion", cardType: "Monster", rarity: "epic", atk: 2800, def: 2600, lvl: 8, element: "earth" as const },
  { cardId: "IL-027", name: "Fortress Supreme", archetype: "Iron Legion", cardType: "Monster", rarity: "epic", atk: 2600, def: 2800, lvl: 8, element: "earth" as const },
  { cardId: "IL-028", name: "Iron Goliath", archetype: "Iron Legion", cardType: "Monster", rarity: "epic", atk: 3000, def: 2400, lvl: 8, element: "earth" as const },
  { cardId: "IL-029", name: "Legion Commander Magnus", archetype: "Iron Legion", cardType: "Monster", rarity: "legendary", atk: 3200, def: 3000, lvl: 9, element: "earth" as const },
  { cardId: "IL-030", name: "Titan of the Citadel", archetype: "Iron Legion", cardType: "Monster", rarity: "legendary", atk: 3500, def: 3500, lvl: 10, element: "earth" as const },
  { cardId: "IL-031", name: "Iron Fortify", archetype: "Iron Legion", cardType: "Spell", rarity: "common", lvl: 0, element: "earth" as const },
  { cardId: "IL-032", name: "Legion Rally", archetype: "Iron Legion", cardType: "Spell", rarity: "common", lvl: 0, element: "earth" as const },
  { cardId: "IL-033", name: "Steel Recovery", archetype: "Iron Legion", cardType: "Spell", rarity: "common", lvl: 0, element: "earth" as const },
  { cardId: "IL-034", name: "Armored March", archetype: "Iron Legion", cardType: "Spell", rarity: "common", lvl: 0, element: "earth" as const },
  { cardId: "IL-035", name: "Siege Formation", archetype: "Iron Legion", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "earth" as const },
  { cardId: "IL-036", name: "Iron Wall", archetype: "Iron Legion", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "earth" as const },
  { cardId: "IL-037", name: "Battle Cry", archetype: "Iron Legion", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "earth" as const },
  { cardId: "IL-038", name: "Fortress Arsenal", archetype: "Iron Legion", cardType: "Spell", rarity: "rare", lvl: 0, element: "earth" as const },
  { cardId: "IL-039", name: "Legion's Might", archetype: "Iron Legion", cardType: "Spell", rarity: "rare", lvl: 0, element: "earth" as const },
  { cardId: "IL-040", name: "Iron Citadel", archetype: "Iron Legion", cardType: "Field", rarity: "rare", lvl: 0, element: "earth" as const },
  { cardId: "IL-041", name: "Shield Counter", archetype: "Iron Legion", cardType: "Trap", rarity: "common", lvl: 0, element: "earth" as const },
  { cardId: "IL-042", name: "Iron Revenge", archetype: "Iron Legion", cardType: "Trap", rarity: "common", lvl: 0, element: "earth" as const },
  { cardId: "IL-043", name: "Defensive Formation", archetype: "Iron Legion", cardType: "Trap", rarity: "uncommon", lvl: 0, element: "earth" as const },
  { cardId: "IL-044", name: "Legion's Guard", archetype: "Iron Legion", cardType: "Trap", rarity: "uncommon", lvl: 0, element: "earth" as const },
  { cardId: "IL-045", name: "Fortress Lockdown", archetype: "Iron Legion", cardType: "Trap", rarity: "epic", lvl: 0, element: "earth" as const },

  // STORM RIDERS (Wind) - 45 cards
  { cardId: "SR-001", name: "Wind Scout", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 1100, def: 600, lvl: 3, element: "wind" as const },
  { cardId: "SR-002", name: "Sky Hawk", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 900, def: 500, lvl: 2, element: "wind" as const },
  { cardId: "SR-003", name: "Gale Sprite", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 800, def: 400, lvl: 2, element: "wind" as const },
  { cardId: "SR-004", name: "Storm Falcon", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 1300, def: 700, lvl: 4, element: "wind" as const },
  { cardId: "SR-005", name: "Thunder Raven", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 1500, def: 800, lvl: 4, element: "wind" as const },
  { cardId: "SR-006", name: "Zephyr Griffin", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 1200, def: 600, lvl: 3, element: "wind" as const },
  { cardId: "SR-007", name: "Cyclone Rider", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 1400, def: 900, lvl: 4, element: "wind" as const },
  { cardId: "SR-008", name: "Gust Harpy", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 1000, def: 500, lvl: 3, element: "wind" as const },
  { cardId: "SR-009", name: "Tempest Eagle", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 1600, def: 1000, lvl: 4, element: "wind" as const },
  { cardId: "SR-010", name: "Breeze Pixie", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 700, def: 300, lvl: 2, element: "wind" as const },
  { cardId: "SR-011", name: "Lightning Wisp", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 600, def: 200, lvl: 1, element: "wind" as const },
  { cardId: "SR-012", name: "Cloud Serpent", archetype: "Storm Riders", cardType: "Monster", rarity: "common", atk: 1100, def: 800, lvl: 3, element: "wind" as const },
  { cardId: "SR-013", name: "Storm Sentinel", archetype: "Storm Riders", cardType: "Monster", rarity: "uncommon", atk: 1700, def: 1100, lvl: 5, element: "wind" as const },
  { cardId: "SR-014", name: "Gale Lord", archetype: "Storm Riders", cardType: "Monster", rarity: "uncommon", atk: 1900, def: 1000, lvl: 5, element: "wind" as const },
  { cardId: "SR-015", name: "Thunder Wyvern", archetype: "Storm Riders", cardType: "Monster", rarity: "uncommon", atk: 1800, def: 1200, lvl: 5, element: "wind" as const },
  { cardId: "SR-016", name: "Cyclone Master", archetype: "Storm Riders", cardType: "Monster", rarity: "uncommon", atk: 2000, def: 900, lvl: 5, element: "wind" as const },
  { cardId: "SR-017", name: "Sky Commander", archetype: "Storm Riders", cardType: "Monster", rarity: "uncommon", atk: 1600, def: 1300, lvl: 5, element: "wind" as const },
  { cardId: "SR-018", name: "Tempest Rider", archetype: "Storm Riders", cardType: "Monster", rarity: "uncommon", atk: 1500, def: 1100, lvl: 4, element: "wind" as const },
  { cardId: "SR-019", name: "Zephyr Champion", archetype: "Storm Riders", cardType: "Monster", rarity: "uncommon", atk: 1400, def: 1400, lvl: 4, element: "wind" as const },
  { cardId: "SR-020", name: "Lightning Striker", archetype: "Storm Riders", cardType: "Monster", rarity: "uncommon", atk: 2100, def: 800, lvl: 5, element: "wind" as const },
  { cardId: "SR-021", name: "Storm Emperor", archetype: "Storm Riders", cardType: "Monster", rarity: "rare", atk: 2400, def: 1600, lvl: 6, element: "wind" as const },
  { cardId: "SR-022", name: "Thunder Dragon", archetype: "Storm Riders", cardType: "Monster", rarity: "rare", atk: 2600, def: 1800, lvl: 7, element: "wind" as const },
  { cardId: "SR-023", name: "Tempest Overlord", archetype: "Storm Riders", cardType: "Monster", rarity: "rare", atk: 2200, def: 1400, lvl: 6, element: "wind" as const },
  { cardId: "SR-024", name: "Gale Sovereign", archetype: "Storm Riders", cardType: "Monster", rarity: "rare", atk: 2000, def: 1600, lvl: 5, element: "wind" as const },
  { cardId: "SR-025", name: "Cyclone Tyrant", archetype: "Storm Riders", cardType: "Monster", rarity: "rare", atk: 2300, def: 1500, lvl: 6, element: "wind" as const },
  { cardId: "SR-026", name: "Thunder Colossus", archetype: "Storm Riders", cardType: "Monster", rarity: "epic", atk: 2800, def: 2000, lvl: 8, element: "wind" as const },
  { cardId: "SR-027", name: "Storm Titan", archetype: "Storm Riders", cardType: "Monster", rarity: "epic", atk: 3000, def: 2200, lvl: 8, element: "wind" as const },
  { cardId: "SR-028", name: "Tempest Behemoth", archetype: "Storm Riders", cardType: "Monster", rarity: "epic", atk: 2600, def: 1800, lvl: 7, element: "wind" as const },
  { cardId: "SR-029", name: "Sky Lord Zephyros", archetype: "Storm Riders", cardType: "Monster", rarity: "legendary", atk: 3200, def: 2400, lvl: 9, element: "wind" as const },
  { cardId: "SR-030", name: "Primordial Tempest", archetype: "Storm Riders", cardType: "Monster", rarity: "legendary", atk: 3500, def: 2600, lvl: 10, element: "wind" as const },
  { cardId: "SR-031", name: "Lightning Strike", archetype: "Storm Riders", cardType: "Spell", rarity: "common", lvl: 0, element: "wind" as const },
  { cardId: "SR-032", name: "Gale Force", archetype: "Storm Riders", cardType: "Spell", rarity: "common", lvl: 0, element: "wind" as const },
  { cardId: "SR-033", name: "Storm Recovery", archetype: "Storm Riders", cardType: "Spell", rarity: "common", lvl: 0, element: "wind" as const },
  { cardId: "SR-034", name: "Thunder Bolt", archetype: "Storm Riders", cardType: "Spell", rarity: "common", lvl: 0, element: "wind" as const },
  { cardId: "SR-035", name: "Sudden Gust", archetype: "Storm Riders", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "wind" as const },
  { cardId: "SR-036", name: "Cyclone Shield", archetype: "Storm Riders", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "wind" as const },
  { cardId: "SR-037", name: "Tempest Call", archetype: "Storm Riders", cardType: "Spell", rarity: "uncommon", lvl: 0, element: "wind" as const },
  { cardId: "SR-038", name: "Storm Arsenal", archetype: "Storm Riders", cardType: "Spell", rarity: "rare", lvl: 0, element: "wind" as const },
  { cardId: "SR-039", name: "Thunder Realm", archetype: "Storm Riders", cardType: "Spell", rarity: "rare", lvl: 0, element: "wind" as const },
  { cardId: "SR-040", name: "Sky Fortress", archetype: "Storm Riders", cardType: "Field", rarity: "rare", lvl: 0, element: "wind" as const },
  { cardId: "SR-041", name: "Wind Barrier", archetype: "Storm Riders", cardType: "Trap", rarity: "common", lvl: 0, element: "wind" as const },
  { cardId: "SR-042", name: "Lightning Counter", archetype: "Storm Riders", cardType: "Trap", rarity: "common", lvl: 0, element: "wind" as const },
  { cardId: "SR-043", name: "Storm Ambush", archetype: "Storm Riders", cardType: "Trap", rarity: "uncommon", lvl: 0, element: "wind" as const },
  { cardId: "SR-044", name: "Gale Reflection", archetype: "Storm Riders", cardType: "Trap", rarity: "uncommon", lvl: 0, element: "wind" as const },
  { cardId: "SR-045", name: "Tempest Wrath", archetype: "Storm Riders", cardType: "Trap", rarity: "epic", lvl: 0, element: "wind" as const },
];

/**
 * Seed all 180 starter deck cards
 */
export const seedAllStarterCards = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const seeded: string[] = [];
    const skipped: string[] = [];

    for (const card of STARTER_CARDS) {
      // Check if card already exists
      const existing = await ctx.db
        .query("cardDefinitions")
        .withIndex("by_name", (q) => q.eq("name", card.name))
        .first();

      if (existing) {
        skipped.push(card.name);
        continue;
      }

      // Map card type to schema format
      let cardType: "creature" | "spell" | "trap" | "equipment";
      switch (card.cardType.toLowerCase()) {
        case "monster":
          cardType = "creature";
          break;
        case "field":
          cardType = "spell"; // Field spells are still spells
          break;
        default:
          cardType = card.cardType.toLowerCase() as "spell" | "trap" | "equipment";
      }

      const cardData = {
        name: card.name,
        rarity: card.rarity as "common" | "uncommon" | "rare" | "epic" | "legendary",
        archetype: card.element,
        cardType,
        attack: card.atk,
        defense: card.def,
        cost: card.lvl, // Level maps to cost
        ability: undefined, // To be filled in later
        flavorText: undefined,
        imageUrl: undefined,
        isActive: true,
        createdAt: now,
      };

      // Insert into cardDefinitions
      await ctx.db.insert("cardDefinitions", cardData);

      // Also insert into cards table for compatibility
      await ctx.db.insert("cards", cardData);

      seeded.push(card.name);
    }

    return {
      success: true,
      seeded: seeded.length,
      skipped: skipped.length,
      total: STARTER_CARDS.length,
      breakdown: {
        infernalDragons: STARTER_CARDS.filter((c) => c.archetype === "Infernal Dragons").length,
        abyssalDepths: STARTER_CARDS.filter((c) => c.archetype === "Abyssal Depths").length,
        ironLegion: STARTER_CARDS.filter((c) => c.archetype === "Iron Legion").length,
        stormRiders: STARTER_CARDS.filter((c) => c.archetype === "Storm Riders").length,
      },
    };
  },
});
