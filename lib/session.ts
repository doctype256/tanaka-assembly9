import { SessionOptions } from "iron-session";

console.log("SESSION_SECRET length:", process.env.SESSION_SECRET?.length); 
console.log("SESSION_SECRET value:", process.env.SESSION_SECRET);

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

declare module "iron-session" {
  interface IronSessionData {
    isAdmin?: boolean;
  }
}
