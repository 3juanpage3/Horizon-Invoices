import { createIsomorphicFn } from "@tanstack/react-start";

import { getSession } from "@/lib/api/auth.functions";

// Route loaders run on both server (SSR) and client (navigation).
// On the server, call MongoDB directly. On the client, use the server function.
export const loadSession = createIsomorphicFn()
  .server(async () => {
    const { getSessionData } = await import("@/lib/auth.server");
    return getSessionData();
  })
  .client(() => getSession());
