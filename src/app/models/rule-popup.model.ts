import { Failure } from './failure.model';
import { TxResult } from './tx-result.model';

// What the rule popup shows: one failure of a transaction's result, instead of all of them.
export type RulePopup = Omit<TxResult, 'failures'> & { failure: Failure };
