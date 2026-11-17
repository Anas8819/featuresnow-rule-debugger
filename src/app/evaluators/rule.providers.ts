import { Provider, Type } from '@angular/core';

import { Rule } from '../models';
import { CrossBorderRule } from './cross-border-rule.evaluator';
import { HighRiskMerchantRule } from './high-risk-merchant-rule.evaluator';
import { HighValueRule } from './high-value-rule.evaluator';
import { LargeAtmWithdrawalRule } from './large-atm-withdrawal-rule.evaluator';
import { OutsideHoursRule } from './outside-hours-rule.evaluator';
import { SmallTransactionBurstRule } from './small-transaction-burst-rule.evaluator';
import { UnusualTypeRule } from './unusual-type-rule.evaluator';
import { RULES } from './rules.token';

// The one place a rule is registered. RuleService reads them all through RULES and never changes when one is added.
const ruleTypes: Type<Rule>[] = [
  HighValueRule,
  SmallTransactionBurstRule,
  UnusualTypeRule,
  HighRiskMerchantRule,
  CrossBorderRule,
  OutsideHoursRule,
  LargeAtmWithdrawalRule,
];

export function provideRules(): Provider[] {
  return ruleTypes.map((useClass) => ({ provide: RULES, useClass, multi: true }));
}
