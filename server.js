const express = require('express');
const connectDB = require('./config/db');

const app = express();

// connect db
connectDB();

// parse body to json
app.use(express.json({ extended: false }));

// routes
app.use('/api/users', require('./routes/api/user'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/post'));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
