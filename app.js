const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = require('./util/database.js');
const SignUp = require('./models/signUp.js');

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/user/auth', (req, res, next) => {
  res.send(`
    <form id="authForm" action="/user/auth" method="POST">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name" required autocomplete="name"><br>
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required autocomplete="email"><br>
      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required><br>

      <input type="radio" id="signUp" name="authType" value="signUp" checked>
      <label for="signUp">Sign Up</label>

      <input type="radio" id="signIn" name="authType" value="signIn">
      <label for="signIn">Sign In</label>

      <button type="submit">Submit</button>
    </form>
  `);
});

app.post('/user/auth', async (req, res, next) => {
  try {
    const { name, email, password, authType } = req.body;

    if (!name || !email || !password || !authType) {
      return res.status(400).send('Email, password, and authentication type are required for authentication.');
    }

    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);

    if (authType === 'signUp') {
      // Sign-up logic
      const existingEmail = await SignUp.findOne({ where: { email: email } });

      if (existingEmail) {
        return res.status(400).send('Email or username is already taken. Please choose different ones.');
      }

      // No existing email, create a new SignUp record
      await SignUp.create({
        name: name,
        email: email,
        password: hashedPassword
      });

      return res.status(201).json({ message: 'User registration successful.' });
    } else if (authType === 'signIn') {
      // Sign-in logic
      const user = await SignUp.findOne({ where: { email: email } });

      if (!user) {
        return res.status(404).send('User not found.');
      }

      // If user exists, check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        return res.status(200).json({ message: 'User login successful.' });
      } else {
        return res.status(401).send('User not authorized. Incorrect password.');
      }
    } else {
      return res.status(400).send('Invalid authentication type');
    }
  } catch (err) {
    console.error('Error during authentication:', err);
    res.status(500).send('Error during authentication');
  }
});



sequelize
  .sync()
  .then(() => {
    app.listen(8000, () => {
      console.log('Server is running on port 8000');
    });
  })
  .catch(err => {
    console.log(err);
  });
