"use client";
import Link from "next/link";
import Image from "next/image";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

function Footer() {
    return (
        <footer className="py-12 px-4 md:px-6 bg-background border-t border-border">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-between">
                    {/* Brand */}
                    <div className="mb-8 md:mb-0">
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/logo.png" alt="Gradio" width={32} height={32} className="rounded-lg" />
                            <h2 className="text-lg font-bold text-foreground">Gradio</h2>
                        </Link>

                        <p className="text-sm text-muted-foreground mt-4">
                            Enterprise-grade AI-powered proctoring &amp; assessment platform.
                        </p>

                        <div className="mt-3">
                            <Link href="https://x.com/compose/tweet?text=I%27ve%20been%20using%20%23GradioAI%20for%20AI-powered%20exam%20proctoring!">
                                <Button variant="secondary" className="gap-1.5 text-xs">
                                    Share Your Thoughts On
                                    <Icons.twitter className="w-3.5 h-3.5 fill-current" />
                                </Button>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                            <Link
                                href="https://github.com"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="GitHub"
                            >
                                <Icons.gitHub className="w-4 h-4" />
                            </Link>
                            <Link
                                href="https://x.com"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Twitter / X"
                            >
                                <Icons.twitter className="w-3.5 h-3.5 fill-current" />
                            </Link>
                        </div>

                        <p className="text-xs text-muted-foreground mt-5">
                            © {new Date().getFullYear()} Gradio Technologies. All rights reserved.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="font-semibold text-sm text-foreground mb-4">Platform</h3>
                            <ul className="space-y-2">
                                {[
                                    { label: "Dashboard", href: "/candidate/dashboard" },
                                    { label: "Exams", href: "/candidate/exams" },
                                    { label: "Reports", href: "/candidate/reports" },
                                    { label: "Profile", href: "/candidate/profile" },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm text-foreground mb-4">Company</h3>
                            <ul className="space-y-2">
                                {[
                                    { label: "About", href: "#" },
                                    { label: "Blog", href: "#" },
                                    { label: "Careers", href: "#" },
                                    { label: "Contact", href: "#" },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm text-foreground mb-4">Legal</h3>
                            <ul className="space-y-2">
                                {[
                                    { label: "Privacy Policy", href: "#" },
                                    { label: "Terms of Service", href: "#" },
                                    { label: "Cookie Policy", href: "#" },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Large Brand Name */}
                <div className="w-full flex mt-10 items-center justify-center overflow-hidden">
                    <h1 className="text-center text-4xl md:text-7xl lg:text-[10rem] font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-300 to-neutral-600 dark:from-neutral-700 dark:to-neutral-900 select-none leading-none tracking-tight">
                        Gradio
                    </h1>
                </div>
            </div>
        </footer>
    );
}

export { Footer as LargeNameFooter };
