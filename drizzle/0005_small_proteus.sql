CREATE TABLE `irrigationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`cropId` int,
	`irrigationDate` varchar(24) NOT NULL,
	`method` varchar(64),
	`duration` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `irrigationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treatmentHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`cropId` int,
	`treatmentDate` varchar(24) NOT NULL,
	`chemicalName` varchar(120) NOT NULL,
	`quantity` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treatmentHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `farms` DROP INDEX `farms_ownerOpenId_unique`;--> statement-breakpoint
ALTER TABLE `crops` ADD `chemicalName` varchar(120);