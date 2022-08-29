CREATE DATABASE battleliveredux;

CREATE TABLE user_account 
(id BIGSERIAL PRIMARY KEY NOT NULL, 
username VARCHAR(200) NOT NULL UNIQUE, 
email VARCHAR(200) NOT NULL UNIQUE, 
password VARCHAR(200) NOT NULL
);

CREATE TABLE room
(id BIGSERIAL PRIMARY KEY NOT NULL,
description VARCHAR(200) NOT NULL,
user_id BIGINT NOT NULL UNIQUE, 
is_rap_room BOOLEAN NOT NULL DEFAULT FALSE,
FOREIGN KEY (user_id) REFERENCES user_account(id)
);

CREATE TABLE user_connected
(id BIGSERIAL PRIMARY KEY NOT NULL,
room_id BIGINT NOT NULL, 
socket_id VARCHAR(200) NOT NULL,
in_queue BOOLEAN NOT NULL DEFAULT FALSE,
is_rapper BOOLEAN NOT NULL DEFAULT FALSE,
is_ready BOOLEAN NOT NULL DEFAULT FALSE,
FOREIGN KEY (id) REFERENCES user_account(id),
FOREIGN KEY (room_id) REFERENCES room(id)
);

CREATE TABLE user_stats
(id BIGSERIAL PRIMARY KEY NOT NULL,
win BIGINT NOT NULL DEFAULT 0,
loss BIGINT NOT NULL DEFAULT 0,
draw BIGINT NOT NULL DEFAULT 0,
FOREIGN KEY (id) REFERENCES user_account(id)
);