import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';

import { ScreeningService } from '../../services/screening.service';
import { ApiService } from '../../services/api.service';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';

import { Screening } from '../../models/screening.model';
import { Movie } from '../../models/movie.model';
import { Genre } from '../../models/genre.model';

@Component({
  selector: 'app-screening-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    HttpClientModule,
  ],
  templateUrl: './screening-list.component.html',
  styleUrls: ['./screening-list.component.css']
})
export class ScreeningListComponent implements OnInit {
  // Screenings data
  allScreenings: Screening[] = [];
  filteredScreenings: Screening[] = [];
  movies: Movie[] = [];

  // Filter state
  selectedDate: Date | null = null;
  selectedMovieId: number | null = null;
  priceRange: string | null = null;

  // UI state
  loading = true;
  isLoggedIn = false;

  constructor(
    private screeningService: ScreeningService,
    private apiService: ApiService,
    private reservationService: ReservationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check login status
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });

    // Load movies for filter
    this.apiService.getMovies().subscribe(
      movies => {
        this.movies = movies;
      },
      error => {
        console.error('Error loading movies:', error);
      }
    );

    // Load all screenings
    this.loadScreenings();
  }

  loadScreenings(): void {
    this.loading = true;
    this.screeningService.getScreenings().subscribe(
      screenings => {
        this.allScreenings = screenings;
        this.filteredScreenings = screenings;
        this.loading = false;
      },
      error => {
        console.error('Error loading screenings:', error);
        this.loading = false;
      }
    );
  }

  onDateChanged(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.loading = true;

    // Convert filters to appropriate format
    const dateFilter = this.selectedDate ?
      this.selectedDate.toISOString().split('T')[0] : undefined;

    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (this.priceRange === 'low') {
      maxPrice = 450;
    } else if (this.priceRange === 'medium') {
      minPrice = 450;
      maxPrice = 550;
    } else if (this.priceRange === 'high') {
      minPrice = 550;
    }

    // Apply filters through service
    this.screeningService.getScreenings(
      dateFilter,
      this.selectedMovieId || undefined,
      minPrice,
      maxPrice
    ).subscribe(
      screenings => {
        this.filteredScreenings = screenings;
        this.loading = false;
      },
      error => {
        console.error('Error filtering screenings:', error);
        this.loading = false;
      }
    );
  }

  resetFilters(): void {
    this.selectedDate = null;
    this.selectedMovieId = null;
    this.priceRange = null;
    this.filteredScreenings = this.allScreenings;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  // Helper methods for images and nested properties
  getScreeningMovieCoverUrl(screening: Screening): string {
    if (screening.movie?.coverUrl &&
      screening.movie.coverUrl.trim() !== '' &&
      screening.movie.coverUrl.startsWith('http')) {
      return screening.movie.coverUrl;
    }
    return 'assets/images/movie-placeholder.jpg';
  }

  getScreeningMovieTitle(screening: Screening): string {
    return screening.movie?.title || 'Unknown Movie';
  }

  getScreeningMovieDuration(screening: Screening): string {
    if (!screening.movie?.runtime) return 'Unknown duration';

    const runtime = screening.movie.runtime;
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  hasScreeningMovieGenres(screening: Screening): boolean {
    return !!screening.movie?.genres && screening.movie.genres.length > 0;
  }

  getScreeningMovieGenres(screening: Screening): Genre[] {
    if (!screening.movie?.genres) return [];
    return screening.movie.genres.slice(0, 3); // Limit to 3 genres
  }

  isLowSeats(screening: Screening): boolean {
    return screening.availableSeats < 10;
  }

  addToCart(screening: Screening): void {
    if (!this.isLoggedIn) {
      // Redirect to login if user is not logged in
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.reservationService.addToCart(screening.id).subscribe(
      cart => {
        if (cart) {
          // Show success message
          alert('Added to cart successfully!');
        } else {
          alert('Failed to add to cart. Please try again.');
        }
      },
      error => {
        console.error('Error adding to cart:', error);
        alert('Failed to add to cart. Please try again.');
      }
    );
  }
}
