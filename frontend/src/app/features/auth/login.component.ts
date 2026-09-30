import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination = requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//')
          ? requestedUrl
          : '/dashboard';
        void this.router.navigateByUrl(destination);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.errorMessage.set('Usuario o contraseña inválidos.');
        } else if (error instanceof HttpErrorResponse && error.status === 0) {
          this.errorMessage.set('No se pudo conectar con el servidor. Verifica que el backend esté activo.');
        } else {
          this.errorMessage.set('No fue posible iniciar sesión. Intenta de nuevo.');
        }
      }
    });
  }
}