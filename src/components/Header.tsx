import { Bars3Icon, UserIcon } from "@heroicons/react/24/outline";
import { type FC } from "react";
import { useLocation } from "react-router";

const Header: FC = () => {
  const pathname = useLocation().pathname;
  const location = pathname.split("/")[1];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RaceBet
            </div>
            <div className="hidden sm:block text-sm text-gray-500">
              Monaco Grand Prix 2025
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a
                href="/"
                className={`font-medium ${
                  location === ""
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Markets
              </a>
              {/* <a
                href="/portfolio"
                className={`font-medium ${
                  location === "portfolio"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Portfolio
              </a> */}
            </nav>

            <div className="flex items-center gap-2">
              <a href="/portfolio" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <UserIcon className="w-5 h-5" />
              </a>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
                <Bars3Icon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
