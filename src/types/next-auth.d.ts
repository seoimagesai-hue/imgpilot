import type {DefaultSession} from "next-auth";
import type {AccountStatus, UserRole} from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      accountStatus: AccountStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    accountStatus?: AccountStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    accountStatus?: AccountStatus;
  }
}
