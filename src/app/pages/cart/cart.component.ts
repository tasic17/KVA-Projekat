import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClientModule } from '@angular/common/http';

import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { Cart } from '../../models/cart.model';
import { Reservation } from '../../models/reservation.model';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    HttpClientModule,
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = true;

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;

    this.authService.currentUser$.pipe(
      take(1)
    ).subscribe(
      user => {
        if (user) {
          this.reservationService.getUserCart(user.id).subscribe(
            cart => {
              this.cart = cart;
              this.loading = false;
            },
            error => {
              console.error('Error loading cart:', error);
              this.loading = false;
            }
          );
        } else {
          this.loading = false;
        }
      }
    );
  }

  removeItem(reservationId: number): void {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
      this.reservationService.removeFromCart(reservationId).subscribe(
        updatedCart => {
          this.cart = updatedCart;
          this.snackBar.open('Item removed from cart', 'Close', {
            duration: 3000
          });
        },
        error => {
          console.error('Error removing item from cart:', error);
          this.snackBar.open('Failed to remove item. Please try again.', 'Close', {
            duration: 3000
          });
        }
      );
    }
  }

  checkout(): void {
    if (confirm('Complete your purchase? You cannot undo this action.')) {
      this.loading = true;

      this.reservationService.checkout().subscribe(
        reservations => {
          this.loading = false;

          if (reservations.length > 0) {
            this.snackBar.open('Purchase completed successfully!', 'Close', {
              duration: 3000
            });

            // Navigate to my reservations page
            this.router.navigate(['/my-reservations']);
          } else {
            this.snackBar.open('Failed to complete purchase. Please try again.', 'Close', {
              duration: 3000
            });
          }
        },
        error => {
          console.error('Error during checkout:', error);
          this.loading = false;

          this.snackBar.open('Failed to complete purchase. Please try again.', 'Close', {
            duration: 3000
          });
        }
      );
    }
  }

  // Helper methods for safely accessing nested properties
  getScreeningImage(reservation: Reservation): string {
    if (!reservation.screening || !reservation.screening.movie ||
      !reservation.screening.movie.coverUrl ||
      !reservation.screening.movie.coverUrl.startsWith('http')) {
      return 'assets/images/movie-placeholder.jpg';
    }
    return reservation.screening.movie.coverUrl;
  }

  getScreeningTitle(reservation: Reservation): string {
    return reservation.screening?.movie?.title || 'Unknown Movie';
  }

  getScreeningDate(reservation: Reservation): string {
    return reservation.screening?.date || '';
  }

  getScreeningTime(reservation: Reservation): string {
    return reservation.screening?.time || 'N/A';
  }

  getScreeningHall(reservation: Reservation): string {
    return reservation.screening?.hall || 'N/A';
  }

  getScreeningPrice(reservation: Reservation): number {
    return reservation.screening?.price || 0;
  }

  getTicketCount(): number {
    return this.cart?.reservations?.length || 0;
  }

  getTotalPrice(): number {
    return this.cart?.totalPrice || 0;
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
}
