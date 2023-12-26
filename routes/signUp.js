const path = require('path');

const SignUp = require('../models/signUp.js');

const signUpController = require('../controllers/signUp.js');

const express = require('express');

const router = express.Router();

router.get('/user/signUp', signUpController.getSignUp);

router.post('/user/signUp', signUpController.postSignUp);

module.exports = router;