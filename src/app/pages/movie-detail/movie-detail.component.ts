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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../services/api.service';
import { ScreeningService } from '../../services/screening.service';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { Movie } from '../../models/movie.model';
import { Screening } from '../../models/screening.model';
import { Review } from '../../models/review.model';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

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
    MatDialogModule
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private screeningService: ScreeningService,
    private reservationService: ReservationService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });

    this.route.paramMap.pipe(
      switchMap(params => {
        const movieId = Number(params.get('id'));
        if (isNaN(movieId)) {
          this.router.navigate(['/movies']);
          return of(null);
        }

        return forkJoin({
          movie: this.apiService.getMovieById(movieId),
          screenings: this.screeningService.getScreeningsByMovieId(movieId),
          reviews: this.reservationService.getMovieReviews(movieId),
          averageRating: this.reservationService.getAverageRating(movieId)
        });
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
      },
      error => {
        console.error('Error fetching movie details:', error);
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

    this.reservationService.addToCart(screening.id).subscribe(
      cart => {
        if (cart) {
          // Show success message
          alert('Added to cart successfully!');
        } else {
          // Show error message
          alert('Failed to add to cart. Please try again.');
        }
      },
      error => {
        console.error('Error adding to cart:', error);
        alert('Failed to add to cart. Please try again.');
      }
    );
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
