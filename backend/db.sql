CREATE DATABASE cybertown;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  oauth_id VARCHAR(128) NOT NULL UNIQUE,
  username VARCHAR(128) NOT NULL,
  email VARCHAR(256) NOT NULL UNIQUE,
  avatar VARCHAR(256) NOT NULL,
  bio VARCHAR(256),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id INT REFERENCES users(id),
  expired_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(128) NOT NULL,
  max_participants INT NOT NULL,
  languages VARCHAR(64)[] NOT NULL,
  created_by INT REFERENCES users (id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_settings (
  room_id INT REFERENCES rooms (id) ON DELETE CASCADE,
  host INT REFERENCES users(id),
  co_hosts INT[],
  welcome_message varchar(512)
);

CREATE TABLE IF NOT EXISTS room_kicks (
  room_id INT REFERENCES rooms (id) ON DELETE CASCADE,
  user_id INT REFERENCES users (id) ON DELETE CASCADE,
  expired_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE follows (
  follower_id INT REFERENCES users(id) ON DELETE CASCADE,
  followee_id INT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE dms (
  id SERIAL PRIMARY KEY
); 

CREATE TABLE dm_participants (
  dm_id INT REFERENCES dms(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (dm_id, user_id)
);

CREATE TABLE messages (
  dm_id INT REFERENCES dms(id) ON DELETE CASCADE,
  id VARCHAR(64) NOT NULL UNIQUE,
  "from" INT REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(1024) NOT NULL, 
  is_deleted BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  reply_to VARCHAR(64),
  reactions JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE
);
