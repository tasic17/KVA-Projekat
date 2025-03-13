import {Reservation} from './reservation.model';

export interface Cart {
  userId: number;
  reservations: Reservation[];
  totalPrice: number;
}
