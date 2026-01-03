import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-owner',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './owner.html',
  styleUrl: './owner.css',
})
export class Owner {

}
