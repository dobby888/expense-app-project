const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const sequelize = require('./util/database.js');

const app = express();

const signUpRoutes = require('./routes/signUp.js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(signUpRoutes);

sequelize
  .sync()
  .then(login => {
    app.listen(8000);
  })
  .catch(err => {
    console.log(err); 
  });
