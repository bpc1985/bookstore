"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  LogOut,
  Settings,
  Package,
  BookOpen,
  Menu,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { api } from "@/lib/api";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();

  const handleLogout = async () => {
    await logout(api);
    router.push("/");
  };

  const cartItemCount = cart?.total_items || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <Link href="/" className="flex items-center gap-2 mb-8">
                <div className="p-2 bg-primary rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">BookStore</span>
              </Link>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/books"
                  className="px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Browse Books
                </Link>
                {user && (
                  <Link
                    href="/orders"
                    className="px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    My Orders
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-primary rounded-lg group-hover:bg-primary/90 transition-colors">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:inline">
              BookStore
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/books"
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Browse
            </Link>
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/books" className="hidden md:flex">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          {user && (
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/10"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-primary/10"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="shadow-sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
