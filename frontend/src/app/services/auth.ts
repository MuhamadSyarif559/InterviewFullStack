import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class Auth {
  private baseUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) { }

  register(email: string, password: string) {
    return this.http.post(
      `${this.baseUrl}/register`,
      { email, password },
      { responseType: 'text', withCredentials: true }
    );
  }

  login(email: string, password: string) {
    return this.http.post(
      `${this.baseUrl}/login`,
      { email, password },
      { responseType: 'text', withCredentials: true }
    );
  }

  me() {
    return this.http.get(`${this.baseUrl}/me`, { responseType: 'text', withCredentials: true });
  }

  logout() {
    return this.http.post(`${this.baseUrl}/logout`, {}, { responseType: 'text', withCredentials: true });
  }
}
