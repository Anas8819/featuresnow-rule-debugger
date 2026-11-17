import { Transaction } from '../models';

export class SenderHistory {
  // The sender's history as seen at the moment of tx: only transactions with an earlier timestamp.
  static earlierTransactions(tx: Transaction, senderTxs: Transaction[]): Transaction[] {
    return senderTxs.filter((other) => other.time < tx.time);
  }

  static mostCommonCountry(txs: Transaction[]): string {
    const counts: Record<string, number> = {};
    for (const t of txs) {
      counts[t.merchant_country] = (counts[t.merchant_country] ?? 0) + 1;
    }
    let best = '';
    for (const country in counts) {
      if (best === '' || counts[country] > counts[best]) {
        best = country;
      }
    }
    return best;
  }
}
