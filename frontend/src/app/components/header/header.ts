import {Component, inject} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
})
export class Header {
  constructor(private router: Router) {}
  public authService = inject(AuthService);

  goHome() {
    this.router.navigate(['/']);
  }

  goForum() {
    this.router.navigate(['/forum']);
  }

  goAuth() {
    this.router.navigate(['/authentication']);
  }

  goAccount() {
    this.router.navigate(['/account']);
  }
}
