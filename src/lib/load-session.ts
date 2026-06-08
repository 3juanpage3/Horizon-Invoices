import { createIsomorphicFn } from "@tanstack/react-start";

import { getSession } from "@/lib/api/auth.functions";
import { getSessionData } from "@/lib/auth.server";

// Route loaders run on both server (SSR) and client (navigation).
// On the server, call MongoDB directly. On the client, use the server function.
export const loadSession = createIsomorphicFn()
  .server(() => getSessionData())
  .client(() => getSession());
