/**
 * Top-level chainResolver export for backward compatibility
 * Maintains flat API structure (api.chainResolver.*) while code is organized in subdirectories
 */

export {
  addToChain,
  resolveChain,
  passPriority,
  getCurrentChain,
} from "./gameplay/chainResolver";
