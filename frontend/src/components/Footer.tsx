'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Globe, MessageCircle, Camera, Play, Landmark } from 'lucide-react';
import { demoContent } from '@/lib/demoContent';

const quickLinks = [
  { href: '/announcements', label: 'Announcements' },
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/projects', label: 'Projects' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
];

const serviceLinks = [
  { href: '/register', label: 'Join the constituency updates' },
  { href: '/concerns', label: 'Share a Concern' },
  { href: '/volunteer', label: 'Volunteer' },
  { href: '/about', label: demoContent.footer.aboutLinkLabel },
];

export default function Footer() {
  return (
    <footer className="bg-ghana-black text-white">
      <div className="h-1 bg-gradient-to-r from-ghana-green via-ghana-gold to-ghana-red" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-ghana-gold rounded-full flex items-center justify-center">
                <Landmark size={22} className="text-ghana-green" strokeWidth={2} aria-hidden />
              </div>
              <div>
                <p className="font-bold text-lg">{demoContent.constituency.name}</p>
                <p className="text-ghana-gold text-xs">{demoContent.office.footerTagline}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{demoContent.office.footerDescription}</p>
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mt-3 border border-white/15 rounded px-2 py-1 inline-block">
              {demoContent.badges.system}
            </p>
            <div className="flex space-x-3 mt-4">
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-ghana-green transition-colors">
                <Globe size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-ghana-green transition-colors">
                <MessageCircle size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-ghana-green transition-colors">
                <Camera size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-ghana-green transition-colors">
                <Play size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-ghana-gold">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-ghana-gold">Services</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-ghana-gold">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin size={16} className="text-ghana-green mt-0.5 shrink-0" />
                <span className="text-gray-400 text-sm">{demoContent.constituency.officeAddressLine}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={16} className="text-ghana-green shrink-0" />
                <span className="text-gray-400 text-sm">{demoContent.contact.phoneDisplay}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={16} className="text-ghana-green shrink-0" />
                <span className="text-gray-400 text-sm">{demoContent.contact.emailDisplay}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Clock size={16} className="text-ghana-green shrink-0" />
                <span className="text-gray-400 text-sm">Mon - Fri: 8:00 AM - 5:00 PM</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-gray-500 text-xs" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} {demoContent.copyright.line}. Sample deployment.
          </p>
          <p className="text-gray-600 text-xs mt-1 sm:mt-0">{demoContent.copyright.poweredBy}</p>
        </div>
      </div>
    </footer>
  );
}
