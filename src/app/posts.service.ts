import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../environments/environment';
import { Subject } from 'rxjs';
import { Post } from './post.model';
import { stringify } from '@angular/core/src/util';

@Injectable({
  providedIn: 'root'
})
export class PostsService {

  constructor(private http: HttpClient) { }

  private posts: Post[] = [];
  private postsUpdated = new Subject<Post[]>();
  private apiUrl = environment.apiUrl;

  getPosts() {
    this.http.get<{ message: string, posts: Post[] }>(this.apiUrl + '/api/posts')
      .subscribe((postData) => {
        console.log(postData);
        this.posts = postData.posts;
        this.postsUpdated.next([...this.posts]);
      });
  }

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  addPosts(title: string, content: string) {
    const post: Post = {
      id: null,
      title: title,
      content: content
    };
    this.http.post< {message: string, post: Post}>(this.apiUrl + '/api/posts', post)
      .subscribe((postData) => {
        console.log(postData);
        this.posts.push(post);
        this.postsUpdated.next([...this.posts]);
      });
  }
}
