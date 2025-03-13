// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  // Simulated users database
  private users: User[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      favoriteGenres: [],
      username: 'john',
      password: 'password123'
    }
  ];

  constructor() {
    // Check localStorage for logged in user on service initialization
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<User | null> {
    // Find user with matching credentials
    const user = this.users.find(u =>
      u.username === username && u.password === password
    );

    if (user) {
      // Store user in localStorage and update current user
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      return of(user);
    }

    return of(null);
  }

  register(user: Omit<User, 'id'>): Observable<User> {
    // Generate new ID (would be handled by backend in real app)
    const newId = this.users.length > 0
      ? Math.max(...this.users.map(u => u.id)) + 1
      : 1;

    const newUser: User = {
      ...user,
      id: newId
    };

    // Add user to "database"
    this.users.push(newUser);

    // Log in the new user
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    this.currentUserSubject.next(newUser);

    return of(newUser);
  }

  logout(): void {
    // Remove user from localStorage and reset current user
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  updateUser(user: User): Observable<User> {
    // Find and update user in "database"
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;

      // Update localStorage and current user if it's the logged-in user
      if (this.currentUser && this.currentUser.id === user.id) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }
    }

    return of(user);
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }
}
