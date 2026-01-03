import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  constructor(private router: Router) {}

  goManager() {
    console.log('Manager clicked');
    this.router.navigate(['/manager']);
  }

  goUser() {
    this.router.navigate(['/user']);
  }

  goOwner() {
    this.router.navigate(['/owner']);
  }
}
