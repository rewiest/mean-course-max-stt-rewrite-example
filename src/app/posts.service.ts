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
  private postsUpdated = new Subject<{posts: Post[], count: number}>();
  private apiUrl = environment.apiUrl;

  getPosts(postsPerPage: number, currentPage: number) {
    const queryParams = `?pagesize=${postsPerPage}&page=${currentPage}`;
    this.http.get<{ message: string, posts: Post[], count: number }>(this.apiUrl + '/api/posts' + queryParams)
      .subscribe((postData) => {
        this.posts = postData.posts;
        this.postsUpdated.next({posts: [...this.posts], count: postData.count});
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
        this.router.navigate(['/']);
      });
  }

  deletePost(postId: string) {
    return this.http.delete<{ message: string, post: Post }>(this.apiUrl + '/api/posts/' + postId);
  }
}
