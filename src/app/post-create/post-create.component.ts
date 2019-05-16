import { Component, OnInit } from '@angular/core';
import { disableBindings } from '@angular/core/src/render3';

@Component({
  selector: 'app-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.css']
})
export class PostCreateComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  onAddPost() {
    alert('Save was clicked');
  }
}
