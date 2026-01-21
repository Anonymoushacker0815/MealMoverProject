import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Navbar } from '../../../components/navbar/navbar';
import { RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-order',
  imports: [
    Navbar, RouterOutlet
  ],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order
{

  constructor(private router: Router, private route: ActivatedRoute) {
    const lastRoute = localStorage.getItem('orderLastRoute');

    if (lastRoute && lastRoute !== '/user/order') {
      this.router.navigateByUrl(lastRoute);
    } else {
      this.router.navigate(['restaurants'], { relativeTo: this.route });
    }

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.urlAfterRedirects.startsWith('/user/order')) {
          localStorage.setItem('orderLastRoute', event.urlAfterRedirects);
        }
      });
  }
}
