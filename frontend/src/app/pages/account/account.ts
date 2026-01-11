import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  templateUrl: './account.html',
})
export class Account implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);
  user = this.authService.currentUser;

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/authentication']);
      return;
    }

    this.authService.verifyUser().subscribe({
      next: () => console.log('User verified by server'),
      error: () => this.doLogout() // Logout on error
    });
  }

  doLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

