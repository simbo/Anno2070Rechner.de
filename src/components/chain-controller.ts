import type { InjectionKey } from 'vue';

import type { GroupState, ProductionState } from '../models/chain-state';

/**
 * Actions of a displayed commodity chain, provided to all its levels.
 */
export interface ChainController {
  choose: (group: GroupState, production: ProductionState) => void;
  activate: (production: ProductionState) => void;
  deactivate: (group: GroupState, production: ProductionState) => void;
  leave: (production: ProductionState) => void;
  productivity: (production: ProductionState, text: string) => void;
}

/**
 * Injection key of the chain controller.
 */
export const chainControllerKey: InjectionKey<ChainController> = Symbol('chain-controller');
