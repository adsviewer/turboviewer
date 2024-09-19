import {
  type InsightsSearchExpression,
  type InsightsSearchField,
  type InsightsSearchOperator,
} from '@/graphql/generated/schema-server';

export enum AndOrEnum {
  AND = 'AND',
  OR = 'OR',
}

export interface SearchTermType {
  key: string;
  andOrValue: AndOrEnum;
  searchOperator: InsightsSearchOperator;
  searchField: InsightsSearchField;
  searchValue: string;
  searchTerms: SearchTermType[];
  depth: number;
  isRoot?: boolean;
}

export type SearchExpression = InsightsSearchExpression & {
  isAdvancedSearch?: boolean;
  clientSearchTerms?: SearchTermType[];
};

export const isAndOrEnum = (value: string): value is AndOrEnum => Object.values(AndOrEnum).includes(value as AndOrEnum);
