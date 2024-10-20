import { atom } from 'jotai';
import { type SearchQueryStringsQuery } from '@/graphql/generated/schema-server';

export const searchesAtom = atom<SearchQueryStringsQuery['searchQueryStrings']>([]);
