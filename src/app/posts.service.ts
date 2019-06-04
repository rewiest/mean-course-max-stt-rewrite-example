import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from './../environments/environment';
import { Subject } from 'rxjs';

import { Post } from './post.model';

@Injectable({
  providedIn: 'root'
})
export class PostsService {

  constructor(private http: HttpClient, private router: Router) { }

  private posts: Post[] = [];
  private postsUpdated = new Subject<Post[]>();
  private apiUrl = environment.apiUrl;

  getPosts() {
    this.http.get<{ message: string, posts: Post[] }>(this.apiUrl + '/api/posts')
      .subscribe((postData) => {
        this.posts = postData.posts;
        this.postsUpdated.next([...this.posts]);
      });
  }

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  getPost(postId: string) {
    return this.http.get<{ message: string, post: Post }>(this.apiUrl + '/api/posts/' + postId);
  }

  addPost(postTitle: string, postContent: string) {
    const post: Post = {
      id: null,
      title: postTitle,
      content: postContent
    };
    this.http.post<{ message: string, post: Post }>(this.apiUrl + '/api/posts', post)
      .subscribe((postData) => {
        post.id = postData.post.id;
        this.posts.push(post);
        this.postsUpdated.next([...this.posts]);
        this.router.navigate(['/']);
      });
  }

  updatePost(postId: string, postTitle: string, postContent: string) {
    const post: Post = {
      id: postId,
      title: postTitle,
      content: postContent
    };
    this.http.put<{ message: string, post: Post }>(this.apiUrl + '/api/posts/' + postId, post)
      .subscribe((postData) => {
        const updatedPosts = [...this.posts];
        const oldPostIndex = updatedPosts.findIndex(p => p.id === post.id);
        updatedPosts[oldPostIndex] = post;
        this.posts = updatedPosts;
        this.postsUpdated.next([...this.posts]);
        this.router.navigate(['/']);
      });
  }

  deletePost(postId: string) {
    this.http.delete<{ message: string, post: Post }>(this.apiUrl + '/api/posts/' + postId)
      .subscribe((response) => {
        const updatedPosts = this.posts.filter(post => post.id !== postId);
        this.posts = updatedPosts;
        this.postsUpdated.next([...this.posts]);
      });
  }
}
