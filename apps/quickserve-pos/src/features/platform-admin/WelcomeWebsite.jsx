import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChefHat, 
  QrCode, 
  Monitor, 
  Wifi, 
  Building2, 
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Clock,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  ShoppingCart,
  Utensils,
  Coffee,
  Pizza,
  Store,
  Star,
  Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomeWebsite() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const coreFeatures = [
    {
      icon: Zap,
      title: "Quick 3-Click Billing",
      description: "Take orders, punch bills, and generate KOTs instantly. Accept payments with split bills or merged tables. Apply discounts effortlessly."
    },
    {
      icon: ShoppingCart,
      title: "Smart Inventory Management",
      description: "Auto-deduct inventory item-wise, get low-stock alerts, and access day-end inventory reports automatically."
    },
    {
      icon: BarChart3,
      title: "Real-Time Reports",
      description: "Go paperless with automated tracking. Get 80+ essential business reports on sales, orders, staff actions, and inventory."
    },
    {
      icon: Monitor,
      title: "Kitchen Display System",
      description: "Real-time order tracking keeps your kitchen running smoothly during peak hours with instant notifications."
    },
    {
      icon: QrCode,
      title: "QR Code Ordering",
      description: "Let customers scan, browse, and order directly from their tables. No app installation needed."
    },
    {
      icon: Wifi,
      title: "Offline-First Technology",
      description: "Never miss an order. Our system works seamlessly even without internet connectivity."
    }
  ];

  const addons = [
    {
      icon: Users,
      title: "CRM",
      description: "Know your customers well and deliver the best to win their trust and loyalty with smart CRM tools."
    },
    {
      icon: TrendingUp,
      title: "Analytics",
      description: "Grow your business with insightful 100+ downloadable reports about sales, inventory, and payments."
    },
    {
      icon: Shield,
      title: "Security",
      description: "Bank-grade security with automatic backups, GST-compliant billing, and role-based access control."
    },
    {
      icon: Building2,
      title: "Multi-Outlet",
      description: "Manage multiple locations from a single dashboard with centralized reporting and inventory."
    }
  ];

  const restaurantTypes = [
    { icon: Coffee, name: "Cafes" },
    { icon: Utensils, name: "Fine Dine" },
    { icon: Pizza, name: "QSR" },
    { icon: Store, name: "Food Courts" },
    { icon: ChefHat, name: "Cloud Kitchens" },
    { icon: Building2, name: "Large Chains" }
  ];

  const stats = [
    { number: "1000+", label: "Restaurants Trust Us" },
    { number: "50K+", label: "Orders Processed Daily" },
    { number: "99.9%", label: "Uptime Guarantee" }
  ];

  const testimonials = [
    {
      quote: "QuickServe POS transformed our operations. The offline-first approach means we never miss an order, even during internet outages. The multi-outlet management is a game-changer.",
      author: "Rajesh Kumar",
      role: "Owner, Spice Garden Chain",
      rating: 5
    },
    {
      quote: "The QR code ordering feature increased our table turnover by 40%. Customers love the convenience, and our staff can focus on service quality instead of taking orders.",
      author: "Priya Sharma",
      role: "Manager, Urban Cafe",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Info Bar */}
      <div className="bg-gray-900 text-white py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-6">
              <a href="mailto:support@quickservepos.com" className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                <Mail className="w-4 h-4" />
                <span>support@quickservepos.com</span>
              </a>
              <a href="tel:+911234567890" className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                <Phone className="w-4 h-4" />
                <span>+91 123 456 7890</span>
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>Serving restaurants across India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 select-none">
              <img src="/images/logo/QuickServe-logo-black.png" alt="QuickServe POS" className="h-9 w-auto object-contain" />
              <span className="font-['Outfit'] text-2xl font-bold tracking-tight text-gray-900 hidden sm:block leading-none translate-y-[2px]">
                QuickServe POS
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#addons" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Add-ons</a>
              <a href="#restaurants" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">For Restaurants</a>
              <div className="w-px h-6 bg-gray-300"></div>
              <a href="https://spacelinkers.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">About Us</a>
              <a href="mailto:support@quickservepos.com" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Contact</a>
              <Button 
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg shadow-orange-200 font-semibold rounded-full"
              >
                Sign In
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-gray-100 bg-white"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-gray-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#addons" className="block py-2 text-gray-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Add-ons</a>
              <a href="#restaurants" className="block py-2 text-gray-600 font-medium" onClick={() => setMobileMenuOpen(false)}>For Restaurants</a>
              <div className="border-t border-gray-200 my-2"></div>
              <a href="https://spacelinkers.com" target="_blank" rel="noopener noreferrer" className="block py-2 text-gray-600 font-medium">About Us</a>
              <a href="mailto:support@quickservepos.com" className="block py-2 text-gray-600 font-medium">Contact</a>
              <Button 
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold mt-4 rounded-full"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            ref={(el) => {
              if (el) {
                el.muted = true;
                el.play().catch(e => console.log('Autoplay failed:', e));
              }
            }}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://videos.pexels.com/video-files/3252037/3252037-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Restaurant POS Software
                <span className="block text-orange-600 mt-2">Made Simple!</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Manage all your restaurant operations efficiently so you can focus on growing your brand, like a real boss!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-lg h-14 px-8 shadow-xl shadow-orange-200 font-semibold rounded-full"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold border-2 hover:bg-gray-50 rounded-full"
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                >
                  Explore Features
                </Button>
              </div>

              <p className="text-sm text-gray-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Trusted by 1,000+ restaurants across India
              </p>
            </motion.div>

            {/* Right Column - Animated Visual */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                y: [0, -10, 0]
              }}
              transition={{ 
                opacity: { duration: 0.6, delay: 0.2 },
                x: { duration: 0.6, delay: 0.2 },
                y: { 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }
              }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <motion.div 
                  className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100"
                  animate={{ 
                    boxShadow: [
                      "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      "0 25px 50px -12px rgba(249, 115, 22, 0.15)",
                      "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    ]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <ChefHat className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Table #12</p>
                          <p className="text-sm text-gray-500">Order #1847</p>
                        </div>
                      </div>
                      <motion.span 
                        className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Ready
                      </motion.span>
                    </div>
                    
                    <div className="space-y-3">
                      {['Margherita Pizza', 'Caesar Salad', 'Iced Latte'].map((item, i) => (
                        <motion.div 
                          key={i} 
                          className="flex items-center justify-between py-2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + (i * 0.2) }}
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-gray-700">{item}</span>
                          </div>
                          <span className="text-gray-900 font-semibold">₹{(i + 1) * 150}</span>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-orange-600">₹900</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, 2, 0]
                  }}
                  transition={{ 
                    duration: 3.5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <motion.p 
                        className="text-2xl font-bold text-gray-900"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      >
                        +24%
                      </motion.p>
                      <p className="text-xs text-gray-500">Sales Today</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
                  animate={{ 
                    y: [0, 8, 0],
                    rotate: [0, -2, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 1
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <motion.p 
                        className="text-2xl font-bold text-gray-900"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                      >
                        48
                      </motion.p>
                      <p className="text-xs text-gray-500">Orders Today</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Client Logos Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-gray-500 mb-8 uppercase tracking-wider">
            Trusted by Leading Restaurant Brands
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {/* Using actual brand logos from logo.dev */}
            {[
              { name: "Domino's Pizza", url: "https://img.logo.dev/dominos.com?token=pk_X-WZEoNsS_a7f9TViSaylw" },
              { name: "Subway", url: "https://img.logo.dev/subway.com?token=pk_X-WZEoNsS_a7f9TViSaylw" },
              { name: "KFC", url: "https://img.logo.dev/kfc.com?token=pk_X-WZEoNsS_a7f9TViSaylw" },
              { name: "McDonald's", url: "https://img.logo.dev/mcdonalds.com?token=pk_X-WZEoNsS_a7f9TViSaylw" },
              { name: "Starbucks", url: "https://img.logo.dev/starbucks.com?token=pk_X-WZEoNsS_a7f9TViSaylw" },
              { name: "Pizza Hut", url: "https://img.logo.dev/pizzahut.com?token=pk_X-WZEoNsS_a7f9TViSaylw" }
            ].map((brand, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-center p-4"
              >
                <img 
                  src={brand.url}
                  alt={brand.name}
                  className="h-16 w-auto object-contain grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300"
                />
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            * Logos shown are for demonstration purposes
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-bold text-orange-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              A Restaurant POS Made for All Your Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Quick and easy-to-use restaurant billing software that makes managing high order volumes butter smooth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-orange-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{feature.description}</p>
                <a href="#" className="text-orange-600 font-semibold hover:text-orange-700 inline-flex items-center gap-2 group">
                  Explore all features
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section id="addons" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Add-ons to Supercharge Your Restaurant POS
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful integrations and tools to take your restaurant operations to the next level
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addons.map((addon, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <addon.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{addon.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{addon.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurant Types Section */}
      <section id="restaurants" className="py-20 sm:py-28 bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Built for All Types of Food Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The all-in-one Restaurant Management System for all types of restaurant formats and food outlets
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {restaurantTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 text-center group cursor-pointer"
              >
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                  <type.icon className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{type.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Restaurant Owners
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border border-orange-100 relative"
              >
                <Quote className="w-12 h-12 text-orange-200 absolute top-6 right-6" />
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-orange-500 text-orange-500" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Simple & Clean */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')"
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70 z-0" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Transform Your Restaurant?
            </h2>
            
            <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
              Join 1,000+ restaurants using QuickServe POS to serve customers faster
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={() => navigate('/login')}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white text-lg h-16 px-10 rounded-full font-bold shadow-2xl transition-all duration-300 group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="h-16 px-10 text-lg font-bold border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-full transition-all duration-300"
                onClick={() => window.location.href = 'mailto:support@quickservepos.com'}
              >
                Schedule Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>24/7 support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 select-none mb-4">
                <img src="/images/logo/QuickServe-logo-white.png" alt="QuickServe POS" className="h-9 w-auto object-contain" />
                <span className="font-['Outfit'] text-2xl font-bold tracking-tight text-white leading-none translate-y-[2px]">QuickServe POS</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The complete restaurant management platform that streamlines operations, speeds up service, and helps you serve more customers with less effort.
              </p>
              <p className="text-gray-500 text-sm">
                A product by{' '}
                <a 
                  href="https://spacelinkers.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 font-semibold transition-colors underline decoration-orange-400/30 hover:decoration-orange-300"
                >
                  Spacelinkers Infotech Private Limited
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#addons" className="text-gray-400 hover:text-white transition-colors">Add-ons</a></li>
                <li><a href="#restaurants" className="text-gray-400 hover:text-white transition-colors">For Restaurants</a></li>
                <li><a href="https://spacelinkers.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Contact Us</h3>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:support@quickservepos.com" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    support@quickservepos.com
                  </a>
                </li>
                <li>
                  <a href="tel:+911234567890" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    +91 123 456 7890
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2026 QuickServe POS. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm">
                🔒 Internal Access: Company staff use the Sign In button above
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
