import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../firebase/authService";
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  LogIn, 
  AlertCircle,
  Loader2,
  BookOpen,
  Users,
  Award
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      const userData = await loginUser(email, password);
      
      // Redirect based on role
      if (userData.role === "admin") {
        navigate("/admin");
      } else if (userData.role === "student") {
        navigate("/student");
      } else if (userData.role === "teacher") {
        navigate("/teacher");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format");
      } else {
        setError(err.message || "Failed to login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            {/* Animated Logo */}
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-linear-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-transform duration-300">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              {/* Floating icons */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-linear-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg animate-bounce">
                <Award className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              School Management
            </h1>
            <p className="text-indigo-200 text-sm">
              Your gateway to academic excellence
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex justify-center gap-3 mb-8">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs text-indigo-200">
              <BookOpen className="w-3 h-3" />
              <span>Courses</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs text-indigo-200">
              <Users className="w-3 h-3" />
              <span>Students</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs text-indigo-200">
              <Award className="w-3 h-3" />
              <span>Grades</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur border border-red-500/30 rounded-xl flex items-center gap-3 text-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-indigo-200 ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-indigo-300" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 backdrop-blur"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-indigo-200 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-indigo-300" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 backdrop-blur"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-indigo-300/70 text-sm">
              Need access? Contact your administrator
            </p>
          </div>
        </div>

        {/* Bottom branding */}
        <p className="text-center text-indigo-300/50 text-xs mt-6">
          © 2024 School Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
