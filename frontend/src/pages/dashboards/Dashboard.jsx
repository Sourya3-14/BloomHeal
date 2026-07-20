import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchUser();
  }, [navigate]);

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.data.user);
    } catch (error) {
      console.error(error);
      navigate("/signin");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const dashboardCards = [
    {
      title: "Find Doctors",
      icon: "👨‍⚕️",
      description: "Connect with qualified healthcare professionals in your area.",
      button: "Browse Doctors",
      path: "/doctors",
    },
    {
      title: "Connect with NGOs",
      icon: "🏛️",
      description: "Discover non-governmental organizations working for community health.",
      button: "View NGOs",
      path: "/ngos",
    },
    {
      title: "Health Workers",
      icon: "🏥",
      description: "Access community health workers for local healthcare support.",
      button: "Find Workers",
      path: "/healthworkers",
    },
    {
      title: "Health Blogs",
      icon: "📰",
      description: "Stay informed with healthcare insights and updates from experts.",
      button: "Read Blogs",
      path: "/blogs",
    },
  ];

  const quickActions = [
    { title: "Edit Profile", path: "/profile", icon: "✏️" },
    { title: "View All Blogs", path: "/blogs", icon: "📖" },
    { title: "Find Doctor", path: "/doctors", icon: "🔍" },
    { title: "Browse NGOs", path: "/ngos", icon: "🌐" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F0F7F4]">
        <Navbar onLogout={handleLogout} />
        <div className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C8E6D8] border-t-[#2D7A5F]" />
          <p className="mt-4 text-sm font-medium text-[#4A7A6A]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7F4] font-sans antialiased">
      <Navbar onLogout={handleLogout} />

      <div className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-10">
        {/* ── Centered Page Title ── */}
        {/* <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1A3C34] sm:text-5xl">
            Dashboard
          </h1>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#4CAF82]" />
        </div> */}

        {/* ── Welcome Banner ── */}
        <div className="mb-12 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A3C34] via-[#2D7A5F] to-[#4CAF82] shadow-xl w-full">
          <div className="px-6 py-12 text-center sm:px-12 md:py-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#C8E6D8]">Welcome back</p>
            <h2 className="text-3xl font-extrabold text-white sm:text-5xl">Hello, {user?.firstName || "Ayush"}!</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90 px-4">
              Welcome to your WellNest dashboard. Access healthcare services, manage your profile, and stay connected with trusted healthcare providers.
            </p>
            <div className="mt-6 inline-flex items-center rounded-full bg-white/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm border border-white/20">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-[#4CAF82] animate-pulse"></span>
              {user?.role || "Doctor"}
            </div>
          </div>
        </div>

        {/* ── Service Cards ── */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 w-full">
          {dashboardCards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-[#E8F5F0]">
              <div>
                {/* Card Header */}
                <div className="flex items-center gap-4 border-b border-[#E8F5F0] bg-[#F6FFFC] px-5 py-4">
                  <span className="text-2xl filter drop-shadow-sm">{card.icon}</span>
                  <h3 className="text-base font-bold text-[#1A3C34] tracking-tight">{card.title}</h3>
                </div>
                {/* Card Body */}
                <div className="px-5 py-5">
                  <p className="text-sm leading-relaxed text-[#4A7A6A]">{card.description}</p>
                </div>
              </div>

              {/* Card Footer Button Container */}
              <div className="px-5 pb-5 pt-2">
                <button
                  onClick={() => navigate(card.path)}
                  className="w-full rounded-lg bg-[#2D7A5F] py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#245F4A] hover:shadow-md active:scale-[0.98]">
                  {card.button}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="overflow-hidden rounded-xl bg-white shadow-md border border-[#E8F5F0] w-full">
          <div className="flex items-center gap-3 border-b border-[#E8F5F0] bg-[#F6FFFC] px-6 py-5">
            <span className="text-xl">⚡</span>
            <h3 className="text-base font-bold text-[#1A3C34]">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className="flex items-center justify-center gap-3 rounded-xl border-2 border-[#C8E6D8] bg-[#F0F7F4] px-4 py-3.5 text-sm font-bold text-[#2D7A5F] transition-all duration-200 hover:border-[#2D7A5F] hover:bg-[#2D7A5F] hover:text-white hover:shadow-sm active:scale-[0.98]">
                  <span className="text-base">{action.icon}</span>
                  {action.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
