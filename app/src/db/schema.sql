PRAGMA foreign_keys = ON;

-- ------------------------------
-- Table: user
-- ------------------------------
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    password TEXT,
    created_at DATE NOT NULL,
    last_login_at DATETIME,
    CHECK (
        email LIKE '%_@_%._%' AND
        LENGTH(email) - LENGTH(REPLACE(email, '@', '')) = 1 AND
        SUBSTR(LOWER(email), 1, INSTR(email, '.') - 1) NOT GLOB '*[^@0-9a-z]*' AND
        SUBSTR(LOWER(email), INSTR(email, '.') + 1) NOT GLOB '*[^a-z]*'
    )
);

-- ------------------------------
-- Table: match
-- ------------------------------
CREATE TABLE IF NOT EXISTS match (
    id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE NOT NULL,
    player_1 INTEGER NOT NULL,
    score_player_1 INTEGER NOT NULL,
    player_2 INTEGER NOT NULL,
    score_player_2 INTEGER NOT NULL,
    winner INTEGER NOT NULL,
    date DATETIME NOT NULL,
    FOREIGN KEY (player_1) REFERENCES user (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (player_2) REFERENCES user (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (winner) REFERENCES user (id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- ------------------------------
-- Table: session
-- ------------------------------
CREATE TABLE IF NOT EXISTS session (
    sid TEXT PRIMARY KEY UNIQUE NOT NULL,
    session TEXT NOT NULL,
    expires DATETIME NOT NULL
);
