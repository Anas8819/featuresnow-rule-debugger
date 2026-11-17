import { Rule, Transaction } from '../models';
import { Currency } from '../helpers';

export class HighValueRule implements Rule {
  readonly id = 'RULE_001';
  readonly minUsd = 1000;
  readonly condition = `Amount in USD > ${this.minUsd}`;

  check(tx: Transaction): string | null {
    if (tx.usd <= this.minUsd) return null;
    return `Amount ${Currency.money(tx.usd)} is above ${Currency.money(this.minUsd)}`;
  }
}
