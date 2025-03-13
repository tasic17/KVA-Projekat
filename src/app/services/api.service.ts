// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Movie } from '../models/movie.model';
import { Genre } from '../models/genre.model';
import { Actor } from '../models/actor.model';
import { Director } from '../models/director.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://movie.pequla.com/api';

  constructor(private http: HttpClient) { }

  // Movie endpoints
  getMovies(search?: string, actor?: number, genre?: number, director?: number, runtime?: number): Observable<Movie[]> {
    let url = `${this.baseUrl}/movie`;

    // Add query parameters if provided
    const params: any = {};
    if (search) params.search = search;
    if (actor) params.actor = actor;
    if (genre) params.genre = genre;
    if (director) params.director = director;
    if (runtime) params.runtime = runtime;

    // Convert params object to URL query string
    const queryParams = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');

    if (queryParams) {
      url += `?${queryParams}`;
    }

    return this.http.get<Movie[]>(url).pipe(
      catchError(this.handleError<Movie[]>('getMovies', []))
    );
  }

  getMovieById(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${this.baseUrl}/movie/${id}`).pipe(
      catchError(this.handleError<Movie>('getMovieById'))
    );
  }

  getMovieByShortUrl(shortUrl: string): Observable<Movie> {
    return this.http.get<Movie>(`${this.baseUrl}/movie/short/${shortUrl}`).pipe(
      catchError(this.handleError<Movie>('getMovieByShortUrl'))
    );
  }

  getMovieRuntimes(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/movie/runtime`).pipe(
      catchError(this.handleError<number[]>('getMovieRuntimes', []))
    );
  }

  // Genre endpoints
  getGenres(search?: string): Observable<Genre[]> {
    let url = `${this.baseUrl}/genre`;
    if (search) {
      url += `?search=${search}`;
    }
    return this.http.get<Genre[]>(url).pipe(
      catchError(this.handleError<Genre[]>('getGenres', []))
    );
  }

  getGenreById(id: number): Observable<Genre> {
    return this.http.get<Genre>(`${this.baseUrl}/genre/${id}`).pipe(
      catchError(this.handleError<Genre>('getGenreById'))
    );
  }

  // Actor endpoints
  getActors(search?: string): Observable<Actor[]> {
    let url = `${this.baseUrl}/actor`;
    if (search) {
      url += `?search=${search}`;
    }
    return this.http.get<Actor[]>(url).pipe(
      catchError(this.handleError<Actor[]>('getActors', []))
    );
  }

  getActorById(id: number): Observable<Actor> {
    return this.http.get<Actor>(`${this.baseUrl}/actor/${id}`).pipe(
      catchError(this.handleError<Actor>('getActorById'))
    );
  }

  // Director endpoints
  getDirectors(search?: string): Observable<Director[]> {
    let url = `${this.baseUrl}/director`;
    if (search) {
      url += `?search=${search}`;
    }
    return this.http.get<Director[]>(url).pipe(
      catchError(this.handleError<Director[]>('getDirectors', []))
    );
  }

  getDirectorById(id: number): Observable<Director> {
    return this.http.get<Director>(`${this.baseUrl}/director/${id}`).pipe(
      catchError(this.handleError<Director>('getDirectorById'))
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   *
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}
