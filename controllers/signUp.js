const SignUp = require('../models/signUp');

exports.getSignUp = (req, res, next) => {
    res.sendFile('signUp.html', { root: 'views' });
}

exports.postSignUp = async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send('All fields are required');
    }

    try {
        const signUp = await SignUp.create({
            name: name,
            email: email,
            password: password
        })
        res.redirect('/user/signUp');
    }catch (err) {
        console.error('Error creating slot:', err);
        res.status(500).send('Error creating slot');
      }
}