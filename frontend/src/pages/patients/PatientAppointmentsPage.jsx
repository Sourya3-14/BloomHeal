import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api.js";
import Navbar from "../../components/Navbar.jsx";
import { CalendarDays, ArrowLeft, AlertCircle, MessageCircle, Loader2, Video, XCircle, FileText, Clock, User, StickyNote, History } from "lucide-react";

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | accepted | scheduled | cancelled
  const [patientProfile, setPatientProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchPatientProfile();
  }, [navigate]);

  useEffect(() => {
    if (patientProfile?._id) {
      fetchAppointments();
    }
  }, [patientProfile]);

  const fetchPatientProfile = async () => {
    try {
      const res = await api.get("/patient/profile");
      setPatientProfile(res?.data?.profile || res?.data?.data || null);
    } catch (err) {
      console.error("Error fetching patient profile:", err);
      setError("Please complete your patient profile to view appointments.");
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set("patientId", patientProfile._id);
      if (filter !== "all") query.set("status", filter);
      const response = await api.get(`/appointment/get-patient-appointment?${query.toString()}`);
      const data = response?.data?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!appointmentId) return;
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      const res = await api.patch("/appointment/cancel", { appointmentId });
      if (res?.data?.success) {
        await fetchAppointments();
      }
    } catch (err) {
      console.error("Cancel failed:", err);
      alert(err?.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const handleJoinVideoCall = async (appointment) => {
    if (appointment.meetingStatus === "READY") {
      try {
        const response = await api.get(
          `/patient/${appointment._id}/meeting-access`,
        );
        window.location.assign(response.data.meetUrl);
        return;
      } catch (err) {
        alert(err?.response?.data?.message || "Unable to open Google Meet");
        return;
      }
    }

    localStorage.setItem(
      "currentAppointment",
      JSON.stringify({
        appointmentId: appointment._id,
        doctorId: appointment.doctorId?._id || appointment.doctorId,
        patientId: appointment.patientId?._id || patientProfile._id,
        doctorName: appointment.doctorId?.name || `${appointment.doctorId?.user?.firstName || "Doctor"} ${appointment.doctorId?.user?.lastName || ""}`,
        patientName: patientProfile.name || "Patient",
        userRole: "patient",
      }),
    );
    navigate("/video-call");
  };

  const handleOpenChat = (appointment) => {
    navigate(`/chat/${appointment._id}`, {
      state: {
        appointment,
        patientProfile,
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const statuses = [
    { key: "all", label: "All Records" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "scheduled", label: "Scheduled" },
    { key: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    if (patientProfile?._id) fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const PageHeader = () => (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-[#E8F5F0] p-6 md:p-8 shadow-sm mb-6">
      <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gradient-to-bl from-[#4CAF82]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D7A5F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2D7A5F]">
            <CalendarDays size={12} />
            Patient Ledger
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A3C34] sm:text-3xl">My Appointments</h1>
          <p className="text-xs sm:text-sm font-medium text-[#4A7A6A] max-w-xl">
            Review and monitor your active health schedules, tracking pending requests, accepted windows, and digital telehealth access points.
          </p>
        </div>
        <button
          className="self-start md:self-center inline-flex items-center gap-2 rounded-xl border border-[#C8E6D8] bg-white px-4 py-2 text-xs font-extrabold text-[#4A7A6A] transition-all duration-200 hover:border-[#2D7A5F] hover:text-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-95 shadow-sm"
          onClick={() => navigate("/doctors")}>
          <ArrowLeft size={14} />
          Back to Doctors
        </button>
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
            <Loader2 className="w-10 h-10 text-[#2D7A5F] animate-spin" />
            <p className="text-sm font-bold text-[#4A7A6A]">Retrieving medical registry timelines...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#F0F7F4] text-[#1A3C34] font-sans antialiased">
        <Navbar onLogout={handleLogout} />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <PageHeader />
          <div className="bg-white rounded-3xl border border-[#E8F5F0] p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-red-700 font-bold bg-red-50 border border-red-100 p-4 rounded-xl text-sm">
              <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
              {error}
            </div>
            <button className="rounded-xl bg-[#2D7A5F] px-5 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] transition-all shadow-sm active:scale-95" onClick={() => navigate("/doctors")}>
              Complete Profile Registry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F0F7F4] text-[#1A3C34] font-sans antialiased selection:bg-[#2D7A5F]/20">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <PageHeader />

        {/* Premium Filter Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-6 bg-white/60 backdrop-blur-md border border-[#E8F5F0] p-1.5 rounded-2xl w-fit shadow-sm">
          {statuses.map((s) => {
            const active = filter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-200 ${active ? "bg-[#2D7A5F] text-white shadow-sm" : "text-[#4A7A6A] hover:bg-white hover:text-[#1A3C34]"}`}>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Main Records Matrix */}
        <div className="space-y-6">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8F5F0] p-16 text-center max-w-md mx-auto space-y-4 shadow-sm animate-fadeIn">
              <div className="w-14 h-14 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CalendarDays size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wide text-[#1A3C34]">No Sessions Logged</h3>
                <p className="text-xs font-medium text-[#4A7A6A] leading-relaxed">
                  {filter === "all"
                    ? "You do not have any appointments recorded in this unified environment yet."
                    : `There are currently no active appointments classified under the "${filter}" matrix status.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {appointments.map((a) => {
                const appointmentTime = new Date(a.scheduledTime || a.requestedTime);
                const isPast = appointmentTime < new Date();
                const canContact = (a.status === "scheduled" || a.status === "accepted") && !isPast;

                // Match layout/color metrics to standard statuses
                const getStatusStyles = (status) => {
                  switch (status) {
                    case "scheduled":
                    case "accepted":
                      return "bg-emerald-50 border-emerald-200 text-emerald-800";
                    case "pending":
                      return "bg-amber-50 border-amber-200 text-amber-800";
                    default:
                      return "bg-gray-50 border-gray-200 text-gray-600";
                  }
                };

                return (
                  <div
                    key={a._id}
                    className="bg-white rounded-2xl border border-[#E8F5F0] p-6 shadow-sm hover:border-[#C8E6D8] hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-4 border-b border-[#F0F7F4] pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block flex items-center gap-1">
                            <User size={10} /> Assigned Care Provider
                          </span>
                          <h3 className="text-base font-black text-[#1A3C34]">{a.doctorId?.name || `${a.doctorId?.user?.firstName || "Doctor"} ${a.doctorId?.user?.lastName || ""}`}</h3>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-sm ${getStatusStyles(a.status)}`}>
                          {a.status}
                        </span>
                      </div>

                      {/* Info Parameters Table Stack */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5 sm:col-span-2">
                          <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block flex items-center gap-1">
                            <Clock size={11} /> {a.scheduledTime ? "Confirmed Window" : "Requested Window"}
                          </span>
                          <span className={`font-bold block break-words ${isPast ? "text-[#4A7A6A]/50 line-through" : "text-[#1A3C34]"}`}>
                            {appointmentTime.toLocaleString()}
                            {isPast && " (Past)"}
                          </span>
                        </div>

                        {a.reason && (
                          <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5 sm:col-span-2">
                            <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block flex items-center gap-1">
                              <FileText size={10} /> Purpose of Consultation
                            </span>
                            <p className="font-medium text-[#4A7A6A] leading-relaxed break-words">{a.reason}</p>
                          </div>
                        )}

                        {a.notes && (
                          <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/30 space-y-0.5 sm:col-span-2">
                            <span className="text-[10px] font-black text-amber-800/70 uppercase tracking-wider block flex items-center gap-1">
                              <StickyNote size={10} /> Physician Directives
                            </span>
                            <p className="font-medium text-amber-900/90 leading-relaxed break-words">{a.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Actions Section */}
                    <div className="flex flex-col gap-2 pt-3 border-t border-[#F0F7F4]">
                      {a.status !== "cancelled" && !isPast && (
                        <button
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
                          onClick={() => handleCancel(a._id)}>
                          <XCircle size={13} />
                          Cancel Appointment
                        </button>
                      )}

                      {isPast && (
                        <div className="w-full text-center py-2 bg-[#F0F7F4]/40 border border-[#E8F5F0] rounded-xl text-[11px] font-bold text-[#4A7A6A] flex items-center justify-center gap-1">
                          <History size={12} />
                          This session window has closed.
                        </div>
                      )}

                      {canContact && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#2D7A5F] bg-white px-4 py-2.5 text-xs font-black text-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-95 transition-all"
                            onClick={() => handleOpenChat(a)}>
                            <MessageCircle size={14} />
                            Chat
                          </button>

                          <button
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2D7A5F] px-4 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-md"
                            onClick={() => handleJoinVideoCall(a)}>
                            <Video size={14} />
                            Video
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
