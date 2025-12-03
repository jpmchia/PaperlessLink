/**
 * Query params utility functions
 * Ported from Angular query-params.ts
 */

import { FilterRule } from '../data/filter-rule'
import {
  FILTER_RULE_TYPES,
  FilterRuleType,
  NEGATIVE_NULL_FILTER_VALUE,
} from '../data/filter-rule-type'

export type QueryParams = Record<string, string | number | undefined>

export function queryParamsFromFilterRules(filterRules: FilterRule[] | null | undefined): QueryParams | null {
  if (filterRules) {
    let params: QueryParams = {}
    for (let rule of filterRules) {
      let ruleType = FILTER_RULE_TYPES.find((t) => t.id == rule.rule_type)
      if (!ruleType) continue
      
      if (ruleType.isnull_filtervar && rule.value == null) {
        params[ruleType.isnull_filtervar] = 1
      } else if (
        ruleType.isnull_filtervar &&
        rule.value == NEGATIVE_NULL_FILTER_VALUE.toString()
      ) {
        params[ruleType.isnull_filtervar] = 0
      } else if (ruleType.multi) {
        params[ruleType.filtervar] = params[ruleType.filtervar]
          ? (params[ruleType.filtervar] as string) + ',' + rule.value
          : rule.value
      } else {
        params[ruleType.filtervar] = rule.value
        if (ruleType.datatype == 'boolean')
          params[ruleType.filtervar] =
            rule.value == 'true' || rule.value == '1' ? 1 : 0
      }
    }
    return params
  } else {
    return null
  }
}


