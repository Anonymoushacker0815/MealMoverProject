import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Owner } from './owner';

describe('Owner', () => {
  let component: Owner;
  let fixture: ComponentFixture<Owner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Owner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Owner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
