import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
})
export class Header {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }

  goForum() {
    this.router.navigate(['/forum']);
  }

  goAuth() {
    this.router.navigate(['/authentication']);
  }
}
