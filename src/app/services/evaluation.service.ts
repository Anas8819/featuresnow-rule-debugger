import { Injectable, inject } from '@angular/core';

import { Evaluation } from '../models';
import { DataService } from './data.service';
import { RuleService } from './rule.service';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly dataService = inject(DataService);
  private readonly ruleService = inject(RuleService);
  private evaluation?: Promise<Evaluation>;

  // Both pages share one evaluation: the files are read and the rules run only on first use (about 4s).
  // A failed load stays cached too, which is why the error message asks for a reload.
  load(): Promise<Evaluation> {
    this.evaluation ??= this.dataService
      .load()
      .then((data) => this.ruleService.evaluate(data.transactions, data.featureVectors, data.rules));
    return this.evaluation;
  }
}
