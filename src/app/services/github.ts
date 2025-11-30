import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface ContributionDay {
  date: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  private restBase = 'https://api.github.com';
  private graphqlEndpoint = 'https://api.github.com/graphql';

  constructor(private http: HttpClient) {}

  // Get public user profile via REST API
  getUser(username: string): Observable<GitHubUser> {
    return this.http.get<GitHubUser>(`${this.restBase}/users/${username}`);
  }

  // Get contributions via GraphQL (requires token)
  getContributionsGraphql(username: string, fromIso: string, toIso: string): Observable<ContributionDay[]> {
    const token = environment.githubToken;
    if (!token) {
      return of([]);
    }

    const query = `
      query Contributions($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }`;
    const body = {
      query,
      variables: { login: username, from: fromIso, to: toIso }
    };
    const headers = new HttpHeaders({
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(this.graphqlEndpoint, body, { headers }).pipe(
      map(res => {
        const weeks = res?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
        const days: ContributionDay[] = [];
        for (const week of weeks) {
          for (const d of week.contributionDays) {
            days.push({ date: d.date, count: d.contributionCount });
          }
        }
        return days;
      }),
      catchError(err => {
        console.error('GraphQL contributions failed', err);
        return of([]);
      })
    );
  }

  // Load mock contributions from assets (fallback)
  getMockContributions(): Observable<ContributionDay[]> {
    return this.http.get<ContributionDay[]>('/assets/mock/contributions.json');
  }
}
