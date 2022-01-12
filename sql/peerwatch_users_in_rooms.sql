DROP TABLE IF EXISTS `users_in_rooms`;
CREATE TABLE `users_in_rooms` (
  `userId` int NOT NULL,
  `roomId` varchar(255) NOT NULL,
  `canChat` tinyint(1) NOT NULL DEFAULT '1',
  `canVideo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`userId`,`roomId`) USING BTREE,
  KEY `fk_users_in_rooms_rooms` (`roomId`) USING BTREE,
  CONSTRAINT `fk_users_in_rooms_rooms` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`roomId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_users_in_rooms_users` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
LOCK TABLES `users_in_rooms` WRITE;
UNLOCK TABLES;