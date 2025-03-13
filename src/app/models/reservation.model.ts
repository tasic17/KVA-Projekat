import {Screening} from './screening.model';

export interface Reservation {
  id: number;
  screeningId: number;
  screening?: Screening;
  userId: number;
  reservationDate: string;
  status: 'reserved' | 'watched' | 'canceled';
  rating?: number;
  reviewText?: string;
}
