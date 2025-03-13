import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { Movie } from '../../models/movie.model';
import { Genre } from '../../models/genre.model';
import { Actor } from '../../models/actor.model';
import { Director } from '../../models/director.model';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.css']
})
export class MovieListComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  genres: Genre[] = [];
  actors: Actor[] = [];
  directors: Director[] = [];
  runtimes: number[] = [];

  // Search filters
  searchTerm = '';
  selectedGenre: number | null = null;
  selectedActor: number | null = null;
  selectedDirector: number | null = null;
  selectedRuntime: number | null = null;

  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMovies();
    this.loadFilters();
  }

  loadMovies(): void {
    this.apiService.getMovies().subscribe(
      movies => {
        this.movies = movies;
        this.filteredMovies = movies;
        this.loading = false;
      },
      error => {
        console.error('Error fetching movies:', error);
        this.loading = false;
      }
    );
  }

  loadFilters(): void {
    this.apiService.getGenres().subscribe(
      genres => this.genres = genres,
      error => console.error('Error fetching genres:', error)
    );

    this.apiService.getActors().subscribe(
      actors => this.actors = actors,
      error => console.error('Error fetching actors:', error)
    );

    this.apiService.getDirectors().subscribe(
      directors => this.directors = directors,
      error => console.error('Error fetching directors:', error)
    );

    this.apiService.getMovieRuntimes().subscribe(
      runtimes => this.runtimes = runtimes,
      error => console.error('Error fetching runtimes:', error)
    );
  }

  applyFilters(): void {
    this.loading = true;

    // If no filters are selected, reset to all movies
    if (!this.searchTerm && !this.selectedGenre && !this.selectedActor &&
      !this.selectedDirector && !this.selectedRuntime) {
      this.filteredMovies = this.movies;
      this.loading = false;
      return;
    }

    // Use API filtering when possible
    this.apiService.getMovies(
      this.searchTerm,
      this.selectedActor || undefined,
      this.selectedGenre || undefined,
      this.selectedDirector || undefined,
      this.selectedRuntime || undefined
    ).subscribe(
      movies => {
        this.filteredMovies = movies;
        this.loading = false;
      },
      error => {
        console.error('Error filtering movies:', error);
        this.loading = false;
      }
    );
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedGenre = null;
    this.selectedActor = null;
    this.selectedDirector = null;
    this.selectedRuntime = null;
    this.filteredMovies = this.movies;
  }

  getGenreNames(genres: Genre[]): string {
    return genres?.map(g => g.name).join(', ') || '';
  }

  getDirectorNames(directors: Director[]): string {
    return directors?.map(d => d.name).join(', ') || '';
  }
}
