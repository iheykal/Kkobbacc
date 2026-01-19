'use client'


export const dynamic = 'force-dynamic';
import React from 'react'
import { motion } from 'framer-motion'
import { Users, Shield, Zap, CheckCircle } from 'lucide-react'
import Head from 'next/head'

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us - Kobac Property | Founded by Ilyaas Heykal</title>
        <meta
          name="description"
          content="Kobac Property was founded by Ilyaas Heykal. This web application was created to solve Somalia's fragmented property market. With number #1 marking our commitment to transformation, we're bringing transparency, trust, and efficiency to property transactions across the nation."
        />
        <meta name="keywords" content="Kobac Property, Ilyaas Heykal, Somalia property, property market, property transactions, transparency, Mogadishu properties, property platform" />
        <meta property="og:title" content="About Us - Kobac Property | Founded by Ilyaas Heykal" />
        <meta
          property="og:description"
          content="Kobac Property was founded by Ilyaas Heykal. This web application was created to solve Somalia's fragmented property market. With number #1 marking our commitment to transformation, we're bringing transparency, trust, and efficiency to property transactions across the nation."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/about`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="About Us - Kobac Property" />
        <meta name="twitter:description" content="Kobac Property was founded by Ilyaas Heykal. Solving Somalia's fragmented property market with transparency, trust, and efficiency." />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <img
                    src="/icons/deal-unscreen.gif"
                    alt="Deal"
                    className="h-16 w-16 sm:h-20 sm:w-20 mb-4 sm:mb-0 sm:mr-4 bg-transparent relative z-10"
                  />
                </motion.div>
                <motion.h1
                  className="text-4xl sm:text-5xl font-bold text-slate-900 font-playfair"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  About Us
                </motion.h1>
              </motion.div>

              <motion.p
                className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 leading-relaxed px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Kobac Property is Somalia's #1 Property Platform — built to connect buyers, renters, landlords, and agents in one trusted space.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <p className="text-base sm:text-lg text-slate-600 italic mb-4 px-2">
                Kobac Property was founded by <span className="font-semibold text-slate-900">Ilyaas Heykal</span>
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto px-4">
                This web application was created to solve Somalia's fragmented property market. With number <span className="font-bold text-blue-600">#1</span> marking our commitment to transformation, we're bringing transparency, trust, and efficiency to property transactions across the nation.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 md:p-12"
            >
              {/* Problem Statement */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-6 font-playfair">
                  Solving the Property Market Challenge
                </h2>
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                  We are solving the fragmented and informal property market in Mogadishu and beyond by offering a central platform where verified agents list real properties, customers find what they need, and deals are done transparently.
                </p>
              </motion.div>

              {/* Mission */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.div
                  className="flex items-center mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mr-3" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 font-playfair">
                    Our Mission
                  </h2>
                </motion.div>
                <motion.p
                  className="text-base sm:text-lg text-slate-700 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  Our mission is simple: <span className="font-semibold text-blue-600">🔑 Make property easy, safe, and fast — for everyone.</span>
                </motion.p>
              </motion.div>

              {/* What You Can Do */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <motion.div
                  className="flex items-center mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mr-3" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 font-playfair">
                    With Kobac Property you can:
                  </h2>
                </motion.div>
                <div className="space-y-4">
                  <motion.div
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <motion.div
                      className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </motion.div>
                    <p className="text-base sm:text-lg text-slate-700">
                      <span className="font-semibold">Buy or rent homes confidently</span> — Browse verified properties with complete details and transparent pricing
                    </p>
                  </motion.div>
                  <motion.div
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <motion.div
                      className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, delay: 0.9 }}
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </motion.div>
                    <p className="text-base sm:text-lg text-slate-700">
                      <span className="font-semibold">Work with trusted freelance agents</span> — Connect with verified property professionals who understand the local market
                    </p>
                  </motion.div>
                </div>
              </motion.div>

              {/* Trust & Safety */}
              <motion.div
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-8 mb-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <motion.div
                  className="flex items-center mb-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3" />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Trusted & Transparent
                  </h3>
                </motion.div>
                <motion.p
                  className="text-sm sm:text-base text-slate-700 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  Every property and agent on our platform is verified to ensure you get authentic listings and reliable service. We believe in transparency, which is why all our deals are done openly with clear terms and conditions.
                </motion.p>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.div
                  className="flex items-center mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mr-3" />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Contact Us
                  </h3>
                </motion.div>
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <p className="text-base sm:text-lg text-slate-700 mb-4">
                    Ready to find your perfect property or list with us?
                  </p>
                  <div className="flex justify-center">
                    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md min-w-fit">
                      <p className="text-sm sm:text-base text-slate-600 mb-2 font-medium">Call us today:</p>
                      <a
                        href="tel:0610251014"
                        className="text-xl sm:text-2xl font-bold text-green-600 hover:text-green-700 transition-colors duration-200 whitespace-nowrap block text-center"
                      >
                        061 0251014
                      </a>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

      </div>
    </>
  )
}
