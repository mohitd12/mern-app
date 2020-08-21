const express = require('express');
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/User');
const router = express.Router();

// @route   POST /api/users
// @desc    Register user
// @access  Public
router.post(
	'/',
	[
		check('name').not().isEmpty().withMessage('Name cannot be empty.'),
		check('email').isEmail().withMessage('Please type a valid email'),
		check('password')
			.isLength({ min: 4 })
			.withMessage('Password must contain atleast 4 characters')
			.matches(/\d/)
			.withMessage('must contain a number')
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, email, password } = req.body;

		try {
			let user = await User.findOne({ email });
			if (user) {
				return res.status(400).json({ errors: [ { msg: 'User already exist.' } ] });
			}

			// create an avatar url for user
			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm'
			});

			user = new User({
				name,
				email,
				avatar,
				password
			});

			const salt = await bcrypt.genSalt(10);
			const passHash = await bcrypt.hash(password, salt);
			// set hashed password
			user.password = passHash;

			// save the user at the end
			await user.save();

			// create JWT auth
			const payload = {
				user: {
					id: user.id
				}
			};

			jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 3600 }, (err, token) => {
				if (err) throw err;
				res.json({ token });
			});

			// res.send('user registered');
		} catch (err) {
			console.error(err.message);
			res.status(500).send(`<h1>Internal server error</h1>`);
		}
	}
);

module.exports = router;
