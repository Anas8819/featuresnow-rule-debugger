import { Injectable } from '@angular/core';

import { AppData, FeatureVector, RuleRecord, TransactionRecord } from '../models';

@Injectable({ providedIn: 'root' })
export class DataService {
  async load(): Promise<AppData> {
    const [transactions, featureVectors, rules] = await Promise.all([
      this.readJson<TransactionRecord[]>('data/transactions.json'),
      this.readJson<FeatureVector[]>('data/feature_vectors.json'),
      this.readJson<RuleRecord[]>('data/example_rules.json'),
    ]);
    return { transactions, featureVectors, rules };
  }

  private async readJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    // A missing file comes back as an error page, not JSON, so stop here with a message the page can show.
    if (!response.ok) {
      throw new Error(`Couldn't load ${url} (HTTP ${response.status}). Check that it is in public/data and reload.`);
    }
    const text = await response.text();
    // The files contain bare NaN, which isn't valid JSON.
    return JSON.parse(text.replaceAll(': NaN', ': null'));
  }
}
