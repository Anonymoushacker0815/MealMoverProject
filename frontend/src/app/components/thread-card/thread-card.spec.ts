import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadCard } from './thread-card';

describe('ThreadCard', () => {
  let component: ThreadCard;
  let fixture: ComponentFixture<ThreadCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
