import { RuleInfo } from './rule-info.model';

// example_rules.json has everything about a rule except its condition, which RuleService adds.
export type RuleRecord = Omit<RuleInfo, 'condition'>;
