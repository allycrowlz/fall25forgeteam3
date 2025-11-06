'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  const noNavbarPages = ['/', '/login', '/signup'];
  const showNavbar = !noNavbarPages.includes(pathname);

  const getNavbarColors = () => {
    if (pathname.includes('/expenses') || pathname === '/shoppinglist') return { bg: '#C5E4AE', text: '#407947' }; // Light green bg, dark green text
    if (pathname === '/groups') return { bg: '#407947', text: "#FFFFFF" } // Dark green bg, white text
    // Default color for other pages
    return { bg: '#FFFFFF', text: '#407947' }; // White bg, dark green text
  };

  const showGroupControls = pathname === '/groups';

  return showNavbar ? <Navbar colors={getNavbarColors()} showGroupControls={showGroupControls} /> : null;
}