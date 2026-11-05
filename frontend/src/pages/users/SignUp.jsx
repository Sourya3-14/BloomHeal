import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../utils/api.js";
import { AlertCircle, Loader2, UserPlus, ShieldCheck } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) return "This field is required";
    if (name.trim().length < 2) return "Must be at least 2 characters";
    if (name.trim().length > 50) return "Must be less than 50 characters";
    if (!/^[a-zA-Z\s'-]+$/.test(name)) return "Only letters, spaces, hyphens and apostrophes allowed";
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.length > 254) return "Email is too long";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password.length > 128) return "Password is too long";
    return "";
  };

  const validateRole = (role) => {
    const validRoles = ["patient", "doctor", "health_worker", "ngo"];
    if (!role) return "Please select a role";
    if (!validRoles.includes(role)) return "Please select a valid role";
    return "";
  };

  // Validate individual field
  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
        return validateName(value);
      case "lastName":
        return validateName(value);
      case "email":
        return validateEmail(value);
      case "password":
        return validatePassword(value);
      case "role":
        return validateRole(value);
      default:
        return "";
    }
  };

  // Validate all fields
  const validateForm = () => {
    const errors = {};
    Object.keys(form).forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) errors[field] = error;
    });
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError(""); // Clear general error when user types

    // Real-time validation
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate all fields before submission
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors above");
      setLoading(false);
      return;
    }

    try {
      // Trim whitespace from names
      const submitData = {
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
      };

      await api.post("/auth/signup", submitData);
      navigate("/signin", {
        state: { message: "Account created successfully! Please sign in." },
      });
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F0F7F4] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-[#2D7A5F]/20">
      <div className="relative w-full max-w-[540px] bg-white rounded-3xl border border-[#E8F5F0] p-6 sm:p-10 shadow-xl overflow-hidden animate-fadeIn">
        {/* Subtle top background gradient spot */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-bl from-[#4CAF82]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2D7A5F]/10 text-[#2D7A5F] border border-[#C8E6D8] mb-1 shadow-sm">
            <UserPlus size={22} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A3C34] sm:text-3xl">Create Account</h1>
          <p className="text-xs sm:text-sm font-medium text-[#4A7A6A]">Join the decentralized BloomHeal network community.</p>
        </div>

        {/* Universal Action Error Banner */}
        {error && (
          <div className="flex items-center gap-2 text-red-700 font-bold bg-red-50 border border-red-100 p-3.5 rounded-xl text-xs mb-6 shadow-sm">
            <AlertCircle size={14} className="flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1">
              <label htmlFor="firstName" className="text-[11px] font-black uppercase tracking-wider text-[#4A7A6A]">
                First Name *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                maxLength="50"
                placeholder="Jane"
                className={`w-full text-sm font-medium bg-[#FAFDFB] border ${
                  fieldErrors.firstName ? "border-red-300 focus:ring-red-500/20" : "border-[#C8E6D8] focus:border-[#2D7A5F] focus:ring-[#2D7A5F]/10"
                } rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-4 placeholder-[#4A7A6A]/40 text-[#1A3C34] shadow-sm`}
              />
              {fieldErrors.firstName && <p className="text-[11px] font-bold text-red-600">{fieldErrors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label htmlFor="lastName" className="text-[11px] font-black uppercase tracking-wider text-[#4A7A6A]">
                Last Name *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                maxLength="50"
                placeholder="Doe"
                className={`w-full text-sm font-medium bg-[#FAFDFB] border ${
                  fieldErrors.lastName ? "border-red-300 focus:ring-red-500/20" : "border-[#C8E6D8] focus:border-[#2D7A5F] focus:ring-[#2D7A5F]/10"
                } rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-4 placeholder-[#4A7A6A]/40 text-[#1A3C34] shadow-sm`}
              />
              {fieldErrors.lastName && <p className="text-[11px] font-bold text-red-600">{fieldErrors.lastName}</p>}
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-[11px] font-black uppercase tracking-wider text-[#4A7A6A]">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              maxLength="254"
              placeholder="jane.doe@example.com"
              className={`w-full text-sm font-medium bg-[#FAFDFB] border ${
                fieldErrors.email ? "border-red-300 focus:ring-red-500/20" : "border-[#C8E6D8] focus:border-[#2D7A5F] focus:ring-[#2D7A5F]/10"
              } rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-4 placeholder-[#4A7A6A]/40 text-[#1A3C34] shadow-sm`}
            />
            {fieldErrors.email && <p className="text-[11px] font-bold text-red-600">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-[11px] font-black uppercase tracking-wider text-[#4A7A6A]">
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              maxLength="128"
              placeholder="••••••••"
              className={`w-full text-sm font-medium bg-[#FAFDFB] border ${
                fieldErrors.password ? "border-red-300 focus:ring-red-500/20" : "border-[#C8E6D8] focus:border-[#2D7A5F] focus:ring-[#2D7A5F]/10"
              } rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-4 placeholder-[#4A7A6A]/40 text-[#1A3C34] shadow-sm`}
            />
            {fieldErrors.password && <p className="text-[11px] font-bold text-red-600">{fieldErrors.password}</p>}
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAFDFB] border border-[#E8F5F0] px-2.5 py-1 w-full text-[11px] text-[#4A7A6A] font-semibold mt-0.5">
              <ShieldCheck size={12} className="text-[#2D7A5F]" />
              <span>Security rule: Credentials must contain 6+ characters.</span>
            </div>
          </div>

          {/* Selection Role Dropdown */}
          <div className="space-y-1">
            <label htmlFor="role" className="text-[11px] font-black uppercase tracking-wider text-[#4A7A6A]">
              I am a... *
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full text-sm font-bold bg-[#FAFDFB] border ${
                  fieldErrors.role ? "border-red-300 focus:ring-red-500/20" : "border-[#C8E6D8] focus:border-[#2D7A5F] focus:ring-[#2D7A5F]/10"
                } rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-4 text-[#1A3C34] shadow-sm appearance-none cursor-pointer`}>
                <option value="">Select your structural role</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="health_worker">Health Worker</option>
                <option value="ngo">NGO Partner</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#4A7A6A]">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {fieldErrors.role && <p className="text-[11px] font-bold text-red-600">{fieldErrors.role}</p>}
          </div>

          {/* Submission Trigger */}
          <button
            type="submit"
            disabled={loading || Object.keys(fieldErrors).some((key) => fieldErrors[key])}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D7A5F] px-4 py-3 text-xs font-black text-white hover:bg-[#245F4A] disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md active:scale-95 mt-4">
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Provisioning Ecosystem Account...
              </>
            ) : (
              "Initialize Secure Registration"
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-8 pt-5 border-t border-[#F0F7F4] text-center">
          <p className="text-xs font-bold text-[#4A7A6A]">
            Already have an active profile ledger?{" "}
            <Link to="/signin" className="text-[#2D7A5F] hover:underline font-black ml-1">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
