import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SessionData {
  userId: number;
  email: string;
  name: string;
  companyName: string;
  tenantID: number;
}

const STORAGE_KEY = 'sessionData';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private subject = new BehaviorSubject<SessionData | null>(this.readFromStorage());
  session$ = this.subject.asObservable();

  get value() {
    return this.subject.value;
  }

  set(session: SessionData) {
    this.subject.next(session);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clear() {
    this.subject.next(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private readFromStorage(): SessionData | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionData;
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
