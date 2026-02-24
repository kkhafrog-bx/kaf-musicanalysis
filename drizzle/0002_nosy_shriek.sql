CREATE TABLE `llmSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('manus','openai','google') NOT NULL DEFAULT 'manus',
	`apiKey` text,
	`openaiModel` varchar(64) DEFAULT 'gpt-3.5-turbo',
	`googleModel` varchar(64) DEFAULT 'gemini-pro',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `llmSettings_id` PRIMARY KEY(`id`)
);
