import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Movie } from '../models/movie.model';
import { Genre } from '../models/genre.model';
import { Actor } from '../models/actor.model';
import { Director } from '../models/director.model';

// Interfejsi za API modele
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
  shortUrl: string;
  startDate: string;
  poster: string;
  runTime: number;
  directorId: number;
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
    // Konstruisanje URL-a sa parametrima
    let url = `${this.baseUrl}/movie`;

    // Dodajemo parametre u URL
    const params: string[] = [];
    if (search) params.push(`search=${search}`);
    if (actor) params.push(`actor=${actor}`);
    if (genre) params.push(`genre=${genre}`);
    if (director) params.push(`director=${director}`);
    if (runtime) params.push(`runtime=${runtime}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    // Izvršavamo HTTP zahtev ka API-ju
    return this.http.get<ApiMovie[]>(url).pipe(
      map(movies => movies.map(movie => this.mapApiMovieToModel(movie))),
      catchError(error => {
        console.error('Error fetching movies:', error);
        return of([]);
      })
    );
  }

  getMovieById(id: number): Observable<Movie | null> {
    return this.http.get<ApiMovie>(`${this.baseUrl}/movie/${id}`).pipe(
      map(movie => this.mapApiMovieToModel(movie)),
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

  // Helper metoda koja konvertuje API model filma u model aplikacije
  private mapApiMovieToModel(apiMovie: ApiMovie): Movie {
    return {
      id: apiMovie.movieId,
      title: apiMovie.title,
      description: apiMovie.description,
      shortUrl: apiMovie.shortUrl,
      releaseDate: apiMovie.startDate,
      coverUrl: apiMovie.poster,
      runtime: apiMovie.runTime,
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
      directors: [
        {
          id: apiMovie.director.directorId,
          name: apiMovie.director.name,
          biography: undefined,
          imageUrl: undefined
        }
      ]
    };
  }
}
