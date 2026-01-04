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
  user: any = null;

  ngOnInit() {
    this.user = this.authService.getUser();

    if (!this.user) {
      this.router.navigate(['/authentication']);
    }
  }

  doLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

