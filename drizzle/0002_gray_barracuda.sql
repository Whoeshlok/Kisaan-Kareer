CREATE TABLE `diseaseScans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`imageUrl` text NOT NULL,
	`diagnosis` text NOT NULL,
	`source` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diseaseScans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weatherSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`latitude` varchar(24) NOT NULL,
	`longitude` varchar(24) NOT NULL,
	`timezone` varchar(80),
	`payload` text NOT NULL,
	`source` varchar(120) NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weatherSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `marketPrices` ADD `changePercent` varchar(16) DEFAULT '0' NOT NULL;