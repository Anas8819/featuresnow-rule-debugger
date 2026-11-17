import { Rule, Transaction } from '../models';
import { Currency } from '../helpers';

export class SmallTransactionBurstRule implements Rule {
  readonly id = 'RULE_002';
  readonly smallUsd = 10;
  readonly windowMinutes = 60;
  readonly minCount = 5;
  readonly condition = `Amount < ${this.smallUsd} USD and the sender made at least ${this.minCount} such transactions in the last ${this.windowMinutes} minutes`;

  check(tx: Transaction, senderTxs: Transaction[]): string | null {
    if (tx.usd >= this.smallUsd) return null;
    const windowStart = tx.time - this.windowMinutes * 60_000;
    // Counts tx itself too: it is small and inside its own window.
    const smallCount = senderTxs.filter(
      (other) => other.usd < this.smallUsd && other.time > windowStart && other.time <= tx.time,
    ).length;
    if (smallCount < this.minCount) return null;
    return `${smallCount} transactions under ${Currency.money(this.smallUsd)} in the last ${this.windowMinutes} minutes (limit ${this.minCount})`;
  }
}
