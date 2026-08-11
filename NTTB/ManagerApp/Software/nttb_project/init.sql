-- Drop and recreate database
DROP DATABASE IF EXISTS MockDB;
CREATE DATABASE IF NOT EXISTS MockDB;
USE MockDB;

-- Users table
CREATE TABLE `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(15) DEFAULT NULL,
  `rank` INT DEFAULT 5,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `user_name` (`user_name`)
);

-- Nodes table
CREATE TABLE `nodes` (
  `node_id` INT NOT NULL AUTO_INCREMENT,
  `node_name` VARCHAR(255) NOT NULL,
  `mac_address` VARCHAR(17) NOT NULL,
  `node_last_seen` DATETIME DEFAULT NULL,
  `node_status` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`node_id`),
  UNIQUE KEY `mac_address` (`mac_address`)
);

-- Tasks table
CREATE TABLE `tasks` (
  `task_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_title` VARCHAR(255) NOT NULL,
  `task_description` TEXT DEFAULT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `due_by` DATETIME DEFAULT NULL,
  `assigned_by` INT DEFAULT NULL,
  `priority` INT DEFAULT 0,
  `progress` VARCHAR(50) DEFAULT 'Not Started',
  PRIMARY KEY (`task_id`),
  CHECK (`due_by` IS NULL OR `due_by` > `assigned_at`)
);

-- Node access table (with FK -> users and nodes)
CREATE TABLE `node_access` (
  `user_id` INT NOT NULL,
  `node_id` INT NOT NULL,
  `level_of_access` VARCHAR(20) NOT NULL DEFAULT 'read',
  PRIMARY KEY (`user_id`, `node_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`node_id`) REFERENCES `nodes` (`node_id`) ON DELETE CASCADE
);

-- Insert users
-- Two users for each rank 1..5 (total 10 users)
INSERT INTO `users` (`user_id`, `user_name`, `email`, `password`, `phone`, `rank`) VALUES
  (1,  'root_1',         'root1@mockdb.local',  '$2y$10$dsDmupxfRhVN8dwiK/4Fdu0GOQbI6Q4O25mU/ofdMwSUqkspgMtmq', NULL, 1), -- <- Dustins password
  (2,  'root_2',         'root2@mockdb.local',  '$2y$10$XquTmN2r6UdwvGHmlnAw5OwGPKn9Qi.yTyn/V.GpRAOxJDWWTDCQK', NULL, 1), -- <- Aarons password
  (3,  'admin_1',        'admin1@mockdb.local', '$2y$10$.FpWG.tXyRdukwhx5uf1FeFrDd9jXPr8BUxFj6z38jniHCO/VW/yi', NULL, 2), -- rest are 1234567890
  (4,  'admin_2',        'admin2@mockdb.local', '$2y$10$.FpWG.tXyRdukwhx5uf1FeFrDd9jXPr8BUxFj6z38jniHCO/VW/yi', NULL, 2),
  (5,  'moderator_1',    'mod1@mockdb.local',   '$2y$10$.FpWG.tXyRdukwhx5uf1FeFrDd9jXPr8BUxFj6z38jniHCO/VW/yi', NULL, 3),
  (6,  'moderator_2',    'mod2@mockdb.local',   '$2y$10$.FpWG.tXyRdukwhx5uf1FeFrDd9jXPr8BUxFj6z38jniHCO/VW/yi', NULL, 3),
  (7,  'manager_1',      'mgr1@mockdb.local',   '$2y$10$.FpWG.tXyRdukwhx5uf1FeFrDd9jXPr8BUxFj6z38jniHCO/VW/yi', NULL, 4),
  (8,  'manager_2',      'mgr2@mockdb.local',   '$2y$10$.FpWG.tXyRdukwhx5uf1FeFrDd9jXPr8BUxFj6z38jniHCO/VW/yi', NULL, 4),
  (9,  'user_1',         'user1@mockdb.local',  '$2y$10$.FpWG.tXyRdukwhx5uf1FeFrDd9jXPr8BUxFj6z38jniHCO/VW/yi', NULL, 5),
  (10, 'user_2',         'user2@mockdb.local',  '$2y$10$.FpWG.tXyRdukwhx5uf1FeFrDd9jXPr8BUxFj6z38jniHCO/VW/yi', NULL, 5);

-- Insert nodes (explicit IDs; node 5 renamed to Patio Node)
INSERT INTO `nodes` (`node_id`, `node_name`, `mac_address`, `node_last_seen`, `node_status`) VALUES
  (1, 'Bar Station',    '00:11:22:33:44:55', NULL, 0),
  (2, 'Prep Station',   '00:11:22:33:44:66', NULL, 0),
  (3, 'Host Station',   '00:11:22:33:44:77', NULL, 0),
  (4, 'Dish Station',   '00:11:22:33:44:88', NULL, 0),
  (5, 'Patio Node',     '00:11:22:33:44:99', NULL, 0);

-- Insert tasks (total 10 tasks, varying progress and priorities)
INSERT INTO `tasks` (`task_id`, `task_title`, `task_description`, `due_by`, `assigned_by`, `priority`, `progress`) VALUES
  (1,  'Restock supplies',      'Refill condiments',                 '2025-12-02 18:00:00', 3, 1, 'In Progress'),
  (2,  'Manual time',           'Backdated',                         '2026-01-10 09:00:00', 1, 1, 'Completed'),
  (3,  'Calibrate sensors',     'Run sensor calibration routine',    '2025-12-03 12:00:00', 5, 2, 'Not Started'),
  (4,  'Update firmware',       'Push firmware v1.2.3 to hosts',     '2026-02-01 09:00:00', 4, 3, 'In Progress'),
  (5,  'Inspect wiring',        'Check power rails and connectors',  '2025-12-05 14:00:00', 7, 2, 'Completed'),
  (6,  'Replace filters',       'Change air and water filters',      '2025-12-01 08:00:00', 8, 1, 'Not Started'),
  (7,  'Run security audit',    'Audit user privileges and logs',    '2025-12-06 10:00:00', 2, 3, 'In Progress'),
  (8,  'Cleanup logs',          'Rotate and archive logs',           '2026-01-20 00:00:00', 6, 0, 'Completed'),
  (9,  'Test failover',         'Simulate node failure and recovery','2025-12-04 16:00:00', 1, 2, 'Not Started'),
  (10, 'Prepare report',        'Generate monthly status report',    '2026-01-05 11:00:00', 3, 1, 'Completed');

-- Insert node_access
-- Give root user (user_id = 1) access to all nodes
INSERT INTO `node_access` (`user_id`, `node_id`, `level_of_access`) VALUES
  (1, 1, 'root'),
  (1, 2, 'root'),
  (1, 3, 'root'),
  (1, 4, 'root'),
  (1, 5, 'root'),
  (2, 1, 'root'),
  (3, 1, 'admin'),
  (3, 3, 'admin'),
  (4, 2, 'admin'),
  (5, 5, 'manager'),
  (6, 3, 'manager'),
  (7, 4, 'manager'),
  (8, 2, 'manager'),
  (9, 1, 'read'),
  (10,5, 'read');

-- Ensure AUTO_INCREMENT counters are set past explicit IDs used
ALTER TABLE `users` AUTO_INCREMENT = 11;
ALTER TABLE `nodes` AUTO_INCREMENT = 6;
ALTER TABLE `tasks` AUTO_INCREMENT = 11;

-- Verification selects
SELECT * FROM users;
SELECT * FROM nodes;
SELECT * FROM tasks;
SELECT * FROM node_access ORDER BY node_id;
