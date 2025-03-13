import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredMovies: Movie[] = [];
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMovies().subscribe(
      movies => {
        // Get up to 4 random movies for featured section
        if (movies.length > 0) {
          // Shuffle the array
          const shuffled = [...movies].sort(() => 0.5 - Math.random());
          this.featuredMovies = shuffled.slice(0, 4);
        }
        this.loading = false;
      },
      error => {
        console.error('Error fetching movies:', error);
        this.loading = false;
      }
    );
  }
}
