-- CreateTable
CREATE TABLE `comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,
    `dealId` INTEGER NULL,
    `userId` INTEGER NULL,

    INDEX `dealId`(`dealId`),
    INDEX `userId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dealImages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dealId` INTEGER NOT NULL,
    `dealImage` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,

    INDEX `dealId`(`dealId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dealReports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,
    `dealId` INTEGER NULL,
    `reporterId` INTEGER NULL,

    INDEX `dealId`(`dealId`),
    INDEX `reporterId`(`reporterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loc3` VARCHAR(255) NOT NULL,
    `mystatus` VARCHAR(255) NULL,
    `title` VARCHAR(255) NOT NULL,
    `link` VARCHAR(255) NOT NULL,
    `totalPrice` INTEGER NOT NULL,
    `personalPrice` INTEGER NOT NULL,
    `currentMember` INTEGER NOT NULL,
    `totalMember` INTEGER NOT NULL,
    `dealDate` DATETIME(0) NOT NULL,
    `dealPlace` VARCHAR(255) NOT NULL,
    `content` VARCHAR(255) NOT NULL,
    `status` VARCHAR(255) NOT NULL DEFAULT '모집중',
    `loc1` VARCHAR(255) NULL,
    `loc2` VARCHAR(255) NULL,
    `isCertificated` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,
    `userId` INTEGER NULL,

    INDEX `userId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `eventImage` VARCHAR(255) NULL,
    `type` VARCHAR(255) NOT NULL,
    `target` VARCHAR(255) NOT NULL,
    `eventStatus` INTEGER NOT NULL DEFAULT -1,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,
    `dealId` INTEGER NULL,
    `userId` INTEGER NULL,

    INDEX `dealId`(`dealId`),
    INDEX `userId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `link` VARCHAR(255) NULL,
    `image` VARCHAR(255) NULL,
    `lPrice` INTEGER NULL,
    `hPrice` VARCHAR(255) NULL,
    `mallName` VARCHAR(255) NULL,
    `productId` VARCHAR(255) NULL,
    `productType` VARCHAR(255) NULL,
    `brand` VARCHAR(255) NULL,
    `maker` VARCHAR(255) NULL,
    `category1` VARCHAR(255) NULL,
    `category2` VARCHAR(255) NULL,
    `category3` VARCHAR(255) NULL,
    `category4` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,
    `dealId` INTEGER NULL,

    INDEX `dealId`(`dealId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `replies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,
    `parentId` INTEGER NULL,
    `dealId` INTEGER NULL,
    `userId` INTEGER NULL,

    INDEX `dealId`(`dealId`),
    INDEX `parentId`(`parentId`),
    INDEX `userId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userReports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,
    `reporterId` INTEGER NULL,
    `reportedUserId` INTEGER NULL,

    INDEX `reportedUserId`(`reportedUserId`),
    INDEX `reporterId`(`reporterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(40) NULL,
    `nick` VARCHAR(15) NULL,
    `password` VARCHAR(100) NULL,
    `provider` VARCHAR(255) NOT NULL DEFAULT 'local',
    `snsId` VARCHAR(255) NULL,
    `accessToken` VARCHAR(255) NULL,
    `curLocation1` VARCHAR(255) NULL,
    `curLocation2` VARCHAR(255) NULL,
    `curLocation3` VARCHAR(255) NULL,
    `curLocationA` VARCHAR(255) NULL,
    `curLocationB` VARCHAR(255) NULL,
    `curLocationC` VARCHAR(255) NULL,
    `userStatus` VARCHAR(255) NULL,
    `refreshToken` VARCHAR(255) NULL,
    `isNewUser` BOOLEAN NOT NULL DEFAULT true,
    `kakaoNumber` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,
    `deletedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealImages` ADD CONSTRAINT `dealimages_ibfk_1` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealReports` ADD CONSTRAINT `dealreports_ibfk_1` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealReports` ADD CONSTRAINT `dealreports_ibfk_2` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deals` ADD CONSTRAINT `deals_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prices` ADD CONSTRAINT `prices_ibfk_1` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `replies` ADD CONSTRAINT `replies_ibfk_1` FOREIGN KEY (`parentId`) REFERENCES `comments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `replies` ADD CONSTRAINT `replies_ibfk_2` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `replies` ADD CONSTRAINT `replies_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userReports` ADD CONSTRAINT `userreports_ibfk_1` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userReports` ADD CONSTRAINT `userreports_ibfk_2` FOREIGN KEY (`reportedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

