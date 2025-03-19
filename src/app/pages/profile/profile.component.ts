import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { Genre } from '../../models/genre.model';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (newPassword && confirmPassword && newPassword.value && newPassword.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }

  return null;
}

@Component({
  selector: 'app-profile',
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
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: User | null = null;
  genres: Genre[] = [];

  loading = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService
  ) {
    this.profileForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      favoriteGenres: [[]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;

    this.apiService.getGenres().subscribe(
      genres => {
        this.genres = genres;
        this.loading = false;

        if (this.currentUser) {
          this.initializeForm();
        }
      },
      error => {
        console.error('Error loading genres:', error);
        this.loading = false;
      }
    );
  }

  initializeForm(): void {
    if (!this.currentUser) return;

    this.profileForm.patchValue({
      firstName: this.currentUser.firstName,
      lastName: this.currentUser.lastName,
      email: this.currentUser.email,
      phone: this.currentUser.phone,
      address: this.currentUser.address,
      favoriteGenres: this.currentUser.favoriteGenres || []
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.currentUser) {
      this.errorMessage = 'User not found';
      this.isLoading = false;
      return;
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      favoriteGenres,
      currentPassword,
      newPassword
    } = this.profileForm.value;


    if (currentPassword && newPassword) {
      if (currentPassword !== this.currentUser.password) {
        this.errorMessage = 'Current password is incorrect';
        this.isLoading = false;
        return;
      }
    }


    const updatedUser: User = {
      ...this.currentUser,
      firstName,
      lastName,
      email,
      phone,
      address,
      favoriteGenres: favoriteGenres || []
    };


    if (newPassword) {
      updatedUser.password = newPassword;
    }

    this.authService.updateUser(updatedUser).subscribe(
      user => {
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully';
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      },
      error => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred while updating your profile';
        console.error('Update profile error:', error);
      }
    );
  }
}
