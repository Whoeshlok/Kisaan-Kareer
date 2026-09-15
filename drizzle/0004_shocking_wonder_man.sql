ALTER TABLE `crops` ADD `harvestDate` varchar(24);--> statement-breakpoint
ALTER TABLE `crops` ADD `treatmentDate` varchar(24);--> statement-breakpoint
ALTER TABLE `crops` ADD `treatmentQuantity` varchar(64);--> statement-breakpoint
ALTER TABLE `farms` ADD `soilType` varchar(80) DEFAULT 'Not tested' NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` ADD `soilReportAvailable` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` ADD `irrigationFrequency` varchar(64) DEFAULT 'As needed' NOT NULL;