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
    const expenses = await Expense.findAll();
    res.send(`
      <form action='/user/addExpenses' method='POST'>
        <label for="amountSpent">Amount Spent:</label>
        <input type="number" id="amountSpent" name="amountSpent" required autocomplete="amountSpent"><br>
        <label for="spentDes">Description:</label>
        <input type="text" id="spentDes" name="spentDes" required autocomplete="spentDes"><br>
        <label for="category">Category:</label>
        <select id="category" name="category" style="width: 100%; height: 30px;">
          <option value="education">Education</option>
          <option value="food">Food</option>
          <option value="medical">Medical</option>
          <option value="family">Family</option>
          <option value="grocery">Grocery</option>
          <option value="rent">Rent</option>
          <option value="transport">Transport</option>
          <option value="entertainment">Entertainment</option>
        </select><br><br>
        <button type='submit'>Add Expense</button>
      </form>
      <ul id='expenseList'>
        ${displayexpenseList(expenses)}
      </ul>
      
    `);
  } catch (err) {
    console.log('Error displaying expenses:', err);
    return res.send('Error fetching expenses');
  }
});

app.post('/user/addExpenses', async (req, res, next) => {
  try {
    const { amountSpent, spentDes, category } = req.body;
    await Expense.create({
      amount: amountSpent,
      description: spentDes,
      category: category
    });
    res.redirect('/user/addExpenses');
  } catch (err) {
    console.error('Error during expense:', err);
    return res.status(500).json({ success: false, message: 'Error during adding expense' });
  }
});

app.post('/user/deleteExpenses/:id', async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    await Expense.destroy({ where: { id: expenseId } });
    res.redirect('/user/addExpenses');
  } catch (err) {
    console.log('Error during deleting an expense:', err);
    return res.send('Error during expense deletion');
  }
});

function displayexpenseList(expenses) {
  return expenses.map(expense => `
    <li>
      ${expense.amount}-${expense.description}-${expense.category}
      <button onclick="deleteExpenses(${expense.id})">Delete</button>
    </li>`).join('');
}

sequelize.sync()
  .then(() => {
    app.listen(8000, () => {
      console.log('Server is running on port 8000');
    });
  })
  .catch(err => {
    console.log(err);
  });
