import { FeatureVector } from './feature-vector.model';
import { RuleRecord } from './rule-record.model';
import { TransactionRecord } from './transaction-record.model';

export interface AppData {
  transactions: TransactionRecord[];
  featureVectors: FeatureVector[];
  rules: RuleRecord[];
}
