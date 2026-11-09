import React, { useState, useEffect } from 'react';
import { 
  Heart, Shield, AlertTriangle, Clock, CheckCircle, PhoneCall, 
  Pill, Activity, UserCheck, RefreshCw, Users, Stethoscope, 
  Zap, Code, LogIn, LogOut, Lock, Mail, Plus, Check, FileText,
  Calendar, MapPin, ChevronRight, AlertCircle, Bell, Settings,
  Radio, Smartphone, User, X, UserPlus, Phone
} from 'lucide-react';

const INITIAL_STATE = {
  patient: {
    name: "Savitri Devi",
    age: 78,
    location: "Jaipur, Rajasthan",
    emergencyContact: "+91 98765 43210 (Ravi - Grandson)",
    status: "NORMAL" // NORMAL, DELAYED, CRITICAL
  },
  medications: [
    { id: 1, name: "Amlodipine (5mg)", time: "08:30 AM", dosage: "1 Tablet", taken: true, category: "Blood Pressure" },
    { id: 2, name: "Metformin (500mg)", time: "01:30 PM", dosage: "1 Tablet", taken: false, category: "Diabetes" },
    { id: 3, name: "Atorvastatin (10mg)", time: "08:30 PM", dosage: "1 Tablet", taken: false, category: "Cholesterol" }
  ],
  checkIns: [
    { id: 1, title: "Morning Check-in", expectedTime: "08:00 AM", status: "completed", timestamp: "08:02 AM" },
    { id: 2, title: "Afternoon Check-in", expectedTime: "02:00 PM", status: "pending", timestamp: null },
    { id: 3, title: "Evening Check-in", expectedTime: "08:00 PM", status: "pending", timestamp: null }
  ],
  vitals: {
    bp: { systolic: 128, diastolic: 82, status: "Normal" },
    pulse: { value: 72, status: "Normal" },
    sugar: { value: 110, status: "Normal (Fasting)" },
    temp: { value: 98.4, status: "Normal" }
  },
  vitalsHistory: [
    { date: "Oct 5, 2026", bp: "124/80", sugar: 105, temp: 98.2, status: "Normal" },
    { date: "Oct 6, 2026", bp: "126/82", sugar: 112, temp: 98.4, status: "Normal" },
    { date: "Oct 7, 2026", bp: "130/85", sugar: 118, temp: 98.6, status: "Elevated" },
    { date: "Oct 8, 2026", bp: "128/82", sugar: 110, temp: 98.4, status: "Normal" }
  ],
  appointments: [
    { id: 1, doctor: "Dr. A. Sharma", specialty: "Cardiologist", date: "Tomorrow, Oct 9", time: "11:00 AM", location: "City Care Clinic" },
    { id: 2, doctor: "Dr. Meena Gupta", specialty: "General Physician", date: "Oct 15, 2026", time: "04:30 PM", location: "Apollo Health" }
  ],
  anomalies: [
    { id: 101, timestamp: "Today, 10:45 AM", severity: "LOW", title: "Delayed Morning Check-in (+45m)", resolved: true, note: "User verified via automated voice prompt: 'I was resting in lawn'." }
  ],
  escalationRules: {
    bufferMinutes: 60,
    firstAlert: "SMS & Mobile App Prompt to Senior",
    secondAlert: "Automated AI Voice Call to Senior Phone",
    thirdAlert: "High-Priority Caregiver Push & WhatsApp Alert",
    finalAlert: "Emergency Response & Local Caretaker Escalation"
  },
  clinicalNotes: [
    { id: 1, date: "Oct 4, 2026", doctor: "Dr. A. Sharma", note: "Blood pressure well controlled on 5mg Amlodipine. Recommended 15 min daily morning walk." }
  ]
};

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("careconnect_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login"); // 'login' or 'signup'
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Registration Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("senior");
  const [regEmergencyContact, setRegEmergencyContact] = useState("");

  // Database of Users in LocalStorage
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem("careconnect_registered_users");
    return saved ? JSON.parse(saved) : [];
  });

  // Main Dashboard State
  const [activeTab, setActiveTab] = useState("senior"); 
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("careconnect_data");
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  // Modal and Note States
  const [showApiModal, setShowApiModal] = useState(false);
  const [latestApiCall, setLatestApiCall] = useState(null);
  const [newClinicalNote, setNewClinicalNote] = useState("");

  useEffect(() => {
    localStorage.setItem("careconnect_data", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem("careconnect_registered_users", JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("careconnect_user", JSON.stringify(user));
      setActiveTab(user.role);
    } else {
      localStorage.removeItem("careconnect_user");
    }
  }, [user]);

  // Helper function to simulate backend REST API responses
  const triggerApi = (endpoint, method, payload, response) => {
    setLatestApiCall({
      endpoint,
      method,
      payload,
      response,
      status: 200,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setAuthError("Please fill in all required fields.");
      return;
    }

    const existingUser = registeredUsers.find(u => u.email.toLowerCase() === regEmail.toLowerCase());
    if (existingUser) {
      setAuthError("An account with this email already exists.");
      return;
    }

    const newUser = {
      id: "usr_" + Date.now(),
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      emergencyContact: regEmergencyContact || "None Provided"
    };

    setRegisteredUsers([...registeredUsers, newUser]);
    
    // Automatically update patient profile name and contact if registering as a Senior
    if (regRole === "senior") {
      setData(prev => ({
        ...prev,
        patient: {
          ...prev.patient,
          name: regName,
          emergencyContact: regEmergencyContact || prev.patient.emergencyContact
        }
      }));
    }

    triggerApi("/api/v1/auth/register", "POST", { name: regName, email: regEmail, role: regRole }, { success: true, userId: newUser.id });

    setAuthSuccess("Account created successfully! Please sign in.");
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setRegEmergencyContact("");
    setAuthMode("login");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    const targetUser = registeredUsers.find(
      u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword
    );

    if (!targetUser) {
      setAuthError("Invalid email or password. Please try again or create a new account.");
      return;
    }

    const userData = {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      name: targetUser.name,
      emergencyContact: targetUser.emergencyContact,
      token: "jwt_bearer_token_" + Date.now()
    };

    setUser(userData);
    triggerApi("/api/v1/auth/login", "POST", { email: loginEmail }, { success: true, token: userData.token, user: userData });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleCheckIn = () => {
    const updatedCheckIns = data.checkIns.map(c => 
      c.status === "pending" ? { ...c, status: "completed", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : c
    );
    const updatedPatient = { ...data.patient, status: "NORMAL" };
    
    setData({ ...data, checkIns: updatedCheckIns, patient: updatedPatient });
    triggerApi("/api/v1/checkin/confirm", "POST", { patientId: "P-7821", action: "MANUAL_SENIOR_CONFIRM" }, { success: true, newStatus: "NORMAL", timestamp: new Date().toISOString() });
  };

  const handleToggleMed = (id) => {
    const updatedMeds = data.medications.map(m => m.id === id ? { ...m, taken: !m.taken } : m);
    setData({ ...data, medications: updatedMeds });
    const med = updatedMeds.find(m => m.id === id);
    triggerApi("/api/v1/medications/status", "PUT", { medId: id, taken: med.taken }, { success: true, med });
  };

  const handleSimulateAnomaly = () => {
    const updatedPatient = { ...data.patient, status: "DELAYED" };
    const newAnomaly = {
      id: Date.now(),
      timestamp: "Just Now",
      severity: "MEDIUM",
      title: "Missed Routine Window (+2 hrs Delay)",
      resolved: false,
      note: "No response received after scheduled 2-hour safety window."
    };

    setData({
      ...data,
      patient: updatedPatient,
      anomalies: [newAnomaly, ...data.anomalies]
    });

    triggerApi("/api/v1/anomaly/detect", "POST", { type: "MISSED_CHECKIN", bufferExceededMin: 120 }, { anomalyDetected: true, escalation: "LEVEL_2_AI_VOICE_CALL" });
  };

  const handleSimulateBpSpike = () => {
    const updatedVitals = {
      ...data.vitals,
      bp: { systolic: 168, diastolic: 102, status: "High Alert!" }
    };
    const updatedPatient = { ...data.patient, status: "CRITICAL" };
    const newAnomaly = {
      id: Date.now(),
      timestamp: "Just Now",
      severity: "HIGH",
      title: "Blood Pressure Spike Detected (168/102)",
      resolved: false,
      note: "Vitals log detected reading outside safe physiological range."
    };

    const newHistoryRow = {
      date: "Today (Spike)",
      bp: "168/102",
      sugar: 125,
      temp: 98.8,
      status: "CRITICAL"
    };

    setData({
      ...data,
      vitals: updatedVitals,
      patient: updatedPatient,
      anomalies: [newAnomaly, ...data.anomalies],
      vitalsHistory: [newHistoryRow, ...data.vitalsHistory]
    });

    triggerApi("/api/v1/vitals/telemetry", "POST", { bp: "168/102", pulse: 88 }, { alertTriggered: true, severity: "HIGH_CRITICAL" });
  };

  const handleAddDoctorNote = (e) => {
    e.preventDefault();
    if (!newClinicalNote.trim()) return;

    const newNote = {
      id: Date.now(),
      date: "Today, Oct 8",
      doctor: user?.name || "Dr. A. Sharma",
      note: newClinicalNote
    };

    setData({
      ...data,
      clinicalNotes: [newNote, ...data.clinicalNotes]
    });

    setNewClinicalNote("");
    triggerApi("/api/v1/clinical/notes", "POST", { note: newNote }, { success: true, recordId: newNote.id });
  };

  const handleReset = () => {
    setData(INITIAL_STATE);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-4 py-8 font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex bg-rose-500/20 text-rose-400 p-3 rounded-2xl border border-rose-500/30 mb-2">
              <Heart className="h-8 w-8 fill-current" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">CareConnect</h1>
            <p className="text-xs text-slate-400">Remote Elderly Care & Anomaly Escalation Platform</p>
          </div>

          {/* Authentication Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
              className={`py-2 px-3 rounded-xl transition text-center flex items-center justify-center space-x-1.5 ${
                authMode === "login" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => { setAuthMode("signup"); setAuthError(""); setAuthSuccess(""); }}
              className={`py-2 px-3 rounded-xl transition text-center flex items-center justify-center space-x-1.5 ${
                authMode === "signup" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            </form>
          ) : (
            /* CREATE NEW ACCOUNT / REGISTRATION FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Savitri Devi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. savitri@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Account Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="senior">👵 Senior Citizen</option>
                  <option value="family">👨‍👩‍👧 Family Member / Caregiver</option>
                  <option value="doctor">🩺 Physician / Doctor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Emergency Contact Info</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    value={regEmergencyContact}
                    onChange={(e) => setRegEmergencyContact(e.target.value)}
                    placeholder="+91 98765 43210 (Name & Relation)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create CareConnect Account</span>
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12">
      
      {/* HEADER NAVBAR */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="bg-rose-500 p-2 rounded-xl text-white">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                CareConnect
              </h1>
              <p className="text-[11px] text-slate-400">Remote Senior Safety & Health Hub</p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab("senior")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "senior" ? "bg-rose-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              <span>👵 Senior View</span>
            </button>
            <button
              onClick={() => setActiveTab("family")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "family" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Family Hub</span>
            </button>
            <button
              onClick={() => setActiveTab("doctor")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "doctor" ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Doctor Mode</span>
            </button>
          </div>

          {/* Tools & Profile */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowApiModal(true)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono transition"
            >
              <Code className="h-3.5 w-3.5 text-sky-400" />
              <span>API Inspector</span>
            </button>

            <div className="flex items-center space-x-2 border-l border-slate-700 pl-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold block text-white">{user.name}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* DEMO LIVE ANOMALY SIMULATION CONTROL BAR */}
      <div className="bg-amber-500 text-amber-950 border-b border-amber-600 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-amber-950 fill-current animate-pulse" />
          <span className="font-bold uppercase tracking-wide">Live Anomaly Controls:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCheckIn} className="bg-slate-900 text-white px-3 py-1 rounded-lg font-bold hover:bg-slate-800 transition">
            Instant Check-in
          </button>
          <button onClick={handleSimulateAnomaly} className="bg-amber-900 text-amber-100 px-3 py-1 rounded-lg font-bold hover:bg-amber-950 transition">
            Simulate +2 hrs Delay
          </button>
          <button onClick={handleSimulateBpSpike} className="bg-rose-900 text-rose-100 px-3 py-1 rounded-lg font-bold hover:bg-rose-950 transition">
            Simulate High BP (168/102)
          </button>
          <button onClick={handleReset} className="bg-amber-800 text-amber-100 px-3 py-1 rounded-lg hover:bg-amber-900 transition">
            Reset State
          </button>
        </div>
      </div>

      {/* MAIN VIEW AREA */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* 👵 MODE 1: ACCESSIBLE SENIOR DASHBOARD */}
        {activeTab === "senior" && (
          <div className="max-w-2xl mx-auto space-y-6">

            {/* STATUS BANNER & CHECK-IN */}
            <div className={`p-6 rounded-3xl shadow-xl transition-all ${
              data.patient.status === "NORMAL" 
                ? "bg-gradient-to-br from-emerald-600 to-teal-800 text-white" 
                : "bg-gradient-to-br from-amber-600 to-rose-700 text-white"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest font-extrabold bg-black/20 px-3 py-1 rounded-full">
                  Daily Check-in
                </span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-mono">Today</span>
              </div>

              {data.patient.status === "NORMAL" ? (
                <div>
                  <h2 className="text-3xl font-black mb-2">Good Day, {data.patient.name.split(' ')[0]}!</h2>
                  <p className="text-emerald-100 text-base mb-6">You are checked in. Family is notified that you are doing fine.</p>
                  <button
                    onClick={handleCheckIn}
                    className="w-full py-5 bg-white text-emerald-900 font-black text-xl rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center space-x-3"
                  >
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                    <span>I'm Safe & Doing Fine!</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-8 w-8 text-yellow-300 animate-bounce" />
                    <h2 className="text-2xl font-black">Check-in Prompt Alert</h2>
                  </div>
                  <p className="text-amber-100 text-base mb-6">Please tap the button below to confirm your status with family.</p>
                  <button
                    onClick={handleCheckIn}
                    className="w-full py-5 bg-white text-rose-800 font-black text-xl rounded-2xl shadow-2xl active:scale-95 transition flex items-center justify-center space-x-3 animate-pulse"
                  >
                    <UserCheck className="h-8 w-8 text-rose-600" />
                    <span>Tap Here: I am Okay!</span>
                  </button>
                </div>
              )}
            </div>

            {/* MEDICINES CHECKLIST */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Pill className="h-6 w-6 text-rose-500" />
                Medication Tracker
              </h3>
              <div className="space-y-3">
                {data.medications.map(med => (
                  <div 
                    key={med.id}
                    onClick={() => handleToggleMed(med.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      med.taken ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-rose-50/60 border-rose-200 text-slate-800"
                    }`}
                  >
                    <div>
                      <h4 className={`text-lg font-bold ${med.taken ? "line-through text-slate-400" : "text-slate-900"}`}>{med.name}</h4>
                      <p className="text-xs text-slate-500">{med.time} • {med.dosage} ({med.category})</p>
                    </div>
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${
                      med.taken ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"
                    }`}>
                      {med.taken && <Check className="h-6 w-6 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK VITALS SNAPSHOT */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Latest Health Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-bold block">Blood Pressure</span>
                  <span className="text-xl font-extrabold text-slate-800">{data.vitals.bp.systolic}/{data.vitals.bp.diastolic}</span>
                  <span className="text-[10px] block text-emerald-600 font-bold mt-1">mmHg</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-bold block">Blood Sugar</span>
                  <span className="text-xl font-extrabold text-slate-800">{data.vitals.sugar.value}</span>
                  <span className="text-[10px] block text-slate-500 font-bold mt-1">mg/dL (Fasting)</span>
                </div>
              </div>
            </div>

            {/* EMERGENCY SOS */}
            <div className="bg-rose-50 border-2 border-rose-200 p-5 rounded-3xl text-center">
              <button 
                onClick={() => alert(`🚨 EMERGENCY SOS DISPATCHED!\nContacting Caregiver: ${data.patient.emergencyContact}`)}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-lg rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <PhoneCall className="h-6 w-6" />
                <span>Trigger Emergency SOS Alert</span>
              </button>
            </div>

          </div>
        )}

        {/* 👨‍👩‍👧 MODE 2: FAMILY / CAREGIVER DASHBOARD */}
        {activeTab === "family" && (
          <div className="space-y-6">

            {/* PATIENT HEADER SUMMARY */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-100 text-indigo-700 p-4 rounded-2xl font-black text-xl">
                  👵
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{data.patient.name}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {data.patient.location} • Age {data.patient.age}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                  data.patient.status === "NORMAL" 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                  {data.patient.status === "NORMAL" ? "● Routine Normal" : "⚠️ Anomaly Detected"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ROUTINE CHECK-IN TIMELINE */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Clock className="h-5 w-5 text-indigo-500" />
                  Routine Check-in Timeline
                </h3>
                <div className="space-y-4 border-l-2 border-slate-200 pl-4">
                  {data.checkIns.map(c => (
                    <div key={c.id} className="relative">
                      <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                        c.status === "completed" ? "bg-emerald-500" : "bg-slate-300"
                      }`} />
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          c.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Expected: {c.expectedTime} {c.timestamp ? `• Logged: ${c.timestamp}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ANOMALY ENGINE & ESCALATION */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Shield className="h-5 w-5 text-rose-500" />
                  Anomaly Engine & Alerts
                </h3>
                
                <div className="space-y-3">
                  {data.anomalies.map(a => (
                    <div key={a.id} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold text-amber-900">
                        <span>{a.title}</span>
                        <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded">{a.severity}</span>
                      </div>
                      <p className="text-amber-800">{a.note}</p>
                      <p className="text-[10px] text-amber-600">{a.timestamp}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block mb-2">Escalation Protocol Sequence:</span>
                  <ul className="text-xs space-y-1.5 text-slate-500">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"/> +0m: {data.escalationRules.firstAlert}</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"/> +60m: {data.escalationRules.secondAlert}</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"/> +120m: {data.escalationRules.thirdAlert}</li>
                  </ul>
                </div>
              </div>

              {/* VITALS GRID & APPOINTMENTS */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    Vitals Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Blood Pressure</span>
                      <p className="text-base font-bold text-slate-800">{data.vitals.bp.systolic}/{data.vitals.bp.diastolic}</p>
                      <span className="text-[10px] text-slate-500">{data.vitals.bp.status}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Sugar Level</span>
                      <p className="text-base font-bold text-slate-800">{data.vitals.sugar.value} mg/dL</p>
                      <span className="text-[10px] text-slate-500">Fasting</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Upcoming Appointments
                  </h3>
                  {data.appointments.map(app => (
                    <div key={app.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-slate-800">{app.doctor} ({app.specialty})</p>
                      <p className="text-slate-500">{app.date} at {app.time}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 🩺 MODE 3: DOCTOR / CLINICAL VIEW */}
        {activeTab === "doctor" && (
          <div className="space-y-6">

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Clinical Health Profile</h2>
                <p className="text-xs text-slate-500">Patient: {data.patient.name} (78 Yrs, Female)</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200 font-semibold">
                  Medication Adherence: 88%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* VITALS TREND LOG TABLE */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Vitals Telemetry Trends
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">BP (mmHg)</th>
                        <th className="p-3 font-semibold">Blood Sugar</th>
                        <th className="p-3 font-semibold">Body Temp</th>
                        <th className="p-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.vitalsHistory.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3 font-medium text-slate-800">{row.date}</td>
                          <td className="p-3 font-bold text-slate-800">{row.bp}</td>
                          <td className="p-3 text-slate-600">{row.sugar} mg/dL</td>
                          <td className="p-3 text-slate-600">{row.temp} °F</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status === "CRITICAL" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CLINICAL NOTES ENTRY */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Physician Notes
                </h3>

                <form onSubmit={handleAddDoctorNote} className="space-y-3">
                  <textarea
                    rows={3}
                    value={newClinicalNote}
                    onChange={(e) => setNewClinicalNote(e.target.value)}
                    placeholder="Enter observation notes, dosage adjustments..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Save Clinical Note
                  </button>
                </form>

                <div className="space-y-3 pt-2">
                  {data.clinicalNotes.map(note => (
                    <div key={note.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span>{note.doctor}</span>
                        <span>{note.date}</span>
                      </div>
                      <p className="text-slate-700 italic">"{note.note}"</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* REST API TELEMETRY INSPECTOR MODAL */}
      {showApiModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-sky-400" />
                <h3 className="font-mono text-sm font-bold text-sky-400">REST API Telemetry Inspector</h3>
              </div>
              <button onClick={() => setShowApiModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {latestApiCall ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-extrabold">{latestApiCall.method}</span>
                    <span className="text-slate-200">{latestApiCall.endpoint}</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    HTTP {latestApiCall.status} OK
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Request Payload:</span>
                  <pre className="bg-slate-950 p-3 rounded-lg text-amber-300 text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(latestApiCall.payload, null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Response JSON:</span>
                  <pre className="bg-slate-950 p-3 rounded-lg text-emerald-300 text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(latestApiCall.response, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center font-mono">No API calls captured in session yet.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}