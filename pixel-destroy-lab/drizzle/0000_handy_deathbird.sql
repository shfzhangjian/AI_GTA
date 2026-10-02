CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`round` integer NOT NULL,
	`player` text NOT NULL,
	`data` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_events_room_round` ON `events` (`room`,`round`,`id`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`name` text NOT NULL,
	`x` real DEFAULT 400 NOT NULL,
	`y` real DEFAULT 300 NOT NULL,
	`angle` real DEFAULT 0 NOT NULL,
	`weapon` integer DEFAULT 0 NOT NULL,
	`health` integer DEFAULT 100 NOT NULL,
	`kills` integer DEFAULT 0 NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_players_room` ON `players` (`room`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`map` text DEFAULT 'demo' NOT NULL,
	`phase` text DEFAULT 'lobby' NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL,
	`winner` text
);
