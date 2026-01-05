import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';

@Component({
  standalone: true,
  selector: 'app-owner-profile',
  imports: [CommonModule, Navbar],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class OwnerProfile {}