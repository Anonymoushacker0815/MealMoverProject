import { Component, OnInit, inject, signal, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { AuthService } from '../../services/auth.service';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-user-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-map.html',
  styleUrl: './user-map.css'
})
export class UserMap implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private mapService = inject(MapService);


  @Input() mode: 'route' | 'picker' = 'route';

  @Output() locationSelected = new EventEmitter<{lat: number, lng: number, address: string, geojson: any}>();

  private map!: L.Map;
  private routeLayer: L.GeoJSON | null = null;
  private endMarker: L.CircleMarker | null = null;


  private startMarker: L.CircleMarker | null = null;


  private userLat: number = 46.6243;
  private userLng: number = 14.30547;


  searchQuery: string = '';
  routeInfo = signal<any>(null);
  errorMessage = signal<string>('');
  selectedAddress = signal<string>('');

  ngOnInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const user = this.authService.currentUser();

    if (user && user.location) {
      const userCoords = this.mapService.extractCoords(user.location);
      if (userCoords) {
        this.userLat = userCoords.lat;
        this.userLng = userCoords.lng;
      }
    }

    this.map = L.map('map').setView([this.userLat, this.userLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '©OpenStreetMap'
    }).addTo(this.map);

    if (this.mode === 'route') {
      this.initRouteMode();
    } else {
      this.initPickerMode();
    }
  }


  private initRouteMode() {
    this.startMarker = L.circleMarker([this.userLat, this.userLng], {
      radius: 8, color: '#FFFFFF', weight: 3, fillColor: '#9B1C1F', fillOpacity: 1
    }).addTo(this.map).bindPopup("You are here");

    this.mapService.getAddressFromPosition(this.userLat, this.userLng).subscribe(addr => {
      this.startMarker?.setPopupContent(`<b>Start:</b><br>${addr}`);
    });


    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.drawRoute(this.userLat, this.userLng, e.latlng.lat, e.latlng.lng);
    });
  }

  private drawRoute(startLat: number, startLng: number, endLat: number, endLng: number) {
    this.errorMessage.set('Calculating route...');

    this.mapService.getRouteDetails(startLat, startLng, endLat, endLng).subscribe({
      next: (data) => {
        if (!data.routes || data.routes.length === 0) {
          this.errorMessage.set('No road route found.');
          return;
        }

        this.errorMessage.set('');
        const route = data.routes[0];

        this.routeInfo.set({ distance: route.distance, duration: route.duration });


        if (this.routeLayer) this.map.removeLayer(this.routeLayer);
        if (this.endMarker) this.map.removeLayer(this.endMarker);


        this.routeLayer = L.geoJSON(route.geometry, {
          style: { color: '#9B1C1F', weight: 8, opacity: 1, lineCap: 'round' }
        }).addTo(this.map);


        this.endMarker = L.circleMarker([endLat, endLng], {
          radius: 8, color: '#FFFFFF', weight: 3, fillColor: '#9B1C1F', fillOpacity: 1
        }).addTo(this.map).bindPopup("Loading address...");

        this.map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });


        this.mapService.getAddressFromPosition(endLat, endLng).subscribe(addr => {
          this.endMarker?.setPopupContent(`<b>Destination:</b><br>${addr}`).openPopup();
        });
      },
      error: (err) => {
        this.errorMessage.set('Routing unavailable.');
      }
    });
  }


  private initPickerMode() {
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.handleSelection(e.latlng.lat, e.latlng.lng);
    });


    if (this.authService.currentUser()) {
      this.handleSelection(this.userLat, this.userLng);
    }
  }


  handleSelection(lat: number, lng: number) {

    if (this.startMarker) this.map.removeLayer(this.startMarker);

    this.startMarker = L.circleMarker([lat, lng], {
      radius: 10, color: '#FFFFFF', weight: 3,  fillColor: '#9B1C1F', fillOpacity: 1
    }).addTo(this.map);

    this.map.setView([lat, lng], 16);

    this.selectedAddress.set("Locating...");
    this.mapService.getAddressFromPosition(lat, lng).subscribe(addr => {
      this.selectedAddress.set(addr);

      const geojson = {
        type: "Point",
        coordinates: [lng, lat]
      };

      this.locationSelected.emit({
        lat, lng, address: addr, geojson
      });
    });
  }

  searchLocation() {
    if (!this.searchQuery) return;
    this.mapService.getPositionFromAddress(this.searchQuery).subscribe({
      next: (data) => {
        if (data.features && data.features.length > 0) {
          const coords = data.features[0].geometry.coordinates; // [lng, lat]
          this.handleSelection(coords[1], coords[0]);
        } else {
          this.errorMessage.set("Address not found.");
        }
      },
      error: () => this.errorMessage.set("Search failed.")
    });
  }
}
