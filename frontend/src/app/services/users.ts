import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroment/enviroment';
export interface UserApiResponse {
  id: number;
  email: string;
  name: string;
  companyName: string;
  employmentStatus: number;
  isDeleted: boolean;
  tenantID: number | null;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private baseUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  list(tenantID?: number | null) {
    if (tenantID === null || tenantID === undefined) {
      return this.http.get<UserApiResponse[]>(this.baseUrl, { withCredentials: true });
    }

    const params = new HttpParams().set('tenantID', tenantID.toString());
    return this.http.get<UserApiResponse[]>(`${this.baseUrl}/GetUserListByTenantid`, {
      params,
      withCredentials: true
    });
  }

  create(payload: Record<string, unknown>) {
    return this.http.post<UserApiResponse>(this.baseUrl, payload, { withCredentials: true });
  }

  update(id: number, payload: Record<string, unknown>) {
    return this.http.put<UserApiResponse>(`${this.baseUrl}/${id}`, payload, { withCredentials: true });
  }
}
