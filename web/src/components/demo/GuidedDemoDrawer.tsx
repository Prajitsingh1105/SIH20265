import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { useAuth } from '../../context/AuthContext';
import { X, CheckCircle, ArrowRight, UserCheck, RotateCcw } from 'lucide-react';

export const GuidedDemoDrawer: React.FC = () => {
  const { isGuideOpen, setIsGuideOpen, demoSteps, completeStep, resetDemoData } = useDemo();
  const { demoLogin, user } = useAuth();
  const navigate = useNavigate();

  if (!isGuideOpen) {
    return (
      <button
        onClick={() => setIsGuideOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gov-navy-950 font-black px-4 py-2.5 rounded-full shadow-2xl border-2 border-amber-300 transition-all transform hover:scale-105"
        title="Open Interactive Demo Presentation Guide"
      >
        <span className="text-base animate-bounce">▶</span>
        <span className="text-xs uppercase tracking-wider font-extrabold">Demo Guide (12 Steps)</span>
      </button>
    );
  }

  const completedCount = demoSteps.filter((s) => s.isCompleted).length;

  const handleNavigateAndLogin = async (step: any) => {
    // If not already logged in as role, switch
    if (!user || user.role !== step.role) {
      await demoLogin(step.role);
    }
    completeStep(step.id);
    navigate(step.path);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-300 animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="bg-gov-navy-900 text-white p-4 flex items-center justify-between border-b border-gov-navy-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-extrabold text-sm">▶ DEMO WALKTHROUGH</span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono">
              SIH 2026
            </span>
          </div>
          <h3 className="text-base font-bold mt-1 text-white">DEPOSIT-TRACK Presentation Flow</h3>
          <p className="text-xs text-gray-300 mt-0.5">
            Progress: <strong className="text-amber-400">{completedCount}</strong> of 12 steps completed
          </p>
        </div>
        <button
          onClick={() => setIsGuideOpen(false)}
          className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gov-navy-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Reset Data Toolbar */}
      <div className="bg-amber-50 px-4 py-2 flex items-center justify-between border-b border-amber-200 text-xs">
        <span className="text-amber-900 font-medium">Ready to reset demonstration state?</span>
        <button
          onClick={async () => {
            if (confirm('Reset all demo data back to initial seed state?')) {
              await resetDemoData();
              alert('Demo state restored! ~40 FDRs seeded.');
            }
          }}
          className="flex items-center space-x-1 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {demoSteps.map((step) => {
          const isCurrentRole = user?.role === step.role;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-lg border transition-all ${
                step.isCompleted
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-white border-gray-200 hover:border-gov-navy-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      step.isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gov-navy-900 text-amber-400'
                    }`}
                  >
                    {step.isCompleted ? <CheckCircle className="w-4 h-4" /> : step.id}
                  </span>
                  <h4 className="font-bold text-xs text-gov-navy-900 leading-snug">
                    {step.id}. {step.title}
                  </h4>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    isCurrentRole
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {step.roleLabel}
                </span>
              </div>

              {/* Talking Point */}
              <p className="text-xs text-gray-600 mt-2 pl-8 leading-relaxed">
                {step.talkingPoint}
              </p>

              {/* Action Buttons */}
              <div className="mt-3 pl-8 flex items-center gap-2">
                <button
                  onClick={() => handleNavigateAndLogin(step)}
                  className="flex items-center space-x-1 text-xs font-bold bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 px-3 py-1.5 rounded shadow-xs transition"
                >
                  <span>Go to Screen</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {!isCurrentRole && (
                  <button
                    onClick={async () => {
                      await demoLogin(step.role);
                      completeStep(step.id);
                    }}
                    className="flex items-center space-x-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 px-2.5 py-1.5 rounded transition border border-gray-300"
                    title={`Switch session to ${step.roleLabel}`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-gov-navy-600" />
                    <span>Login as {step.role.split('_')[0]}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
