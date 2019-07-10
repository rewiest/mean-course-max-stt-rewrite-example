const express = require('express');
const checkAuth = require('../middleware/check-auth');

const ActionController = require('../controllers/action-controller');


const router = express.Router();

router.post('/posts', checkAuth, ActionController.addPost);

router.get('/posts', ActionController.getPosts);

router.get('/posts/:id', ActionController.getPost);

router.put('/posts/:id', checkAuth, ActionController.updatePost);

router.delete('/posts/:id', checkAuth, ActionController.deletePost);

module.exports = router;
