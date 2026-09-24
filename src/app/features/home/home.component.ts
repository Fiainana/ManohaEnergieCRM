import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="home">
      <div class="card">
        <h2>Bienvenue, {{ auth.displayName() || auth.user()?.login }}</h2>
        <p class="text-muted">
          Vous êtes connecté au CRM Manoha Énergie via Sage100Api.
        </p>
        <p>
          <strong>Rôles :</strong>
          {{ auth.roles().join(', ') || '—' }}
        </p>
      </div>
    </div>
  `,
  styles: `
    .home h2 {
      margin: 0 0 0.5rem;
      font-size: 1.15rem;
    }
    .home p {
      margin: 0.35rem 0;
    }
  `,
})
export class HomeComponent {
  readonly auth = inject(AuthService);
}
