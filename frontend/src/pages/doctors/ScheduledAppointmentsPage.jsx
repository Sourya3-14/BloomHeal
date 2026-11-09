import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api.js";
import Navbar from "../../components/Navbar.jsx";
import { CalendarRange, ArrowLeft, AlertCircle, Loader2, Mail, Phone, MessageSquare, FileText, Clock, Video, RefreshCw, XCircle, StickyNote, History } from "lucide-react";

export default function ScheduledAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [filter, setFilter] = useState("all"); // all, today, upcoming, past
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchDoctorProfile();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
    }
  }, [currentUser]);

  const fetchDoctorProfile = async () => {
    try {
      const res = await api.get("/doctor/profile");
      setCurrentUser(res?.data?.data || null);
    } catch (err) {
      console.error("Error fetching doctor profile:", err);
      setError("Access denied. Only doctors can view this page.");
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      if (!currentUser?._id) {
        setError("Access denied. Only doctors can view this page.");
        return;
      }
      const doctorId = currentUser._id;

      // Fetch both accepted and scheduled appointments
      const [acceptedResponse, scheduledResponse] = await Promise.all([api.get(`/appointment/get-doctor-appointment?doctorId=${doctorId}&status=accepted`), api.get(`/appointment/get-doctor-appointment?doctorId=${doctorId}&status=scheduled`)]);

      const allAppointments = [...(Array.isArray(acceptedResponse?.data?.data) ? acceptedResponse.data.data : []), ...(Array.isArray(scheduledResponse?.data?.data) ? scheduledResponse.data.data : [])];

      setAppointments(allAppointments);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        const response = await api.patch(`/appointment/cancel`, {
          appointmentId,
        });

        if (response.data.success) {
          alert("Appointment cancelled successfully!");
          await fetchAppointments();
        }
      } catch (err) {
        console.error("Error cancelling appointment:", err);
        alert(err.response?.data?.message || "Failed to cancel appointment");
      }
    }
  };

  const handleRescheduleAppointment = async (appointment) => {
    const newTime = prompt("Enter new date and time (YYYY-MM-DD HH:MM format):", appointment.scheduledTime ? new Date(appointment.scheduledTime).toISOString().slice(0, 16).replace("T", " ") : new Date(appointment.requestedTime).toISOString().slice(0, 16).replace("T", " "));

    if (newTime) {
      try {
        const response = await api.patch("/appointment/change-time", {
          appointmentId: appointment._id,
          newTime: new Date(newTime.replace(" ", "T")).toISOString(),
          notes: "Rescheduled by doctor",
        });

        if (response.data.success) {
          alert("Appointment rescheduled successfully!");
          await fetchAppointments();
        }
      } catch (err) {
        console.error("Error rescheduling appointment:", err);
        alert(err.response?.data?.message || "Failed to reschedule appointment");
      }
    }
  };

  const handleStartVideoCall = async (appointment) => {
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
        doctorId: appointment.doctorId?._id || currentUser._id,
        patientId: appointment.patientId?._id || appointment.patientId,
        doctorName: currentUser.name || "Doctor",
        patientName: appointment.patientId?.name || "Patient",
        userRole: "doctor",
      }),
    );
    navigate("/video-call");
  };

  const handleConnectCalendar = async () => {
    setConnectingCalendar(true);
    try {
      const response = await api.post(
        "/api/google/connect",
        {},
        { withCredentials: true },
      );
      window.location.assign(response.data.url);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to connect Google Calendar");
      setConnectingCalendar(false);
    }
  };

  const getFilteredCounts = (type) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (type === "today") {
      return appointments.filter((a) => {
        const d = new Date(a.scheduledTime || a.requestedTime);
        return d >= today && d < tomorrow;
      }).length;
    }
    if (type === "upcoming") {
      return appointments.filter((a) => {
        const d = new Date(a.scheduledTime || a.requestedTime);
        return d >= tomorrow;
      }).length;
    }
    if (type === "past") {
      return appointments.filter((a) => {
        const d = new Date(a.scheduledTime || a.requestedTime);
        return d < today;
      }).length;
    }
    return appointments.length;
  };

  const filterAppointments = (appointmentsList) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case "today":
        return appointmentsList.filter((appointment) => {
          const appointmentDate = new Date(appointment.scheduledTime || appointment.requestedTime);
          return appointmentDate >= today && appointmentDate < tomorrow;
        });
      case "upcoming":
        return appointmentsList.filter((appointment) => {
          const appointmentDate = new Date(appointment.scheduledTime || appointment.requestedTime);
          return appointmentDate >= tomorrow;
        });
      case "past":
        return appointmentsList.filter((appointment) => {
          const appointmentDate = new Date(appointment.scheduledTime || appointment.requestedTime);
          return appointmentDate < today;
        });
      default:
        return appointmentsList;
    }
  };

  const filteredAppointments = filterAppointments(appointments);

  const PageHeader = () => (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-[#E8F5F0] p-6 md:p-8 shadow-sm mb-6">
      <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gradient-to-bl from-[#4CAF82]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D7A5F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2D7A5F]">
            <CalendarRange size={12} />
            Master Schedule
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A3C34] sm:text-3xl">Scheduled Appointments</h1>
          <p className="text-xs sm:text-sm font-medium text-[#4A7A6A] max-w-xl">Track active treatment tracks, sync secure clinical rooms, or recalibrate patient calendars directly within your operations ledger.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!currentUser?.googleCalendarConnected && (
            <button
              className="self-start md:self-center inline-flex items-center gap-2 rounded-xl border border-[#C8E6D8] bg-white px-4 py-2 text-xs font-extrabold text-[#2D7A5F] transition-all duration-200 hover:border-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-95 shadow-sm disabled:opacity-60"
              onClick={handleConnectCalendar}
              disabled={connectingCalendar}>
              <CalendarRange size={14} />
              {connectingCalendar ? "Connecting..." : "Connect Google Calendar"}
            </button>
          )}
          <button
            className="self-start md:self-center inline-flex items-center gap-2 rounded-xl border border-[#C8E6D8] bg-white px-4 py-2 text-xs font-extrabold text-[#4A7A6A] transition-all duration-200 hover:border-[#2D7A5F] hover:text-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-95 shadow-sm"
            onClick={() => navigate("/doctors")}>
            <ArrowLeft size={14} />
            Back to Doctors
          </button>
        </div>
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
            <p className="text-sm font-bold text-[#4A7A6A]">Synchronizing unified care calendars...</p>
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
              Return to Doctor Matrix
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

        {/* Filter Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6 bg-white/60 backdrop-blur-md border border-[#E8F5F0] p-1.5 rounded-2xl w-fit shadow-sm">
          {[
            { id: "all", label: "All Records" },
            { id: "today", label: "Today" },
            { id: "upcoming", label: "Upcoming" },
            { id: "past", label: "Past Logs" },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <button key={tab.id} onClick={() => setFilter(tab.id)} className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-200 ${active ? "bg-[#2D7A5F] text-white shadow-sm" : "text-[#4A7A6A] hover:bg-white hover:text-[#1A3C34]"}`}>
                {tab.label} ({getFilteredCounts(tab.id)})
              </button>
            );
          })}
        </div>

        {/* Workspace Body */}
        <div className="space-y-6">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8F5F0] p-16 text-center max-w-md mx-auto space-y-4 shadow-sm animate-fadeIn">
              <div className="w-14 h-14 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CalendarRange size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wide text-[#1A3C34]">No {filter === "all" ? "" : filter} Tracks Found</h3>
                <p className="text-xs font-medium text-[#4A7A6A] leading-relaxed">{filter === "all" ? "Your unified record matrix contains no active time allocations currently." : `There are no scheduled items categorized under your ${filter} parameter.`}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {filteredAppointments.map((appointment) => {
                const appointmentTime = new Date(appointment.scheduledTime || appointment.requestedTime);
                const isPast = appointmentTime < new Date();
                const canVideoCall = (appointment.status === "scheduled" || appointment.status === "accepted") && !isPast;

                return (
                  <div key={appointment._id} className="bg-white rounded-2xl border border-[#E8F5F0] p-6 shadow-sm hover:border-[#C8E6D8] hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                      {/* Top Header Row within Card */}
                      <div className="flex items-start justify-between gap-4 border-b border-[#F0F7F4] pb-3">
                        <div>
                          <h3 className="text-base font-black text-[#1A3C34]">{appointment.patientId?.name || "Patient Name"}</h3>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider mt-0.5">
                            <Clock size={11} />
                            Booked: {new Date(appointment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-sm ${
                            appointment.status === "scheduled" || appointment.status === "accepted" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}>
                          {appointment.status}
                        </span>
                      </div>

                      {/* Diagnostic Registry Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5">
                          <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block">{appointment.scheduledTime ? "Scheduled Window" : "Requested Window"}</span>
                          <span className={`font-bold block break-words ${isPast ? "text-[#4A7A6A]/50 line-through" : "text-[#1A3C34]"}`}>
                            {appointmentTime.toLocaleString()}
                            {isPast && " (Past)"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5">
                          <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block flex items-center gap-1">
                            <Mail size={10} /> Email Registry
                          </span>
                          <span className="font-semibold text-[#4A7A6A] block truncate" title={appointment.patientId?.email}>
                            {appointment.patientId?.email || "Not provided"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5">
                          <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block flex items-center gap-1">
                            <Phone size={10} /> Comm Interface
                          </span>
                          <span className="font-bold text-[#1A3C34]">{appointment.patientId?.phone || "Not provided"}</span>
                        </div>

                        <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5 sm:col-span-2">
                          <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block flex items-center gap-1">
                            <FileText size={10} /> Case Manifest
                          </span>
                          <p className="font-medium text-[#4A7A6A] leading-relaxed break-words">{appointment.reason || "No explicit statement logged."}</p>
                        </div>

                        {appointment.notes && (
                          <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/30 space-y-0.5 sm:col-span-2">
                            <span className="text-[10px] font-black text-amber-800/70 uppercase tracking-wider block flex items-center gap-1">
                              <StickyNote size={10} /> Clinical Directives
                            </span>
                            <p className="font-medium text-amber-900/90 leading-relaxed break-words">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Triggers */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F0F7F4]">
                      {!isPast ? (
                        <>
                          <button
                            className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C8E6D8] bg-white px-3 py-2.5 text-xs font-extrabold text-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-95 transition-all shadow-sm"
                            onClick={() => handleRescheduleAppointment(appointment)}>
                            <RefreshCw size={13} />
                            Reschedule
                          </button>
                          <button className="rounded-xl border border-[#C8E6D8] bg-white px-3 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all" onClick={() => handleCancelAppointment(appointment._id)}>
                            Cancel
                          </button>
                          <button
                            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C8E6D8] bg-white px-3 py-2.5 text-xs font-extrabold text-[#2D7A5F] hover:bg-[#F6FFFC] active:scale-95 transition-all"
                            onClick={() => {
                              localStorage.setItem(
                                "currentAppointment",
                                JSON.stringify({
                                  appointmentId: appointment._id,
                                  doctorId: appointment.doctorId?._id || appointment.doctorId,
                                  patientId: appointment.patientId?._id || appointment.patientId,
                                  doctorName: appointment.doctorId?.name || "Doctor",
                                  patientName: appointment.patientId?.name || "Patient",
                                }),
                              );
                              navigate(`/chat/${appointment._id}`);
                            }}>
                            <MessageSquare size={13} />
                            Chat Node
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center py-2 bg-[#F0F7F4]/40 border border-[#E8F5F0] rounded-xl text-[11px] font-bold text-[#4A7A6A] flex items-center justify-center gap-1">
                          <History size={12} />
                          This operational session window has concluded.
                        </div>
                      )}

                      {canVideoCall && (
                        <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2D7A5F] px-4 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-md mt-1" onClick={() => handleStartVideoCall(appointment)}>
                          <Video size={14} />
                          Initialize Telehealth Video Bridge
                        </button>
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
