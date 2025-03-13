import {Genre} from './genre.model';
import {Actor} from './actor.model';
import {Director} from './director.model';

export interface Movie {
  id: number;
  title: string;
  description: string;
  shortUrl: string;
  releaseDate: string;
  coverUrl: string;
  runtime: number;
  genres: Genre[];
  actors: Actor[];
  directors: Director[];
}
