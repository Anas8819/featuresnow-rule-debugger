import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';

import { RuleCondition } from '../../components/rule-condition/rule-condition.component';
import { RuleTags } from '../../components/rule-tags/rule-tags.component';
import { RuleInfo, TxResult } from '../../models';
import { EvaluationService } from '../../services/evaluation.service';
import { TransactionGridService } from '../../services/transaction-grid.service';

@Component({
  selector: 'app-rules-page',
  imports: [AgGridAngular, DecimalPipe, RouterLink, RuleCondition, RuleTags],
  templateUrl: './rules-page.component.html',
  styleUrl: './rules-page.component.scss',
})
export class RulesPage implements OnInit {
  private readonly evaluationService = inject(EvaluationService);
  private readonly gridService = inject(TransactionGridService);

  // From the URL: /rules shows the list of rules, /rules/RULE_005 shows that rule's failing transactions.
  // An unknown ID also shows the list.
  readonly ruleId = input<string>();

  protected readonly gridOptions = this.gridService.gridOptions;

  protected readonly loading = signal(true);
  // The message to show when the data couldn't be loaded; null when it loaded fine.
  protected readonly error = signal<string | null>(null);
  protected readonly rules = signal<RuleInfo[]>([]);
  protected readonly results = signal<TxResult[]>([]);

  protected readonly selectedRule = computed(() => this.rules().find((rule) => rule.rule_id === this.ruleId()));

  // How many transactions fail each rule, keyed by rule_id. Rules with no failures are absent.
  protected readonly counts = computed(() => {
    const counts: Record<string, number> = {};
    for (const result of this.results()) {
      for (const failure of result.failures) {
        counts[failure.rule.rule_id] = (counts[failure.rule.rule_id] ?? 0) + 1;
      }
    }
    return counts;
  });

  // The transactions that fail the open rule. Same rows as the Transactions page grid, just fewer of them.
  protected readonly failing = computed(() => {
    const ruleId = this.ruleId();
    return this.results().filter((result) => result.failures.some((f) => f.rule.rule_id === ruleId));
  });

  // The shared transaction columns, then the reason this row fails the open rule. The rule is already open,
  // so the Reason column is plain text: no rule chip and no filter.
  // Built from the open rule's rows, so Country and Type only offer values they contain.
  protected readonly columnDefs = computed<ColDef<TxResult>[]>(() => [
    ...this.gridService.transactionColumns(this.failing()),
    {
      headerName: 'Reason',
      valueGetter: (p) => p.data?.failures.find((f) => f.rule.rule_id === this.ruleId())?.reason ?? '',
      cellClass: 'wrap-cell',
      // wrapText lets long reasons wrap instead of being cut off; autoHeight then grows the row to fit them.
      wrapText: true,
      autoHeight: true,
      flex: 1,
      minWidth: 260,
    },
  ]);

  async ngOnInit(): Promise<void> {
    try {
      const evaluation = await this.evaluationService.load();
      this.rules.set(evaluation.rules);
      this.results.set(evaluation.results);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.loading.set(false);
    }
  }
}
