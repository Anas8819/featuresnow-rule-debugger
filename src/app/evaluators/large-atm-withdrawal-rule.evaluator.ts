import { Rule, Transaction } from '../models';
import { Currency } from '../helpers';

export class LargeAtmWithdrawalRule implements Rule {
  readonly id = 'RULE_007';
  readonly minUsd = 500;
  // The data has no 'atm' transaction type, so this never fires.
  readonly condition = `Type is 'atm' and amount > ${this.minUsd} USD (the data has no 'atm' type)`;

  check(tx: Transaction): string | null {
    if (tx.transaction_type !== 'atm') return null;
    if (tx.usd <= this.minUsd) return null;
    return `ATM withdrawal of ${Currency.money(tx.usd)} is above ${Currency.money(this.minUsd)}`;
  }
}
