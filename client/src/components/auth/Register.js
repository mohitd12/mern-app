import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { setAlert } from '../../actions/alert';
import PropTypes from 'prop-types';

import Alert from '../layout/Alert';

const Register = ({ setAlert }) => {
	const [ formData, setFormData ] = useState({
		name: '',
		email: '',
		password: '',
		cpassword: ''
	});

	const { name, email, password, cpassword } = formData;

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (password !== cpassword) {
			setAlert('Passwords do not match', 'danger', 3000);
		} else {
			console.log('Success');
		}
	};

	return (
		<section className="container">
			<Alert />
			<h1 className="large text-primary">Sign Up</h1>
			<p className="lead">
				<i className="fas fa-user" /> Create Your Account
			</p>
			<form className="form" onSubmit={handleSubmit}>
				<div className="form-group">
					<input type="text" placeholder="Name" name="name" required onChange={handleChange} value={name} />
				</div>
				<div className="form-group">
					<input
						type="email"
						placeholder="Email Address"
						name="email"
						onChange={handleChange}
						value={email}
					/>
					<small className="form-text">
						This site uses Gravatar so if you want a profile image, use a Gravatar email
					</small>
				</div>
				<div className="form-group">
					<input
						type="password"
						placeholder="Password"
						name="password"
						minLength="6"
						onChange={handleChange}
						value={password}
					/>
				</div>
				<div className="form-group">
					<input
						type="password"
						placeholder="Confirm Password"
						name="cpassword"
						minLength="6"
						onChange={handleChange}
						value={cpassword}
					/>
				</div>
				<input type="submit" className="btn btn-primary" value="Register" />
			</form>
			<p className="my-1">
				Already have an account?&nbsp;
				<Link to="/login">Sign In</Link>
			</p>
		</section>
	);
};

Register.propTypes = {
	setAlert: PropTypes.func.isRequired
};

export default connect(null, { setAlert })(Register);
