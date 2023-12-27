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

exports.postSignIn = async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
        // Check if a user with the provided username or email and password exists
        const user = await SignUp.findOne({
            where: {
                [Sequelize.or]: [
                    { name: name },
                    { email: email }
                ]
            }
        });

        if (user) {
            // Log values for debugging
            console.log('Entered username/email:', name || email);
            console.log('Entered password:', password);
            console.log('Database password:', user.password);

            // Check password match (modify as needed based on your encryption/hashing)
            if (password === user.password) {
                // User found, consider it a successful sign-in
                res.status(200).send('Sign In successful');
            } else {
                // Password mismatch
                res.status(401).send('Incorrect password');
            }
        } else {
            // User not found
            res.status(401).send('User not found');
        }
    } catch (error) {
        console.error('Error during sign-in:', error);
        res.status(500).send('Error during sign-in');
    }
};
