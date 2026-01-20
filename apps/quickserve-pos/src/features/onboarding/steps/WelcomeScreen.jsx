import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Store, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

const WelcomeScreen = ({ onStart }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8 relative"
            >
                <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 rounded-full animate-pulse" />
                <div className="relative h-20 w-20 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-orange-100">
                    <Store className="h-10 w-10 text-orange-600" />
                </div>
            </motion.div>
            
            <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-gray-900 mb-4 tracking-tight"
            >
                Welcome to QuickServe POS
            </motion.h1>
            
            <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-gray-500 max-w-lg mb-10 leading-relaxed"
            >
                Let's get your restaurant set up for success. We'll guide you through a quick 5-step wizard to configure your menu, tables, and settings.
            </motion.p>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-12"
            >
               <FeatureCard title="Effortless Menu" desc="Create categories & items" delay={0.5} />
               <FeatureCard title="Smart Tables" desc="Visual floor management" delay={0.6} />
               <FeatureCard title="Tax Automation" desc="GST & billing preset" delay={0.7} />
               <FeatureCard title="Instant QR" desc="Contactless ordering" delay={0.8} />
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
            >
                <Button 
                    size="lg" 
                    onClick={onStart}
                    className="h-14 px-10 text-lg bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-600/20 transition-all hover:-translate-y-1 rounded-full font-semibold"
                >
                    Start Setup <Rocket className="ml-2 h-5 w-5" />
                </Button>
                <p className="mt-6 text-sm text-gray-400 font-medium">Estimated time: 5 minutes</p>
            </motion.div>
        </div>
    );
};

const FeatureCard = ({ title, desc, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow text-left"
    >
        <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-orange-600" />
        </div>
        <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
        </div>
    </motion.div>
);

export default WelcomeScreen;
