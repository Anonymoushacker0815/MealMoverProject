import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadDetail } from './thread-detail';

describe('ThreadDetail', () => {
  let component: ThreadDetail;
  let fixture: ComponentFixture<ThreadDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
