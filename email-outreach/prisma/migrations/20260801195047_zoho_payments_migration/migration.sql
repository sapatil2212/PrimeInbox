-- AlterTable
ALTER TABLE `Subscription` 
    CHANGE COLUMN `stripeCustomerId` `gatewayCustomerId` VARCHAR(191) NULL,
    CHANGE COLUMN `stripeSubscriptionId` `gatewaySubscriptionId` VARCHAR(191) NULL,
    CHANGE COLUMN `stripePriceId` `gatewayPriceId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Invoice` 
    MODIFY COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'inr';

-- AlterTable
ALTER TABLE `Payment` 
    MODIFY COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'inr',
    MODIFY COLUMN `provider` VARCHAR(191) NOT NULL DEFAULT 'zoho';

-- CreateTable
CREATE TABLE `WebhookLog` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'processed',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WebhookLog_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
