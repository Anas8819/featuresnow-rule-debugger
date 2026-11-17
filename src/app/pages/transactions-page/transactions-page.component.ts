import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ICellRendererParams } from 'ag-grid-community';

import { RuleCondition } from '../../components/rule-condition/rule-condition.component';
import { RuleTags } from '../../components/rule-tags/rule-tags.component';
import { Failure, RuleInfo, RulePopup, Transaction, TxResult } from '../../models';
import { EvaluationService } from '../../services/evaluation.service';
import { TransactionGridService } from '../../services/transaction-grid.service';

@Component({
  selector: 'app-transactions-page',
  imports: [AgGridAngular, DecimalPipe, RuleCondition, RuleTags],
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.scss',
})
export class TransactionsPage implements OnInit {
  private readonly evaluationService = inject(EvaluationService);
  private readonly gridService = inject(TransactionGridService);
  private readonly ruleDialog = viewChild.required<ElementRef<HTMLDialogElement>>('ruleDialog');

  // The Failed rules value for a row that passed every rule. Other rows hold their failed rule IDs: "RULE_001,RULE_005".
  private readonly passed = '—';

  protected readonly gridOptions = this.gridService.gridOptions;

  protected readonly loading = signal(true);
  // The message to show when the data couldn't be loaded; null when it loaded fine.
  protected readonly error = signal<string | null>(null);
  protected readonly rules = signal<RuleInfo[]>([]);
  protected readonly results = signal<TxResult[]>([]);
  // null while the popup is closed.
  protected readonly popup = signal<RulePopup | null>(null);

  // The shared transaction columns, then this page's Failed rules column.
  // The dropdown options come from the data, so the columns are rebuilt once it is loaded.
  protected readonly columnDefs = computed<ColDef<TxResult>[]>(() => [
    ...this.gridService.transactionColumns(this.results()),
    {
      headerName: 'Failed rules',
      // The value is the failed rule IDs, which the filter reads and the column sorts by, so rows failing the same
      // rules sit together and "—" (passed every rule) sorts after every rule ID. The cell renderer draws the chips.
      valueGetter: (p) => (p.data ? this.failedRuleIds(p.data) : this.passed),
      cellRenderer: this.failedRulesCell,
      ...this.failedRulesFilter(this.rules()),
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

  protected closeRule(): void {
    this.ruleDialog().nativeElement.close();
  }

  private openRule(tx: Transaction, failure: Failure): void {
    this.popup.set({ tx, failure });
    this.ruleDialog().nativeElement.showModal();
  }

  // Failed rules: "—" keeps transactions that passed every rule, "All rules" keeps those that failed any rule,
  // and each rule keeps those that failed that rule. Rules are listed by ID only, like the chips in the cells:
  // full names don't fit the filter popup.
  private failedRulesFilter(rules: RuleInfo[]) {
    const grid = this.gridService;
    return grid.dropdownFilter([
      grid.option('passed', '— (passed all rules)', (cell) => cell === this.passed),
      grid.option('anyRule', 'All rules', (cell) => cell !== this.passed),
      ...rules.map((rule) =>
        grid.option(rule.rule_id, rule.rule_id, (cell) => cell.split(',').includes(rule.rule_id)),
      ),
    ]);
  }

  private failedRuleIds(row: TxResult): string {
    return row.failures.length === 0
      ? this.passed
      : row.failures.map((f) => f.rule.rule_id).join(',');
  }

  // One line per failed rule: a rule-ID chip button, then the reason. Clicking the chip opens the rule popup.
  // Built with textContent rather than an HTML string, because reasons can contain merchant names from the data.
  // An arrow function because AG Grid calls it on its own, and the chips still need this page's openRule.
  private readonly failedRulesCell = (params: ICellRendererParams<TxResult>): HTMLElement => {
    const cell = document.createElement('div');
    const row = params.data;
    if (!row || row.failures.length === 0) {
      cell.className = 'muted';
      cell.textContent = this.passed;
      return cell;
    }
    for (const failure of row.failures) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = failure.rule.rule_id;
      chip.title = `Why ${row.tx.transaction_id} fails ${failure.rule.rule_id}`;
      chip.addEventListener('click', () => this.openRule(row.tx, failure));
      const line = document.createElement('div');
      line.append(chip, ' ' + failure.reason);
      cell.append(line);
    }
    return cell;
  };
}
