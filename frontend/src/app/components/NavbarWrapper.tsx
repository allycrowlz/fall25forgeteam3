'use client';
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

const BROWN = "#4C331D";
const GREEN = "#407947";

export default function NavbarWrapper() {
  const pathname = usePathname();
  const noNavbarPages = ['/', '/login', '/signup'];
  const showNavbar = !noNavbarPages.includes(pathname);

  const getNavbarColors = () => {
    // Groups page: Dark green bg, white text
    if (pathname === '/groups') return { bg: GREEN, text: "#FFFFFF" };
    // Default for other pages: White bg, white text
    return { bg: '#FFFFFF', text: GREEN };
  };

  return showNavbar ? <Navbar colors={getNavbarColors()} /> : null;
}