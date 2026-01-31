import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, Subject } from 'rxjs';
import { Thread } from '../types/thread';
import { Reply } from '../types/reply';


@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private apiUrl = 'http://localhost:3000/api/threads';
  private refreshSubject = new Subject<void>();
  refresh$ = this.refreshSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return { headers: new HttpHeaders({ Authorization: token }) };
  }

  triggerRefresh() {
    this.refreshSubject.next();
  }

  getThreads(): Observable<Thread[]> {
    return this.http.get<Thread[]>(this.apiUrl);
  }

  createThread(data: { title: string; content: string }): Observable<Thread> {
    return this.http.post<Thread>(this.apiUrl, data, this.getAuthHeaders());
  }

  likeThread(id: string | number) {
    return this.http.post<Thread>(`${this.apiUrl}/${id}/like`, {}, this.getAuthHeaders());
  }

  dislikeThread(id: string | number) {
    return this.http.post<Thread>(`${this.apiUrl}/${id}/dislike`, {}, this.getAuthHeaders());
  }

  reportThread(id: string, reason: string | null) {
    const cleaned =
      typeof reason === 'string' && reason.trim().length > 0 ? reason.trim() : null;

    return this.http.post<any>(
      `${this.apiUrl}/${id}/report`,
      { reason: cleaned },
      this.getAuthHeaders()
    );
  }

  getThread(id: string | number): Observable<Thread> {
    return this.http.get<Thread>(`${this.apiUrl}/${id}`);
  }


  getReplies(threadId: string | number): Observable<Reply[]> {
    return this.http.get<Reply[]>(`${this.apiUrl}/${threadId}/replies`);
  }


  createReply(threadId: string | number, data: { content: string }): Observable<Reply> {
    return this.http.post<Reply>(`${this.apiUrl}/${threadId}/replies`, data, this.getAuthHeaders());
  }
}
