const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const axios = require('axios'); // Add Axios

const sequelize = require('./util/database.js');
const SignUp = require('./models/signUp.js');

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/user/auth', (req, res, next) => {
  res.send(`
    <form id="authForm">
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

      <button type="button" onclick="submitForm()">Submit</button>
    </form>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script>
      async function submitForm() {
        const formData = new FormData(document.getElementById('authForm'));
        try {
          const response = await axios.post('/user/auth', Object.fromEntries(formData));
          handleResponse(response.data);
        } catch (error) {
          console.error('Error during form submission:', error);
        }
      }

      function handleResponse(data) {
        if (data.success) {
          alert(data.message);
          if (data.authType === 'signUp') {
            window.location.href = '/user/auth'; // Redirect to the sign-up page
          }
        } else {
          alert('Error: ' + data.message);
        }
      }
    </script>
  `);
});

app.post('/user/auth', async (req, res, next) => {
  try {
    const { name, email, password, authType } = req.body;

    if (!name || !email || !password || !authType) {
      return res.status(400).json({ success: false, message: 'Email, password, and authentication type are required for authentication.' });
    }

    if (authType === 'signUp') {
      // Sign-up logic
      const existingEmail = await SignUp.findOne({ where: { email: email } });

      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email or username is already taken. Please choose different ones.' });
      }

      // No existing email, create a new SignUp record
      const salt = 10;
      const hashedPassword = await bcrypt.hash(password, salt);
      await SignUp.create({
        name: name,
        email: email,
        password: hashedPassword
      });

      return res.status(201).json({ success: true, message: 'User registration successful.', authType: 'signUp' });
    } else if (authType === 'signIn') {
      // Sign-in logic
      const user = await SignUp.findOne({ where: { email: email } });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // If user exists, check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        return res.status(200).json({ success: true, message: 'User login successful.', authType: 'signIn' });
      } else {
        console.log('Stored Hashed Password:', user.password);
        console.log('Entered Password:', password);
        return res.status(401).json({ success: false, message: 'User not authorized. Incorrect password.' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid authentication type' });
    }
  } catch (err) {
    console.error('Error during authentication:', err);
    return res.status(500).json({ success: false, message: 'Error during authentication' });
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
