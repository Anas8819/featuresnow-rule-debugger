import { Rule, Transaction } from '../models';
import { Currency, SenderHistory } from '../helpers';

export class CrossBorderRule implements Rule {
  readonly id = 'RULE_005';
  readonly minHistory = 10;
  readonly minUsd = 250;
  readonly condition = `Merchant country differs from the most common country in the sender's earlier transactions (needs at least ${this.minHistory}) and amount ≥ ${this.minUsd} USD`;

  check(tx: Transaction, senderTxs: Transaction[]): string | null {
    const earlier = SenderHistory.earlierTransactions(tx, senderTxs);
    if (earlier.length < this.minHistory) return null;
    const usualCountry = SenderHistory.mostCommonCountry(earlier);
    if (tx.merchant_country === usualCountry) return null;
    if (tx.usd < this.minUsd) return null;
    return `Country ${tx.merchant_country} differs from the sender's usual ${usualCountry}, and ${Currency.money(tx.usd)} is at least ${Currency.money(this.minUsd)}`;
  }
}
