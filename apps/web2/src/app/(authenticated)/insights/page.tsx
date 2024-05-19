import { type ReactNode } from 'react';
import InsightsGrid from './components/insights-grid';
import OrderFilters from './components/order-filters';

export default function Insights(): ReactNode {
  return (
    <>
      <h1>Insights</h1>
      <OrderFilters />
      <InsightsGrid />
    </>
  );
}
