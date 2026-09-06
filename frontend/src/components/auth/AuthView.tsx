import React, { useState, useMemo } from 'react';
import {
  Shield,
  Mail,
  UserCheck,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Camera,
  Check,
  X,
  Upload
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const AuthView: React.FC = () => {
  const { loginWithCredentials, registerNewUser, verifyEmailCode, allVeterans } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'verify'>('login');
  const [role, setRole] = useState<UserRole>('veteran');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rank, setRank] = useState('');
  const [unit, setUnit] = useState('');
  const [serviceBranch, setServiceBranch] = useState('Indian Army');
  const [title, setTitle] = useState('');
  const [specialization, setSpecialization] = useState('Combat PTSD & Trauma Recovery');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Status & Errors
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // OTP Verification state
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['1', '2', '3', '4', '5', '6']);
  const [otpError, setOtpError] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Password Strength Evaluation
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.minLength) score += 1;
    if (passwordCriteria.hasNumber) score += 1;
    if (passwordCriteria.hasSpecial) score += 1;
    return score;
  }, [passwordCriteria]);

  const passwordStrengthLabel = useMemo(() => {
    if (password.length === 0) return { label: '', color: 'bg-gray-200', text: 'text-gray-400' };
    if (passwordScore === 3) return { label: 'Strong Password', color: 'bg-emerald-500', text: 'text-emerald-700' };
    if (passwordScore === 2) return { label: 'Moderate Password', color: 'bg-amber-500', text: 'text-amber-700' };
    return { label: 'Weak (criteria missing)', color: 'bg-rose-500', text: 'text-rose-700' };
  }, [password, passwordScore]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAuthError('Image size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) {
      setAuthError('Please enter both your registered email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithCredentials(email, role, password);
      if (res && res.error) {
        setAuthError(res.error);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password || !name) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    if (passwordScore < 3) {
      setAuthError('Password must be at least 8 characters and contain at least 1 number and 1 special character.');
      return;
    }

    if (role === 'counselor') {
      registerNewUser({
        name,
        role: 'counselor',
        email,
        password,
        title: title || 'Licensed Clinical Counselor',
        specialization: specialization || 'Combat PTSD & Trauma Recovery',
        institution: institution || 'Amrita Health Care & Rehabilitation',
        phone: phone || '+91 98765 43210',
        rank: 'Clinical Specialist',
        avatarUrl: avatarUrl || undefined,
      });
    } else {
      registerNewUser({
        name,
        rank: rank || 'Veteran Soldier',
        unit: unit || 'Infantry Division',
        serviceBranch,
        email,
        password,
        role: 'veteran',
        avatarUrl: avatarUrl || undefined,
      });
    }

    setPendingEmail(email);
    setAuthMode('verify');
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpCode.join('');
    if (fullCode.length !== 6) {
      setOtpError('Please enter a 6-digit verification code.');
      return;
    }

    const success = verifyEmailCode(pendingEmail || email, fullCode);
    if (!success) {
      setOtpError('Invalid code. Please try 123456');
    }
  };

  const handleQuickDemoLogin = (vetId: string) => {
    const found = allVeterans.find(v => v.user.id === vetId);
    if (found) {
      loginWithCredentials(found.user.email, 'veteran', 'Valor@2026');
    }
  };

  const handleCounselorDemoLogin = () => {
    loginWithCredentials('a.nair@amrita-health.org', 'counselor', 'Doctor@2026');
  };

  return (
    <div className="min-h-[calc(100vh-61px)] flex items-center justify-center p-4 relative overflow-hidden bg-[#FDF6EE]">
      {/* Background Nude Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F7DFCC]/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel border border-[#E8DCCE] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl z-10 relative bg-white">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#1C1917] flex items-center justify-center text-white mx-auto shadow-warm">
            <Shield className="w-7 h-7 stroke-[2.2] text-[#D96B27]" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-[#1C1917] tracking-wider">VALOR PLATFORM</h1>
          <p className="text-xs text-[#786F68]">Secure Authentication & Clinical Access Control</p>
        </div>

        {/* Error Notice */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{authError}</div>
          </div>
        )}

        {/* Auth Mode Toggle (Login vs Register) */}
        {authMode !== 'verify' && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#FDF6EE] border border-[#E8DCCE] text-xs font-bold">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'login' ? 'bg-[#1C1917] text-white shadow-warm' : 'text-[#786F68] hover:text-[#1C1917]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'signup' ? 'bg-[#1C1917] text-white shadow-warm' : 'text-[#786F68] hover:text-[#1C1917]'
              }`}
            >
              Register Account
            </button>
          </div>
        )}

        {/* ROLE SELECTION BAR */}
        {authMode !== 'verify' && (
          <div className="space-y-1.5">
            <label className="label-overline text-[10px] text-[#786F68] block">
              I am signing in as:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRole('veteran')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                  role === 'veteran'
                    ? 'bg-[#F7DFCC] border-[#D96B27] text-[#8C4A1E] shadow-sm'
                    : 'bg-[#FDF6EE] border-[#E8DCCE] text-[#786F68]'
                }`}
              >
                <UserCheck className="w-4 h-4 text-[#D96B27]" /> Veteran
              </button>

              <button
                type="button"
                onClick={() => setRole('counselor')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                  role === 'counselor'
                    ? 'bg-[#F7DFCC] border-[#D96B27] text-[#8C4A1E] shadow-sm'
                    : 'bg-[#FDF6EE] border-[#E8DCCE] text-[#786F68]'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-[#D96B27]" /> Counselor
              </button>
            </div>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1C1917] block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#786F68] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={role === 'veteran' ? 'vikram.rathore@army.gov.in' : 'a.nair@amrita-health.org'}
                  className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1C1917] block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#786F68] absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] text-white font-extrabold text-xs shadow-rust flex items-center justify-center gap-2 transition-all font-heading tracking-wider disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Authenticate & Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. REGISTRATION / SIGNUP FORM */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5">
            {/* Optional Avatar Upload */}
            <div className="flex items-center gap-3 p-3 bg-[#FDF6EE] rounded-2xl border border-[#E8DCCE]">
              <div className="relative group shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-[#D96B27]" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#E8DCCE] flex items-center justify-center text-[#786F68]">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-xs font-bold text-[#1C1917] block">Profile Picture (Optional)</label>
                <div className="flex items-center gap-2 mt-1">
                  <label className="px-2.5 py-1 rounded-lg bg-white border border-[#E8DCCE] hover:border-[#D96B27] text-[11px] font-bold text-[#8C4A1E] cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1C1917] block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={role === 'counselor' ? 'e.g. Dr. Sneha Patel, MD' : 'e.g. Major Vikramaditya Rathore'}
                className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                required
              />
            </div>

            {role === 'counselor' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1917] block">Title / Credentials</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Clinical Psychologist, PhD"
                      className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1917] block">Institution / Hospital</label>
                    <input
                      type="text"
                      value={institution}
                      onChange={e => setInstitution(e.target.value)}
                      placeholder="e.g. Amrita Medical Command"
                      className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1917] block">Clinical Specialization</label>
                  <select
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                  >
                    <option value="Combat PTSD & Trauma Recovery">Combat PTSD & Trauma Recovery</option>
                    <option value="Cognitive Behavioral Therapy (CBT)">Cognitive Behavioral Therapy (CBT)</option>
                    <option value="Somatic & Nervous System Grounding">Somatic & Nervous System Grounding</option>
                    <option value="Sleep Architecture & Stress De-escalation">Sleep Architecture & Stress De-escalation</option>
                    <option value="Veteran Peer Reintegration & Family Support">Veteran Peer Reintegration & Family Support</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1917] block">Rank / Designation</label>
                  <input
                    type="text"
                    value={rank}
                    onChange={e => setRank(e.target.value)}
                    placeholder="e.g. Major / Subedar"
                    className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1917] block">Branch</label>
                  <select
                    value={serviceBranch}
                    onChange={e => setServiceBranch(e.target.value)}
                    className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                  >
                    <option value="Indian Army">Indian Army</option>
                    <option value="Indian Navy">Indian Navy</option>
                    <option value="Indian Air Force">Indian Air Force</option>
                    <option value="Paramilitary (CRPF/BSF/ITBP)">Paramilitary</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1C1917] block">Email Address (For Verification)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="veteran@domain.org"
                className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                required
              />
            </div>

            {/* Password Creation with Strength Meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1C1917]">Create Strong Password</label>
                {password.length > 0 && (
                  <span className={`text-[10px] font-extrabold ${passwordStrengthLabel.text}`}>
                    {passwordStrengthLabel.label}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-[#FDF6EE] border border-[#E8DCCE] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#D96B27]"
                required
              />

              {/* Strength Progress Bar */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                <div className={`h-1.5 rounded-full transition-all ${passwordScore >= 1 ? passwordStrengthLabel.color : 'bg-gray-200'}`} />
                <div className={`h-1.5 rounded-full transition-all ${passwordScore >= 2 ? passwordStrengthLabel.color : 'bg-gray-200'}`} />
                <div className={`h-1.5 rounded-full transition-all ${passwordScore >= 3 ? passwordStrengthLabel.color : 'bg-gray-200'}`} />
              </div>

              {/* Password Criteria Live Indicators */}
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                  {passwordCriteria.minLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-[#786F68] shrink-0" />
                  )}
                  <span className={passwordCriteria.minLength ? 'text-emerald-700 font-bold' : 'text-[#786F68]'}>
                    Minimum 8 characters
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px]">
                  {passwordCriteria.hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-[#786F68] shrink-0" />
                  )}
                  <span className={passwordCriteria.hasNumber ? 'text-emerald-700 font-bold' : 'text-[#786F68]'}>
                    At least one Number (0-9)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px]">
                  {passwordCriteria.hasSpecial ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-[#786F68] shrink-0" />
                  )}
                  <span className={passwordCriteria.hasSpecial ? 'text-emerald-700 font-bold' : 'text-[#786F68]'}>
                    At least one Special Character (!@#$%^&*)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] text-white font-extrabold text-xs shadow-rust flex items-center justify-center gap-2 transition-all font-heading tracking-wider mt-2"
            >
              <span>Send Email Verification Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 3. EMAIL VERIFICATION STEP */}
        {authMode === 'verify' && (
          <form onSubmit={handleVerifyOTP} className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-[#FDF2E9] border border-[#F7DFCC] text-center space-y-1">
              <Mail className="w-8 h-8 text-[#D96B27] mx-auto" />
              <h3 className="font-heading font-bold text-xl text-[#1C1917]">Verify Your Email Address</h3>
              <p className="text-xs text-[#786F68]">
                A 6-digit code was sent to: <strong className="text-[#8C4A1E] font-mono">{pendingEmail || email}</strong>
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {otpError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1C1917] block text-center">
                Enter 6-Digit Code (Demo Code: 123456)
              </label>
              <div className="flex items-center justify-center gap-2">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => {
                      const newCode = [...otpCode];
                      newCode[index] = e.target.value;
                      setOtpCode(newCode);
                    }}
                    className="w-10 h-12 rounded-xl bg-[#FDF6EE] border border-[#E8DCCE] text-center font-mono font-extrabold text-xl text-[#D96B27] focus:border-[#D96B27] focus:outline-none shadow-sm"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-[#786F68] hover:underline"
              >
                ← Back to Edit Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResending(true);
                  setTimeout(() => setIsResending(false), 1500);
                }}
                className="text-[#D96B27] font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} /> Resend Code
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] text-white font-extrabold text-xs shadow-rust flex items-center justify-center gap-2 font-heading tracking-wider"
            >
              <CheckCircle2 className="w-5 h-5" /> Verify Email & Launch Profile
            </button>
          </form>
        )}

        {/* DEMO QUICK LOGIN SELECTOR FOR JUDGES */}
        <div className="pt-4 border-t border-[#E8DCCE] space-y-2">
          <div className="label-overline text-[10px] text-center">
            SIH 2026 Verified Demo Credentials
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemoLogin('vet-01')}
              className="p-2.5 rounded-xl bg-[#FDF6EE] hover:bg-white border border-[#E8DCCE] text-[#1C1917] text-left font-bold flex items-center justify-between shadow-sm transition-all"
            >
              <span>Col. Rajesh (Stable)</span>
              <span className="text-[9px] text-[#D96B27] font-mono">🟢 Veteran</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('vet-03')}
              className="p-2.5 rounded-xl bg-[#FDF6EE] hover:bg-white border border-[#E8DCCE] text-[#1C1917] text-left font-bold flex items-center justify-between shadow-sm transition-all"
            >
              <span>WO Vikram (Urgent)</span>
              <span className="text-[9px] text-rose-600 font-mono">🔴 Veteran</span>
            </button>
          </div>

          <button
            onClick={handleCounselorDemoLogin}
            className="w-full p-2.5 rounded-xl bg-[#1C1917] hover:bg-black text-white text-center font-bold text-xs flex items-center justify-center gap-1.5 shadow-warm font-heading tracking-wider transition-all"
          >
            <Stethoscope className="w-4 h-4 text-[#D96B27]" /> Log In as Dr. Ananya Nair (Counselor)
          </button>
        </div>
      </div>
    </div>
  );
};
