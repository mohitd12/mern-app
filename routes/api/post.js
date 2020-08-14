const express = require('express');
const { check, validationResult } = require('express-validator');

const requireAuth = require('../../middleware/auth');
const User = require('../../models/User');
const Post = require('../../models/Post');

const router = express.Router();

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post('/', [ requireAuth, [ check('text', 'Text is required').not().isEmpty() ] ], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const user = await User.findById(req.user.id).select('-password');

		const newPost = new Post({
			text: req.body.text,
			avatar: user.avatar,
			name: user.name,
			user: req.user.id
		});

		const post = await newPost.save();
		res.json(post);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error</h1>`);
	}
});

// @route   GET /api/posts
// @desc    Get all posts
// @access  Private
router.get('/', requireAuth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error</h1>`);
	}
});

// @route   GET /api/posts/post_id
// @desc    Get a post by id
// @access  Private
router.get('/:post_id', requireAuth, async (req, res) => {
	try {
		await Post.findById(req.params.post_id, (err, post) => {
			if (err) {
				return res.status(400).json({ msg: 'Post not found.' });
			}
			res.json(post);
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error</h1>`);
	}
});

// @route   DELETE /api/posts/post_id
// @desc    Delete a post by id
// @access  Private
router.delete('/:post_id', requireAuth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id, (err, post) => {
			if (err) {
				return res.status(400).json({ msg: 'Post not found.' });
			}
			return post;
		});
		// check user
		if (post.user.toString() !== req.user.id) {
			return res.status(400).json({ msg: 'User not authorized' });
		}

		await post.remove();
		res.json({ msg: 'Post removed' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error</h1>`);
	}
});

// @route   PUT /api/posts/like/post_id
// @desc    Like a post by id
// @access  Private
router.put('/like/:post_id', requireAuth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id, (err, post) => {
			if (err) return res.status(400).json({ msg: 'Post not found' });
		});

		// check if already liked by current user
		if (post.likes.filter((like) => like.user.toString() === req.user.id).length > 0) {
			return res.status(400).json({ msg: 'Post already liked!' });
		}

		post.likes.unshift({ user: req.user.id });
		await post.save();
		res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error</h1>`);
	}
});

// @route   PUT /api/posts/unlike/post_id
// @desc    Like a post by id
// @access  Private
router.put('/unlike/:post_id', requireAuth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id, (err, post) => {
			if (err) return res.status(400).json({ msg: 'Post not found' });
		});

		// check if already liked by current user
		if (post.likes.filter((like) => like.user.toString() === req.user.id).length === 0) {
			return res.status(400).json({ msg: 'Post has not yet been liked.' });
		}

		const removeIdx = post.likes.map((like) => like.user.toString()).indexOf(req.user.id);

		post.likes.splice(removeIdx, 1);
		await post.save();
		res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error</h1>`);
	}
});

// @route   POST /api/posts/comments/:post_id
// @desc    Create a comment
// @access  Private
router.post(
	'/comments/:post_id',
	[ requireAuth, [ check('text', 'Text is required').not().isEmpty() ] ],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select('-password');
			const post = await Post.findById(req.params.post_id, (err, post) => {
				if (err) return res.status(400).json({ msg: 'Post not found' });
			});

			const newComment = {
				text: req.body.text,
				avatar: user.avatar,
				name: user.name,
				user: req.user.id
			};

			post.comments.unshift(newComment);
			await post.save();
			res.json(post.comments);
		} catch (err) {
			console.error(err.message);
			res.status(500).send(`<h1>Internal server error</h1>`);
		}
	}
);

// @route   DELETE /api/posts/comments/:post_id/:comment_id
// @desc    Delete a comment
// @access  Private
router.delete('/comments/:post_id/:comment_id', requireAuth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id, (err, post) => {
			if (err) return res.status(400).json({ msg: 'Post not found' });
		});

		// Pull out comment
		const comment = post.comments.find((comment) => comment.id === req.params.comment_id);

		// Make sure comment exist
		if (!comment) {
			return res.status(404).json({ msg: 'Comment does not exist.' });
		}

		// Check if user authorized to delete
		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'User not authorized' });
		}

		const removeIdx = post.comments.map((comment) => comment.user.toString()).indexOf(req.user.id);

		post.comments.splice(removeIdx, 1);
		await post.save();
		res.json(post.comments);
	} catch (err) {
		console.error(err.message);
		res.status(500).send(`<h1>Internal server error</h1>`);
	}
});

module.exports = router;
