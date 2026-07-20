import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Calendar, MoreVertical, User, LogOut, Stethoscope } from "lucide-react";

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/doctors", label: "Doctors" },
    { path: "/ngos", label: "NGOs" },
    { path: "/healthworkers", label: "Health Workers" },
    { path: "/events", label: "Events", icon: <Calendar size={16} /> },
    { path: "/blogs", label: "Blogs" },
    { path: "/outbreak", label: "Outbreak" },
    { path: "/assistant", label: "AI Assistant" },
  ];

  const dropdownItems = [
    {
      path: "/profile",
      label: "Profile",
      icon: <User size={18} />,
      onClick: () => {
        navigate("/profile");
        setShowDropdown(false);
      },
    },
    {
      label: "Logout",
      icon: <LogOut size={18} />,
      onClick: () => {
        onLogout();
        setShowDropdown(false);
      },
      danger: true,
    },
  ];

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full flex flex-col xl:flex-row items-center justify-between gap-4 px-6 py-4 md:px-12 backdrop-blur-md border-b transition-all duration-300 ${
        isScrolled ? "bg-[#F0F7F4]/90 border-[#C8E6D8] shadow-md" : "bg-white/80 border-[#E8F5F0]"
      }`}>
      {/* Brand */}
      <div onClick={() => navigate("/dashboard")} className="flex items-center gap-3 cursor-pointer group">
        <div className="w-10 h-10 bg-gradient-to-br from-[#2D7A5F] to-[#4CAF82] rounded-xl flex items-center justify-center shadow-md shadow-[#2D7A5F]/20 transition-transform duration-300 group-hover:scale-105">
          <Stethoscope size={20} color="white" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#1A3C34] to-[#2D7A5F] bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-[1.02]">
          WellNest
        </h2>
      </div>

      {/* Nav Items */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] ${
              isActive(item.path)
                ? "bg-gradient-to-br from-[#2D7A5F] to-[#4CAF82] text-white shadow-md shadow-[#2D7A5F]/20"
                : "text-[#4A7A6A] hover:bg-[#2D7A5F]/10 hover:text-[#1A3C34] hover:-translate-y-0.5"
            }`}>
            {item.icon && <span className="flex items-center">{item.icon}</span>}
            {item.label}
          </Link>
        ))}
      </div>

      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="More options"
          className={`p-3 rounded-xl border flex items-center justify-center transition-all duration-300 active:scale-95 ${
            showDropdown
              ? "bg-gradient-to-br from-[#2D7A5F] to-[#4CAF82] text-white border-transparent rotate-90"
              : "bg-[#F6FFFC] border-[#C8E6D8] text-[#2D7A5F] hover:border-[#2D7A5F] hover:bg-[#2D7A5F]/10 hover:scale-105"
          }`}>
          <MoreVertical size={20} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-md border border-[#E8F5F0] rounded-2xl shadow-xl overflow-hidden z-[60] origin-top-right animate-[fadeIn_0.2s_ease-out]">
            {dropdownItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-left transition-all duration-200 ${
                  item.danger ? "text-red-600 hover:bg-red-50" : "text-[#1A3C34] hover:bg-[#F0F7F4] hover:text-[#2D7A5F] hover:translate-x-1"
                }`}>
                <span className="flex items-center">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
