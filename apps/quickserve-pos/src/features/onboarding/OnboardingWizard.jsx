import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutlet } from '@/context/OutletContext'; // Assuming context provides outlet details
import { OnboardingService } from '@/services/OnboardingService';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WelcomeScreen from './steps/WelcomeScreen';
import Step1BusinessInfo from './steps/Step1BusinessInfo';
import Step2MenuSetup from './steps/Step2MenuSetup';
import Step3TablesSetup from './steps/Step3TablesSetup';
import Step4TaxConfig from './steps/Step4TaxConfig';
import Step5QRReady from './steps/Step5QRReady';

const OnboardingWizard = () => {
    const { outletId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [statusData, setStatusData] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        loadStatus();
    }, [outletId]);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const data = await OnboardingService.getOnboardingStatus(outletId);
            setStatusData(data);
            
            // Determine step to show
            if (data.onboarding_status === 'active') {
                 // Already active, redirect to dashboard
                 navigate(`/${outletId}/dashboard`);
                 return;
            }
            
            // Logic to restore step:
            // If we have an explicit onboarding_step field in DB, use it.
            // Or calculate based on booleans.
            // Using the explicit step from DB as primary source of truth for resume.
            let step = data.onboarding_step || 0;
            
            // Safety check: if step says 0 but business info is done, maybe move to 1?
            // User requested: "Resume from last incomplete step"
            if (data.qr_generated) step = 5;
            else if (data.tax_configured) step = 5; // Ready for QR
            else if (data.tables_created) step = 4;
            else if (data.menu_created) step = 3;
            else if (data.business_info_completed) step = 2;
            else step = Math.max(step, 0); // Default or explicit '1' if started but not finished

             // Step mapping:
             // 0: Welcome (If step is 0)
             // 1: Business Info
             // 2: Menu
             // 3: Tables
             // 4: Tax
             // 5: QR
            
            // If user has started meaningful work (status != setup_pending), skip welcome?
            // Requirement: "Show onboarding UI ONLY"
            // Requirement: "Welcome Screen ... Progress indicator (0% initially) ... Primary CTA: “Start Setup”"
            // If step > 0, we can probably skip Welcome Screen, OR show it but button says "Resume Setup".
            // Let's stick to the mapped step.
            
            // Correcting logic based on flow:
            // 0 -> Welcome
            // 1 -> Business Info
            // 2 -> Menu
            // 3 -> Tables
            // 4 -> Tax
            // 5 -> QR
            
            // If data.business_info_completed is true, we should be at least at step 2.
            if (data.business_info_completed && step < 2) step = 2;
            if (data.menu_created && step < 3) step = 3;
            if (data.tables_created && step < 4) step = 4;
            if (data.tax_configured && step < 5) step = 5;

            setCurrentStep(step);
        } catch (error) {
            console.error("Failed to load onboarding status", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        await loadStatus(); // Refresh status to determine next step
    };
    
    const goToStep = (step) => {
        setCurrentStep(step);
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-2 text-gray-600">Loading setup...</span>
            </div>
        );
    }

    // Step Rendering
    const renderStep = () => {
        switch (currentStep) {
            case 0: return <WelcomeScreen onStart={() => goToStep(1)} />;
            case 1: return <Step1BusinessInfo outletId={outletId} initialData={statusData} onNext={handleNext} />;
            case 2: return <Step2MenuSetup outletId={outletId} onNext={handleNext} onBack={() => goToStep(1)} />;
            case 3: return <Step3TablesSetup outletId={outletId} onNext={handleNext} onBack={() => goToStep(2)} />;
            case 4: return <Step4TaxConfig outletId={outletId} onNext={handleNext} onBack={() => goToStep(3)} />;
            case 5: return <Step5QRReady outletId={outletId} onFinish={() => navigate(`/${outletId}/dashboard`)} />;
            default: return <WelcomeScreen onStart={() => goToStep(1)} />;
        }
    };

    // Calculate Progress
    // Total steps excluding Welcome (5 steps: 1,2,3,4,5)
    // Progress = (currentStep - 1) / 5 * 100? 
    // If step 0: 0%
    // If step 1: 0% (Start) -> 20% (End)?
    // Let's say: 
    // Step 0: 0%
    // Step 1: 10%
    // Step 2: 30%
    // Step 3: 50%
    // Step 4: 70%
    // Step 5: 90% -> 100% on finish.
    
    const progress = currentStep === 0 ? 0 : (currentStep / 5) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Simple Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
                         <span className="text-white font-bold">Q</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">QuickServe POS</span>
                </div>
                {/* Progress Bar (Hidden on welcome screen if desired, or always shown) */}
                {currentStep > 0 && (
                    <div className="flex-1 max-w-xs mx-4 hidden md:block">
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-orange-600 transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-center mt-1 text-gray-500">Step {currentStep} of 5</p>
                    </div>
                )}
                <div>
                  <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'}>
                      Help
                  </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-start pt-10 px-4 md:px-0 pb-10">
                <div className="w-full max-w-2xl">
                    {renderStep()}
                </div>
            </main>
        </div>
    );
};

export default OnboardingWizard;
