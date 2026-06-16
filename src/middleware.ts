export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!login|api/auth|api/webhook|_next/static|_next/image|favicon.ico).*)"],
};
