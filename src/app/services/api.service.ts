import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Movie } from '../models/movie.model';
import { Genre } from '../models/genre.model';
import { Actor } from '../models/actor.model';
import { Director } from '../models/director.model';

// Interfaces for API models
interface ApiGenre {
  genreId: number;
  name: string;
}

interface ApiActor {
  actorId: number;
  name: string;
}

interface ApiDirector {
  directorId: number;
  name: string;
}

interface ApiMovie {
  movieId: number;
  title: string;
  description: string;
  shortDescription?: string;
  shortUrl: string;
  startDate: string;
  poster: string;
  runTime: number;
  director: ApiDirector;
  movieActors: {
    actor: ApiActor
  }[];
  movieGenres: {
    genre: ApiGenre
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://movie.pequla.com/api';

  constructor(private http: HttpClient) {}

  // Movie endpoints
  getMovies(search?: string, actor?: number, genre?: number, director?: number, runtime?: number): Observable<Movie[]> {
    // Construct URL with parameters
    let url = `${this.baseUrl}/movie`;

    // Add parameters to URL
    const params: string[] = [];
    if (search) params.push(`search=${search}`);
    if (actor) params.push(`actor=${actor}`);
    if (genre) params.push(`genre=${genre}`);
    if (director) params.push(`director=${director}`);
    if (runtime) params.push(`runtime=${runtime}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    // Execute HTTP request to the API
    return this.http.get<ApiMovie[]>(url).pipe(
      map(movies => movies.map(movie => this.mapApiMovieToModel(movie))),
      catchError(error => {
        console.error('Error fetching movies:', error);
        return of([]);
      })
    );
  }

  getMovieById(id: number): Observable<Movie | null> {
    console.log(`Fetching movie with ID ${id} from API`);
    return this.http.get<ApiMovie>(`${this.baseUrl}/movie/${id}`).pipe(
      map(movie => {
        console.log('Raw API movie data:', movie);
        return this.mapApiMovieToModel(movie);
      }),
      catchError(error => {
        console.error(`Error fetching movie with id ${id}:`, error);
        return of(null);
      })
    );
  }

  getMovieRuntimes(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/movie/runtime`).pipe(
      catchError(error => {
        console.error('Error fetching movie runtimes:', error);
        return of([]);
      })
    );
  }

  // Genre endpoints
  getGenres(search?: string): Observable<Genre[]> {
    let url = `${this.baseUrl}/genre`;
    if (search) {
      url += `?search=${search}`;
    }

    return this.http.get<ApiGenre[]>(url).pipe(
      map(genres => genres.map(genre => ({
        id: genre.genreId,
        name: genre.name
      }))),
      catchError(error => {
        console.error('Error fetching genres:', error);
        return of([]);
      })
    );
  }

  getGenreById(id: number): Observable<Genre | null> {
    return this.http.get<ApiGenre>(`${this.baseUrl}/genre/${id}`).pipe(
      map(genre => ({
        id: genre.genreId,
        name: genre.name
      })),
      catchError(error => {
        console.error(`Error fetching genre with id ${id}:`, error);
        return of(null);
      })
    );
  }

  // Actor endpoints
  getActors(search?: string): Observable<Actor[]> {
    let url = `${this.baseUrl}/actor`;
    if (search) {
      url += `?search=${search}`;
    }

    return this.http.get<ApiActor[]>(url).pipe(
      map(actors => actors.map(actor => ({
        id: actor.actorId,
        name: actor.name,
        biography: undefined,
        imageUrl: undefined
      }))),
      catchError(error => {
        console.error('Error fetching actors:', error);
        return of([]);
      })
    );
  }

  getActorById(id: number): Observable<Actor | null> {
    return this.http.get<ApiActor>(`${this.baseUrl}/actor/${id}`).pipe(
      map(actor => ({
        id: actor.actorId,
        name: actor.name,
        biography: undefined,
        imageUrl: undefined
      })),
      catchError(error => {
        console.error(`Error fetching actor with id ${id}:`, error);
        return of(null);
      })
    );
  }

  // Director endpoints
  getDirectors(search?: string): Observable<Director[]> {
    let url = `${this.baseUrl}/director`;
    if (search) {
      url += `?search=${search}`;
    }

    return this.http.get<ApiDirector[]>(url).pipe(
      map(directors => directors.map(director => ({
        id: director.directorId,
        name: director.name,
        biography: undefined,
        imageUrl: undefined
      }))),
      catchError(error => {
        console.error('Error fetching directors:', error);
        return of([]);
      })
    );
  }

  getDirectorById(id: number): Observable<Director | null> {
    return this.http.get<ApiDirector>(`${this.baseUrl}/director/${id}`).pipe(
      map(director => ({
        id: director.directorId,
        name: director.name,
        biography: undefined,
        imageUrl: undefined
      })),
      catchError(error => {
        console.error(`Error fetching director with id ${id}:`, error);
        return of(null);
      })
    );
  }

  // Helper method that converts API movie model to application model
  private mapApiMovieToModel(apiMovie: ApiMovie): Movie {
    // Ensure all properties are correctly mapped from API response to your application model
    return {
      id: apiMovie.movieId,
      title: apiMovie.title,
      description: apiMovie.description || '',
      shortUrl: apiMovie.shortUrl || '',
      releaseDate: apiMovie.startDate || '',
      coverUrl: apiMovie.poster || '',
      runtime: apiMovie.runTime || 0,
      genres: apiMovie.movieGenres?.map((mg: { genre: ApiGenre }) => ({
        id: mg.genre.genreId,
        name: mg.genre.name
      })) || [],
      actors: apiMovie.movieActors?.map((ma: { actor: ApiActor }) => ({
        id: ma.actor.actorId,
        name: ma.actor.name,
        biography: undefined,
        imageUrl: undefined
      })) || [],
      directors: apiMovie.director ? [{
        id: apiMovie.director.directorId,
        name: apiMovie.director.name,
        biography: undefined,
        imageUrl: undefined
      }] : []
    };
  }
}
