import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, newsletterSubscribersTable } from "@workspace/db";
import { requireAdmin } from "../../lib/auth";

const router: IRouter = Router();

router.get("/admin/newsletter/subscribers", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(newsletterSubscribersTable)
    .orderBy(desc(newsletterSubscribersTable.subscribedAt));

  res.json(
    rows.map((row) => ({
      id: row.id,
      email: row.email,
      subscribedAt: row.subscribedAt.toISOString(),
    })),
  );
});

export default router;
