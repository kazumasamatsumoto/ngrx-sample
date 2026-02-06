import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FilterConfig } from '../store/filter/filter.state';

@Injectable({
  providedIn: 'root'
})
export class FilterApiService {
  private readonly apiUrl = '/api/filter-config';  // 実際のエンドポイントに変更

  constructor(private http: HttpClient) {}

  /**
   * フィルター設定を取得
   */
  getFilterConfig(): Observable<FilterConfig[]> {
    return this.http.get<FilterConfig[]>(this.apiUrl);
  }
}
