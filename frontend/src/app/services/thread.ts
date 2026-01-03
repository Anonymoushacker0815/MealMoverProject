import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  triggerRefresh() {
    this.refreshSubject.next();
  }
  // GET all threads
  getThreads(): Observable<Thread[]> {
    return this.http.get<ThreadApi[]>(this.apiUrl).pipe(
      map((threads) =>
        threads.map((api) => this.mapApiToThread(api))
      )
    );
  }

  // POST new thread
  createThread(data: {
    title: string;
    content: string;
  }): Observable<Thread> {
    return this.http
      .post<ThreadApi>(this.apiUrl, data)
      .pipe(map((api) => this.mapApiToThread(api)));
  }

  // Mapper 
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
