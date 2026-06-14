import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { prisma } from "../../prisma/client.js";
import { asyncHandler } from "../../utils/http.js";
import { assertGroupMember } from "../groups/groupAccess.js";
import { calculateBalances } from "./balance.service.js";

const router = Router();
router.use(requireAuth);

type BalanceUser = { id: string; name: string; email: string };

function collectBalanceUsers(group: {
  members: Array<{ user: BalanceUser }>;
  expenses: Array<{ paidBy?: BalanceUser; splits: Array<{ user?: BalanceUser }> }>;
  settlements: Array<{ fromUser?: BalanceUser; toUser?: BalanceUser }>;
}) {
  const usersById = new Map<string, BalanceUser>();
  for (const member of group.members) usersById.set(member.user.id, member.user);
  for (const expense of group.expenses) {
    if (expense.paidBy) usersById.set(expense.paidBy.id, expense.paidBy);
    for (const split of expense.splits) {
      if (split.user) usersById.set(split.user.id, split.user);
    }
  }
  for (const settlement of group.settlements) {
    if (settlement.fromUser) usersById.set(settlement.fromUser.id, settlement.fromUser);
    if (settlement.toUser) usersById.set(settlement.toUser.id, settlement.toUser);
  }
  return Array.from(usersById.values());
}

router.get(
  "/overall",
  asyncHandler(async (req, res) => {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: req.user!.id } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        expenses: {
          include: {
            paidBy: { select: { id: true, name: true, email: true } },
            splits: { include: { user: { select: { id: true, name: true, email: true } } } }
          }
        },
        settlements: {
          include: {
            fromUser: { select: { id: true, name: true, email: true } },
            toUser: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    const usersById = new Map<string, BalanceUser>();
    for (const group of groups) {
      for (const user of collectBalanceUsers(group)) usersById.set(user.id, user);
    }

    const balance = calculateBalances(
      Array.from(usersById.values()),
      groups.flatMap((group) => group.expenses),
      groups.flatMap((group) => group.settlements)
    );

    res.json({ balance });
  })
);

router.get(
  "/groups/:groupId",
  asyncHandler(async (req, res) => {
    await assertGroupMember(req.params.groupId, req.user!.id);
    const group = await prisma.group.findUniqueOrThrow({
      where: { id: req.params.groupId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        expenses: {
          include: {
            paidBy: { select: { id: true, name: true, email: true } },
            splits: { include: { user: { select: { id: true, name: true, email: true } } } }
          }
        },
        settlements: {
          include: {
            fromUser: { select: { id: true, name: true, email: true } },
            toUser: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    const balance = calculateBalances(
      collectBalanceUsers(group),
      group.expenses,
      group.settlements
    );
    res.json({ balance });
  })
);

export { router as balancesRouter };
