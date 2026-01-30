import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as FilterActions from '../store/filter.actions';
import * as FilterSelectors from '../store/filter.selectors';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent {
  private store = inject(Store);

  // サンプルデータ
  countryOptions = [
    { id: 'jp', name: '日本' },
    { id: 'us', name: 'アメリカ' },
    { id: 'uk', name: 'イギリス' },
    { id: 'fr', name: 'フランス' },
    { id: 'de', name: 'ドイツ' }
  ];

  regionOptions = [
    { id: 'asia', name: 'アジア' },
    { id: 'europe', name: 'ヨーロッパ' },
    { id: 'america', name: 'アメリカ大陸' },
    { id: 'africa', name: 'アフリカ' },
    { id: 'oceania', name: 'オセアニア' }
  ];

  organizationOptions = [
    { id: 'org1', name: '組織A' },
    { id: 'org2', name: '組織B' },
    { id: 'org3', name: '組織C' },
    { id: 'org4', name: '組織D' },
    { id: 'org5', name: '組織E' }
  ];

  selectedCountries$ = this.store.select(FilterSelectors.selectCountries);
  selectedRegions$ = this.store.select(FilterSelectors.selectRegions);
  selectedOrganizations$ = this.store.select(FilterSelectors.selectOrganizations);
  serialNumber$ = this.store.select(FilterSelectors.selectSerialNumber);

  onCountriesChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selected = Array.from(select.selectedOptions).map(option => option.value);
    this.store.dispatch(FilterActions.setCountries({ countries: selected }));
  }

  onRegionsChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selected = Array.from(select.selectedOptions).map(option => option.value);
    this.store.dispatch(FilterActions.setRegions({ regions: selected }));
  }

  onOrganizationsChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selected = Array.from(select.selectedOptions).map(option => option.value);
    this.store.dispatch(FilterActions.setOrganizations({ organizations: selected }));
  }

  onSerialNumberChange(value: string) {
    const num = value ? parseInt(value, 10) : null;
    this.store.dispatch(FilterActions.setSerialNumber({ serialNumber: num }));
  }

  resetFilters() {
    this.store.dispatch(FilterActions.resetFilters());
  }
}
