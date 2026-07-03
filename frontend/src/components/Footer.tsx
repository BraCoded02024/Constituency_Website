'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock, Globe, MessageCircle, Share2, Play } from 'lucide-react';
import { demoContent } from '@/lib/demoContent';
import { NPP_FLAG_SRC } from '@/lib/siteImages';

const quickLinks = [
  { href: '/announcements', label: 'Announcements' },
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/projects', label: 'Projects' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
];

const serviceLinks = [
  { href: '/register', label: 'Join the Party' },
  { href: '/concerns', label: 'Share a Concern' },
  { href: '/volunteer', label: 'Volunteer' },
  { href: '/about', label: demoContent.footer.aboutLinkLabel },
];

const socialConfig = [
  { key: 'website' as const, icon: Globe, label: 'Website' },
  { key: 'whatsapp' as const, icon: MessageCircle, label: 'WhatsApp' },
  { key: 'facebook' as const, icon: Share2, label: 'Facebook' },
  { key: 'youtube' as const, icon: Play, label: 'YouTube' },
];

export default function Footer() {
  const activeSocial = socialConfig.filter(({ key }) => demoContent.social[key]);

  return (
    <footer className="bg-gray-900 text-white">
      <div className="h-1 bg-gradient-to-r from-npp-red via-white to-npp-blue" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center ring-2 ring-white/10">
                <Image
                  src={NPP_FLAG_SRC}
                  alt="NPP Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-lg">{demoContent.constituency.name}</p>
                <p className="text-npp-red-light text-xs">{demoContent.office.footerTagline}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">{demoContent.office.footerDescription}</p>
            {activeSocial.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-5">
                {activeSocial.map(({ key, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={demoContent.social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-npp-blue transition-colors"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-npp-red-light">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-npp-red-light">Services</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-npp-red-light">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin size={16} className="text-npp-blue-light mt-0.5 shrink-0" />
                <span className="text-gray-400 text-sm">{demoContent.constituency.officeAddressLine}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={16} className="text-npp-blue-light shrink-0" />
                <a href={demoContent.contact.phoneHref} className="text-gray-400 text-sm hover:text-white transition-colors">
                  {demoContent.contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={16} className="text-npp-blue-light shrink-0" />
                <a href={demoContent.contact.emailHref} className="text-gray-400 text-sm hover:text-white transition-colors">
                  {demoContent.contact.emailDisplay}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Clock size={16} className="text-npp-blue-light shrink-0" />
                <span className="text-gray-400 text-sm">{demoContent.contact.officeHours}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-500 text-xs" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} {demoContent.copyright.line}. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs">{demoContent.office.navTagline}</p>
        </div>
      </div>
    </footer>
  );
}
