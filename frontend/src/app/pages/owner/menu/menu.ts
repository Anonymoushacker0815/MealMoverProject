import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';

@Component({
  standalone: true,
  selector: 'app-owner-menu',
  imports: [CommonModule, Navbar],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class OwnerMenu {}