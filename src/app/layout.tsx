import type { Metadata } from "next";
import { WorkplaceProvider } from "../components/provider";
import { Shell } from "../components/shell";
import "./globals.css";
import "./work-systems.css";
export const metadata: Metadata = {
  title: "Northstar · Apprenticeship Workplace",
  description:
    "Learn professional skills by doing real simulated work. Thirty connected workplace systems.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WorkplaceProvider>
          <Shell>{children}</Shell>
        </WorkplaceProvider>
      </body>
    </html>
  );
}
