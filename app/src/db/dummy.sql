-- =========================
-- Populate dummy data (dynamic IDs, idempotent)
-- =========================

-- Users
INSERT OR IGNORE INTO user (username, created_at, last_login_at) VALUES
('alice', '2025-01-05', '2025-08-01 14:30:00'),
('bob', '2025-02-10', '2025-08-05 09:15:00'),
('charlie', '2025-03-12', '2025-08-08 18:40:00'),
('diana', '2025-04-02', NULL),
('eric', '2025-05-15', '2025-08-09 11:00:00');

-- Matchs
INSERT OR IGNORE INTO match (player_1, score_player_1, player_2, score_player_2, winner, date) VALUES
((SELECT id FROM user WHERE username='guest'), 10, (SELECT id FROM user WHERE username='alice'), 8, (SELECT id FROM user WHERE username='guest'), '2025-07-15 15:00:00'),
((SELECT id FROM user WHERE username='alice'), 7, (SELECT id FROM user WHERE username='bob'), 10, (SELECT id FROM user WHERE username='bob'), '2025-07-16 16:30:00'),
((SELECT id FROM user WHERE username='bob'), 12, (SELECT id FROM user WHERE username='charlie'), 5, (SELECT id FROM user WHERE username='bob'), '2025-07-18 19:45:00'),
((SELECT id FROM user WHERE username='charlie'), 9, (SELECT id FROM user WHERE username='diana'), 11, (SELECT id FROM user WHERE username='diana'), '2025-07-20 20:15:00'),
((SELECT id FROM user WHERE username='charlie'), 13, (SELECT id FROM user WHERE username='diana'), 7, (SELECT id FROM user WHERE username='charlie'), '2025-07-20 18:15:00'),
((SELECT id FROM user WHERE username='charlie'), 12, (SELECT id FROM user WHERE username='alice'), 4, (SELECT id FROM user WHERE username='charlie'), '2025-07-20 16:15:00'),
((SELECT id FROM user WHERE username='charlie'), 5, (SELECT id FROM user WHERE username='bob'), 8, (SELECT id FROM user WHERE username='bob'), '2025-07-20 12:15:00'),
((SELECT id FROM user WHERE username='alice'), 4, (SELECT id FROM user WHERE username='diana'), 9, (SELECT id FROM user WHERE username='diana'), '2025-07-20 14:15:00');

-- Sessions
INSERT OR IGNORE INTO session (sid, session, expires) VALUES
('sess1', '{"logged_in": true, "user_id": ' || (SELECT id FROM user WHERE username='guest') || '}', '2025-08-15 12:00:00'),
('sess2', '{"logged_in": true, "user_id": ' || (SELECT id FROM user WHERE username='alice') || '}', '2025-08-16 12:00:00');

-- -- Conversations
-- INSERT OR IGNORE INTO conversations (user1_id, user2_id) VALUES
-- ((SELECT id FROM user WHERE username='guest'), (SELECT id FROM user WHERE username='alice')),
-- ((SELECT id FROM user WHERE username='alice'), (SELECT id FROM user WHERE username='bob')),
-- ((SELECT id FROM user WHERE username='bob'), (SELECT id FROM user WHERE username='charlie')),
-- ((SELECT id FROM user WHERE username='charlie'), (SELECT id FROM user WHERE username='diana'));

-- -- Messages
-- INSERT OR IGNORE INTO messages (conversation_id, sender_id, client_offset, content) VALUES
-- ((SELECT id FROM conversations WHERE user1_id=(SELECT id FROM user WHERE username='guest') AND user2_id=(SELECT id FROM user WHERE username='alice')), (SELECT id FROM user WHERE username='guest'), 'offset1', 'Hey Alice!'),
-- ((SELECT id FROM conversations WHERE user1_id=(SELECT id FROM user WHERE username='guest') AND user2_id=(SELECT id FROM user WHERE username='alice')), (SELECT id FROM user WHERE username='alice'), 'offset2', 'Hey Guest, how are you?'),
-- ((SELECT id FROM conversations WHERE user1_id=(SELECT id FROM user WHERE username='alice') AND user2_id=(SELECT id FROM user WHERE username='bob')), (SELECT id FROM user WHERE username='alice'), 'offset3', 'Bob, ready for the match?'),
-- ((SELECT id FROM conversations WHERE user1_id=(SELECT id FROM user WHERE username='alice') AND user2_id=(SELECT id FROM user WHERE username='bob')), (SELECT id FROM user WHERE username='bob'), 'offset4', 'Absolutely!');

-- -- Blocks
-- INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES
-- ((SELECT id FROM user WHERE username='guest'), (SELECT id FROM user WHERE username='charlie')),
-- ((SELECT id FROM user WHERE username='alice'), (SELECT id FROM user WHERE username='diana'));

