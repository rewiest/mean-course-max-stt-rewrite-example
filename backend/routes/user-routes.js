const express = require('express');
const checkAuth = require('../middleware/check-auth');

const UserController = require('../controllers/user-controller');

const router = express.Router();

router.post('/users/login', UserController.userLogin);

// router.post('/users', checkAuth, UserController.addUser);

// router.get('/users', checkAuth, UserController.getUsers);

// router.get('/users/:id', checkAuth, UserController.getUser);

// router.put('/users/:id', checkAuth, UserController.updateUser);

// router.delete('/users/:id', checkAuth, UserController.deleteUser);


module.exports = router;
