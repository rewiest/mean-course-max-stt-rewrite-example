import { Component, OnInit } from '@angular/core';
import { PostsService } from './../posts.service';
import { Post } from './../post.model';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {

  constructor(public postsService: PostsService) { }

  posts: Post[] = [];

  ngOnInit() {
    this.posts = this.postsService.getPosts();
  }

}
