import {Genre} from './genre.model';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  favoriteGenres: Genre[];
  username: string;
  password: string; // In a real app, never store plain passwords
}
