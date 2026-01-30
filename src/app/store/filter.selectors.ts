import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FilterState } from './filter.state';

export const selectFilterState = createFeatureSelector<FilterState>('filter');

export const selectCountries = createSelector(
  selectFilterState,
  (state) => state.countries
);

export const selectRegions = createSelector(
  selectFilterState,
  (state) => state.regions
);

export const selectOrganizations = createSelector(
  selectFilterState,
  (state) => state.organizations
);

export const selectSerialNumber = createSelector(
  selectFilterState,
  (state) => state.serialNumber
);

export const selectAllFilters = createSelector(
  selectFilterState,
  (state) => state
);
