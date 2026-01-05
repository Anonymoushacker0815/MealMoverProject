import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';

@Component({
  standalone: true,
  selector: 'app-owner-analytics',
  imports: [CommonModule, Navbar],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class OwnerAnalytics{}