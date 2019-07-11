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
  let pageSize = +req.query.pagesize;
  let currentPage = +req.query.page;
  let skip = pageSize * (currentPage - 1);
  let limit = pageSize;
  postsDb.list({'include_docs': true, 'skip': skip, 'limit': limit})
    .then((fetchedPosts) => {
      posts = [];
      row = 0;
      fetchedPosts.rows.forEach((fetchedPost) => {
        posts[row] = {
          id: fetchedPost.id,
          title: fetchedPost.doc.title,
          content: fetchedPost.doc.content,
          creator: fetchedPost.doc.creator
        }
        row = row + 1;
      });
      let docCount = fetchedPosts.total_rows;
      console.log('Get posts successful');
      res.status(200).json({
        message: 'Get posts sucessful.',
        posts: posts,
        count: docCount
      })
    })
    .catch((error) => {
      console.log('Get post failed');
      res.status(500).json({
        message: 'Get post failed.',
        error: error
      });
    });
};

// get one post function
exports.getPost = (req, res, next) => {
  console.log('In route - getPost');
  let postId = req.params.id;
  postsDb.get(postId)
    .then((fetchedPost) => {
      console.log('Get post successful for', postId);
      res.status(200).json({
        message: 'Get post successful.',
        post: {
          id: fetchedPost._id,
          title: fetchedPost.title,
          content: fetchedPost.content,
          creator: fetchedPost.creator
        }
      })
    })
    .catch((error) => {
      console.log('Get post failed');
      res.status(500).json({
        message: 'Get post failed.',
        error: error
      });
    });
};

// add post function
exports.addPost = (req, res, next) => {
  console.log('In route - addPost');
  let post = {
    title: req.body.title,
    content: req.body.content,
    creator: req.userData.email
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
          content: post.content,
          creator: post.creator
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

// update post function
exports.updatePost = (req, res, next) => {
  console.log('In route - updatePost');
  let post = {
    _id: req.params.id,
    _rev: '',
    title: req.body.title,
    content: req.body.content,
    creator: req.userData.email
  }
  postsDb.get(post._id)
    .then((fetchedPost) => {
      if (fetchedPost.creator !== req.userData.email) {
        console.log('Not authorized.');
        res.status(401).json({
          message: 'Not authorized.'
        });
        return;
      }
      post._rev = fetchedPost._rev;
      return postsDb.insert(post);
    })
    .then((updatedPost) => {
      if (res.statusCode !== 200) return
      console.log('Update post successful for', post._id);
      res.status(201).json({
        message: 'Update post successful.',
        post: {
          id: updatedPost.id,
          title: post.title,
          content: post.content,
          creator: post.creator
        }
      });
    })
    .catch((error) => {
      console.log('Update post failed for ' + postId);
      res.status(500).json({
        message: 'Update post failed.',
        error: error
      });
    });
};

// delete post function
exports.deletePost = (req, res, next) => {
  console.log('In route - deletePost');
  let postId = req.params.id;
  postsDb.get(postId)
    .then((fetchedPost) => {
      if (fetchedPost.creator !== req.userData.email) {
        console.log('Not authorized.');
        res.status(401).json({
          message: 'Not authorized.'
        });
        return;
      }
      let latestRev = fetchedPost._rev;
      return postsDb.destroy(postId, latestRev);
    })
    .then((deletedPost) => {
      if (res.statusCode !== 200) return
      console.log('Delete post successful for ' + postId);
      res.status(200).json({
        message: 'Delete post successful.',
        post: {
          id: deletedPost.id
        }
      });
    })
    .catch((error) => {
      console.log('Delete post failed for ' + postId);
      res.status(500).json({
        message: 'Delete post failed.',
        error: error
      });
    });
};


