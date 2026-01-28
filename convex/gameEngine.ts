/**
 * Game Engine - Re-export Wrapper
 *
 * This file re-exports all mutations from the modular gameEngine/ directory.
 * The original monolithic implementation has been split into:
 * - gameEngine/summons.ts - Normal Summon, Set Monster, Flip Summon
 * - gameEngine/positions.ts - Change Position
 * - gameEngine/spellsTraps.ts - Set Spell/Trap, Activate Spell, Activate Trap
 * - gameEngine/turns.ts - End Turn
 *
 * Backup of original file: gameEngine.ts.backup
 */

export {
  normalSummon,
  setMonster,
  flipSummon,
  changePosition,
  setSpellTrap,
  activateSpell,
  activateTrap,
  endTurn,
} from "./gameplay/gameEngine/index";
