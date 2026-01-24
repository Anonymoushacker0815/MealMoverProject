import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, Subject } from 'rxjs';
import { Thread } from '../types/thread';
import { ThreadApi } from '../types/thread-api';
import { ReplyApi } from '../types/reply-api';
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
    return this.http.get<ThreadApi[]>(this.apiUrl).pipe(
      map((threads) =>
        threads.map((api) => this.mapApiToThread(api))
      )
    );
  }

  createThread(data: {
    title: string;
    content: string;
  }): Observable<Thread> {
    return this.http
      .post<ThreadApi>(this.apiUrl, data)
      .pipe(map((api) => this.mapApiToThread(api)));
  }

  private mapApiToThread(api: ThreadApi): Thread {
    return {
      id: api.id,
      title: api.title,
      content: api.content,
      author: api.author_name,
      likes: api.likes,
      dislikes: api.dislikes,
      views: api.views,
      createdAt: new Date(api.created_at),
    };
  }

  likeThread(id: string) {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/like`, {}) 
      .pipe(
        map((api) => (api ? this.mapApiToThread(api) : null))
      );
  }

  dislikeThread(id: string) {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/dislike`, {})
      .pipe(
        map((api) => (api ? this.mapApiToThread(api) : null))
      );
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

  getThread(id: string): Observable<Thread> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((api) => this.mapApiToThread(api))
    );
  }

  getReplies(threadId: string): Observable<Reply[]> {
    return this.http.get<ReplyApi[]>(`${this.apiUrl}/${threadId}/replies`).pipe(
      map((replies) => replies.map((r) => this.mapApiToReply(r)))
    );
  }

  createReply(threadId: string, data: { content: string; author_name?: string }): Observable<Reply> {
    return this.http.post<ReplyApi>(`${this.apiUrl}/${threadId}/replies`, data).pipe(
      map((api) => this.mapApiToReply(api))
    );
  }

  private mapApiToReply(api: ReplyApi): Reply {
    return {
      id: api.id,
      threadId: api.thread_id,
      content: api.content,
      author: api.author_name,
      createdAt: new Date(api.created_at),
    };
  }
}
