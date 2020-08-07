const express = require('express');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const requireAuth = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', requireAuth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate('user', [ 'name', 'avatar' ]);

		if (!profile) {
			return res.status(400).json({ msg: 'Profile is not created yet.' });
		}
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

		res.send('he');
	}
);

module.exports = router;
