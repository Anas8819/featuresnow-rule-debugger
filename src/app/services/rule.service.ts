import { Injectable, inject } from '@angular/core';

import { RULES } from '../evaluators';
import { Currency } from '../helpers';
import { Evaluation, Failure, FeatureVector, RuleRecord, Transaction, TransactionRecord } from '../models';

@Injectable({ providedIn: 'root' })
export class RuleService {
  // Rules are registered in evaluators/rule.providers.ts, so adding one never touches this service.
  private readonly evaluators = inject(RULES);

  evaluate(transactions: TransactionRecord[], featureVectors: FeatureVector[], rules: RuleRecord[]): Evaluation {
    // Each rule from example_rules.json is paired with its implementation once, up front, and gets its condition.
    // A rule with no implementation never fails.
    const checks = rules.map((rule) => {
      const implementation = this.evaluators.find((evaluator) => evaluator.id === rule.rule_id);
      const info = { ...rule, condition: implementation?.condition ?? 'No implementation for this rule.' };
      return { info, implementation };
    });

    const joined = this.join(transactions, featureVectors);
    const transactionsBySender = this.groupBySender(joined);

    const results = joined.map((tx) => {
      const senderTxs = transactionsBySender.get(tx.sender_account_id)!;
      const failures: Failure[] = [];
      for (const { info, implementation } of checks) {
        const reason = implementation?.check(tx, senderTxs);
        if (reason) {
          failures.push({ rule: info, reason });
        }
      }
      return { tx, failures };
    });

    return { rules: checks.map((check) => check.info), results };
  }

  // Adds hour_of_day from the matching feature vector, time parsed from txn_date_time, and the USD amount.
  private join(transactions: TransactionRecord[], featureVectors: FeatureVector[]): Transaction[] {
    const featureVectorById = new Map(featureVectors.map((fv) => [fv.transaction_id, fv]));
    return transactions.map((tx) => ({
      ...tx,
      hour_of_day: featureVectorById.get(tx.transaction_id)!.hour_of_day,
      time: new Date(tx.txn_date_time.replace(' ', 'T')).getTime(),
      usd: Currency.usd(tx),
    }));
  }

  private groupBySender(transactions: Transaction[]): Map<string, Transaction[]> {
    const bySender = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const senderTxs = bySender.get(tx.sender_account_id);
      if (senderTxs) {
        senderTxs.push(tx);
      } else {
        bySender.set(tx.sender_account_id, [tx]);
      }
    }
    return bySender;
  }
}
