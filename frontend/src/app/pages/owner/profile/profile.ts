import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../components/navbar/navbar';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type OpeningDay = {
  label: string;
  closed: boolean;
  open: string;
  close: string;
};

@Component({
  standalone: true,
  selector: 'app-owner-profile',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './profile.html',
})
export class OwnerProfile {

  // ---------- UI state ----------
  isEditing = false;

  days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  trackByDay = (_: number, day: DayKey) => day;

  // ---------- DEMO PROFILE DATA ----------
  profile = {
    restaurantName: 'Pizza Italier',
    email: 'mail@example.com',
    phone: '+43 123 456 789',
    deliveryZone: '3 km radius',
  };

  openingHours: Record<DayKey, OpeningDay> = {
    mon: { label: 'Mon', closed: false, open: '09:00', close: '18:00' },
    tue: { label: 'Tue', closed: false, open: '09:00', close: '18:00' },
    wed: { label: 'Wed', closed: false, open: '09:00', close: '18:00' },
    thu: { label: 'Thu', closed: false, open: '09:00', close: '18:00' },
    fri: { label: 'Fri', closed: false, open: '09:00', close: '20:00' },
    sat: { label: 'Sat', closed: false, open: '10:00', close: '20:00' },
    sun: { label: 'Sun', closed: true, open: '00:00', close: '00:00' },
  };

  // Backup für Cancel
  private backup: any = null;

  // ---------- Actions ----------
  startEdit() {
    this.backup = {
      profile: JSON.parse(JSON.stringify(this.profile)),
      openingHours: JSON.parse(JSON.stringify(this.openingHours)),
    };
    this.isEditing = true;
  }

  cancelEdit() {
    if (this.backup) {
      this.profile = this.backup.profile;
      this.openingHours = this.backup.openingHours;
    }
    this.isEditing = false;
  }

  saveProfile() {
    this.isEditing = false;
  }

  setAllWeekdays(open: string, close: string) {
    (['mon', 'tue', 'wed', 'thu', 'fri'] as DayKey[]).forEach(d => {
      this.openingHours[d].closed = false;
      this.openingHours[d].open = open;
      this.openingHours[d].close = close;
    });
  }
}
