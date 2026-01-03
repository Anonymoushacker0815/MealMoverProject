import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NAV_ITEMS, Role } from './navbar.config';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(private router: Router) {}
  @Input({ required: true }) role!: Role;

  get items() {
    return NAV_ITEMS[this.role];
  }
  navigate(route: string) {
  this.router.navigate([route]);
  }
}
