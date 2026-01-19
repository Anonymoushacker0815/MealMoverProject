import { Component } from '@angular/core';
import {Navbar} from '../../../components/navbar/navbar';
import { UserMap } from '../../../components/user-map/user-map';

@Component({
  selector: 'app-order',
  imports: [
    Navbar,UserMap
  ],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order {

}
