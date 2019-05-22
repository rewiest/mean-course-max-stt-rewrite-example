// initialize Cloudant
const Cloudant = require('@cloudant/cloudant');
const cloudant = new Cloudant({ url: process.env.DB_URL, plugins: 'promises' });

// create Posts database if it does not already exist
cloudant.db.create('posts')
  .then((data) => {
    console.log('Posts database created');
  })
  .catch((error) => {
    if (error.error === 'file_exists') {
      console.log('Posts database already exists');
    } else {
      console.log('Error occurred when creating Posts database', error.error);
    }
  });
const postsDb = cloudant.db.use('posts');

// get all posts function
exports.getPosts = (req, res, next) => {
  console.log('In route - getPosts');
  postsDb.list({'include_docs': true})
    .then((fetchedPosts) => {
      console.log(fetchedPosts);
      posts = [];
      row = 0;
      fetchedPosts.rows.forEach((fetchedPost) => {
        posts[row] = {
          id: fetchedPost.id,
          title: fetchedPost.doc.title,
          content: fetchedPost.doc.content
        }
        row = row + 1;
      });
      console.log('Get posts successful');
      res.status(200).json({
        message: 'Get posts sucessful.',
        posts: posts
      })
    })
    .catch((error) => {
      console.log('Get post failed');
      res.status(500).json({
        message: 'Get post failed.',
        error: error
      });
    });
}

// add post function
exports.addPost = (req, res, next) => {
  console.log('In route - addPost');
  let post = {
    title: req.body.title,
    content: req.body.content
  }
  console.log(post);
  postsDb.insert(post)
    .then((addedPost) => {
      console.log('Add post successful for ' + addedPost.id);
      console.log(addedPost);
      res.status(201).json({
        message: 'Add post successful.',
        post: {
          id: addedPost.id,
          title: post.title,
          content: post.content
        }
      });
    })
    .catch((error) => {
      console.log('Add post failed');
      res.status(500).json({
        message: 'Add post failed.',
        error: error
      });
    });
};



