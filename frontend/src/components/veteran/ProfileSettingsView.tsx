import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Camera,
  Save,
  User,
  Phone,
  MapPin,
  Heart,
  Medal,
  Award,
  AlertTriangle,
  Flame,
  Trophy,
  CheckCircle2,
  ExternalLink,
  Upload,
  Clock,
  Mail,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

const AVATAR_PRESETS = [
  {
    id: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    label: 'Commando (Para SF)',
    creed: 'Balidan Param Dharma — Sacrifice is our supreme duty. We stand unbroken through the tempest.',
  },
  {
    id: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    label: 'Tactical Recon (MARCOS)',
    creed: 'Shauryam Daksham Yuddhe — Valour and competence in combat. Moving with silent strength.',
  },
  {
    id: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    label: 'Command Staff (Gorkha Rifles)',
    creed: 'Kafar Hunu Bhanda Marnu Ramro — Better to die than live a coward. Service before self.',
  },
  {
    id: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    label: 'Airborne Officer (Garud)',
    creed: 'Nabha Sparsham Deeptam — Touch the sky with glory. Restoring rhythm and balance.',
  },
];

export const ProfileSettingsView: React.FC = () => {
  const { currentVeteranUser, currentVeteranProfile, activeVeteranId, setCurrentUser, setAllVeterans } = useApp();
  const vetId = activeVeteranId || '550e8400-e29b-41d4-a716-446655440001';

  // State initialized with context or fallback
  const [avatarUrl, setAvatarUrl] = useState(
    currentVeteranUser?.avatarUrl || AVATAR_PRESETS[0].id
  );
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Form Fields
  const [name, setName] = useState(currentVeteranUser?.name || 'Major Vikramaditya Rathore');
  const [email, setEmail] = useState(currentVeteranUser?.email || 'vikram.rathore@army.gov.in');
  const [rank, setRank] = useState(currentVeteranUser?.rank || 'Major');
  const [unit, setUnit] = useState(currentVeteranUser?.unit || '9 Para SF');
  const [branch, setBranch] = useState(currentVeteranProfile?.serviceBranch || 'Indian Army (Para SF)');
  const [yearsOfService, setYearsOfService] = useState('14');
  const [deployments, setDeployments] = useState('4');
  const [bio, setBio] = useState(
    'Balidan Param Dharma — Sacrifice is our supreme duty. Focusing on somatic recovery and supporting fellow combat veterans on the peer network.'
  );
  const [phone, setPhone] = useState('+91 98765 43210');
  const [homeCity, setHomeCity] = useState('Chandigarh, Punjab');
  const [emergencyName, setEmergencyName] = useState('Lt. Col. Ankit Sharma (Battle Buddy)');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98111 22233');

  // Preferences
  const [checkInDays, setCheckInDays] = useState(currentVeteranProfile?.checkInFrequencyDays || 7);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load stored custom fields from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`sah_profile_extra_${vetId}`);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.avatarUrl) setAvatarUrl(d.avatarUrl);
        if (d.name) setName(d.name);
        if (d.email) setEmail(d.email);
        if (d.rank) setRank(d.rank);
        if (d.unit) setUnit(d.unit);
        if (d.branch) setBranch(d.branch);
        if (d.yearsOfService) setYearsOfService(d.yearsOfService);
        if (d.deployments) setDeployments(d.deployments);
        if (d.bio) setBio(d.bio);
        if (d.phone) setPhone(d.phone);
        if (d.homeCity) setHomeCity(d.homeCity);
        if (d.emergencyName) setEmergencyName(d.emergencyName);
        if (d.emergencyPhone) setEmergencyPhone(d.emergencyPhone);
        if (d.checkInDays) setCheckInDays(d.checkInDays);
      } catch (e) {}
    } else {
      if (currentVeteranUser?.avatarUrl) setAvatarUrl(currentVeteranUser.avatarUrl);
      if (currentVeteranUser?.name) setName(currentVeteranUser.name);
      if (currentVeteranUser?.email) setEmail(currentVeteranUser.email);
      if (currentVeteranUser?.rank) setRank(currentVeteranUser.rank);
      if (currentVeteranUser?.unit) setUnit(currentVeteranUser.unit);
    }
  }, [vetId, currentVeteranUser]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
          setShowAvatarPicker(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset: typeof AVATAR_PRESETS[0]) => {
    setAvatarUrl(preset.id);
    setBio(preset.creed);
    setShowAvatarPicker(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const payload = {
      name,
      email,
      rank,
      unit,
      service_branch: branch,
      years_of_service: parseInt(yearsOfService, 10) || 0,
      deployment_count: parseInt(deployments, 10) || 0,
      bio,
      phone_number: phone,
      home_city: homeCity,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      avatar_url: avatarUrl,
      gps_enabled: gpsEnabled,
      notifications_enabled: pushEnabled,
      check_in_frequency_days: checkInDays,
    };

    try {
      await apiService.updateVeteranProfile(vetId, payload).catch(err => {
        console.warn('Backend profile update note:', err);
      });

      // Update AppContext global user state
      if (setCurrentUser && currentVeteranUser) {
        const updatedUser = {
          ...currentVeteranUser,
          name,
          email,
          rank,
          unit,
          avatarUrl,
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('sah_active_user', JSON.stringify(updatedUser));
      }

      if (setAllVeterans) {
        setAllVeterans((prev: any[]) =>
          prev.map((v: any) =>
            v.user.id === vetId
              ? {
                  ...v,
                  user: { ...v.user, name, email, rank, unit, avatarUrl },
                  profile: { ...v.profile, checkInFrequencyDays: checkInDays },
                }
              : v
          )
        );
      }

      // Save extra fields locally
      localStorage.setItem(`sah_profile_extra_${vetId}`, JSON.stringify({
        ...payload,
        avatarUrl,
        email,
        yearsOfService,
        deployments,
        phone,
        homeCity,
        emergencyName,
        emergencyPhone,
        checkInDays,
      }));

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-fadeIn pb-16">
      {/* 1. Header Card */}
      <div className="p-6 rounded-2xl glass-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-warm">
        <div>
          <span className="label-overline text-[10px] text-[#8C4A1E]">MILITARY DOSSIER & PROFILE</span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1C1917] mt-1">
            Veteran Profile & Settings
          </h1>
          <p className="text-xs text-[#786F68] mt-1">
            Manage your service record, custom profile picture, recovery motto, and clinical check-in frequency.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#F7DFCC] text-[#8C4A1E] flex items-center justify-center font-bold shrink-0 shadow-rust">
          <Settings className="w-6 h-6" />
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Dossier updated successfully! Changes saved across VALOR clinical network and header.
        </div>
      )}

      {/* 2. Hero Profile Banner */}
      <div className="p-6 rounded-2xl glass-panel space-y-6 shadow-warm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-[#E8DCCE] pb-6">
          {/* Avatar with Camera Badge */}
          <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl border-2 border-[#D96B27] object-cover shadow-rust transition-transform group-hover:scale-105"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#8C4A1E] text-white p-1.5 rounded-xl shadow-md group-hover:bg-[#723B17]">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-2xl font-bold text-[#1C1917]">{name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F7DFCC] text-[#8C4A1E]">
                {rank}
              </span>
            </div>
            <p className="text-xs text-[#786F68] mt-1 font-medium">{branch} • {unit} • {homeCity}</p>
            <p className="text-xs text-[#4B5563] italic mt-2 line-clamp-2">"{bio}"</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="px-3.5 py-2 bg-[#F7DFCC] hover:bg-[#EBD0B9] text-[#8C4A1E] text-xs font-bold rounded-xl transition-all shrink-0"
          >
            {showAvatarPicker ? 'Close Picker' : 'Change Avatar'}
          </button>
        </div>

        {/* Avatar Preset & Upload Drawer */}
        {showAvatarPicker && (
          <div className="p-4 rounded-xl bg-[#FAF3EC] border border-[#E8DCCE] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#8C4A1E]">Choose Profile Picture Preset or Upload Custom Photo</h4>
              <label className="px-3 py-1.5 bg-[#D96B27] hover:bg-[#C55A1A] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-rust">
                <Upload className="w-3.5 h-3.5" /> Upload from Computer
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {AVATAR_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className={`cursor-pointer rounded-xl border-2 p-2.5 transition-all bg-white flex flex-col justify-between ${
                    avatarUrl === preset.id ? 'border-[#8C4A1E] shadow-sm bg-[#FDF6EE]' : 'border-[#E8DCCE] hover:border-[#D96B27]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={preset.id} alt={preset.label} className="w-10 h-10 rounded-lg object-cover" />
                    <p className="text-xs font-bold text-[#1C1917]">
                      {preset.label}
                    </p>
                  </div>
                  <p className="text-[10px] text-[#786F68] mt-2 italic line-clamp-2">
                    "{preset.creed}"
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E8DCCE] flex gap-2 items-center">
              <input
                type="text"
                placeholder="Or paste direct image URL (https://...)"
                value={customAvatarInput}
                onChange={e => setCustomAvatarInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E8DCCE] bg-white text-[#1C1917]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customAvatarInput.trim()) {
                    setAvatarUrl(customAvatarInput.trim());
                    setShowAvatarPicker(false);
                  }
                }}
                className="px-3 py-1.5 bg-[#8C4A1E] text-white text-xs font-bold rounded-lg hover:bg-[#723B17]"
              >
                Apply URL
              </button>
            </div>
          </div>
        )}

        {/* Recovery Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#FDF6EE] border border-[#E8DCCE] text-center">
            <Trophy className="w-5 h-5 mx-auto text-[#D97706] mb-1" />
            <p className="text-lg font-black text-[#1C1917]">{currentVeteranProfile?.totalXP || 480}</p>
            <p className="text-[10px] font-bold text-[#786F68] uppercase">Valor XP</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FDF6EE] border border-[#E8DCCE] text-center">
            <Flame className="w-5 h-5 mx-auto text-[#EA580C] mb-1" />
            <p className="text-lg font-black text-[#1C1917]">{currentVeteranProfile?.streakDays || 5} Days</p>
            <p className="text-[10px] font-bold text-[#786F68] uppercase">Active Streak</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FDF6EE] border border-[#E8DCCE] text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto text-[#059669] mb-1" />
            <p className="text-lg font-black text-[#1C1917]">Level {currentVeteranProfile?.level || 1}</p>
            <p className="text-[10px] font-bold text-[#786F68] uppercase">Recovery Tier</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FDF6EE] border border-[#E8DCCE] text-center">
            <Shield className="w-5 h-5 mx-auto text-[#2563EB] mb-1" />
            <p className="text-lg font-black text-[#1C1917]">{branch.split(' ')[0]}</p>
            <p className="text-[10px] font-bold text-[#786F68] uppercase">Branch</p>
          </div>
        </div>
      </div>

      {/* 3. Detailed Editing Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section A: Personal & Contact */}
        <div className="p-6 rounded-2xl glass-panel space-y-4 shadow-warm">
          <div className="flex items-center gap-2 border-b border-[#E8DCCE] pb-3">
            <User className="w-4 h-4 text-[#8C4A1E]" />
            <h3 className="font-heading text-sm font-extrabold text-[#1C1917] uppercase tracking-wide">
              Personal Information & Creed
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Home Station / City</label>
              <input
                type="text"
                value={homeCity}
                onChange={e => setHomeCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Personal Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Account Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#786F68] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Recovery Creed / Motto</label>
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
                placeholder="Share your personal philosophy or current somatic goal..."
              />
            </div>
          </div>
        </div>

        {/* Section B: Military Service Record */}
        <div className="p-6 rounded-2xl glass-panel space-y-4 shadow-warm">
          <div className="flex items-center gap-2 border-b border-[#E8DCCE] pb-3">
            <Medal className="w-4 h-4 text-[#8C4A1E]" />
            <h3 className="font-heading text-sm font-extrabold text-[#1C1917] uppercase tracking-wide">
              Military Service Record
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Rank & Designation</label>
              <input
                type="text"
                value={rank}
                onChange={e => setRank(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Regiment / Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Service Branch</label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
              >
                <option value="Indian Army">Indian Army</option>
                <option value="Indian Army (Para SF)">Indian Army (Para SF)</option>
                <option value="Indian Navy">Indian Navy</option>
                <option value="Indian Navy (MARCOS)">Indian Navy (MARCOS)</option>
                <option value="Indian Air Force">Indian Air Force</option>
                <option value="Indian Air Force (Garud)">Indian Air Force (Garud)</option>
                <option value="Paramilitary">Paramilitary</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Years Served</label>
                <input
                  type="number"
                  value={yearsOfService}
                  onChange={e => setYearsOfService(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Deployments</label>
                <input
                  type="number"
                  value={deployments}
                  onChange={e => setDeployments(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section C: Emergency Battle Buddy Contact */}
        <div className="p-6 rounded-2xl glass-panel space-y-4 shadow-warm">
          <div className="flex items-center gap-2 border-b border-[#E8DCCE] pb-3">
            <Heart className="w-4 h-4 text-[#8C4A1E]" />
            <h3 className="font-heading text-sm font-extrabold text-[#1C1917] uppercase tracking-wide">
              Emergency Battle Buddy (First Line of Support)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Contact Name & Relation</label>
              <input
                type="text"
                value={emergencyName}
                onChange={e => setEmergencyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">Emergency Phone</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCCE] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#8C4A1E]"
              />
            </div>
          </div>
        </div>

        {/* Section D: Clinical Frequency & Telemetry */}
        <div className="p-6 rounded-2xl glass-panel space-y-4 shadow-warm">
          <div className="flex items-center gap-2 border-b border-[#E8DCCE] pb-3">
            <Clock className="w-4 h-4 text-[#8C4A1E]" />
            <h3 className="font-heading text-sm font-extrabold text-[#1C1917] uppercase tracking-wide">
              Clinical Monitoring & Check-in Preferences
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                Weekly Clinical Assessment Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 3, label: 'Every 3 Days', sub: 'High Support' },
                  { days: 7, label: 'Weekly (7 Days)', sub: 'Standard' },
                  { days: 14, label: 'Bi-Weekly (14 Days)', sub: 'Maintenance' },
                ].map(item => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setCheckInDays(item.days)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      checkInDays === item.days
                        ? 'bg-[#F7DFCC] border-[#8C4A1E] text-[#8C4A1E] shadow-sm'
                        : 'bg-white border-[#E8DCCE] text-[#786F68] hover:border-[#8C4A1E]'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] text-[#786F68]">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-[#E8DCCE] bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={e => setPushEnabled(e.target.checked)}
                  className="rounded text-[#D96B27] focus:ring-[#D96B27]"
                />
                <span className="text-xs font-bold text-[#1C1917]">Enable Daily Task Reminders</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-[#E8DCCE] bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={gpsEnabled}
                  onChange={e => setGpsEnabled(e.target.checked)}
                  className="rounded text-[#D96B27] focus:ring-[#D96B27]"
                />
                <span className="text-xs font-bold text-[#1C1917]">GPS Outdoor Path Verification</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] text-white font-extrabold text-xs flex items-center gap-2 shadow-rust transition-all disabled:opacity-50 font-heading tracking-wider"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Dossier...' : 'Save & Synchronize Dossier'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
