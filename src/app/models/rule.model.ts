import { Transaction } from './transaction.model';

export interface Rule {
  // Must match a rule_id in example_rules.json; that file supplies the name and description.
  readonly id: string;
  // The exact check in plain English, shown on the Rules page.
  readonly condition: string;
  // Returns the reason the transaction fails this rule, or null when it passes.
  // senderTxs is every transaction by the same sender, including tx itself.
  check(tx: Transaction, senderTxs: Transaction[]): string | null;
}
