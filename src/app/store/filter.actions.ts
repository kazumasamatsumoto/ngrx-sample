import { createAction, props } from '@ngrx/store';

export const setCountries = createAction(
  '[Filter] Set Countries',
  props<{ countries: string[] }>()
);

export const setRegions = createAction(
  '[Filter] Set Regions',
  props<{ regions: string[] }>()
);

export const setOrganizations = createAction(
  '[Filter] Set Organizations',
  props<{ organizations: string[] }>()
);

export const setSerialNumber = createAction(
  '[Filter] Set Serial Number',
  props<{ serialNumber: number | null }>()
);

export const resetFilters = createAction('[Filter] Reset Filters');
