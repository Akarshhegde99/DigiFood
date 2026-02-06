import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { FloatingCart } from "@/components/ui/FloatingCart";

export const metadata: Metadata = {
    title: "DigiFood | Premium Dining",
    description: "The ultimate digital dining experience.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
                <Toaster position="bottom-right" />
            </body>
        </html>
    );
}
