import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { submitContactMessage } from '../lib/api.ts';
import type { SiteSettings } from '../types/index.ts';

interface ContactSectionProps {
  settings: SiteSettings;
}

export function ContactSection({ settings }: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const cleanPhone = (settings.contactPhone || '+8801318527145').replace(/[^0-9+]/g, '');
  const cleanWhatsapp = (settings.contactWhatsapp || '8801984382715').replace(/[^0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await submitContactMessage(formData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', address: '', message: '' });
      setTimeout(() => setStatus('idle'), 6000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <section id="contact" className="relative pt-24 pb-20 bg-[#050816] overflow-hidden">
      {/* Figma Reference Angled Blue Accent Geometry */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-blue-700/20 via-cyan-600/15 to-indigo-600/20 angled-top-bg pointer-events-none -z-10" />

      {/* Atmospheric Radial Glows */}
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[500px] bg-blue-600/15 blur-[150px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[400px] bg-cyan-500/10 blur-[130px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Start A Conversation</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-display tracking-tight mb-4">
            Contact
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Have a 3D modeling commission, game asset pipeline, or industrial CAD visualization inquiry? Send a message and let's bring it to reality.
          </p>
        </div>

        {/* 2-Column Angled Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">

          {/* LEFT: Clickable Contact Information & Direct Channels */}
          <div className="lg:col-span-5 flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-b from-[#0a112c]/90 to-[#070b1a] border border-blue-500/30 shadow-2xl shadow-blue-950/60 relative overflow-hidden">
            {/* Background geometric flare */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block mb-2">
                Get In Touch Directly
              </span>
              <h3 className="text-2xl font-bold text-white font-display mb-4">
                Let's discuss your next breakthrough design.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-8">
                Available for worldwide 3D asset contracts, freelance visualization projects, and technical engineering consultations.
              </p>

              {/* CLICKABLE INFO LIST */}
              <div className="space-y-4">
                {/* 1. Email (Clickable mailto:) */}
                <a
                  href={`mailto:${settings.contactEmail || 'nayemh161@gmail.com'}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/60 hover:bg-blue-950/60 border border-blue-500/20 hover:border-cyan-400/40 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-950/90 border border-blue-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">Email Address</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate block">
                      {settings.contactEmail || 'nayemh161@gmail.com'}
                    </span>
                  </div>
                </a>

                {/* 2. WhatsApp (Clickable https://wa.me/8801984382715) */}
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/60 hover:bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-400/50 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/90 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">WhatsApp Direct</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">
                      {settings.contactWhatsapp || '+8801984-382715'}
                    </span>
                  </div>
                </a>

                {/* 3. Phone (Clickable tel:) */}
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/60 hover:bg-blue-950/60 border border-blue-500/20 hover:border-cyan-400/40 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-950/90 border border-blue-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">Phone Call</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {settings.contactPhone || '+8801318527145'}
                    </span>
                  </div>
                </a>

                {/* 4. Location */}
                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/60 border border-blue-500/20">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/90 border border-blue-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">Base Location</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-200">
                      {settings.contactLocation || 'Bajitpur, Kishoreganj, Dhaka, Bangladesh'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-blue-900/40 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Timezone: GMT+6 (BST)</span>
              <span className="text-cyan-400">Fast Response Guaranteed</span>
            </div>
          </div>

          {/* RIGHT: "Send a Direct Inquiry" Form with CLEAN EMPTY INPUTS */}
          <div className="lg:col-span-7 p-8 rounded-3xl bg-[#090f28]/95 border border-blue-500/30 shadow-2xl shadow-blue-950/50 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white font-display mb-2">
                Send a Direct Inquiry
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Fill in the details below. All submissions are dispatched directly to the portfolio inbox.
              </p>

              {status === 'success' && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-start gap-3 animate-in fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">Inquiry Delivered Successfully!</p>
                    <p className="text-xs text-emerald-300/80 mt-0.5">
                      Thank you for reaching out. Nayem will review your inquiry and get back to you promptly.
                    </p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-rose-200">Delivery Error</p>
                    <p className="text-xs text-rose-300/80 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Requirement 23: Clean, empty inputs without example placeholder text */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-blue-500/25 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white transition-all outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-blue-500/25 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-blue-500/25 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white transition-all outline-none"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-blue-500/25 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-blue-500/25 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white transition-all outline-none resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-xl shadow-blue-600/40 hover:shadow-cyan-500/50 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-cyan-200" />
                  <span>{status === 'submitting' ? 'Submitting...' : 'Submit'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
