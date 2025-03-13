import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { ScreeningService } from '../../services/screening.service';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { Movie } from '../../models/movie.model';
import { Screening } from '../../models/screening.model';
import { Review } from '../../models/review.model';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    HttpClientModule,
  ],
  templateUrl: './movie-detail.component.html',
  styleUrls: ['./movie-detail.component.css']
})
export class MovieDetailComponent implements OnInit {
  movie: Movie | null = null;
  screenings: Screening[] = [];
  reviews: Review[] = [];
  averageRating = 0;

  loading = true;
  isLoggedIn = false;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private screeningService: ScreeningService,
    private reservationService: ReservationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });

    this.route.paramMap.pipe(
      switchMap(params => {
        const movieId = Number(params.get('id'));
        if (isNaN(movieId)) {
          this.error = true;
          this.loading = false;
          return of(null);
        }

        // Dodajem catchError da se rukuje sa mogućim API greškama
        return this.apiService.getMovieById(movieId).pipe(
          catchError(err => {
            console.error('Error fetching movie:', err);
            this.error = true;
            return of(null);
          }),
          switchMap(movie => {
            if (!movie) {
              this.error = true;
              this.loading = false;
              return of(null);
            }

            return forkJoin({
              movie: of(movie),
              screenings: this.screeningService.getScreeningsByMovieId(movieId).pipe(
                catchError(err => {
                  console.error('Error fetching screenings:', err);
                  return of([]);
                })
              ),
              reviews: this.reservationService.getMovieReviews(movieId).pipe(
                catchError(err => {
                  console.error('Error fetching reviews:', err);
                  return of([]);
                })
              ),
              averageRating: this.reservationService.getAverageRating(movieId).pipe(
                catchError(err => {
                  console.error('Error fetching average rating:', err);
                  return of(0);
                })
              )
            });
          })
        );
      })
    ).subscribe(
      result => {
        if (result) {
          this.movie = result.movie;
          this.screenings = result.screenings;
          this.reviews = result.reviews;
          this.averageRating = result.averageRating;
        }
        this.loading = false;
      }
    );
  }

  addToCart(screening: Screening): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.reservationService.addToCart(screening.id).subscribe({
      next: (cart) => {
        if (cart) {
          // Show success message
          alert('Added to cart successfully!');
        } else {
          // Show error message
          alert('Failed to add to cart. Please try again.');
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        alert('Failed to add to cart. Please try again.');
      }
    });
  }

  // Helper methods for template
  getMovieCoverUrl(): string {
    if (this.movie?.coverUrl && this.movie.coverUrl.trim() !== '' &&
      this.movie.coverUrl.startsWith('http')) {
      return this.movie.coverUrl;
    }
    return 'assets/images/movie-placeholder.jpg';
  }

  hasGenres(): boolean {
    return !!this.movie?.genres && this.movie.genres.length > 0;
  }

  hasDirectors(): boolean {
    return !!this.movie?.directors && this.movie.directors.length > 0;
  }

  hasActors(): boolean {
    return !!this.movie?.actors && this.movie.actors.length > 0;
  }

  getDirectorNames(): string {
    if (!this.movie?.directors || this.movie.directors.length === 0) {
      return '';
    }
    return this.movie.directors.map(d => d.name).join(', ');
  }
  getActorNames(): string {
    if (!this.movie?.actors || this.movie.actors.length === 0) {
      return '';
    }
    return this.movie.actors.map(a => a.name).join(', ');
  }

  isLowSeats(screening: Screening): boolean {
    return screening.availableSeats < 10;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateDay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  formatDateMonthDay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  formatReviewDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getRatingStars(rating: number): string[] {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return [
      ...Array(fullStars).fill('star'),
      ...(halfStar ? ['star_half'] : []),
      ...Array(emptyStars).fill('star_border')
    ];
  }
}
