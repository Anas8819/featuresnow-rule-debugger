import { Component, input } from '@angular/core';

import { RuleInfo } from '../../models';

// A rule's ID on the left and its severity and action badges on the right (rule cards, rule detail, rule popup).
// The host element is the row itself, so it lays out exactly like the div it replaces.
@Component({
  selector: 'app-rule-tags',
  templateUrl: './rule-tags.component.html',
  host: { class: 'card-top' },
})
export class RuleTags {
  readonly rule = input.required<RuleInfo>();
}
