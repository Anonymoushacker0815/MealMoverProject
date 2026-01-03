import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Thread } from '../types/thread';

interface ThreadApi {
  id: string;
  title: string;
  content: string;
  author_name: string;
  likes: number;
  dislikes: number;
  views: number;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private apiUrl = 'http://localhost:3000/api/threads';

  constructor(private http: HttpClient) {}

  getThreads(): Observable<Thread[]> {
    return this.http
      .get<any[]>(this.apiUrl)
      .pipe(
        map((threads) =>
          threads.map((api) => ({
            id: api.id,
            title: api.title,
            content: api.content,
            author: api.author_name,
            likes: api.likes,
            dislikes: api.dislikes,
            views: api.views,
            createdAt: new Date(api.created_at),
          }))
        )
      );
  }
}