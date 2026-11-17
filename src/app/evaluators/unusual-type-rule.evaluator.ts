import { Rule, Transaction } from '../models';
import { SenderHistory } from '../helpers';

export class UnusualTypeRule implements Rule {
  readonly id = 'RULE_003';
  readonly minHistory = 10;
  readonly rareShare = 0.05;
  readonly condition = `The type makes up less than ${this.percent(this.rareShare)} of the sender's earlier transactions (needs at least ${this.minHistory})`;

  check(tx: Transaction, senderTxs: Transaction[]): string | null {
    if (tx.transaction_type === null) return null;
    const earlier = SenderHistory.earlierTransactions(tx, senderTxs);
    // Without enough history every type looks unusual, and with none the share would be 0 / 0.
    if (earlier.length < this.minHistory) return null;
    const sameType = earlier.filter((other) => other.transaction_type === tx.transaction_type).length;
    const share = sameType / earlier.length;
    if (share >= this.rareShare) return null;
    return `Type '${tx.transaction_type}' is ${this.percent(share)} of this sender's ${earlier.length} earlier transactions (below ${this.percent(this.rareShare)})`;
  }

  private percent(share: number): string {
    return (share * 100).toFixed(1) + '%';
  }
}
