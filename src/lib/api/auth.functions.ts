import type { SessionData } from "../auth.server";
import { apiRequest } from "./client";

type Credentials = { usernameOrEmail: string; password: string };
type Registration = { username: string; email: string; password: string };

export const registerUser = ({ data }: { data: Registration }) =>
  apiRequest<{ success: boolean }>("/api/auth", {
    method: "POST",
    body: JSON.stringify({ action: "register", ...data }),
  });

export const loginUser = ({ data }: { data: Credentials }) =>
  apiRequest<{ success: boolean }>("/api/auth", {
    method: "POST",
    body: JSON.stringify({ action: "login", ...data }),
  });

export const logoutUser = () =>
  apiRequest<{ success: boolean }>("/api/auth", {
    method: "POST",
    body: JSON.stringify({ action: "logout" }),
  });

export const getSession = () => apiRequest<SessionData>("/api/auth");
