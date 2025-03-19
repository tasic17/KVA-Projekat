import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, finalize, of } from 'rxjs';
import { take } from 'rxjs/operators';

import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';

interface ApiActor {
  actorId: number;
  name: string;
  createdAt: string;
}

interface ApiMovieActor {
  movieActorId: number;
  movieId: number;
  actorId: number;
  actor: ApiActor;
}

interface ApiDirector {
  directorId: number;
  name: string;
  createdAt: string;
}

interface ApiMovie {
  movieId: number;
  internalId: string;
  corporateId: string;
  directorId: number;
  title: string;
  originalTitle: string;
  description: string;
  shortDescription: string;
  poster: string;
  startDate: string;
  shortUrl: string;
  runtime: number;
  createdAt: string;
  updatedAt: string | null;
  director: ApiDirector;
  movieActors: ApiMovieActor[];
}

interface Genre {
  id: number;
  name: string;
}

interface Actor {
  id: number;
  name: string;
}

interface Director {
  id: number;
  name: string;
}

interface Movie {
  id: number;
  title: string;
  description: string;
  releaseDate: string;
  coverUrl: string;
  runtime: number;
  genres: Genre[];
  actors: Actor[];
  directors: Director[];
}

interface Screening {
  id: number;
  movieId: number;
  date: string;
  time: string;
  hall: string;
  price: number;
  availableSeats: number;
}

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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    HttpClientModule
  ],
  templateUrl: './movie-detail.component.html',
  styleUrls: ['./movie-detail.component.css']
})
export class MovieDetailComponent implements OnInit {
  movie: Movie | null = null;
  screenings: Screening[] = [];
  loading = true;
  error = false;
  errorMessage = '';
  movieId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private reservationService: ReservationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMovie();
  }

  loadMovie(): void {
    this.loading = true;
    this.error = false;

    const rawId = this.route.snapshot.paramMap.get('id');
    this.movieId = rawId ? parseInt(rawId, 10) : 0;

    if (isNaN(this.movieId) || this.movieId <= 0) {
      this.error = true;
      this.errorMessage = 'Invalid movie ID';
      this.loading = false;
      return;
    }

    this.http.get<ApiMovie>(`https://movie.pequla.com/api/movie/${this.movieId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching movie:', error);
          this.error = true;
          this.errorMessage = 'Error loading movie data';
          return of(null as ApiMovie | null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(apiMovie => {
        if (apiMovie) {
          this.mapApiMovieToModel(apiMovie);
          this.generateScreenings(apiMovie.movieId);
        }
      });
  }

  mapApiMovieToModel(apiMovie: ApiMovie): void {
    this.movie = {
      id: apiMovie.movieId,
      title: apiMovie.title || 'Unknown Title',
      description: apiMovie.description || 'No description available',
      releaseDate: apiMovie.startDate || '',
      coverUrl: apiMovie.poster || '',
      runtime: apiMovie.runtime || 120,
      genres: [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Thriller' }
      ],
      actors: apiMovie.movieActors ? apiMovie.movieActors.map(ma => ({
        id: ma.actor.actorId,
        name: ma.actor.name
      })) : [],
      directors: apiMovie.director ? [
        {
          id: apiMovie.director.directorId,
          name: apiMovie.director.name
        }
      ] : []
    };
  }

  // Generate some fake screenings for the movie
  generateScreenings(movieId: number): void {
    const today = new Date();
    const screenings: Screening[] = [];

    // Different halls
    const halls = ['Hall A', 'Hall B', 'VIP Hall'];

    // Times
    const times = ['12:30', '15:45', '18:30', '21:00'];

    // Generate screenings for the next 7 days
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Format the date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];

      // Add 1-2 screenings per day
      const numScreenings = Math.floor(Math.random() * 2) + 1;

      for (let j = 0; j < numScreenings; j++) {
        const timeIndex = Math.floor(Math.random() * times.length);
        const hallIndex = Math.floor(Math.random() * halls.length);

        // Vary price based on hall (VIP is more expensive)
        const isVip = halls[hallIndex] === 'VIP Hall';
        const basePrice = isVip ? 650 : 450;

        // Weekend screenings cost more
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const price = isWeekend ? basePrice + 50 : basePrice;

        screenings.push({
          id: (i * 10) + j + 1,
          movieId: movieId,
          date: formattedDate,
          time: times[timeIndex],
          hall: halls[hallIndex],
          price: price,
          availableSeats: Math.floor(Math.random() * 50) + 10
        });
      }
    }

    this.screenings = screenings;
  }

  // Helper methods for the template
  getDirectorNames(): string {
    if (!this.movie?.directors || this.movie.directors.length === 0) {
      return 'Unknown';
    }
    return this.movie.directors.map(d => d.name).join(', ');
  }

  getActorNames(): string {
    if (!this.movie?.actors || this.movie.actors.length === 0) {
      return 'No cast information available';
    }
    return this.movie.actors.map(a => a.name).join(', ');
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  formatDateDay(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } catch (error) {
      return '';
    }
  }

  formatDateMonthDay(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  }

  addToCart(screening: Screening): void {
    // Check if the user is logged in
    this.authService.currentUser$.pipe(
      take(1) // Take only the current value and then complete
    ).subscribe(user => {
      if (!user) {
        // If not logged in, redirect to login
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url }
        });
        return;
      }

      // User is logged in, add to cart using the reservation service
      this.reservationService.addToCart(screening.id).subscribe(
        cart => {
          if (cart) {
            // Show success message with improved visibility
            const message = `Added screening at ${screening.time} on ${this.formatDate(screening.date)} to cart`;

            // Use MatSnackBar with custom styling for better readability
            this.snackBar.open(message, 'View Cart', {
              duration: 5000, // Longer duration for better visibility
              panelClass: ['custom-snackbar'], // Add custom CSS class
              verticalPosition: 'top',
              horizontalPosition: 'center'
            }).onAction().subscribe(() => {
              this.router.navigate(['/cart']);
            });
          } else {
            this.snackBar.open('Failed to add to cart. Please try again.', 'Close', {
              duration: 3000,
              panelClass: ['custom-snackbar-error']
            });
          }
        },
        error => {
          console.error('Error adding to cart:', error);
          this.snackBar.open('Failed to add to cart. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['custom-snackbar-error']
          });
        }
      );
    });
  }

  retry(): void {
    this.loadMovie();
  }
}
