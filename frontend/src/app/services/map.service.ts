import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private http = inject(HttpClient);

  // APIs
  private photonUrl = 'https://photon.komoot.io/api/';
  private osrmUrl = 'https://router.project-osrm.org/route/v1/driving/';


  getPositionFromAddress(query: string): Observable<any> {
    return this.http.get<any>(`${this.photonUrl}?q=${encodeURIComponent(query)}`);
  }

  getAddressFromPosition(lat: number, lng: number): Observable<string> {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    return this.http.get<any>(url).pipe(
      map(data => {
        if (!data.features || data.features.length === 0) return 'Unknown Location';

        const props = data.features[0].properties;


        const street = props.street || '';
        const house = props.housenumber || '';
        const city = props.city || props.town || props.state || '';


        const streetPart = street ? `${street} ${house}` : '';
        const comma = streetPart && city ? ', ' : '';

        return `${streetPart}${comma}${city}` || props.name || 'Unnamed Location';
      })
    );
  }

  getRouteDetails(startLat: number, startLng: number, endLat: number, endLng: number): Observable<any> {
    const coords = `${startLng},${startLat};${endLng},${endLat}`;

    return this.http.get<any>(
      `${this.osrmUrl}${coords}?overview=full&geometries=geojson`
    ).pipe(
      tap(data => console.log("OSRM Route Details:", data))
    );
  }

  extractCoords(locationObj: any): { lat: number, lng: number } | null {
    if (!locationObj || !locationObj.coordinates) return null;
    return {
      lng: locationObj.coordinates[0],
      lat: locationObj.coordinates[1]
    };
  }
}
