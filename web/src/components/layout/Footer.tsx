import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gov-navy-950 text-gray-300 text-xs border-t border-gov-navy-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-sm mb-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>DEPOSIT-TRACK</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Automated central repository, verification trust layer, and lifecycle monitoring engine for institutional security deposits and FDRs.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-semibold mb-3">Portal Services</h4>
            <ul className="space-y-1.5 text-gray-400">
              <li>• Two-Tier Bank CBS Verification</li>
              <li>• Zero-Miss 90/60/30/7d Alerts</li>
              <li>• Digital Encrypted Document Vault</li>
              <li>• Automated Release / Refund Stepper</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-semibold mb-3">Compliance & Guidelines</h4>
            <ul className="space-y-1.5 text-gray-400">
              <li>• AICTE Approval Process Handbook (APH)</li>
              <li>• General Financial Rules (GFR 2017)</li>
              <li>• Digital Personal Data Protection (DPDP 2023)</li>
              <li>• OWASP Top 10 Security Architecture</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-white font-semibold mb-3">Smart India Hackathon 2026</h4>
            <p className="text-gray-400 leading-relaxed">
              Problem Statement: <strong className="text-amber-400">SIH26265</strong>
              <br />
              Theme: <strong>Smart Automation</strong>
              <br />
              Developed by: <strong className="text-white">Team StrataXX</strong>
              <br />
              AICTE Context Prototype
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-gov-navy-800 flex flex-col sm:flex-row justify-between items-center text-gray-500 text-[11px] gap-2">
          <p>© 2026 DEPOSIT-TRACK. All India Council for Technical Education. All rights reserved.</p>
          <div className="flex space-x-4">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-gray-400 cursor-pointer">Accessibility Statement</span>
            <span>•</span>
            <span>Last Updated: 30 Oct 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
