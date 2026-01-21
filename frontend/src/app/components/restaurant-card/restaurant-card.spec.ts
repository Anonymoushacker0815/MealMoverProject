import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantCard } from './restaurant-card';

describe('RestaurantCard', () => {
  let component: RestaurantCard;
  let fixture: ComponentFixture<RestaurantCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
