import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroment/enviroment';
interface MeResponse {
  userId: number;
  email: string;
  name: string;
  companyName: string;
  tenantID:number;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  // private baseUrl = 'http://localhost:8080/api/auth';

  
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  constructor(private http: HttpClient) {}

  register(
    name: string,
    companyName: string,
    email: string,
    EmploymentStatus: number,
    password: string,
    tenantID: number
  ) {
    return this.http.post(
      `${this.baseUrl}/register`,
      { email, password, name, companyName, EmploymentStatus, tenantID },
      { responseType: 'text', withCredentials: true }
    );
  }

  Companyregister(companyName: string) {
    return this.http.post(
      `${this.baseUrl}/Companyregister`,
      { companyName },
      { withCredentials: true }
    );
  }

  login(email: string, password: string) {
    return this.http.post<MeResponse>(
      `${this.baseUrl}/login`,
      { email, password },
      { withCredentials: true }
    );
  }

  me() {
    return this.http.get<MeResponse>(
      `${this.baseUrl}/me`,
      { withCredentials: true }
    );
  }

  logout() {
    return this.http.post(
      `${this.baseUrl}/logout`,
      {},
      { responseType: 'text', withCredentials: true }
    );
  }

  getEmployeesByTenant() {
    return this.http.get<any[]>(
      `${this.baseUrl}/employees`,
      { withCredentials: true }
    );
  }

  updateUser(id: number, payload: {
    name: string;
    companyName: string;
    email: string;
    employmentStatus: number;
    isDeleted: boolean;
    tenantID: number;
    password?: string;
  }) {
    return this.http.put(
      `${this.baseUrl}/users/${id}`,
      payload,
      { responseType: 'text', withCredentials: true }
    );
  }
}
