-- ParkSpace Database Schema
-- PostgreSQL with PostGIS extension for location-based queries

-- Enable PostGIS extension for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    user_type VARCHAR(20) CHECK (user_type IN ('driver', 'owner', 'both')) DEFAULT 'driver',
    verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    stripe_customer_id VARCHAR(255),
    stripe_account_id VARCHAR(255),
    profile_photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parking spaces table
CREATE TABLE parking_spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    space_type VARCHAR(50) CHECK (space_type IN ('driveway', 'garage', 'parking_lot', 'street', 'other')) NOT NULL,
    vehicle_types_allowed TEXT[],
    is_covered BOOLEAN DEFAULT FALSE,
    has_ev_charging BOOLEAN DEFAULT FALSE,
    has_security_camera BOOLEAN DEFAULT FALSE,
    has_lighting BOOLEAN DEFAULT FALSE,
    max_height_inches INTEGER,
    max_width_inches INTEGER,
    access_type VARCHAR(50) CHECK (access_type IN ('key', 'code', 'app', 'attendant', 'open')) DEFAULT 'code',
    photos TEXT[],
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending_approval', 'rejected')) DEFAULT 'pending_approval',
    subscription_tier VARCHAR(20) CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')) DEFAULT 'basic',
    featured BOOLEAN DEFAULT FALSE,
    instant_booking BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parking_spaces_location ON parking_spaces USING GIST (location);
CREATE INDEX idx_parking_spaces_owner ON parking_spaces(owner_id);
CREATE INDEX idx_parking_spaces_status ON parking_spaces(status);

-- Pricing table
CREATE TABLE pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES parking_spaces(id) ON DELETE CASCADE,
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    weekly_rate DECIMAL(10, 2),
    monthly_rate DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    minimum_booking_hours INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(space_id)
);

-- Availability table (for recurring availability)
CREATE TABLE recurring_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES parking_spaces(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recurring_availability_space ON recurring_availability(space_id);

-- Blocked dates
CREATE TABLE blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES parking_spaces(id) ON DELETE CASCADE,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blocked_dates_space ON blocked_dates(space_id);
CREATE INDEX idx_blocked_dates_datetime ON blocked_dates(start_datetime, end_datetime);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES parking_spaces(id) ON DELETE CASCADE,
    renter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    vehicle_type VARCHAR(50),
    vehicle_plate_number VARCHAR(20),
    total_price DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    owner_payout DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled_by_renter', 'cancelled_by_owner', 'disputed')) DEFAULT 'pending',
    payment_intent_id VARCHAR(255),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',
    access_code VARCHAR(20),
    special_instructions TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_space ON bookings(space_id);
CREATE INDEX idx_bookings_renter ON bookings(renter_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_datetime ON bookings(start_datetime, end_datetime);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    review_type VARCHAR(20) CHECK (review_type IN ('space_review', 'renter_review')) NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
    accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);

-- Public parking lots table
CREATE TABLE public_parking_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    total_spaces INTEGER,
    available_spaces INTEGER,
    operating_hours TEXT,
    data_source VARCHAR(50) CHECK (data_source IN ('manual', 'api', 'city_data')) DEFAULT 'manual',
    website_url TEXT,
    phone_number VARCHAR(20),
    last_updated TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_public_parking_location ON public_parking_lots USING GIST (location);

-- Payouts table
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    stripe_transfer_id VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    payout_date TIMESTAMP,
    booking_ids UUID[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payouts_owner ON payouts(owner_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    space_id UUID REFERENCES parking_spaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, space_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Search analytics table
CREATE TABLE search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    search_location GEOGRAPHY(POINT, 4326),
    search_radius_miles DECIMAL(5, 2),
    start_datetime TIMESTAMP,
    end_datetime TIMESTAMP,
    filters_applied JSONB,
    results_count INTEGER,
    clicked_space_id UUID REFERENCES parking_spaces(id) ON DELETE SET NULL,
    resulted_in_booking BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_analytics_location ON search_analytics USING GIST (search_location);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_spaces_updated_at BEFORE UPDATE ON parking_spaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION get_nearby_spaces(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_miles DOUBLE PRECISION DEFAULT 5
)
RETURNS TABLE (
    space_id UUID,
    title VARCHAR,
    distance_miles DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id AS space_id,
        ps.title,
        ST_Distance(
            ps.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) / 1609.34 AS distance_miles
    FROM parking_spaces ps
    WHERE ps.status = 'active'
    AND ST_DWithin(
        ps.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_miles * 1609.34
    )
    ORDER BY distance_miles;
END;
$$ LANGUAGE plpgsql;

-- Insert app settings
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_settings (setting_key, setting_value, description) VALUES
    ('commission_rate_basic', '0.20', 'Commission rate for basic tier (20%)'),
    ('commission_rate_pro', '0.15', 'Commission rate for pro tier (15%)'),
    ('commission_rate_enterprise', '0.10', 'Commission rate for enterprise tier (10%)'),
    ('listing_fee_featured', '9.99', 'Monthly fee for featured listings'),
    ('cancellation_penalty_rate', '0.10', 'Cancellation penalty (10% of booking)');

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user account information for both parking space owners and renters';
COMMENT ON TABLE parking_spaces IS 'Contains all parking space listings';
COMMENT ON TABLE bookings IS 'Records all parking space bookings and their status';
COMMENT ON COLUMN parking_spaces.location IS 'PostGIS geography point for efficient spatial queries';
COMMENT ON FUNCTION get_nearby_spaces IS 'Returns parking spaces within specified radius sorted by distance';