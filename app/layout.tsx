import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import DynamicThemeProvider from "@/components/DynamicThemeProvider";
import { auth } from "@/auth";
import { AdminProvider } from "@/lib/admin-context";
import { getConfig } from "@/lib/config/reader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viáney's Bakery",
  description: "Custom cakes and pastries for every occasion, made with love.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAdmin = !!(session?.user?.id); // Explicitly check user.id exists
  const config = await getConfig();
  const { theme } = config;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Set the CSS vars at first paint (server-rendered) so the page never
      // flashes the hardcoded defaults before client JS swaps in the saved
      // theme — PageSections' effect still keeps these in sync afterward.
      style={{
        ['--theme-primary' as string]: theme.primaryColor,
        ['--theme-secondary' as string]: theme.secondaryColor,
        ['--theme-accent' as string]: theme.accentColor,
      }}
    >
      <body className="min-h-full flex flex-col">
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <DynamicThemeProvider initialColors={theme}>
            <AdminProvider isAdmin={isAdmin} adminName={session?.user?.name ?? undefined}>
              {children}
            </AdminProvider>
          </DynamicThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
