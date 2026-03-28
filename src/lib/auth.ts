import { betterAuth } from "better-auth";
import { Pool } from "pg";
import {nextCookies} from "better-auth/next-js";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  plugins: [nextCookies()]
})
