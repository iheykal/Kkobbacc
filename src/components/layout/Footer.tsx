'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import HybridImage from '@/components/ui/HybridImage'
import { Phone, MapPin, Mail } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-lg p-2 -m-2"
              title="Click to go to homepage"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <HybridImage
                  src="/icons/header.png"
                  alt="Kobac Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white">
                  Kobac Property
                </h3>
                <p className="text-sm text-primary-200">
                  Premium Property
                </p>
              </div>
            </Link>
            <p className="text-primary-200 text-sm leading-relaxed">
              Helping you make the right property choice with our premium property services.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/properties"
                  className="text-primary-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Properties
                </Link>
              </li>
              <li>
                <Link
                  href="/agents"
                  className="text-primary-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Agents
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-primary-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Services</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-primary-200 text-sm">Property Sales</span>
              </li>
              <li>
                <span className="text-primary-200 text-sm">Property Rentals</span>
              </li>
              <li>
                <span className="text-primary-200 text-sm">Property Management</span>
              </li>
              <li>
                <span className="text-primary-200 text-sm">Property Consulting</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary-200" />
                <span className="text-primary-200 text-sm">0610251014</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary-200" />
                <span className="text-primary-200 text-sm">info@kobac.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-primary-200" />
                <span className="text-primary-200 text-sm">Somalia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-primary-200 text-sm">
              © {new Date().getFullYear()} Kobac Property. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-primary-200 hover:text-white transition-colors duration-200 text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-primary-200 hover:text-white transition-colors duration-200 text-sm"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
