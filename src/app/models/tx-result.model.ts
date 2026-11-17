import { Failure } from './failure.model';
import { Transaction } from './transaction.model';

export interface TxResult {
  tx: Transaction;
  // Empty when the transaction passes every rule.
  failures: Failure[];
}
