// src/app/services/reservation.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Reservation } from '../models/reservation.model';
import { Cart } from '../models/cart.model';
import { ScreeningService } from './screening.service';
import { AuthService } from './auth.service';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { Review } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private reservations: Reservation[] = [];
  private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
  reservations$ = this.reservationsSubject.asObservable();

  private reviews: Review[] = [];
  private reviewsSubject = new BehaviorSubject<Review[]>([]);
  reviews$ = this.reviewsSubject.asObservable();

  // Cart is managed per user
  private cartMap = new Map<number, Cart>();

  constructor(
    private screeningService: ScreeningService,
    private authService: AuthService
  ) {
    // Initialize with some sample data
    this.initializeData();
  }

  private initializeData(): void {
    // Sample reviews
    this.reviews = [
      {
        id: 1,
        movieId: 1,
        userId: 1,
        userName: 'John Doe',
        rating: 4.5,
        comment: 'Excellent movie with great storyline and acting!',
        date: new Date().toISOString()
      },
      {
        id: 2,
        movieId: 2,
        userId: 1,
        userName: 'John Doe',
        rating: 3.5,
        comment: 'Good movie but a bit too long.',
        date: new Date().toISOString()
      }
    ];
    this.reviewsSubject.next(this.reviews);

    // Sample reservations for user 1
    this.reservations = [
      {
        id: 1,
        screeningId: 1,
        userId: 1,
        reservationDate: new Date().toISOString(),
        status: 'watched',
        rating: 4,
        reviewText: 'Great movie!'
      },
      {
        id: 2,
        screeningId: 2,
        userId: 1,
        reservationDate: new Date().toISOString(),
        status: 'reserved'
      }
    ];
    this.reservationsSubject.next(this.reservations);

    // Initialize cart for user 1
    this.cartMap.set(1, {
      userId: 1,
      reservations: [],
      totalPrice: 0
    });
  }

  // Reservation methods
  getUserReservations(userId: number): Observable<Reservation[]> {
    return this.reservations$.pipe(
      map(reservations => reservations.filter(r => r.userId === userId)),
      switchMap(reservations => {
        // Fetch screening details for each reservation
        const reservationsWithScreenings: Reservation[] = [];

        // Create an array of observables for each reservation
        const observables = reservations.map(reservation =>
          this.screeningService.getScreeningById(reservation.screeningId).pipe(
            map(screening => {
              if (screening) {
                return {
                  ...reservation,
                  screening
                };
              }
              return reservation;
            })
          )
        );

        // If there are no reservations, return empty array
        if (observables.length === 0) {
          return of([]);
        }

        // Otherwise, combine all the observables
        return new Observable<Reservation[]>(observer => {
          let completedCount = 0;

          observables.forEach(obs => {
            obs.subscribe(
              reservation => {
                reservationsWithScreenings.push(reservation);
                completedCount++;

                if (completedCount === observables.length) {
                  observer.next(reservationsWithScreenings);
                  observer.complete();
                }
              },
              error => observer.error(error)
            );
          });
        });
      })
    );
  }

  getReservationById(id: number): Observable<Reservation | undefined> {
    return this.reservations$.pipe(
      map(reservations => reservations.find(r => r.id === id)),
      switchMap(reservation => {
        if (!reservation) {
          return of(undefined);
        }

        // Fetch screening details
        return this.screeningService.getScreeningById(reservation.screeningId).pipe(
          map(screening => {
            if (screening) {
              return {
                ...reservation,
                screening
              };
            }
            return reservation;
          })
        );
      })
    );
  }

  makeReservation(screeningId: number): Observable<Reservation | null> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return of(null); // User not logged in
        }

        return this.screeningService.getScreeningById(screeningId).pipe(
          switchMap(screening => {
            if (!screening || screening.availableSeats <= 0) {
              return of(null); // No screening found or no seats available
            }

            // Generate new reservation ID
            const newId = this.reservations.length > 0
              ? Math.max(...this.reservations.map(r => r.id)) + 1
              : 1;

            const reservation: Reservation = {
              id: newId,
              screeningId,
              userId: user.id,
              reservationDate: new Date().toISOString(),
              status: 'reserved',
              screening
            };

            // Add to reservations
            this.reservations.push(reservation);
            this.reservationsSubject.next([...this.reservations]);

            // Update screening available seats
            const updatedScreening = {
              ...screening,
              availableSeats: screening.availableSeats - 1
            };

            return this.screeningService.updateScreening(updatedScreening).pipe(
              map(() => reservation)
            );
          })
        );
      })
    );
  }

  updateReservation(reservation: Reservation): Observable<Reservation> {
    const index = this.reservations.findIndex(r => r.id === reservation.id);
    if (index !== -1) {
      this.reservations[index] = reservation;
      this.reservationsSubject.next([...this.reservations]);
    }

    return of(reservation);
  }

  cancelReservation(id: number): Observable<boolean> {
    return this.getReservationById(id).pipe(
      switchMap(reservation => {
        if (!reservation || reservation.status !== 'reserved') {
          return of(false);
        }

        // Update reservation status
        const updatedReservation: Reservation = {
          ...reservation,
          status: 'canceled'
        };

        const index = this.reservations.findIndex(r => r.id === id);
        if (index !== -1) {
          this.reservations[index] = updatedReservation;
          this.reservationsSubject.next([...this.reservations]);

          // Update screening available seats if there is screening data
          if (reservation.screening) {
            const updatedScreening = {
              ...reservation.screening,
              availableSeats: reservation.screening.availableSeats + 1
            };

            return this.screeningService.updateScreening(updatedScreening).pipe(
              map(() => true)
            );
          }
        }

        return of(false);
      })
    );
  }

  rateReservation(id: number, rating: number, reviewText?: string): Observable<Reservation> {
    return this.getReservationById(id).pipe(
      switchMap(reservation => {
        if (!reservation || reservation.status !== 'watched') {
          throw new Error('Cannot rate a reservation that is not in "watched" status');
        }

        // Update reservation with rating
        const updatedReservation: Reservation = {
          ...reservation,
          rating,
          reviewText
        };

        const index = this.reservations.findIndex(r => r.id === id);
        if (index !== -1) {
          this.reservations[index] = updatedReservation;
          this.reservationsSubject.next([...this.reservations]);

          // Create a review if there is a screening and movie
          if (reservation.screening?.movie) {
            const movieId = reservation.screening.movie.id;
            const userId = reservation.userId;

            // Check if user already has a review for this movie
            const existingReviewIndex = this.reviews.findIndex(
              r => r.movieId === movieId && r.userId === userId
            );

            // Get user name
            this.authService.currentUser$.pipe(
              take(1)
            ).subscribe(user => {
              if (user) {
                const userName = `${user.firstName} ${user.lastName}`;

                // Create new review or update existing
                const newReview: Review = {
                  id: existingReviewIndex !== -1 ? this.reviews[existingReviewIndex].id : this.reviews.length + 1,
                  movieId,
                  userId,
                  userName,
                  rating,
                  comment: reviewText || '',
                  date: new Date().toISOString()
                };

                if (existingReviewIndex !== -1) {
                  this.reviews[existingReviewIndex] = newReview;
                } else {
                  this.reviews.push(newReview);
                }

                this.reviewsSubject.next([...this.reviews]);
              }
            });
          }
        }

        return of(updatedReservation);
      })
    );
  }

  markAsWatched(id: number): Observable<Reservation> {
    return this.getReservationById(id).pipe(
      switchMap(reservation => {
        if (!reservation || reservation.status !== 'reserved') {
          throw new Error('Cannot mark as watched a reservation that is not in "reserved" status');
        }

        // Update reservation status
        const updatedReservation: Reservation = {
          ...reservation,
          status: 'watched'
        };

        const index = this.reservations.findIndex(r => r.id === id);
        if (index !== -1) {
          this.reservations[index] = updatedReservation;
          this.reservationsSubject.next([...this.reservations]);
        }

        return of(updatedReservation);
      })
    );
  }

  // Cart methods
  getUserCart(userId: number): Observable<Cart> {
    if (!this.cartMap.has(userId)) {
      this.cartMap.set(userId, {
        userId,
        reservations: [],
        totalPrice: 0
      });
    }

    const cart = this.cartMap.get(userId)!;

    // Calculate total price based on screenings
    return new Observable<Cart>(observer => {
      if (cart.reservations.length === 0) {
        observer.next(cart);
        observer.complete();
        return;
      }

      let completedCount = 0;
      let totalPrice = 0;
      const reservationsWithScreenings: Reservation[] = [];

      cart.reservations.forEach(reservation => {
        this.screeningService.getScreeningById(reservation.screeningId).subscribe(
          screening => {
            if (screening) {
              totalPrice += screening.price;
              reservationsWithScreenings.push({
                ...reservation,
                screening
              });
            } else {
              reservationsWithScreenings.push(reservation);
            }

            completedCount++;
            if (completedCount === cart.reservations.length) {
              const updatedCart: Cart = {
                ...cart,
                reservations: reservationsWithScreenings,
                totalPrice
              };

              // Update the cart in the map
              this.cartMap.set(userId, updatedCart);

              observer.next(updatedCart);
              observer.complete();
            }
          },
          error => observer.error(error)
        );
      });
    });
  }

  addToCart(screeningId: number): Observable<Cart | null> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return of(null); // User not logged in
        }

        return this.screeningService.getScreeningById(screeningId).pipe(
          switchMap(screening => {
            if (!screening || screening.availableSeats <= 0) {
              return of(null); // No screening found or no seats available
            }

            // Initialize cart if it doesn't exist
            if (!this.cartMap.has(user.id)) {
              this.cartMap.set(user.id, {
                userId: user.id,
                reservations: [],
                totalPrice: 0
              });
            }

            const cart = this.cartMap.get(user.id)!;

            // Check if screening is already in cart
            const existingReservation = cart.reservations.find(r => r.screeningId === screeningId);
            if (existingReservation) {
              return of(cart); // Already in cart
            }

            // Generate new reservation ID (temporary, until checkout)
            const newId = this.reservations.length > 0
              ? Math.max(...this.reservations.map(r => r.id)) + 1
              : 1;

            const reservation: Reservation = {
              id: newId,
              screeningId,
              userId: user.id,
              reservationDate: new Date().toISOString(),
              status: 'reserved',
              screening
            };

            // Add to cart
            const updatedReservations = [...cart.reservations, reservation];
            const updatedCart: Cart = {
              ...cart,
              reservations: updatedReservations,
              totalPrice: cart.totalPrice + screening.price
            };

            this.cartMap.set(user.id, updatedCart);

            return of(updatedCart);
          })
        );
      })
    );
  }

  removeFromCart(reservationId: number): Observable<Cart | null> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user || !this.cartMap.has(user.id)) {
          return of(null);
        }

        const cart = this.cartMap.get(user.id)!;
        const reservationIndex = cart.reservations.findIndex(r => r.id === reservationId);

        if (reservationIndex === -1) {
          return of(cart); // Reservation not in cart
        }

        const reservation = cart.reservations[reservationIndex];
        const screeningPrice = reservation.screening?.price || 0;

        // Remove from cart
        const updatedReservations = cart.reservations.filter(r => r.id !== reservationId);
        const updatedCart: Cart = {
          ...cart,
          reservations: updatedReservations,
          totalPrice: cart.totalPrice - screeningPrice
        };

        this.cartMap.set(user.id, updatedCart);

        return of(updatedCart);
      })
    );
  }

  clearCart(): Observable<Cart | null> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user || !this.cartMap.has(user.id)) {
          return null;
        }

        const emptyCart: Cart = {
          userId: user.id,
          reservations: [],
          totalPrice: 0
        };

        this.cartMap.set(user.id, emptyCart);

        return emptyCart;
      })
    );
  }

  checkout(): Observable<Reservation[]> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user || !this.cartMap.has(user.id)) {
          return of([]);
        }

        const cart = this.cartMap.get(user.id)!;

        if (cart.reservations.length === 0) {
          return of([]);
        }

        // Process each reservation
        const reservationsToAdd: Reservation[] = [];

        cart.reservations.forEach(reservation => {
          // The reservation is already prepared with proper ID, etc.
          reservationsToAdd.push(reservation);

          // Update available seats if screening info is available
          if (reservation.screening) {
            const updatedScreening = {
              ...reservation.screening,
              availableSeats: reservation.screening.availableSeats - 1
            };

            this.screeningService.updateScreening(updatedScreening).subscribe();
          }
        });

        // Add all reservations to the "database"
        this.reservations = [...this.reservations, ...reservationsToAdd];
        this.reservationsSubject.next(this.reservations);

        // Clear the cart
        this.cartMap.set(user.id, {
          userId: user.id,
          reservations: [],
          totalPrice: 0
        });

        return of(reservationsToAdd);
      })
    );
  }

  // Review methods
  getMovieReviews(movieId: number): Observable<Review[]> {
    return this.reviews$.pipe(
      map(reviews => reviews.filter(r => r.movieId === movieId))
    );
  }

  getUserReviews(userId: number): Observable<Review[]> {
    return this.reviews$.pipe(
      map(reviews => reviews.filter(r => r.userId === userId))
    );
  }

  getAverageRating(movieId: number): Observable<number> {
    return this.getMovieReviews(movieId).pipe(
      map(reviews => {
        if (reviews.length === 0) {
          return 0;
        }

        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        return sum / reviews.length;
      })
    );
  }
}
