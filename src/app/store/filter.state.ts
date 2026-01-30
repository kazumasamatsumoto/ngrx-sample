export interface FilterState {
  countries: string[];
  regions: string[];
  organizations: string[];
  serialNumber: number | null;
}

export const initialFilterState: FilterState = {
  countries: [],
  regions: [],
  organizations: [],
  serialNumber: null
};
