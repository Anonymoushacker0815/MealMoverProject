import { Component } from '@angular/core';

import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [Navbar],
  templateUrl: './manager.html',
  styleUrl: './manager.css',
})
export class Manager {
  
}
