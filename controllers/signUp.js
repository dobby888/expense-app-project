const SignUp = require('../models/signUp');
const Sequelize = require('sequelize'); // Assuming Sequelize is used

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
        });

        // Redirect to sign-up success page or handle as needed
        res.redirect('/user/signUpSuccess');
    } catch (err) {
        console.error('Error creating signUp record:', err);
        res.status(500).send('Error creating signUp record');
    }
}

exports.postSignIn = async (req, res, next) => {
    const { signInName, signInEmail, signInPassword } = req.body;

    try {
        // Check if a user with the provided name or email exists
        const user = await SignUp.findOne({
            where: {
                [Sequelize.or]: [
                    { name: signInName },
                    { email: signInEmail }
                ]
            }
        });

        if (user) {
            // Log values for debugging
            console.log('Entered name:', signInName);
            console.log('Entered email:', signInEmail);
            console.log('Entered password:', signInPassword);
            console.log('Database password:', user.password);

            // Check password match (modify as needed based on your encryption/hashing)
            if (signInPassword === user.password) {
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
