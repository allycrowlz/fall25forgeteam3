'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();
  
  const noNavbarPages = ['/', '/login', '/signup', '/onboarding'];
  const showNavbar = !noNavbarPages.includes(pathname);

  return showNavbar ? <Navbar /> : null;
}