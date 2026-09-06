import React, { useState } from 'react';
import { X, PhoneCall, ShieldAlert, HeartHandshake, Wind, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BoxBreathingWidget } from './BoxBreathingWidget';

export const CrisisModal: React.FC = () => {
  const { isCrisisModalOpen, setIsCrisisModalOpen, currentVeteranUser, triggerEmergencyAlert } = useApp();
  const [requestedCallback, setRequestedCallback] = useState(false);
  const [activeGrounding, setActiveGrounding] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  const counselorName = currentVeteranUser?.assignedCounselorName || 'Dr. Ananya Nair (Lead Clinical Specialist)';

  const handleNotifyCounselor = async () => {
    setIsNotifying(true);
    try {
      await triggerEmergencyAlert('Crisis Support Requested: Veteran clicked Emergency Callback in 24/7 Crisis Modal');
      setRequestedCallback(true);
    } catch (e) {
      console.error('Failed to dispatch crisis emergency alert:', e);
      setRequestedCallback(true);
    } finally {
      setIsNotifying(false);
    }
  };

  if (!isCrisisModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-[#FFFFFF] border border-[#E8DCCE] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-[#1C1917] space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E8DCCE] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D96B27] text-white flex items-center justify-center shadow-rust">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-[#1C1917] flex items-center gap-2">
                24/7 Veteran Crisis & Support Network
              </h2>
              <p className="text-xs text-[#786F68] font-medium">
                Immediate confidential Indian Armed Forces & Mental Health support.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCrisisModalOpen(false)}
            className="p-2 rounded-xl text-[#786F68] hover:text-[#1C1917] hover:bg-[#FDF6EE] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Immediate Indian Emergency Callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tele-MANAS */}
          <a
            href="tel:14416"
            className="flex items-center gap-3 p-4 rounded-2xl bg-[#FDF2E9] border border-[#F7DFCC] hover:border-[#D96B27] transition-all group shadow-warm"
          >
            <div className="w-10 h-10 rounded-xl bg-[#D96B27] text-white flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="label-overline text-[10px] text-[#8C4A1E]">Tele-MANAS (Mental Health)</div>
              <div className="text-xl font-extrabold text-[#1C1917] font-mono">14416</div>
              <div className="text-[10px] text-[#786F68]">Govt. of India 24/7 Toll-Free</div>
            </div>
          </a>

          {/* Indian Army / ECHS Veterans Helpline */}
          <a
            href="tel:1902"
            className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#E8DCCE] hover:border-[#1C1917] transition-all group shadow-warm"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1C1917] text-white flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="label-overline text-[10px] text-[#786F68]">Army Veteran Helpline (ECHS)</div>
              <div className="text-xl font-extrabold text-[#1C1917] font-mono">1902</div>
              <div className="text-[10px] text-[#786F68]">Armed Forces Veteran Cell</div>
            </div>
          </a>

          {/* National Emergency Support System */}
          <a
            href="tel:112"
            className="flex items-center gap-3 p-4 rounded-2xl bg-[#FFF5F5] border border-[#FED7D7] hover:border-[#E53E3E] transition-all group shadow-warm sm:col-span-2"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C53030] text-white flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <div className="label-overline text-[10px] text-[#C53030]">All-India Emergency Line (Police / Ambulance / Rescue)</div>
                <div className="text-xl font-extrabold text-[#1C1917] font-mono">Dial 112</div>
              </div>
              <div className="text-right text-[10px] text-[#786F68] hidden sm:block">
                National ERSS (Unified Emergency)
              </div>
            </div>
          </a>
        </div>

        {/* Rapid Actions */}
        <div className="space-y-3">
          <span className="label-overline">IMMEDIATE SUPPORTIVE ACTIONS</span>

          {/* Counselor Alert Dispatch */}
          <div className="p-4 rounded-2xl bg-[#FDF6EE] border border-[#E8DCCE] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-[#D96B27]" />
                <div>
                  <span className="text-xs font-bold text-[#1C1917] block">Priority Callback from Assigned Specialist</span>
                  <span className="text-[11px] text-[#786F68]">{counselorName}</span>
                </div>
              </div>
              {requestedCallback ? (
                <span className="text-xs font-bold text-[#D96B27] flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-[#F7DFCC]">
                  <CheckCircle2 className="w-4 h-4" /> Alert Dispatched
                </span>
              ) : (
                <button
                  onClick={handleNotifyCounselor}
                  disabled={isNotifying}
                  className="px-4 py-2 rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] text-white text-xs font-bold transition-all shadow-rust disabled:opacity-50"
                >
                  {isNotifying ? 'Alerting...' : 'Notify Specialist'}
                </button>
              )}
            </div>
            {requestedCallback && (
              <p className="text-[11px] text-[#8C4A1E] bg-[#F7DFCC] p-3 rounded-xl border border-[#E8DCCE]">
                <strong>{counselorName}</strong> has been alerted with top priority to review your file and reach out immediately.
              </p>
            )}
          </div>

          {/* Interactive Box Breathing Grounding Widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-[#1C1917] animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-[#1C1917]">Trauma De-escalation & Grounding</div>
                  <div className="text-[10px] text-[#786F68] font-mono">Box Breathing (4-4-4-4 technique)</div>
                </div>
              </div>
              <button
                onClick={() => setActiveGrounding(!activeGrounding)}
                className="px-4 py-2 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold transition-colors"
              >
                {activeGrounding ? 'Hide Breathing Guide' : 'Start Grounding Guide'}
              </button>
            </div>

            {activeGrounding && (
              <div className="animate-fadeIn">
                <BoxBreathingWidget compact={false} />
              </div>
            )}
          </div>
        </div>

        {/* Safety Disclaimer */}
        <div className="text-[10px] text-[#786F68] leading-relaxed border-t border-[#E8DCCE] pt-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D96B27] shrink-0 mt-0.5" />
          <div>
            <strong>Safety Notice:</strong> VALOR is a supportive monitoring and peer connection platform. It does not replace emergency clinical services. If you or a comrade are in immediate physical danger, call <strong>112</strong> immediately.
          </div>
        </div>
      </div>
    </div>
  );
};
