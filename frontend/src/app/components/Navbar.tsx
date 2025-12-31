'use client';

import dynamic from 'next/dynamic';
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const GroupSwitcher = dynamic(() => import("./GroupSwitcher"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-4">
      <div className="w-80 h-9 bg-gray-100 rounded-xl animate-pulse" />
      <div className="w-32 h-9 bg-gray-100 rounded-xl animate-pulse" />
      <div className="w-32 h-9 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  ),
});

const BROWN = "#4C331D";

interface NavbarProps {
  colors?: {
    bg: string;
    text: string;
  };
}

export default function Navbar({ colors }: NavbarProps) {
  const pathname = usePathname();
  const isGroupsPage = pathname === '/groups';
  const navColors = colors || { bg: "#FFFFFF", text: "#FFFFFF" };
  const linkTextClassname =
    "font-normal hover:font-semibold hover:scale-105 transition-all";

  return (
    <header
      className="shadow-md px-8 py-4"
      style={{
        backgroundColor: navColors.bg,
        borderColor: navColors.text,
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      <div className="flex items-center justify-between mx-auto" style={{ maxWidth: '1400px' }}>
        {/* Left side: Logo OR (on groups page) dropdown + buttons */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {!isGroupsPage && (
            <Link href="/groups" className="hover:opacity-80 transition-opacity">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={150}
                height={50}
                className="cursor-pointer"
              />
            </Link>
          )}

          <GroupSwitcher
            variant="navbar"
            showActions={isGroupsPage}
            theme={isGroupsPage ? 'light' : 'dark'}
          />
        </div>

        {/* Right side - Navigation Links */}
        <nav className="flex items-center" style={{ gap: '2.5rem' }}>
          <Link
            href="/groups"
            className={linkTextClassname}
            style={{ color: navColors.text }}
          >
            Home
          </Link>
          <Link
            href="/calendar"
            className={linkTextClassname}
            style={{ color: navColors.text }}
          >
            Calendar
          </Link>
          <Link
            href="/lists"
            className={linkTextClassname}
            style={{ color: navColors.text }}
          >
            Lists
          </Link>
          <Link
            href="/tasks"
            className={linkTextClassname}
            style={{ color: navColors.text }}
          >
            Tasks
          </Link>
          <Link
            href="/expenses"
            className={linkTextClassname}
            style={{ color: navColors.text }}
          >
            Expenses
          </Link>
          <Link
            href="/profile"
            className={linkTextClassname}
            style={{ color: navColors.text }}
          >
            Profile
          </Link>
          <Link
            href="/groups/settings"
            className={linkTextClassname}
            style={{ color: navColors.text }}
          >
            Group Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}