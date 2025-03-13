import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    HttpClientModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredMovies: Movie[] = [];
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMovies().subscribe(
      movies => {
        // Get up to 4 random movies for featured section
        if (movies.length > 0) {
          // Shuffle the array
          const shuffled = [...movies].sort(() => 0.5 - Math.random());
          this.featuredMovies = shuffled.slice(0, 4);
        }
        this.loading = false;
      },
      error => {
        console.error('Error fetching movies:', error);
        this.loading = false;
      }
    );
  }

  // Helper methods for template
  getMovieCoverUrl(movie: Movie): string {
    if (movie.coverUrl && movie.coverUrl.trim() !== '' &&
      movie.coverUrl.startsWith('http')) {
      return movie.coverUrl;
    }
    return 'assets/images/movie-placeholder.jpg';
  }

  getGenreNames(movie: Movie): string {
    if (!movie.genres || movie.genres.length === 0) {
      return 'No genres';
    }
    return movie.genres.map(g => g.name).join(', ');
  }

  getDescription(movie: Movie): string {
    if (!movie.description) {
      return 'No description available';
    }

    const truncated = movie.description.slice(0, 120);
    if (movie.description.length > 120) {
      return truncated + '...';
    }
    return truncated;
  }
}
