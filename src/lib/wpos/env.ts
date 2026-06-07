/**
 * @deprecated Use `@/config/env.server` for server env or `@/config/env` for client env.
 * Kept for backward compatibility.
 */
export { getServerEnv as env } from "@/config/env.server";
export type { ServerEnv as EnvConfig } from "@/config/env.schema";
