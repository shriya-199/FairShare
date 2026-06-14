import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ExpenseDetailPage } from "../features/expenses/ExpenseDetailPage";
import { GroupCreatePage } from "../features/groups/GroupCreatePage";
import { GroupDetailPage } from "../features/groups/GroupDetailPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/groups/new", element: <GroupCreatePage /> },
          { path: "/groups/:groupId", element: <GroupDetailPage /> },
          { path: "/groups/:groupId/expenses/:expenseId", element: <ExpenseDetailPage /> }
        ]
      }
    ]
  }
]);
