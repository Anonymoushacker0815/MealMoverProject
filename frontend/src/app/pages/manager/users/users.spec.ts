import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerUsers } from './users';

describe('Users', () => {
  let component: ManagerUsers;
  let fixture: ComponentFixture<ManagerUsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerUsers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerUsers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
