import { InjectionToken } from '@angular/core';

import { Rule } from '../models';

// Every rule implementation, each registered as a multi provider by provideRules().
export const RULES = new InjectionToken<Rule[]>('RULES');
