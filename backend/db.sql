CREATE DATABASE cybertown;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  oauth_id VARCHAR(128) NOT NULL UNIQUE,
  username VARCHAR(128) NOT NULL,
  email VARCHAR(256) NOT NULL UNIQUE,
  avatar VARCHAR(256) NOT NULL,
  bio VARCHAR(256),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(128) NOT NULL,
  max_participants INTEGER NOT NULL,
  languages VARCHAR(64)[] NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS room_settings (
  room_id INTEGER NOT NULL,
  host INTEGER NOT NULL,
  co_hosts INTEGER[],
  welcome_message varchar(512),
  FOREIGN KEY (room_id) REFERENCES rooms (id)
);

CREATE TABLE IF NOT EXISTS room_kicks (
  room_id INTEGER NOT NULL,
  kicked INTEGER NOT NULL,
  kicker INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (room_id) REFERENCES rooms (id),
  FOREIGN KEY (kicked) REFERENCES users (id),
  FOREIGN KEY (kicker) REFERENCES users (id)
);
