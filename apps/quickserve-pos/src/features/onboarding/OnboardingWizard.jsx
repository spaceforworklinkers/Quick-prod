
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OnboardingService } from '@/services/OnboardingService';
import { Loader2, Store, FileText, Utensils, LayoutGrid, Receipt, QrCode, LogOut, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeScreen from './steps/WelcomeScreen';
import Step1BusinessInfo from './steps/Step1BusinessInfo';
import Step2MenuSetup from './steps/Step2MenuSetup';
import Step3TablesSetup from './steps/Step3TablesSetup';
import Step4TaxConfig from './steps/Step4TaxConfig';
import Step5QRReady from './steps/Step5QRReady';

import { useAuth } from '@/context/AuthContext';

const OnboardingWizard = () => {
    const { outletId } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [statusData, setStatusData] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);

    // Timeout fallback for loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading && user) {
                // If still loading after 8 seconds, something is stuck.
                console.error("Loading timeout");
                setLoading(false); 
                // Don't error, just let it render (might show empty or defaults, which is better than stuck)
                // Or better, trigger a re-fetch or show error.
            }
        }, 8000);
        return () => clearTimeout(timer);
    }, [loading, user]);

    if (authLoading) {
        return (
             <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-4" />
                <p className="text-gray-500 font-medium">Verifying Credentials...</p>
            </div>
        );
    }

    if (!user) {
         return (
             <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut className="h-6 w-6 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Session Expired</h2>
                    <p className="text-gray-600 mb-6">Please log in to continue setting up your outlet.</p>
                    <Button onClick={() => navigate(`/${outletId}/login?returnUrl=/${outletId}/setup`, { replace: true })} className="w-full bg-orange-600 hover:bg-orange-700">
                        Go to Login
                    </Button>
                </div>
            </div>
         );
    }

    const loadStatus = async () => {
        try {
            setLoading(true);
            const data = await OnboardingService.getOnboardingStatus(outletId);
            setStatusData(data);
            
            if (data.onboarding_status === 'active') {
                 navigate(`/${outletId}/dashboard`);
                 return;
            }
            
            let step = data.onboarding_step || 0;
            
            if (data.qr_generated) step = 5;
            else if (data.tax_configured) step = 4;
            else if (data.tables_created) step = 3;
            else if (data.menu_created) step = 2;
            else if (data.business_info_completed) step = 1;
            
            if (data.business_info_completed && step < 2) step = 2;
            if (data.menu_created && step < 3) step = 3;
            if (data.tables_created && step < 4) step = 4;

            setCurrentStep(step);
        } catch (error) {
            console.error("Failed to load onboarding status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadStatus();
        }
    }, [outletId, user]);

    const handleNext = async (explicitStep) => {
        if (typeof explicitStep === 'number') {
             setCurrentStep(explicitStep);
        }
        await loadStatus(); 
    };
    
    const goToStep = (step) => {
        setCurrentStep(step);
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading Setup Progress...</p>
            </div>
        );
    }

    // Determine if we are in "Wizard Mode" (Step > 0) or "Welcome Mode" (Step 0)
    // Actually, let's use a consistent layout but hide sidebar on Step 0 if preferred?
    // No, sidebar is nice context even on Welcome.
    
    const steps = [
        { num: 1, label: "Business Details", icon: FileText, desc: "Name & Address" },
        { num: 2, label: "Menu Setup", icon: Utensils, desc: "Add Items" },
        { num: 3, label: "Floor Plan", icon: LayoutGrid, desc: "Tables" },
        { num: 4, label: "Tax & Billing", icon: Receipt, desc: "GST Config" },
        { num: 5, label: "Go Live", icon: QrCode, desc: "Get QR" },
    ];

    const currentStepIndex = currentStep; // 0 is Welcome. 1..5 match steps array.

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Sidebar Navigation - Desktop */}
            <aside className="hidden md:flex flex-col w-80 bg-slate-900 text-white border-r border-slate-800 shadow-2xl z-10">
                <div className="p-8 border-b border-slate-800 flex items-center gap-3">
                   <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                        <Store className="h-6 w-6 text-white" />
                   </div>
                   <div>
                       <h1 className="font-bold text-lg tracking-tight">QuickServe POS</h1>
                       <p className="text-xs text-slate-400">Setup Wizard</p>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto py-8 px-6 space-y-6">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Setup Progress</p>
                        {steps.map((step) => {
                            const isCompleted = currentStep > step.num;
                            const isCurrent = currentStep === step.num;
                            const isLocked = currentStep < step.num;

                            return (
                                <div 
                                    key={step.num}
                                    className={`group flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                                        isCurrent 
                                            ? 'bg-orange-600/10 border border-orange-600/20' 
                                            : 'hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                        isCompleted 
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : isCurrent 
                                                ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-900/30'
                                                : 'border-slate-700 text-slate-500 bg-slate-800'
                                    }`}>
                                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                                    </div>
                                    <div className={`${isLocked ? 'opacity-40' : 'opacity-100'}`}>
                                        <p className={`text-sm font-semibold ${isCurrent ? 'text-orange-400' : 'text-slate-200'}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-xs text-slate-400">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors cursor-pointer mb-2">
                        <HelpCircle className="h-5 w-5" />
                        <span className="text-sm">Need help?</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
                     <span className="font-bold text-gray-900">Step {currentStep} of 5</span>
                     <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                         {Math.round((currentStep / 5) * 100)}%
                     </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-slate-50/50">
                    <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                {currentStep === 0 && <WelcomeScreen onStart={() => goToStep(1)} />}
                                {currentStep === 1 && <Step1BusinessInfo outletId={outletId} initialData={statusData} onNext={handleNext} />}
                                {currentStep === 2 && <Step2MenuSetup outletId={outletId} onNext={handleNext} onBack={() => goToStep(1)} />}
                                {currentStep === 3 && <Step3TablesSetup outletId={outletId} onNext={handleNext} onBack={() => goToStep(2)} />}
                                {currentStep === 4 && <Step4TaxConfig outletId={outletId} onNext={handleNext} onBack={() => goToStep(3)} />}
                                {currentStep === 5 && <Step5QRReady outletId={outletId} onFinish={() => navigate(`/${outletId}/dashboard`)} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OnboardingWizard;


