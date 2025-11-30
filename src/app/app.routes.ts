import { Routes } from '@angular/router';
import { GithubProfile } from './components/github-profile/github-profile';

export const routes: Routes = [
  { path: '', component: GithubProfile },
  { path: ':username', component: GithubProfile }
];
