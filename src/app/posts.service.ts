import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../environments/environment';
import { Subject } from 'rxjs';
import { Post } from './post.model';

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

  addPosts(newTitle: string, newContent: string) {
    const post: Post = {
      id: null,
      title: newTitle,
      content: newContent
    };
    this.http.post<{ message: string, post: Post }>(this.apiUrl + '/api/posts', post)
      .subscribe((postData) => {
        console.log(postData);
        post.id = postData.post.id;
        this.posts.push(post);
        this.postsUpdated.next([...this.posts]);
      });
  }

  deletePost(postId: string) {
    this.http.delete<{ message: string, post: Post }>(this.apiUrl + '/api/posts/' + postId)
      .subscribe((response) => {
        console.log(response);
        const updatedPosts = this.posts.filter(post => post.id !== postId);
        this.posts = updatedPosts;
        this.postsUpdated.next([...this.posts]);
      });
  }
}
