require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// ==================== AUTH ROUTES ====================

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  console.log('Received registration data:', req.body);
  
  const { first_name, last_name, email, password } = req.body;

  // Validation
  if (!first_name || !last_name || !email || !password) {
    console.log('Missing fields:', { first_name, last_name, email, password });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, user_type) 
       VALUES ($1, $2, $3, $4, 'driver') 
       RETURNING id, first_name, last_name, email, user_type, created_at`,
      [first_name, last_name, email.toLowerCase(), hashedPassword]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: '7d' }
    );

    console.log('User registered successfully:', newUser.email);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        user_type: newUser.user_type,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('Login attempt:', req.body.email);
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: '7d' }
    );

    console.log('User logged in successfully:', user.email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        user_type: user.user_type,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== PARKING SPOTS ROUTES ====================

// Search parking spots (WITHOUT PostGIS - FIXED)
app.get('/api/spots/search', async (req, res) => {
  const { latitude, longitude, radius = 5000 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    // Using distance calculation in a subquery
    const radiusInDegrees = radius / 111000; // 1 degree ≈ 111km

    const result = await pool.query(
      `SELECT * FROM (
        SELECT 
          ps.id,
          ps.title,
          ps.description,
          ps.address,
          ps.hourly_rate,
          ps.available,
          ps.longitude,
          ps.latitude,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name,
          (
            6371000 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians($1)) * cos(radians(ps.latitude)) * 
                cos(radians(ps.longitude) - radians($2)) + 
                sin(radians($1)) * sin(radians(ps.latitude))
              ))
            )
          ) as distance_meters
        FROM parking_spaces ps
        JOIN users u ON ps.owner_id = u.id
        WHERE ps.available = true
        AND ps.latitude BETWEEN $1 - $3 AND $1 + $3
        AND ps.longitude BETWEEN $2 - $3 AND $2 + $3
      ) AS nearby_spots
      WHERE distance_meters <= $4
      ORDER BY distance_meters
      LIMIT 50`,
      [latitude, longitude, radiusInDegrees, radius]
    );

    res.json({
      count: result.rows.length,
      spots: result.rows,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single parking spot
app.get('/api/spots/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        ps.*,
        ps.longitude,
        ps.latitude,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.email as owner_email
       FROM parking_spaces ps
       JOIN users u ON ps.owner_id = u.id
       WHERE ps.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parking spot not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching spot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new parking space (WITHOUT PostGIS)
app.post('/api/spots', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production'
    );

    const {
      title,
      description,
      address,
      city,
      state,
      zip_code,
      hourly_rate,
      space_type,
      latitude,
      longitude
    } = req.body;

    // Validation
    if (!title || !description || !address || !city || !state || !zip_code || !hourly_rate || !space_type || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Creating parking space for user:', decoded.userId);

    // Insert parking space
    const result = await pool.query(
      `INSERT INTO parking_spaces 
       (owner_id, title, description, address, city, state, zip_code, hourly_rate, space_type, latitude, longitude, available) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
       RETURNING id, title, address, hourly_rate`,
      [decoded.userId, title, description, address, city, state, zip_code, hourly_rate, space_type, latitude, longitude]
    );

    console.log('Parking space created:', result.rows[0].id);

    res.status(201).json({
      message: 'Parking space created successfully',
      space: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating parking space:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== BOOKINGS ROUTES ====================

// Create booking
app.post('/api/bookings', async (req, res) => {
  const { parking_space_id, start_time, end_time } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!parking_space_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production'
    );

    // Get parking spot details
    const spotResult = await pool.query(
      'SELECT * FROM parking_spaces WHERE id = $1 AND available = true',
      [parking_space_id]
    );

    if (spotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parking spot not available' });
    }

    const spot = spotResult.rows[0];

    // Calculate total amount
    const start = new Date(start_time);
    const end = new Date(end_time);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    const totalPrice = hours * parseFloat(spot.hourly_rate);

    // Calculate commission (15%)
    const commissionAmount = totalPrice * 0.15;
    const ownerPayout = totalPrice - commissionAmount;

    console.log('Creating booking:', {
      renter: decoded.userId,
      space: parking_space_id,
      hours: hours,
      total: totalPrice,
      commission: commissionAmount,
      payout: ownerPayout
    });

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (space_id, renter_id, start_datetime, end_datetime, total_price, commission_amount, owner_payout, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [parking_space_id, decoded.userId, start_time, end_time, totalPrice, commissionAmount, ownerPayout]
    );

    console.log('Booking created:', result.rows[0].id);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: result.rows[0],
    });
  } catch (error) {
    console.error('Booking error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bookings
app.get('/api/bookings', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production'
    );

    const result = await pool.query(
      `SELECT 
        b.*,
        ps.title as parking_title,
        ps.address as parking_address,
        ps.longitude,
        ps.latitude
       FROM bookings b
       JOIN parking_spaces ps ON b.space_id = ps.id
       WHERE b.renter_id = $1
       ORDER BY b.created_at DESC`,
      [decoded.userId]
    );

    res.json({
      count: result.rows.length,
      bookings: result.rows,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});