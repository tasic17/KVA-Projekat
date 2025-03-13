import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Genre } from '../../models/genre.model';

// Custom validator for password match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }

  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;
  genres: Genre[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      favoriteGenres: [[]],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    // Redirect to home if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }

    // Load genres for the favorite genres select
    this.apiService.getGenres().subscribe(
      genres => {
        this.genres = genres;
      },
      error => {
        console.error('Error loading genres:', error);
      }
    );
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Extract user data from form
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      favoriteGenres,
      username,
      password
    } = this.registerForm.value;

    // Create user object
    const user = {
      firstName,
      lastName,
      email,
      phone,
      address,
      favoriteGenres: favoriteGenres || [],
      username,
      password
    };

    this.authService.register(user).subscribe(
      registeredUser => {
        this.isLoading = false;

        if (registeredUser) {
          // Navigate to home page after successful registration
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      },
      error => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred during registration. Please try again.';
        console.error('Registration error:', error);
      }
    );
  }
}
