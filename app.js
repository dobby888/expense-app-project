const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = require('./util/database.js');
const SignUp = require('./models/signUp.js');
const Expense = require('./models/expense.js');

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

      // Redirect to the addExpenses page after signup
      res.redirect('/user/auth');
    } else if (authType === 'signIn') {
      // Sign-in logic
      const user = await SignUp.findOne({ where: { email: email } });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // If user exists, check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        // Redirect to the addExpenses page after login
        res.redirect('/user/addExpenses');
      } else {
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

app.get('/user/addExpenses', async (req, res, next) => {
  try {
    // const expenses = await Expense.findAll();
    res.sendFile('expense.html', { root: 'views' });
  } catch (err) {
    console.log('Error displaying expenses:', err);
    return res.send('Error fetching expenses');
  }
});

app.post('/user/addExpenses', async (req, res, next) => {
  try {
    const { spentAmount, spentDes, category } = req.body;
    await Expense.create({
      spentAmount: spentAmount,
      spentDes: spentDes,
      category: category
    });
    res.redirect('/user/addExpenses');
  } catch (err) {
    console.error('Error during expense:', err);
    return res.status(500).json({ success: false, message: 'Error during adding expense' });
  }
});

app.get('/user/expenses', async (req, res, next) => {
  try {
      const data = await Expense.findAll();
      res.json(data);
  } catch (err) {
      console.log("Error while fetching all expenses:", err);
  }
})

app.post('/user/deleteExpenses/:dID', async (req, res, next) => {
  const dID = req.params.dID;
    try {
      await Expense.destroy({ where: { id: dID } });

        res.redirect('/user/expenses');
    } catch (err) {
        console.log("Error while deleting expense Details with id: ", dID, err);
    } 
});

app.get('/user/editExpenses/:eID', async (req, res, next) => {
  try {
    const eID = req.params.eID;
    const expense = await Expense.findByPk(eID);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    res.json(expense);
  } catch (err) {
    console.log('Error during fetching expense for editing:', err);
    return res.status(500).json({ success: false, message: 'Error during fetching expense for editing' });
  }
});

sequelize.sync()
  .then(() => {
    app.listen(8000, () => {
      console.log('Server is running on port 8000');
    });
  })
  .catch(err => {
    console.log(err);
  });
