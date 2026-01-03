import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewThreadComponent } from './new-thread';

describe('NewThread', () => {
  let component: NewThreadComponent;
  let fixture: ComponentFixture<NewThreadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewThreadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewThreadComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
