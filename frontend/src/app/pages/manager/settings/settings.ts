import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';


@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [CommonModule, Navbar],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class ManagerSettings {

}
