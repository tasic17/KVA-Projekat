import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';

import { Reservation } from '../../models/reservation.model';
import { RatingDialogComponent, RatingDialogResult } from '../../components/rating-dialog/rating-dialog.component';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './my-reservations.component.html',
  styleUrls: ['./my-reservations.component.css']
})
export class MyReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  upcomingReservations: Reservation[] = [];
  watchedReservations: Reservation[] = [];
  canceledReservations: Reservation[] = [];

  loading = true;

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    const user = this.authService.currentUser;

    if (user) {
      this.reservationService.getUserReservations(user.id).subscribe(
        (reservations) => {
          this.reservations = reservations;

          // Filter reservations by status
          this.upcomingReservations = reservations.filter(r => r.status === 'reserved');
          this.watchedReservations = reservations.filter(r => r.status === 'watched');
          this.canceledReservations = reservations.filter(r => r.status === 'canceled');

          this.loading = false;
        },
        (error) => {
          console.error('Error loading reservations:', error);
          this.loading = false;
          this.snackBar.open('Failed to load reservations. Please try again.', 'Close', {
            duration: 3000
          });
        }
      );
    } else {
      this.loading = false;
    }
  }

  cancelReservation(reservationId: number): void {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      this.reservationService.cancelReservation(reservationId).subscribe(
        (success) => {
          if (success) {
            this.loadReservations();
            this.snackBar.open('Reservation canceled successfully.', 'Close', {
              duration: 3000
            });
          } else {
            this.snackBar.open('Failed to cancel reservation.', 'Close', {
              duration: 3000
            });
          }
        },
        (error) => {
          console.error('Error canceling reservation:', error);
          this.snackBar.open('An error occurred. Please try again.', 'Close', {
            duration: 3000
          });
        }
      );
    }
  }

  openRatingDialog(reservation: Reservation): void {
    if (!reservation.screening?.movie) {
      this.snackBar.open('Cannot rate this reservation.', 'Close', {
        duration: 3000
      });
      return;
    }

    const dialogRef = this.dialog.open(RatingDialogComponent, {
      width: '500px',
      data: {
        reservationId: reservation.id,
        movie: reservation.screening.movie,
        screening: reservation.screening
      }
    });

    dialogRef.afterClosed().subscribe((result: RatingDialogResult) => {
      if (result) {
        this.rateReservation(reservation.id, result.rating, result.reviewText);
      }
    });
  }

  rateReservation(reservationId: number, rating: number, reviewText?: string): void {
    this.reservationService.rateReservation(reservationId, rating, reviewText).subscribe(
      (updatedReservation) => {
        // Update the reservation in the list
        const index = this.reservations.findIndex(r => r.id === reservationId);
        if (index !== -1) {
          this.reservations[index] = updatedReservation;

          // Also update the filtered lists
          const watchedIndex = this.watchedReservations.findIndex(r => r.id === reservationId);
          if (watchedIndex !== -1) {
            this.watchedReservations[watchedIndex] = updatedReservation;
          }
        }

        this.snackBar.open('Your rating has been submitted!', 'Close', {
          duration: 3000
        });
      },
      (error) => {
        console.error('Error rating reservation:', error);
        this.snackBar.open('Failed to submit rating. Please try again.', 'Close', {
          duration: 3000
        });
      }
    );
  }

  getStarIcons(rating: number): string[] {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return [
      ...Array(fullStars).fill('star'),
      ...(halfStar ? ['star_half'] : []),
      ...Array(emptyStars).fill('star_border')
    ];
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}
