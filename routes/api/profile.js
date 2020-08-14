const express = require('express');
const { check, validationResult } = require('express-validator');
const config = require('config');
const axios = require('axios');

const User = require('../../models/User');
const Profile = require('../../models/Profile');
const requireAuth = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', requireAuth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate('user', [ 'name', 'avatar' ], User);
		if (!profile) {
			return res.status(400).json({ msg: 'Profile is not created yet.' });
		}
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error</h1>`);
	}
});

// @route   POST /api/profile
// @desc    Create profile
// @access  Private
router.post(
	'/',
	[
		requireAuth,
		[
			check('status', 'Status is required').not().isEmpty(),
			check('skills', 'Skills are required').not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			company,
			website,
			location,
			status,
			skills,
			bio,
			githubusername,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedIn
		} = req.body;

		// create Profile object
		const profileFields = {};
		profileFields.user = req.user.id;

		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (status) profileFields.status = status;
		if (bio) profileFields.bio = bio;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(',').map((skill) => skill.trim());
		}

		// create Social object
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (facebook) profileFields.social.facebook = facebook;
		if (twitter) profileFields.social.twitter = twitter;
		if (instagram) profileFields.social.instagram = instagram;
		if (linkedIn) profileFields.social.linkedIn = linkedIn;

		// insert user's profile to DB
		try {
			let profile = await Profile.findOne({ user: req.user.id });
			// check if profile already exist or update
			if (profile) {
				profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
				return res.json(profile);
			}

			// create a new profile
			profile = new Profile(profileFields);
			await profile.save();

			res.json(profile);
		} catch (err) {
			console.error(err);
			res.status(500).send(`<h1>Internal server error</h1>`);
		}
	}
);

// @route   GET /api/profile
// @desc    Display all profile
// @access  Public
router.get('/', async (req, res) => {
	try {
		await Profile.find().populate('user', [ 'name', 'avatar' ], User).exec((err, profiles) => {
			if (err) {
				console.error(err);
				return res.status(400).json({ msg: 'Cannot find any profile.' });
			}
			res.json(profiles);
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal Server Error</h1>`);
	}
});

// @route   GET /api/profile/user/user_id
// @desc    Display profile by id
// @access  Public
router.get('/user/:user_id', async (req, res) => {
	try {
		await Profile.findOne({ user: req.params.user_id })
			.populate('user', [ 'name', 'avatar' ], User)
			.exec((err, profile) => {
				if (err) {
					return res.status(400).json({ msg: `Profile not found.` });
				}
				res.json(profile);
			});
	} catch (err) {
		console.error(err.message);
		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: `Profile not found.` });
		}
		res.status(500).send(`<h1>Internal Server Error</h1>`);
	}
});

// @route   GET /api/profile
// @desc    Delete profile, user and posts
// @access  Private
router.delete('/', requireAuth, async (req, res) => {
	try {
		// @todo - remove user and post

		// delete the profile of the current user
		await Profile.findOneAndDelete({ user: req.user.id }, (err, profile) => {
			if (err) throw err;
			console.log('Profile deleted');
		});

		// delete the current user
		await User.findByIdAndDelete(req.user.id, (err, user) => {
			if (err) throw err;
			console.log('User deleted');
		});

		res.json({ msg: 'User has been deleted.' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal Server Error</h1>`);
	}
});

// @route   PUT /api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
	'/experience',
	[
		requireAuth,
		[
			check('title', 'Title is required').not().isEmpty(),
			check('company', 'Company is required').not().isEmpty(),
			check('from', 'From date is required').not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { title, location, company, from, to, current, description } = req.body;
		const experienceFields = {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		};

		try {
			// check if profile exists
			let profile = await Profile.findOne({ user: req.user.id });

			if (!profile) {
				return res.status(400).json({ msg: 'You do not have profile.' });
			}

			profile.experience.unshift(experienceFields);
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send(`<h1>Internal Server Error</h1>`);
		}
	}
);

// @route   DELETE /api/profile/experience/exp_id
// @desc    Delete profile experience
// @access  Private
router.delete('/experience/:exp_id', requireAuth, async (req, res) => {
	try {
		// check if profile exists
		let profile = await Profile.findOne({ user: req.user.id });

		if (!profile) {
			return res.status(400).json({ msg: 'Profile not created yet.' });
		}

		profile.experience = profile.experience.filter((exp) => exp.id !== req.params.exp_id);
		await profile.save();
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal Server Error</h1>`);
	}
});

// @route   PUT /api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
	'/education',
	[
		requireAuth,
		[
			check('school', 'School is required').not().isEmpty(),
			check('degree', 'Degree is required').not().isEmpty(),
			check('from', 'From date is required').not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { school, degree, fieldofstudy, from, to, current, description } = req.body;
		const educationFields = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description
		};

		try {
			// check if profile exists
			let profile = await Profile.findOne({ user: req.user.id });

			if (!profile) {
				return res.status(400).json({ msg: 'You do not have profile.' });
			}

			profile.education.unshift(educationFields);
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send(`<h1>Internal Server Error</h1>`);
		}
	}
);

// @route   DELETE /api/profile/education/edu_id
// @desc    Delete profile experience
// @access  Private
router.delete('/education/:edu_id', requireAuth, async (req, res) => {
	try {
		// check if profile exists
		let profile = await Profile.findOne({ user: req.user.id });

		if (!profile) {
			return res.status(400).json({ msg: 'Profile not created yet.' });
		}

		profile.education = profile.education.filter((edu) => {
			return edu.id !== req.params.edu_id;
		});

		await profile.save();
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal Server Error</h1>`);
	}
});

// @route   GET /api/profile/github/:username
// @desc    Get github repos of user
// @access  Public
router.get('/github/:username', async (req, res) => {
	try {
		const url = `https://api.github.com/users/${req.params
			.username}/repos?per_page=5&sort=created:asc&client_id=${config.get(
			'githubClientId'
		)}&client_secret=${config.get('githubSecret')}`;

		const resp = await axios.get(url).catch((err) => {
			if (err.response.status !== 200) return res.status(400).json({ msg: 'No github profile found.' });
		});

		res.json(resp.data);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error</h1>`);
	}
});

module.exports = router;
