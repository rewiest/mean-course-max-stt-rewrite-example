import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatInputModule, MatCardModule, MatButtonModule } from '@angular/material';

import { AppComponent } from './app.component';
import { PostCreateComponent } from './post-create/post-create.component';

@NgModule({
  declarations: [
    AppComponent,
    PostCreateComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
