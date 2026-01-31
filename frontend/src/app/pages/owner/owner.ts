import { Component } from '@angular/core';

import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-owner',
  standalone: true,
  imports: [Navbar],
  templateUrl: './owner.html',
  styleUrl: './owner.css',
})
export class Owner {

}
