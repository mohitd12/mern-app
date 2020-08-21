const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');
const requireAuth = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/auth
// @desc    Get Auth User
// @access  Public
router.get('/', requireAuth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error </h1>`);
	}
});

// @route	POST /api/auth
// @desc	Create User
// @access	Public
router.post(
	'/',
	[ check('email', 'Please type a valid email').isEmail(), check('password', 'Password is required').exists() ],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: [ { msg: 'Invalid credentials' } ] });
		}

		const { email, password } = req.body;
		try {
			const user = await User.findOne({ email });
			// if user not found
			if (!user) {
				return res.status(400).json({ errors: [ { msg: 'Invalid credentials 2' } ] });
			}

			// if user found, compare the passwords
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				res.status(400).json({ errors: [ { msg: 'Invalid credentials 3' } ] });
			}

			// if user exist, create a token
			const payload = {
				user: {
					id: user.id
				}
			};
			jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 3600 }, (err, token) => {
				res.json({ token });
			});
		} catch (err) {
			console.log(err.message);
			res.status(500).send(`<h1>Internal server error</h1>`);
		}
	}
);

module.exports = router;
