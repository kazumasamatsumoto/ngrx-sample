export interface FilterConfig {
  id: string;
  alias: string;  // 例: "DateRange"
  type: 'dateRange' | 'select' | 'text';
  label: string;
  options?: any[];
}

export interface FilterState {
  config: FilterConfig[] | null;
  loading: boolean;
  error: any | null;
}

export const initialFilterState: FilterState = {
  config: null,
  loading: false,
  error: null
};
