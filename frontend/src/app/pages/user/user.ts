import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {

}
