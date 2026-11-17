import { RuleInfo } from './rule-info.model';
import { TxResult } from './tx-result.model';

// What RuleService.evaluate returns: every rule with its condition, and every transaction with its failures.
export interface Evaluation {
  rules: RuleInfo[];
  results: TxResult[];
}
