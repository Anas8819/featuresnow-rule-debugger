import { RuleInfo } from './rule-info.model';

export interface Failure {
  rule: RuleInfo;
  reason: string;
}
