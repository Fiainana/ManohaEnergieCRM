import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { ClientsListComponent } from './features/clients/clients-list/clients-list.component';
import { ClientDetailComponent } from './features/clients/client-detail/client-detail.component';
import { ClientFormComponent } from './features/clients/client-form/client-form.component';
import { FacturesListComponent } from './features/factures/factures-list.component';
import { FactureDetailComponent } from './features/factures/facture-detail.component';
import { ArticlesListComponent } from './features/articles/articles-list.component';
import { ArticleDetailComponent } from './features/articles/article-detail.component';
import { DevisListComponent } from './features/devis/devis-list.component';
import { DevisFormComponent } from './features/devis/devis-form.component';
import { UsersPageComponent } from './features/users/users-page.component';
import { DemandesAchatListComponent } from './features/demandes-achat/demandes-achat-list.component';
import { DemandeAchatFormComponent } from './features/demandes-achat/demande-achat-form.component';
import { DemandeAchatDetailComponent } from './features/demandes-achat/demande-achat-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'clients', component: ClientsListComponent },
      { path: 'clients/nouveau', component: ClientFormComponent },
      { path: 'clients/:numero', component: ClientDetailComponent },
      { path: 'clients/:numero/modifier', component: ClientFormComponent },
      { path: 'factures', component: FacturesListComponent },
      { path: 'factures/:numeroPiece', component: FactureDetailComponent },
      { path: 'articles', component: ArticlesListComponent },
      { path: 'articles/:reference', component: ArticleDetailComponent },
      { path: 'devis', component: DevisListComponent },
      { path: 'devis/nouveau', component: DevisFormComponent },
      { path: 'devis/:numeroPiece', component: DevisFormComponent },
      {
        path: 'demandes-achat',
        component: DemandesAchatListComponent,
        canActivate: [roleGuard('Commercial', 'Admin')],
      },
      {
        path: 'demandes-achat/nouveau',
        component: DemandeAchatFormComponent,
        canActivate: [roleGuard('Commercial', 'Admin')],
      },
      {
        path: 'demandes-achat/:id',
        component: DemandeAchatDetailComponent,
        canActivate: [roleGuard('Commercial', 'Admin')],
      },
      { path: 'utilisateurs', component: UsersPageComponent, canActivate: [roleGuard('Admin')] },
      { path: '**', redirectTo: '' },
    ],
  },
];
