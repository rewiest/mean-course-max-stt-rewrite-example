const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/user-routes');
const actionRoutes = require('./routes/action-routes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// static path for app code files
app.use('/', express.static(path.join(__dirname, '../dist')));

// CORS headers - may remove if using the same domain and port
app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  next();
});

// api test
app.get('/api/posts', (req, res, next) => {
  const posts = [
    {
      id: "001",
      title: "Post Tile 1",
      content: "This is the content for post title 1."
    },
    {
      id: "002",
      title: "Post Tile 2",
      content: "This is the content for post title 2."
    }
  ]
  console.log("Get Posts");
  console.log(posts);
  res.status(200).json({
    message: "The post was successfully retrieved!",
    posts: posts
  });
});

app.post('/api/posts', (req, res, next) => {
  const post = req.body;
  console.log("Add Posts");
  console.log(post);
  res.status(201).json({
    message: "The post was successfully saved!",
    post: post
  });
});

// api paths and routes
app.use('/api', userRoutes);
app.use('/api', actionRoutes);

// default path and static html file
app.all('*', (req,res) => {
  res.status(200).sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// error handler for any other paths that do not match routes
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
})

// error handler for catching all other uncaught or thrown errors
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
})

module.exports = app;
