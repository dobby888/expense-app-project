const path = require('path');

const SignUp = require('../models/signUp.js');

const signUpController = require('../controllers/signUp.js');

const express = require('express');

const router = express.Router();

router.get('/user/auth', signUpController.getAuth);

router.post('/user/auth', signUpController.postAuth);

module.exports = router;  