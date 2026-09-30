import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { LoginRequest, LoginResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorageKey = 'autolog.access-token';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${API_CONFIG.baseUrl}${API_CONFIG.authPath}/login`,
      credentials
    ).pipe(tap((response) => localStorage.setItem(this.tokenStorageKey, response.accessToken)));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }
}