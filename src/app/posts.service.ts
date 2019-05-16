import { Injectable } from '@angular/core';
import { Post } from './post.model';

@Injectable({
  providedIn: 'root'
})
export class PostsService {

  constructor() { }

  private posts: Post[] = [];

  getPosts() {
    return [...this.posts];
  }

  addPosts(title: string, content: string) {
    const post: Post = {
      title: title,
      content: content
    };
    this.posts.push(post);
  }
}
