const express = require('express');
const checkAuth = require('../middleware/check-auth');

const ActionController = require('../controllers/action-controller');


const router = express.Router();

router.post('/posts', ActionController.addPost);

router.get('/posts', ActionController.getPosts);

router.get('/posts/:id', ActionController.getPost);

router.put('/posts/:id', ActionController.updatePost);

router.delete('/posts/:id', ActionController.deletePost);

module.exports = router;
