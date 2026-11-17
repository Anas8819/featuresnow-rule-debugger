export interface RuleInfo {
  rule_id: string;
  name: string;
  description: string;
  action: string;
  severity: string;
  // The exact check in plain English, taken from the rule's implementation by RuleService.
  condition: string;
}
