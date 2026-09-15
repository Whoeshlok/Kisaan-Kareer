CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`kind` varchar(40) NOT NULL,
	`severity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`variety` varchar(100),
	`stage` varchar(64) NOT NULL,
	`sowingDate` varchar(24),
	`isPrimary` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`farmerName` varchar(120) NOT NULL,
	`location` varchar(160) NOT NULL,
	`district` varchar(80) NOT NULL,
	`state` varchar(80) NOT NULL,
	`latitude` varchar(24) NOT NULL,
	`longitude` varchar(24) NOT NULL,
	`farmSizeAcres` varchar(16) NOT NULL,
	`language` varchar(32) NOT NULL DEFAULT 'English',
	`irrigationMethod` varchar(64) NOT NULL DEFAULT 'Tube well',
	`farmingPreference` varchar(32) NOT NULL DEFAULT 'Conventional',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farms_id` PRIMARY KEY(`id`),
	CONSTRAINT `farms_ownerOpenId_unique` UNIQUE(`ownerOpenId`)
);
--> statement-breakpoint
CREATE TABLE `marketPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`district` varchar(80) NOT NULL,
	`market` varchar(120) NOT NULL,
	`commodity` varchar(80) NOT NULL,
	`minPrice` varchar(24),
	`maxPrice` varchar(24),
	`modalPrice` varchar(24) NOT NULL,
	`priceDate` varchar(24) NOT NULL,
	`source` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `soilTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`ph` varchar(16),
	`nitrogen` varchar(16),
	`phosphorus` varchar(16),
	`potassium` varchar(16),
	`organicCarbon` varchar(16),
	`ec` varchar(16),
	`reportUrl` text,
	`testedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `soilTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
