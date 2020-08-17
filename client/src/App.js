import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';

import store from './store';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import './App.css';

const App = () => {
	return (
		<Provider store={store}>
			<Router>
				<Navbar />
				<Route exact path="/" render={() => <Landing />} />
				<Switch>
					<Route exact path="/register" render={() => <Register />} />
					<Route exact path="/login" render={() => <Login />} />
				</Switch>
			</Router>
		</Provider>
	);
};

export default App;
