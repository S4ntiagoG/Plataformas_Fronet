import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isApiRequest = request.url.startsWith(API_CONFIG.baseUrl);
  const isLoginRequest = request.url.includes(`${API_CONFIG.baseUrl}${API_CONFIG.authPath}/login`);
  const token = isApiRequest && !isLoginRequest ? authService.getToken() : null;
  const authorizedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isLoginRequest) {
        authService.clearSession();
        if (router.url !== '/login') {
          void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        }
      }
      return throwError(() => error);
    })
  );
};