import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dash">
      <header class="dash__hero">
        <div>
          <p class="eyebrow">Tableau de bord</p>
          <h1>Bonjour, {{ auth.displayName() || auth.user()?.login }}</h1>
          <p class="dash__sub text-muted">
            Espace commercial Manoha Énergie — rôle
            <strong>{{ auth.roles().join(', ') || 'Utilisateur' }}</strong>
          </p>
        </div>
      </header>

      <section class="dash__grid" aria-label="Accès rapides">
        <a routerLink="/clients" class="dash-card">
          <span class="dash-card__icon dash-card__icon--clients" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13m8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5"/></svg>
          </span>
          <span class="dash-card__body">
            <strong>Clients</strong>
            <span>Portefeuille B2B & fiches client</span>
          </span>
          <span class="dash-card__chev">→</span>
        </a>

        <a routerLink="/devis" class="dash-card">
          <span class="dash-card__icon dash-card__icon--devis" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8zm4 18H6V4h7v5h5z"/></svg>
          </span>
          <span class="dash-card__body">
            <strong>Devis</strong>
            <span>Création, PDF & facturation</span>
          </span>
          <span class="dash-card__chev">→</span>
        </a>

        <a routerLink="/articles" class="dash-card">
          <span class="dash-card__icon dash-card__icon--art" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2m-5 12H9v-2h6zm5-7H4V4h16z"/></svg>
          </span>
          <span class="dash-card__body">
            <strong>Articles</strong>
            <span>Catalogue, prix & stocks</span>
          </span>
          <span class="dash-card__chev">→</span>
        </a>

        <a routerLink="/demandes-achat" class="dash-card">
          <span class="dash-card__icon dash-card__icon--achat" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2M1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2"/></svg>
          </span>
          <span class="dash-card__body">
            <strong>Achats</strong>
            <span>Demandes & suivi articles</span>
          </span>
          <span class="dash-card__chev">→</span>
        </a>
      </section>

      <section class="dash__panel card">
        <h2>Session</h2>
        <dl class="dash__meta">
          <div>
            <dt>Identifiant</dt>
            <dd>{{ auth.user()?.login || '—' }}</dd>
          </div>
          <div>
            <dt>Rôles</dt>
            <dd>{{ auth.roles().join(', ') || '—' }}</dd>
          </div>
          <div>
            <dt>Environnement</dt>
            <dd>Manoha Énergie · Sage 100</dd>
          </div>
        </dl>
      </section>
    </div>
  `,
  styles: `
    .dash__hero {
      margin-bottom: 1.35rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .dash__hero h1 {
      margin: 0.2rem 0 0.35rem;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .dash__sub {
      margin: 0;
      font-size: 0.875rem;
    }

    .dash__sub strong {
      color: var(--color-text-secondary);
      font-weight: 650;
    }

    .dash__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.85rem;
      margin-bottom: 1.25rem;
    }

    .dash-card {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1rem 1.05rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      text-decoration: none;
      color: inherit;
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        transform 0.15s ease;
    }

    .dash-card:hover {
      border-color: #fda4af;
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
      text-decoration: none;
      color: inherit;
    }

    .dash-card__icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .dash-card__icon svg {
      width: 20px;
      height: 20px;
    }

    .dash-card__icon--clients {
      background: #eff6ff;
      color: #2563eb;
    }
    .dash-card__icon--devis {
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }
    .dash-card__icon--art {
      background: #ecfdf5;
      color: #059669;
    }
    .dash-card__icon--achat {
      background: #fff7ed;
      color: #c2410c;
    }

    .dash-card__body {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
      flex: 1;
    }

    .dash-card__body strong {
      font-size: 0.9rem;
      font-weight: 650;
    }

    .dash-card__body span {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .dash-card__chev {
      color: var(--color-text-muted);
      font-size: 1rem;
      font-weight: 600;
    }

    .dash__panel h2 {
      margin: 0 0 0.85rem;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .dash__meta {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.85rem 1.25rem;
      margin: 0;
    }

    .dash__meta dt {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 0.2rem;
    }

    .dash__meta dd {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text);
    }
  `,
})
export class HomeComponent {
  readonly auth = inject(AuthService);
}
