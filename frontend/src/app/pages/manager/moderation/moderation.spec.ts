import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Moderation } from './moderation';

describe('Moderation', () => {
  let component: Moderation;
  let fixture: ComponentFixture<Moderation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Moderation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Moderation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
