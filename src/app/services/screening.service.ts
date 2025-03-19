import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Screening } from '../models/screening.model';
import { ApiService } from './api.service';
import { map, switchMap, tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScreeningService {
  private screenings: Screening[] = [];
  private screeningsSubject = new BehaviorSubject<Screening[]>([]);
  screenings$ = this.screeningsSubject.asObservable();

  private halls = ['Hall A', 'Hall B', 'Hall C', 'VIP Hall'];

  private timeSlots = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];

  private priceTiers = {
    regular: 400,
    evening: 500,
    weekend: 550,
    vip: 750
  };

  constructor(private apiService: ApiService) {
    this.initializeScreenings();
  }

  private initializeScreenings(): void {
    this.apiService.getMovies().pipe(
      tap(movies => {
        const today = new Date();
        let screeningId = 1;

        this.screenings = [];

        movies.forEach(movie => {
          const numScreenings = Math.floor(Math.random() * 3) + 3; // 3-5 screenings

          for (let i = 0; i < numScreenings; i++) {
            const dayOffset = Math.floor(Math.random() * 7); // 0-6 days from today
            const screeningDate = new Date(today);
            screeningDate.setDate(screeningDate.getDate() + dayOffset);

            const formattedDate = screeningDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeIndex = Math.floor(Math.random() * this.timeSlots.length);
            const time = this.timeSlots[timeIndex];

            const isEvening = timeIndex >= 3; // Later time slots
            const isWeekend = screeningDate.getDay() === 0 || screeningDate.getDay() === 6;
            const isVip = Math.random() < 0.2; // 20% chance of VIP

            let price = this.priceTiers.regular;
            if (isVip) {
              price = this.priceTiers.vip;
            } else if (isWeekend) {
              price = this.priceTiers.weekend;
            } else if (isEvening) {
              price = this.priceTiers.evening;
            }

            const hall = isVip ? this.halls[3] : this.halls[Math.floor(Math.random() * 3)];

            const screening: Screening = {
              id: screeningId++,
              movieId: movie.id,
              movie: movie,
              date: formattedDate,
              time: time,
              hall: hall,
              price: price,
              availableSeats: Math.floor(Math.random() * 50) + 50 // 50-99 seats
            };

            this.screenings.push(screening);
          }
        });

        this.screeningsSubject.next(this.screenings);
      }),
      catchError(error => {
        console.error('Error initializing screenings:', error);
        return of([]); // Return empty array in case of error
      })
    ).subscribe({
      error: (error) => console.error('Error in screening initialization:', error)
    });
  }

  getScreenings(
    date?: string,
    movieId?: number,
    minPrice?: number,
    maxPrice?: number
  ): Observable<Screening[]> {
    return this.screenings$.pipe(
      map(screenings => {
        let filtered = screenings;

        if (date) {
          filtered = filtered.filter(s => s.date === date);
        }

        if (movieId) {
          filtered = filtered.filter(s => s.movieId === movieId);
        }

        if (minPrice !== undefined) {
          filtered = filtered.filter(s => s.price >= minPrice);
        }

        if (maxPrice !== undefined) {
          filtered = filtered.filter(s => s.price <= maxPrice);
        }

        return filtered;
      })
    );
  }

  getScreeningById(id: number): Observable<Screening | undefined> {
    return this.screenings$.pipe(
      map(screenings => screenings.find(s => s.id === id))
    );
  }

  getScreeningsByMovieId(movieId: number): Observable<Screening[]> {
    return this.screenings$.pipe(
      map(screenings => screenings.filter(s => s.movieId === movieId))
    );
  }

  updateScreening(screening: Screening): Observable<Screening> {
    const index = this.screenings.findIndex(s => s.id === screening.id);
    if (index !== -1) {
      this.screenings[index] = screening;
      this.screeningsSubject.next([...this.screenings]);
    }

    return of(screening);
  }

  addScreening(screening: Omit<Screening, 'id'>): Observable<Screening> {
    const newId = this.screenings.length > 0
      ? Math.max(...this.screenings.map(s => s.id)) + 1
      : 1;

    const newScreening: Screening = {
      ...screening,
      id: newId
    };

    this.screenings.push(newScreening);
    this.screeningsSubject.next([...this.screenings]);

    return of(newScreening);
  }

  deleteScreening(id: number): Observable<boolean> {
    const initialLength = this.screenings.length;
    this.screenings = this.screenings.filter(s => s.id !== id);

    if (this.screenings.length !== initialLength) {
      this.screeningsSubject.next([...this.screenings]);
      return of(true);
    }

    return of(false);
  }
}
