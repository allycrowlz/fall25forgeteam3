import Link from "next/link";
import Image from "next/image"

interface NavbarProps {
  colors?: {
    bg: string;
    text: string;
  };
  showGroupControls?: boolean;
}

export default function Navbar({ colors, showGroupControls = false }: NavbarProps) {
  const navColors = colors || { bg: '#FFFFFF', text: '#407947' };
  const linkTextClassname = "font-normal hover:font-semibold hover:scale-110 transition-all";

  return (
    <header
      className="shadow-md px-8 py-4"
      style={{ backgroundColor: navColors.bg , borderColor: navColors.text , borderWidth: "1px" , borderStyle: "solid" }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo (and optionally Dropdown + Add Button) */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          {!showGroupControls && (
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

          {/* Dropdown and Add Button (only shows up on groups page) - MAKE THIS ITS OWN COMPONENT LATER ON */}
          {showGroupControls && (
            <>
              <select className="w-80 px-4 py-1 bg-white rounded-xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all">
                <option value="">Select a Group</option>
                <option className="bg-blue-100">Group 1</option>
                <option className="bg-green-100">Group 2</option>
                <option className="bg-purple-100">Group 3</option>
              </select>

              <Link
                href="/groups/join"
                className="px-6 py-1 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
              >
                + Add Group
              </Link>
              <Link
                href="/groups/create"
                className="px-6 py-1 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
              >
                + Create Group
              </Link>
            </>
          )}
        </div>

        {/* Right side - Navigation Links */}
        <nav className="flex gap-8 items-center">
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
            href="/settings"
            className={linkTextClassname}
            style={{ color: navColors.text }}
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}