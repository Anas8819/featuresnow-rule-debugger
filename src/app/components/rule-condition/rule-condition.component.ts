import { Component, input } from '@angular/core';

import { RuleInfo } from '../../models';

// The grey box with a rule's exact condition (rule cards, rule detail, rule popup).
// The host element is the box itself, so a caller can add its own class to it, like the Rules page's detail-logic.
@Component({
  selector: 'app-rule-condition',
  templateUrl: './rule-condition.component.html',
  host: { class: 'logic' },
})
export class RuleCondition {
  readonly rule = input.required<RuleInfo>();
}
