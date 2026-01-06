const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;
    
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name`,
      [email, hashedPassword, first_name, last_name, phone]
    );
    
    const token = jwt.sign(
      { userId: result.rows[0].id, email: result.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// PARKING SPOTS ROUTES
// ============================================

// Search spots - simplified without PostGIS
app.get('/api/spots/search', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;
    
    // Simple search - just return all available spots
    // We can add distance calculation later when PostGIS is available
    const result = await pool.query(
      `SELECT * FROM parking_spaces
       WHERE available = true
       ORDER BY created_at DESC
       LIMIT 50`
    );
    
    res.json({ spots: result.rows });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Create parking spot
app.post('/api/spots', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const {
      title,
      address,
      latitude,
      longitude,
      hourly_rate,
      daily_rate,
      weekly_rate,
      monthly_rate,
      space_type,
      description,
      features
    } = req.body;
    
    // Parse address to extract city, state, zip
    let city = null;
    let state = null;
    let zip_code = null;
    
    if (address) {
      const addressParts = address.split(',').map(part => part.trim());
      
      // Typical format: "123 Main St, Austin, TX 78701"
      if (addressParts.length >= 3) {
        city = addressParts[1]; // "Austin"
        
        // Last part usually has "STATE ZIP"
        const lastPart = addressParts[addressParts.length - 1];
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5})/);
        
        if (stateZipMatch) {
          state = stateZipMatch[1]; // "TX"
          zip_code = stateZipMatch[2]; // "78701"
        }
      }
    }
    
    const result = await pool.query(
      `INSERT INTO parking_spaces 
       (owner_id, title, address, city, state, zip_code, latitude, longitude, 
        hourly_rate, daily_rate, weekly_rate, monthly_rate, space_type, description, features, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
       RETURNING *`,
      [decoded.userId, title, address, city, state, zip_code, latitude, longitude, 
       hourly_rate, daily_rate, weekly_rate, monthly_rate, space_type, description, features]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create spot error:', error);
    res.status(500).json({ error: 'Failed to create parking space' });
  }
});

// Get my spaces
app.get('/api/spots/my-spaces', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT * FROM parking_spaces WHERE owner_id = $1 ORDER BY created_at DESC',
      [decoded.userId]
    );
    
    res.json({ spaces: result.rows });
  } catch (error) {
    console.error('Get spaces error:', error);
    res.status(500).json({ error: 'Failed to get spaces' });
  }
});

// Update parking spot
app.put('/api/spots/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.params;
    
    const {
      title,
      address,
      hourly_rate,
      daily_rate,
      weekly_rate,
      monthly_rate,
      space_type,
      description,
      features
    } = req.body;
    
    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM parking_spaces WHERE id = $1',
      [id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }
    
    if (ownerCheck.rows[0].owner_id !== decoded.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this space' });
    }
    
    const result = await pool.query(
      `UPDATE parking_spaces 
       SET title = $1, address = $2, hourly_rate = $3, 
           daily_rate = $4, weekly_rate = $5, monthly_rate = $6,
           space_type = $7, description = $8, features = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [title, address, hourly_rate, daily_rate, weekly_rate, monthly_rate, 
       space_type, description, features || null, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update spot error:', error);
    res.status(500).json({ error: 'Failed to update parking space' });
  }
});

// ============================================
// STRIPE PAYMENT ROUTES
// ============================================

// Get Stripe publishable key
app.get('/api/stripe/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// Create payment intent
app.post('/api/bookings/create-payment-intent', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { parking_space_id, start_time, end_time, amount } = req.body;
    
    // Get parking space details
    const spaceResult = await pool.query(
      'SELECT * FROM parking_spaces WHERE id = $1',
      [parking_space_id]
    );
    
    if (spaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parking space not found' });
    }
    
    const space = spaceResult.rows[0];
    
    // NEW CALCULATION - Customer does NOT pay for donation
    // Customer pays: Just the parking fee
    const totalPrice = amount / 100; // Convert cents to dollars (e.g., $6.00)
    
    // Platform commission: 15% of parking fee
    const platformCommission = totalPrice * 0.15; // e.g., $0.90
    
    // Veteran donation: $1.00 total, split 50/50
    const veteranDonation = 1.00;
    const parkvanaContribution = 0.50; // Platform contributes $0.50
    const ownerContribution = 0.50;    // Owner contributes $0.50
    
    // Platform keeps: commission - platform's donation contribution
    const platformFee = platformCommission - parkvanaContribution; // e.g., $0.90 - $0.50 = $0.40
    
    // Owner receives: total - commission - owner's donation contribution
    const ownerPayout = totalPrice - platformCommission - ownerContribution; // e.g., $6 - $0.90 - $0.50 = $4.60
    
    // Create booking in pending state
    const bookingResult = await pool.query(
      `INSERT INTO bookings 
       (space_id, renter_id, start_datetime, end_datetime, total_price, 
        commission_amount, veteran_donation, owner_payout, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'pending')
       RETURNING *`,
      [parking_space_id, decoded.userId, start_time, end_time, totalPrice, 
       platformFee, veteranDonation, ownerPayout]
    );
    
    const booking = bookingResult.rows[0];
    
    // Create Stripe payment intent - customer pays ONLY the parking fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Just the parking fee in cents
      currency: 'usd',
      metadata: {
        booking_id: booking.id,
        parking_space_id: parking_space_id,
        renter_id: decoded.userId
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id
    });
    
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm booking after payment
app.post('/api/bookings/confirm', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { booking_id, payment_intent_id } = req.body;
    
    // Update booking status
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'confirmed', 
           payment_status = 'completed',
           stripe_payment_id = $1, 
           payment_intent_id = $1,
           updated_at = NOW()
       WHERE id = $2 AND renter_id = $3
       RETURNING *`,
      [payment_intent_id, booking_id, decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

// ============================================
// PAYMENT METHODS ROUTES
// ============================================

// Get user's payment methods
app.get('/api/payment-methods', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user's Stripe customer ID
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stripeCustomerId = userResult.rows[0].stripe_customer_id;

    if (!stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    // Get default payment method
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    // Format payment methods
    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      card: pm.card,
      is_default: pm.id === defaultPaymentMethodId,
    }));

    res.json({ paymentMethods: formattedMethods });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Add payment method
app.post('/api/payment-methods', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { payment_method_id } = req.body;

    // Get or create Stripe customer
    const userResult = await pool.query(
      'SELECT stripe_customer_id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stripeCustomerId = userResult.rows[0].stripe_customer_id;
    const userEmail = userResult.rows[0].email;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
      });
      stripeCustomerId = customer.id;

      // Save customer ID to database
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [stripeCustomerId, decoded.userId]
      );
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: stripeCustomerId,
    });

    // Set as default if it's the first payment method
    const existingMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    if (existingMethods.data.length === 1) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      });
    }

    res.json({ message: 'Payment method added successfully' });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

// Delete payment method
app.delete('/api/payment-methods/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.params;

    // Verify the payment method belongs to this user's customer
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].stripe_customer_id) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Detach payment method
    await stripe.paymentMethods.detach(id);

    res.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Failed to remove payment method' });
  }
});

// Set default payment method
app.post('/api/payment-methods/:id/set-default', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.params;

    // Get user's Stripe customer ID
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].stripe_customer_id) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const stripeCustomerId = userResult.rows[0].stripe_customer_id;

    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: id,
      },
    });

    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});

// ============================================
// BOOKINGS ROUTES
// ============================================

// Get my bookings (as renter)
app.get('/api/bookings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      `SELECT b.*, ps.title, ps.address, ps.space_type
       FROM bookings b
       JOIN parking_spaces ps ON b.space_id = ps.id
       WHERE b.renter_id = $1
       ORDER BY b.created_at DESC`,
      [decoded.userId]
    );
    
    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Get bookings for spaces owned by user (Owner Dashboard)
app.get('/api/bookings/owner/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        b.id,
        b.space_id,
        b.renter_id as user_id,
        b.start_datetime as start_date,
        b.end_datetime as end_date,
        b.total_price,
        b.status,
        b.rate_type,
        b.created_at,
        ps.title as space_title,
        ps.address as space_address,
        CONCAT(u.first_name, ' ', u.last_name) as renter_name,
        u.email as renter_email
      FROM bookings b
      JOIN parking_spaces ps ON b.space_id = ps.id
      JOIN users u ON b.renter_id = u.id
      WHERE ps.owner_id = $1
      ORDER BY b.created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ============================================
// BOOKING MANAGEMENT ROUTES
// ============================================

// Cancel booking and process refund
app.post('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.params;

    // Get booking details
    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND renter_id = $2',
      [id, decoded.userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Check if booking can be cancelled (>2 hours before start)
    const startTime = new Date(booking.start_datetime);
    const now = new Date();
    const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

    if (hoursUntilStart <= 2) {
      return res.status(400).json({ 
        error: 'Cannot cancel within 2 hours of start time' 
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    // Process Stripe refund (full refund - customer only paid parking fee)
    if (booking.stripe_payment_id || booking.payment_intent_id) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_id || booking.payment_intent_id,
        });
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(500).json({ error: 'Failed to process refund' });
      }
    }

    // Update booking status
    const updatedBooking = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', 
           payment_status = 'refunded',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({ 
      message: 'Booking cancelled and refunded',
      booking: updatedBooking.rows[0]
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Extend booking time
app.post('/api/bookings/:id/extend', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.params;
    const { additional_hours } = req.body;

    if (!additional_hours || additional_hours < 1) {
      return res.status(400).json({ error: 'Invalid additional hours' });
    }

    // Get booking details with parking space info
    const bookingResult = await pool.query(
      `SELECT b.*, ps.hourly_rate
       FROM bookings b
       JOIN parking_spaces ps ON b.space_id = ps.id
       WHERE b.id = $1 AND b.renter_id = $2`,
      [id, decoded.userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Check if booking is active
    const now = new Date();
    const startTime = new Date(booking.start_datetime);
    const endTime = new Date(booking.end_datetime);

    if (now < startTime || now > endTime) {
      return res.status(400).json({ 
        error: 'Can only extend active bookings' 
      });
    }

    // Calculate additional cost (NO veteran donation for extensions)
    const additionalCost = booking.hourly_rate * additional_hours;
    const additionalCommission = additionalCost * 0.15;
    const additionalPlatformFee = additionalCommission; // No donation on extensions
    const additionalOwnerPayout = additionalCost - additionalCommission;

    // Charge customer for additional time
    try {
      // Create a new payment intent for the extension
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(additionalCost * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          booking_id: id,
          type: 'extension',
          additional_hours: additional_hours
        }
      });

      // Update booking with new end time and costs
      const newEndTime = new Date(endTime.getTime() + additional_hours * 60 * 60 * 1000);
      const newTotalPrice = parseFloat(booking.total_price) + additionalCost;
      const newCommission = parseFloat(booking.commission_amount) + additionalPlatformFee;
      const newOwnerPayout = parseFloat(booking.owner_payout) + additionalOwnerPayout;

      const updatedBooking = await pool.query(
        `UPDATE bookings 
         SET end_datetime = $1,
             total_price = $2,
             commission_amount = $3,
             owner_payout = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [newEndTime, newTotalPrice, newCommission, newOwnerPayout, id]
      );

      res.json({
        message: 'Booking extended successfully',
        booking: updatedBooking.rows[0],
        charged: additionalCost
      });

    } catch (stripeError) {
      console.error('Stripe charge error:', stripeError);
      return res.status(500).json({ error: 'Failed to charge for extension' });
    }

  } catch (error) {
    console.error('Extend booking error:', error);
    res.status(500).json({ error: 'Failed to extend booking' });
  }
});

// ============================================
// WAITLIST ROUTE
// ============================================

app.post('/api/waitlist', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email already exists
    const existing = await pool.query(
      'SELECT * FROM waitlist WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      return res.json({ message: 'Already on waitlist' });
    }
    
    // Add to waitlist
    await pool.query(
      'INSERT INTO waitlist (email) VALUES ($1)',
      [email]
    );
    
    res.json({ message: 'Added to waitlist' });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured'
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Stripe ${process.env.STRIPE_SECRET_KEY ? 'configured' : 'NOT configured'}`);
  console.log(`✅ Database ${process.env.DATABASE_URL ? 'configured' : 'NOT configured'}`);
});