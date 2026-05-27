require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedAdmin = require('./seeds/seedAdmin');

const app = express();

// Connect to database, then seed default admin
connectDB().then(() => {
  seedAdmin();
});

app.use(cors());
app.use(express.json());

// Public auth routes (no token required)
app.use('/api/auth', require('./routes/auth'));

// Application routes (protected per-route in each router file)
app.use('/api/users', require('./routes/users'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/leave-types', require('./routes/leaveTypes'));
app.use('/api/leave-requests', require('./routes/leaveRequests'));
app.use('/api/reports', require('./routes/reports'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
