import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { ClientsListComponent } from './features/clients/clients-list/clients-list.component';
import { ClientDetailComponent } from './features/clients/client-detail/client-detail.component';
import { ClientFormComponent } from './features/clients/client-form/client-form.component';
import { FactureDetailComponent } from './features/factures/facture-detail.component';
import { ArticlesListComponent } from './features/articles/articles-list.component';
import { ArticleDetailComponent } from './features/articles/article-detail.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
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
      { path: 'factures/:numeroPiece', component: FactureDetailComponent },
      { path: 'articles', component: ArticlesListComponent },
      { path: 'articles/:reference', component: ArticleDetailComponent },
      { path: '**', redirectTo: '' },
    ],
  },
];
