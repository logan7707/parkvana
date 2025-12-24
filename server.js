require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone_number } = req.body;
    
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone_number) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, first_name, last_name, email, phone_number, created_at`,
      [first_name, last_name, email, hashedPassword, phone_number]
    );

    const newUser = result.rows[0];
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone_number: newUser.phone_number
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Update Profile
app.patch('/api/auth/update-profile', async (req, res) => {
  try {
    const { first_name, last_name, phone_number } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone_number = $3
       WHERE id = $4
       RETURNING id, first_name, last_name, email, phone_number`,
      [first_name, last_name, phone_number, decoded.userId]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Change Password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    const user = userResult.rows[0];
    
    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, decoded.userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Delete Account
app.delete('/api/auth/delete-account', async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    const user = userResult.rows[0];
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    await pool.query('DELETE FROM bookings WHERE renter_id = $1', [decoded.userId]);
    await pool.query('DELETE FROM parking_spaces WHERE owner_id = $1', [decoded.userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [decoded.userId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Account deletion failed' });
  }
});

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Get Stripe publishable key
app.get('/api/stripe/config', (req, res) => {
  res.json({ 
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY 
  });
});

// Create booking with payment
app.post('/api/bookings/create-with-payment', async (req, res) => {
  try {
    const { 
      parking_space_id, 
      start_time, 
      end_time,
      payment_method_id
    } = req.body;
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const renter_id = decoded.userId;

    // Get parking space details
    const spaceResult = await pool.query(
      'SELECT * FROM parking_spaces WHERE id = $1',
      [parking_space_id]
    );
    
    if (spaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parking space not found' });
    }
    
    const space = spaceResult.rows[0];

    // Calculate pricing
    const start = new Date(start_time);
    const end = new Date(end_time);
    const hours = (end - start) / (1000 * 60 * 60);
    const totalPrice = hours * space.hourly_rate;
    
    // Platform commission (15%)
    const platformFee = totalPrice * 0.15;
    
    // Veteran donation ($1)
    const veteranDonation = 1.00;
    
    // Owner payout
    const ownerPayout = totalPrice - platformFee - veteranDonation;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'usd',
      payment_method: payment_method_id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        parking_space_id: parking_space_id.toString(),
        renter_id: renter_id.toString(),
        owner_payout: ownerPayout.toFixed(2),
        veteran_donation: veteranDonation.toFixed(2)
      }
    });

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment failed' });
    }

    // Create booking in database
    const bookingResult = await pool.query(
      `INSERT INTO bookings 
       (parking_space_id, renter_id, start_time, end_time, total_price, status, 
        stripe_payment_id, platform_fee, owner_payout, veteran_donation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        parking_space_id, 
        renter_id, 
        start_time, 
        end_time, 
        totalPrice, 
        'confirmed',
        paymentIntent.id,
        platformFee,
        ownerPayout,
        veteranDonation
      ]
    );

    res.json({
      success: true,
      booking: bookingResult.rows[0],
      message: 'Booking confirmed! $1 donated to feed veterans.'
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      error: 'Booking failed', 
      details: error.message 
    });
  }
});

// Connect Stripe account for space owner
app.post('/api/stripe/connect', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );
    const user = userResult.rows[0];

    // Check if user already has Stripe account
    if (user.stripe_connect_account_id) {
      return res.json({ 
        account_id: user.stripe_connect_account_id,
        onboarding_complete: user.stripe_onboarding_complete 
      });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      capabilities: {
        transfers: { requested: true }
      }
    });

    // Save Stripe account ID
    await pool.query(
      'UPDATE users SET stripe_connect_account_id = $1 WHERE id = $2',
      [account.id, decoded.userId]
    );

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'parkvana://stripe-reauth',
      return_url: 'parkvana://stripe-return',
      type: 'account_onboarding'
    });

    res.json({ 
      account_id: account.id,
      onboarding_url: accountLink.url 
    });

  } catch (error) {
    console.error('Stripe Connect error:', error);
    res.status(500).json({ error: 'Stripe connection failed' });
  }
});

// Check Stripe onboarding status
app.get('/api/stripe/onboarding-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userResult = await pool.query(
      'SELECT stripe_connect_account_id FROM users WHERE id = $1',
      [decoded.userId]
    );
    const user = userResult.rows[0];

    if (!user.stripe_connect_account_id) {
      return res.json({ onboarding_complete: false });
    }

    const account = await stripe.accounts.retrieve(user.stripe_connect_account_id);
    
    const onboardingComplete = account.details_submitted && account.charges_enabled;

    // Update database
    await pool.query(
      'UPDATE users SET stripe_onboarding_complete = $1 WHERE id = $2',
      [onboardingComplete, decoded.userId]
    );

    res.json({ 
      onboarding_complete: onboardingComplete,
      charges_enabled: account.charges_enabled 
    });

  } catch (error) {
    console.error('Onboarding status error:', error);
    res.status(500).json({ error: 'Failed to check onboarding status' });
  }
});

// ============================================
// PARKING SPACE ENDPOINTS
// ============================================

// Search parking spots
app.get('/api/spots/search', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    const result = await pool.query(`
      SELECT ps.*, u.first_name, u.last_name,
        (6371 * acos(cos(radians($1)) * cos(radians(ps.latitude)) * 
        cos(radians(ps.longitude) - radians($2)) + sin(radians($1)) * 
        sin(radians(ps.latitude)))) AS distance
      FROM parking_spaces ps
      JOIN users u ON ps.owner_id = u.id
      WHERE ps.available = true
      AND (6371 * acos(cos(radians($1)) * cos(radians(ps.latitude)) * 
        cos(radians(ps.longitude) - radians($2)) + sin(radians($1)) * 
        sin(radians(ps.latitude)))) < $3
      ORDER BY distance
    `, [latitude, longitude, radius]);

    res.json(result.rows);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Create parking space
app.post('/api/spots', async (req, res) => {
  try {
    const {
      address,
      latitude,
      longitude,
      hourly_rate,
      description,
      space_type,
      features
    } = req.body;

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      `INSERT INTO parking_spaces 
       (owner_id, address, latitude, longitude, hourly_rate, description, space_type, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [decoded.userId, address, latitude, longitude, hourly_rate, description, space_type, features]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create spot error:', error);
    res.status(500).json({ error: 'Failed to create parking space' });
  }
});

// Get user's listed spaces
app.get('/api/spots/my-spaces', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      'SELECT * FROM parking_spaces WHERE owner_id = $1 ORDER BY created_at DESC',
      [decoded.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get spaces error:', error);
    res.status(500).json({ error: 'Failed to get spaces' });
  }
});

// ============================================
// BOOKING ENDPOINTS
// ============================================

// Get user's bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(`
      SELECT b.*, ps.address, ps.space_type, u.first_name, u.last_name
      FROM bookings b
      JOIN parking_spaces ps ON b.parking_space_id = ps.id
      JOIN users u ON ps.owner_id = u.id
      WHERE b.renter_id = $1
      ORDER BY b.created_at DESC
    `, [decoded.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Stripe ${process.env.STRIPE_SECRET_KEY ? 'configured' : 'NOT configured'}`);
});