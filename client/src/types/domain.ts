export type User = {
  id: string;
  name: string;
  email: string;
};

export type GroupMember = {
  id: string;
  userId: string;
  user: User;
};

export type SplitMethod = "EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARES";

export type ExpenseSplit = {
  id: string;
  userId: string;
  owedCents: number;
  inputAmountCents?: number | null;
  inputPercentage?: number | null;
  inputShares?: number | null;
  user: User;
};

export type ExpenseMessage = {
  id: string;
  message: string;
  createdAt: string;
  author: User;
};

export type Expense = {
  id: string;
  groupId: string;
  description: string;
  amountCents: number;
  paidById: string;
  splitMethod: SplitMethod;
  expenseDate: string;
  notes?: string | null;
  paidBy: User;
  splits: ExpenseSplit[];
  messages?: ExpenseMessage[];
};

export type Settlement = {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  note?: string | null;
  settledAt: string;
  fromUser: User;
  toUser: User;
};

export type Group = {
  id: string;
  name: string;
  description?: string | null;
  members: GroupMember[];
  expenses?: Expense[];
  settlements?: Settlement[];
};

export type Balance = {
  users: User[];
  netByUser: Array<User & { netCents: number }>;
  pairwise: Array<{
    fromUser: User;
    toUser: User;
    amountCents: number;
  }>;
};
