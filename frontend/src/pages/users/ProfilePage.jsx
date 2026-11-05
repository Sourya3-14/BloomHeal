import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { blockchainApi } from "../../utils/api.js";
import Navbar from "../../components/Navbar.jsx";
import { ConnectKitButton } from "connectkit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { formatEther } from "viem";
import contract from "../../contractDesc/Token.json";
import { User, FileText, Wallet, Newspaper, Edit3, PlusCircle, RefreshCw, AlertCircle, CheckCircle2, Calendar, Layers, Sparkles } from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [blogForm, setBlogForm] = useState({ title: "", body: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // On-chain reads
  const { data: balance } = useBalance({ address });
  const { data: tokenBalance } = useReadContract({
    address: contract?.address,
    abi: contract?.abi,
    functionName: "balanceOf",
    args: [address],
    enabled: !!address,
  });
  const { data: claimableRewards, refetch: refetchRewards } = useReadContract({
    address: contract?.address,
    abi: contract?.abi,
    functionName: "getUserReward",
    args: [address],
    enabled: !!address,
  });

  // Claim tokens
  const { writeContract, data: claimTxHash, isPending: isClaimPending, error: claimError } = useWriteContract();
  const { isLoading: isClaimTxLoading, isSuccess: isClaimTxSuccess } = useWaitForTransactionReceipt({ hash: claimTxHash });

  // Sync wallet address to server whenever it changes
  useEffect(() => {
    if (!address || !user) return;
    blockchainApi.patch("/reward/set", { walletAddress: address }).catch(console.error);
  }, [address, user]);

  useEffect(() => {
    if (isClaimTxSuccess) {
      setSuccess("Tokens successfully claimed into your decentralized wallet account!");
      refetchRewards();
    }
  }, [isClaimTxSuccess]);

  useEffect(() => {
    if (claimError) setError(`Claim transaction aborted: ${claimError.message}`);
  }, [claimError]);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.data.user))
      .catch(() => navigate("/signin"));
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/profile/me")
      .then((r) => {
        setProfile(r.data.data.profile);
        setFormData(r.data.data.profile || {});
      })
      .catch(() => setError("Failed to pull secure identity profiles."))
      .finally(() => setLoading(false));

    if (user.role === "ngo" || user.role === "health_worker") {
      const ep = user.role === "ngo" ? "/ngo/blogs" : "/healthworker/blogs";
      api
        .get(ep)
        .then((r) => setBlogs(r.data.data || []))
        .catch(console.error);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/profile/${user.role}`, formData);
      setSuccess("Profile settings successfully pushed and hashed!");
      setEditing(false);
      const r = await api.get("/profile/me");
      setProfile(r.data.data.profile);
    } catch {
      setError("Failed to compile updated profile credentials.");
    }
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    const ep = user?.role === "ngo" ? "/ngo/blogs" : "/healthworker/blogs";
    try {
      await api.post(ep, blogForm);
      setSuccess("Your wellness entry has been broadcasted onto the platform grid.");
      setBlogForm({ title: "", body: "" });
      setShowBlogForm(false);
      const r = await api.get(ep);
      setBlogs(r.data.data || []);
    } catch {
      setError("Unable to initialize new health record deployment.");
    }
  };

  const handleClaimTokens = () => {
    if (!claimableRewards || claimableRewards === 0n) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "claim",
      args: [],
    });
  };

  const profileFields = {
    doctor: [
      { name: "name", label: "Full Name", type: "text" },
      { name: "specialization", label: "Specialization", type: "text" },
      { name: "licenseNumber", label: "License Number", type: "text" },
      { name: "affiliation", label: "Hospital / Affiliation", type: "text" },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Other"],
      },
      {
        name: "fee",
        label: "Consultation Fee (WNT equivalent)",
        type: "number",
      },
    ],
    health_worker: [
      { name: "name", label: "Full Name", type: "text" },
      { name: "employer", label: "Employer / Base Clinic", type: "text" },
      { name: "certId", label: "Certification ID", type: "text" },
      { name: "region", label: "Region Domain", type: "text" },
    ],
    ngo: [
      { name: "orgName", label: "Organization Name", type: "text" },
      {
        name: "registrationNumber",
        label: "Registration Number",
        type: "text",
      },
      { name: "mission", label: "Core Mission Statement", type: "textarea" },
      { name: "website", label: "Official Web URL", type: "url" },
      { name: "email", label: "Public Contact Email", type: "email" },
      {
        name: "services",
        label: "Services Provided (comma-separated)",
        type: "text",
      },
    ],
    patient: [{ name: "name", label: "Full Name", type: "text" }],
  };

  const fields = profileFields[user?.role] || [];
  const fmt = (n) => (n ? parseFloat(formatEther(n)).toFixed(4) : "0.0000");
  const isClaiming = isClaimPending || isClaimTxLoading;

  // Reusable Page Header Components
  const PageHeader = () => (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-[#E8F5F0] p-8 md:p-10 shadow-sm mb-8">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-[#4CAF82]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D7A5F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2D7A5F]">
          <Sparkles size={12} />
          Account Matrix
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#1A3C34] sm:text-4xl">User Dashboard</h1>
        <p className="text-sm font-medium text-[#4A7A6A] leading-relaxed">Manage your localized verification settings, modify decentralized identity fields, and analyze distribution balances.</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F0F7F4] text-[#1A3C34] font-sans antialiased">
        <Navbar onLogout={handleLogout} />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <PageHeader />
          <div className="bg-white rounded-3xl border border-[#E8F5F0] p-16 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-[#2D7A5F] animate-spin" />
            <p className="text-sm font-bold text-[#4A7A6A]">Decrypting node-specific user identity parameters...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F0F7F4] text-[#1A3C34] font-sans antialiased selection:bg-[#2D7A5F]/20 selection:text-[#1A3C34]">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <PageHeader />

        {/* Global Action Banner Response Systems */}
        <div className="space-y-3 mb-6">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-red-800 animate-fadeIn shadow-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-600" />
              <div className="text-xs sm:text-sm font-semibold">{error}</div>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 rounded-2xl bg-[#F6FFFC] border border-[#C8E6D8] p-4 text-[#1A3C34] animate-fadeIn shadow-sm">
              <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-[#2D7A5F]" />
              <div className="text-xs sm:text-sm font-bold">{success}</div>
            </div>
          )}
        </div>

        {/* Interactive Data Matrix Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Card Module 1: General Info */}
          <div className="bg-white rounded-2xl border border-[#E8F5F0] p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#F0F7F4] pb-4">
              <div className="w-10 h-10 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-xl flex items-center justify-center shadow-sm">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1A3C34]">General Identity</h3>
                <p className="text-[11px] font-bold text-[#4A7A6A]">Global access parameters</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 rounded-xl bg-[#F6FFFC]/50 border border-[#E8F5F0] gap-1">
                <span className="text-xs font-bold text-[#4A7A6A] uppercase tracking-wide">Account Name</span>
                <span className="text-sm font-extrabold text-[#1A3C34]">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 rounded-xl bg-[#F6FFFC]/50 border border-[#E8F5F0] gap-1">
                <span className="text-xs font-bold text-[#4A7A6A] uppercase tracking-wide">Registry Email</span>
                <span className="text-sm font-semibold text-[#1A3C34] break-all">{user?.email}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 rounded-xl bg-[#F6FFFC]/50 border border-[#E8F5F0] gap-1">
                <span className="text-xs font-bold text-[#4A7A6A] uppercase tracking-wide">System Security Role</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-[#2D7A5F]/10 text-[#2D7A5F] uppercase tracking-wider border border-[#2D7A5F]/20">
                  <Layers size={10} />
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Card Module 2: Wallet Infrastructure */}
          <div className="bg-white rounded-2xl border border-[#E8F5F0] p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#F0F7F4] pb-4">
              <div className="w-10 h-10 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-xl flex items-center justify-center shadow-sm">
                <Wallet size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1A3C34]">Ledger Interface</h3>
                <p className="text-[11px] font-bold text-[#4A7A6A]">Web3 utility & secure incentive ledger</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-start">
                <ConnectKitButton />
              </div>

              {isConnected ? (
                <div className="space-y-3.5 pt-2 animate-fadeIn">
                  <div className="flex justify-between items-center p-3 rounded-xl border border-[#E8F5F0] bg-[#FDFEFF]">
                    <span className="text-xs font-bold text-[#4A7A6A]">Base Gas Balance (ETH)</span>
                    <span className="text-xs font-black text-[#1A3C34]">{fmt(balance?.value)} ETH</span>
                  </div>

                  {tokenBalance !== undefined && (
                    <div className="flex justify-between items-center p-3 rounded-xl border border-[#E8F5F0] bg-[#FDFEFF]">
                      <span className="text-xs font-bold text-[#4A7A6A]">BloomHeal Liquidity (WNT)</span>
                      <span className="text-xs font-black text-[#2D7A5F]">{fmt(tokenBalance)} WNT</span>
                    </div>
                  )}

                  {claimableRewards > 0n && (
                    <div className="flex justify-between items-center p-3 rounded-xl border border-[#C8E6D8] bg-[#F6FFFC]">
                      <span className="text-xs font-bold text-[#2D7A5F]">Synchronized Pool Allocation</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#2D7A5F] text-white text-[11px] font-black">{fmt(claimableRewards)} WNT</span>
                    </div>
                  )}

                  <button
                    onClick={handleClaimTokens}
                    disabled={isClaiming || !claimableRewards || claimableRewards === 0n}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D7A5F] px-4 py-3 text-xs font-black tracking-wide text-white transition-all duration-200 hover:bg-[#245F4A] active:scale-[0.98] disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-md shadow-[#2D7A5F]/10">
                    {isClaiming && <RefreshCw size={12} className="animate-spin" />}
                    {isClaiming ? "Processing On-Chain Settlement..." : claimableRewards > 0n ? `Claim ${fmt(claimableRewards)} WNT Smart Contract Reward` : "No Claimable Nodes Verified"}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#C8E6D8] bg-[#F6FFFC]/40 text-center">
                  <p className="text-xs font-semibold text-[#4A7A6A]">Interface disconnected. Connect your Web3 provider parameters above to initialize native token balances.</p>
                </div>
              )}
            </div>
          </div>

          {/* Card Module 3: Dynamic Profile Specific Contexts */}
          <div className="bg-white rounded-2xl border border-[#E8F5F0] p-6 shadow-sm lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-[#F0F7F4] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-xl flex items-center justify-center shadow-sm">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1A3C34]">Verification Profile</h3>
                  <p className="text-[11px] font-bold text-[#4A7A6A]">Role specific decentralized verification matrices</p>
                </div>
              </div>

              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#C8E6D8] bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#2D7A5F] transition-all duration-200 hover:border-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-95 shadow-sm">
                  <Edit3 size={12} />
                  Modify Parameters
                </button>
              )}
            </div>

            <div>
              {editing ? (
                <form onSubmit={handleProfileSubmit} className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {fields.map((f) => (
                      <div key={f.name} className={`flex flex-col gap-1.5 ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
                        <label htmlFor={f.name} className="text-xs font-black text-[#1A3C34] uppercase tracking-wide">
                          {f.label}
                        </label>

                        {f.type === "select" ? (
                          <select
                            id={f.name}
                            name={f.name}
                            value={formData[f.name] || ""}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                [f.name]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] transition-all focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5">
                            <option value="">Select option reference...</option>
                            {f.options.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : f.type === "textarea" ? (
                          <textarea
                            id={f.name}
                            name={f.name}
                            rows="4"
                            value={formData[f.name] || ""}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                [f.name]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] transition-all focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5 placeholder:text-[#4A7A6A]/40"
                          />
                        ) : (
                          <input
                            id={f.name}
                            name={f.name}
                            type={f.type}
                            value={formData[f.name] || ""}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                [f.name]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] transition-all focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#F0F7F4]">
                    <button type="submit" className="rounded-xl bg-[#2D7A5F] px-5 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-md shadow-[#2D7A5F]/10">
                      Commit Updates
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData(profile || {});
                      }}
                      className="rounded-xl border border-[#C8E6D8] bg-white px-5 py-2.5 text-xs font-extrabold text-[#4A7A6A] hover:bg-[#F6FFFC] hover:text-[#2D7A5F] active:scale-95 transition-all">
                      Abort Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                  {profile ? (
                    fields.map((f) => (
                      <div key={f.name} className={`p-4 rounded-xl border border-[#E8F5F0] bg-[#FDFEFF] ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
                        <div className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider mb-1">{f.label}</div>
                        <div className="text-xs font-bold text-[#1A3C34] leading-relaxed break-words">{profile[f.name] || <span className="text-[#4A7A6A]/40 italic">Not compiled yet</span>}</div>
                      </div>
                    ))
                  ) : (
                    <div className="md:col-span-2 p-6 rounded-xl border border-dashed border-[#C8E6D8] bg-[#F6FFFC]/30 text-center space-y-2">
                      <p className="text-xs font-semibold text-[#4A7A6A]">No synchronized profile registration schemas discovered for this address context.</p>
                      <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-black text-[#2D7A5F] hover:underline">
                        Initialize Profile Struct <PlusCircle size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card Module 4: Decentralized Blog Streaming (Role Dependent) */}
          {(user?.role === "ngo" || user?.role === "health_worker") && (
            <div className="bg-white rounded-2xl border border-[#E8F5F0] p-6 shadow-sm lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between gap-4 border-b border-[#F0F7F4] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-xl flex items-center justify-center shadow-sm">
                    <Newspaper size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1A3C34]">Broadcast Ledger</h3>
                    <p className="text-[11px] font-bold text-[#4A7A6A]">Publish and administer secure medical research nodes</p>
                  </div>
                </div>

                {!showBlogForm && (
                  <button
                    onClick={() => setShowBlogForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D7A5F] px-3.5 py-1.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-md shadow-[#2D7A5F]/10">
                    <PlusCircle size={12} />
                    Write Entry
                  </button>
                )}
              </div>

              <div>
                {showBlogForm ? (
                  <form onSubmit={handleBlogSubmit} className="space-y-5 animate-fadeIn">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-[#1A3C34] uppercase tracking-wide">Article Title Header</label>
                      <input
                        type="text"
                        value={blogForm.title}
                        onChange={(e) => setBlogForm((p) => ({ ...p, title: e.target.value }))}
                        className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5"
                        required
                        placeholder="e.g., Regional Epidemiological Assessment Protocol"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-[#1A3C34] uppercase tracking-wide">Bulletin Core Content Body</label>
                      <textarea
                        rows="5"
                        value={blogForm.body}
                        onChange={(e) => setBlogForm((p) => ({ ...p, body: e.target.value }))}
                        className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5 placeholder:text-[#4A7A6A]/40"
                        required
                        placeholder="Provide detailed peer-reviewed localized clinical analytics data..."
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="rounded-xl bg-[#2D7A5F] px-5 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-md shadow-[#2D7A5F]/10">
                        Deploy Publication
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBlogForm(false);
                          setBlogForm({ title: "", body: "" });
                        }}
                        className="rounded-xl border border-[#C8E6D8] bg-white px-5 py-2.5 text-xs font-extrabold text-[#4A7A6A] hover:bg-[#F6FFFC] hover:text-[#2D7A5F] active:scale-95 transition-all">
                        Discard Draft
                      </button>
                    </div>
                  </form>
                ) : blogs.length === 0 ? (
                  <div className="p-10 rounded-xl border border-dashed border-[#C8E6D8] bg-[#F6FFFC]/30 text-center space-y-2">
                    <p className="text-xs font-semibold text-[#4A7A6A]">No custom articles broadcasted under your cryptographic verification role signature.</p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    <h4 className="text-xs font-black text-[#1A3C34] uppercase tracking-wider border-b border-[#F0F7F4] pb-2">Your Stream Deployments ({blogs.length})</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {blogs.map((blog, i) => (
                        <div
                          key={i}
                          className="group p-5 rounded-xl border border-[#E8F5F0] bg-[#FDFEFF] hover:border-[#C8E6D8] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h5 className="text-sm font-black text-[#1A3C34] group-hover:text-[#2D7A5F] transition-colors line-clamp-1">{blog.title}</h5>
                            <p className="text-xs font-medium text-[#4A7A6A] leading-relaxed line-clamp-3">{blog.body}</p>
                          </div>

                          <div className="flex items-center gap-1 pt-4 mt-3 border-t border-[#F0F7F4] text-[10px] font-bold text-[#4A7A6A]/60 uppercase">
                            <Calendar size={10} />
                            <span>Published: </span>
                            <span className="text-[#1A3C34]">
                              {new Date(blog.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
