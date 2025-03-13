import {Movie} from './movie.model';

export interface Screening {
  id: number;
  movieId: number;
  movie?: Movie;
  date: string;
  time: string;
  hall: string;
  price: number;
  availableSeats: number;
}
