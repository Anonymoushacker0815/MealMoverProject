import { Component } from '@angular/core';
import {Navbar} from '../../../components/navbar/navbar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-order',
  imports: [
    Navbar, RouterOutlet
  ],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order {

}
