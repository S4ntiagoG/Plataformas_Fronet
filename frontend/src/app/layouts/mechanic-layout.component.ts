import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-mechanic-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './mechanic-layout.component.html',
  styleUrl: './mechanic-layout.component.css'
})
export class MechanicLayoutComponent {
  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}