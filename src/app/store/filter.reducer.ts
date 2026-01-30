import { createReducer, on } from '@ngrx/store';
import { FilterState, initialFilterState } from './filter.state';
import * as FilterActions from './filter.actions';

export const filterReducer = createReducer(
  initialFilterState,
  on(FilterActions.setCountries, (state, { countries }) => ({
    ...state,
    countries
  })),
  on(FilterActions.setRegions, (state, { regions }) => ({
    ...state,
    regions
  })),
  on(FilterActions.setOrganizations, (state, { organizations }) => ({
    ...state,
    organizations
  })),
  on(FilterActions.setSerialNumber, (state, { serialNumber }) => ({
    ...state,
    serialNumber
  })),
  on(FilterActions.resetFilters, () => initialFilterState)
);
