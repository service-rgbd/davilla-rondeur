import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const adminAccountsTable = pgTable("admin_accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdminAccount = typeof adminAccountsTable.$inferSelect;
