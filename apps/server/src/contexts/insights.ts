export enum InsightsSearchField {
  AdName = 'a.name',
  AccountName = 'aa.name',
  AdSetName = 'ase.name',
  CampaignName = 'c.name',
}
export enum InsightsSearchOperator {
  Contains = 'contains',
  StartsWith = 'startsWith',
  Equals = 'equals',
}

export interface InsightsSearchTerm {
  field: InsightsSearchField;
  operator: InsightsSearchOperator;
  value: string;
}

export interface InsightsSearchExpression {
  and?: InsightsSearchExpression[] | null;
  or?: InsightsSearchExpression[] | null;
  term?: InsightsSearchTerm | null;
}
