import Link from "next/link";

export default function Navbar() {
  return (
    <header className="bg-[#407947] shadow-md px-8 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Right side - Navigation Links */}
        <nav className="flex gap-8 items-center">
          <Link href="/groups" className="text-white font-normal hover:font-semibold hover:scale-110 transition-all">
            Home
          </Link>
          <Link href="/calendar" className="text-white font-normal hover:font-semibold hover:scale-110 transition-all">
            Calendar
          </Link>
          <Link href="/shoppinglist" className="text-white font-normal hover:font-semibold hover:scale-110 transition-all">
            Lists
          </Link>
          <Link href="/tasks" className="text-white font-normal hover:font-semibold hover:scale-110 transition-all">
            Tasks
          </Link>
          <Link href="/expenses" className="text-white font-normal hover:font-semibold hover:scale-110 transition-all">
            Expenses
          </Link>
          <Link href="/profile" className="text-white font-normal hover:font-semibold hover:scale-110 transition-all">
            Profile
          </Link>
          <Link href="/settings" className="text-white font-normal hover:font-semibold hover:scale-110 transition-all">
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}