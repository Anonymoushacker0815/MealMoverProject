import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './manager.html',
  styleUrl: './manager.css',
})
export class Manager {
  
}
