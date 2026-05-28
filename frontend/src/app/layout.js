import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "OTP Auth — Secure Authentication",
  description:
    "Production-grade OTP authentication system with email and phone verification, powered by Redis and MongoDB.",
  keywords: ["OTP", "authentication", "email verification", "phone verification", "secure login"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
