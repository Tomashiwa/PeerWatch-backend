DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `roomId` varchar(255) NOT NULL,
  `hostId` int NOT NULL,
  `url` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `capacity` int NOT NULL DEFAULT '15',
  PRIMARY KEY (`roomId`),
  KEY `fk_rooms_users` (`hostId`),
  CONSTRAINT `fk_rooms_users` FOREIGN KEY (`hostId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
LOCK TABLES `rooms` WRITE;
UNLOCK TABLES;