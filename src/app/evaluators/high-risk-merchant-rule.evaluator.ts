import { Rule, Transaction } from '../models';

export class HighRiskMerchantRule implements Rule {
  readonly id = 'RULE_004';
  // The data provides no high-risk list, so this rule can't fire until names are added here.
  readonly highRiskMerchants: string[] = [];
  readonly condition = `Merchant is on the high-risk list (empty: the data provides no list)`;

  check(tx: Transaction): string | null {
    if (!this.highRiskMerchants.includes(tx.merchant_description_condensed)) return null;
    return `Merchant '${tx.merchant_description_condensed}' is on the high-risk list`;
  }
}
