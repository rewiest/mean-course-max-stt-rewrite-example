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
  console.log('In route - getPosts', '(' + req.userData.email + ')');
  postsDb.list({'include_docs': true})
    .then((fetchedPosts) => {
      posts = [];
      row = 0;
      fetchedPosts.rows.forEach((fetchedPost) => {
        posts[row] = {
          _id: fetchedPost.id,
          title: fetchedPost.doc.title,
          text: fetchedPost.doc.text,
          refUrl: fetchedPost.doc.refurl,
          creator: fetchedPost.doc.creator
        }
        row = row + 1;
      });
      console.log('Get posts successful', '(' + req.userData.email + ')');
      res.status(200).json({
        message: 'Get posts successful.',
        posts: posts
      });
    })
    .catch((error) => {
      console.log('Get posts failed', '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Get posts failed.',
        error: error
      });
    });
}

// get single post function
exports.getPost = (req, res, next) => {
  let postId = req.params.id;
  console.log('In route - getPost', '(' + req.userData.email + ')');
  postsDb.get(postId)
    .then((fetchedPost) => {
      console.log('Get post successful for', postId, '(' + req.userData.email + ')');
      res.status(200).json({
        message: 'Get post successful.',
        post: {
          _id: fetchedPost._id,
          title: fetchedPost.title,
          text: fetchedPost.text,
          refUrl: fetchedPost.refurl,
          creator: fetchedPost.creator
        }
      });
    })
    .catch((error) => {
      console.log('Get post failed for', postId, '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Get post failed.',
        error: error
      });
    });
}

// add post function
exports.addPost = (req, res, next) => {
  console.log(req.userData.email, 'In route - addPost');
  if (
    ((req.body.creator !== req.userData.email) || (req.userData.roles.indexOf('Creator') < 0)) &&
    (req.userData.roles.indexOf('Reviewer') < 0 ) &&
    (req.userData.roles.indexOf('Admin') < 0)
  ) {
    console.log('Not authorized', '(' + req.userData.email + ')');
    return res.status(403).json({
      message: 'Not authorized to add a post.'
    });
  }
  let post = {
    title: req.body.title,
    text: req.body.text,
    refurl: req.body.refUrl,
    creator: req.body.creator
  }
  postsDb.insert(post)
    .then((addedPost) => {
      console.log('Add post successful for', addedPost.id, '(' + req.userData.email + ')');
      res.status(201).json({
        message: 'Add post successful.',
        post: {
          _id: addedPost.id,
          title: post.title,
          text: post.text,
          refUrl: post.refurl,
          creator: post.creator
        }
      });
    })
    .catch(error => {
      console.log('Add post failed', '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Add post failed.',
        error: error
      });
    });
}

// update post function
exports.updatePost = (req, res, next) => {
  console.log('In route - updatePost', '(' + req.userData.email + ')');
  let post = {
    _id: req.params.id,
    _rev: '',
    title: req.body.title,
    text: req.body.text,
    refurl: req.body.refUrl,
    creator: req.body.creator
  }
  postsDb.get(post._id)
    .then((fetchedPost) => {
      if (
        ((fetchedPost.creator !== req.userData.email) || (req.userData.roles.indexOf('Creator') < 0)) &&
        (req.userData.roles.indexOf('Reviewer') < 0 ) &&
        (req.userData.roles.indexOf('Admin') < 0)
      ) {
        console.log('Not authorized', '(' + req.userData.email + ')');
        return res.status(403).json({
          message: 'Not authorized to update this post.'
        });
      }
      post._rev = fetchedPost._rev;
      return postsDb.insert(post);
    })
    .then((updatedPost) => {
      if (res.statusCode !== 200) return
      console.log('Update post successful for', post._id, '(' + req.userData.email + ')');
      res.status(201).json({
        message: 'Update post successful.',
        post: {
          _id: updatedPost.id,
          title: post.title,
          text: post.text,
          refUrl: post.refurl,
          creator: post.creator
        }
      });
    })
    .catch((error) => {
      console.log('Update post failed for', post._id, '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Update post failed.',
        error: error
      });
    });
}

// delete post function
exports.deletePost = (req, res, next) => {
  console.log('In route - deletePost', '(' + req.userData.email + ')');
  let postId = req.params.id;
  postsDb.get(postId)
    .then((fetchedPost) => {
      if (
        ((fetchedPost.creator !== req.userData.email) || (req.userData.roles.indexOf('Creator') < 0)) &&
        (req.userData.roles.indexOf('Reviewer') < 0 ) &&
        (req.userData.roles.indexOf('Admin') < 0)
      ) {
        console.log('Not authorized', '(' + req.userData.email + ')');
        return res.status(403).json({
          message: 'Not authorized to delete this post.'
        });
      }
      let latestRev = fetchedPost._rev;
      return postsDb.destroy(postId, latestRev);
    })
    .then((deletedPost) => {
      if (res.statusCode !== 200) return
      console.log('Delete post successful for', postId, '(' + req.userData.email + ')');
      res.status(200).json({
        message: 'Delete post successful.',
        post: {
          _id: deletedPost.id
        }
      });
    })
    .catch((error) => {
      console.log('Delete post failed for', postId, '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Delete post failed.',
        error: error
      });
    })
}
