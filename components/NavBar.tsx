"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NavBar = () => {
  return (
    <section className="py-4">
      <div className="container">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/landing/Images/logo.png"
              className="max-h-8"
              alt="FUZO"
              width={32}
              height={32}
            />
            <span className="text-lg font-semibold tracking-tighter">FUZO</span>
          </Link>
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/feed" className={navigationMenuTriggerStyle()}>
                    Feed
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/scout" className={navigationMenuTriggerStyle()}>
                    Scout
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/bites" className={navigationMenuTriggerStyle()}>
                    Bites
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/plate" className={navigationMenuTriggerStyle()}>
                    Plate
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/dashboard" className={navigationMenuTriggerStyle()}>
                    Dashboard
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/users" className={navigationMenuTriggerStyle()}>
                    Users
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/auth-debug" className={navigationMenuTriggerStyle()}>
                    Auth Debug
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="hidden items-center gap-4 lg:flex">
            <Link href="/ai">
              <Button variant="outline">Ask AI</Button>
            </Link>
            <Link href="/chat">
              <Button>Chat</Button>
            </Link>
          </div>
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon">
                <MenuIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="max-h-screen overflow-auto">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="flex items-center gap-2">
                    <Image
                      src="/images/landing/Images/logo.png"
                      className="max-h-8"
                      alt="FUZO"
                      width={32}
                      height={32}
                    />
                    <span className="text-lg font-semibold tracking-tighter">
                      FUZO
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-4">
                <div className="flex flex-col gap-6">
                  <Link href="/feed" className="font-medium">
                    Feed
                  </Link>
                  <Link href="/scout" className="font-medium">
                    Scout
                  </Link>
                  <Link href="/bites" className="font-medium">
                    Bites
                  </Link>
                  <Link href="/plate" className="font-medium">
                    Plate
                  </Link>
                  <Link href="/dashboard" className="font-medium">
                    Dashboard
                  </Link>
                  <Link href="/users" className="font-medium">
                    Users
                  </Link>
                  <Link href="/cron-debug" className="font-medium">
                    CRON Debug
                  </Link>
                </div>
                <div className="mt-6 flex flex-col gap-4">
                  <Link href="/ai">
                    <Button variant="outline">Ask AI</Button>
                  </Link>
                  <Link href="/chat">
                    <Button>Chat</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </section>
  );
};

export default NavBar;
