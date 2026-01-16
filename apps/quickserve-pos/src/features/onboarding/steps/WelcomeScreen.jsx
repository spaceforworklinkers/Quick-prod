import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Store } from 'lucide-react';

const WelcomeScreen = ({ onStart }) => {
    return (
        <div className="flex flex-col items-center text-center animate-in fade-in duration-700">
            <div className="mb-8 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Store className="h-16 w-16 text-orange-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to QuickServe POS
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mb-8">
                Let's get your restaurant set up for success settings. This wizard will guide you through the essentials to start taking orders in minutes.
            </p>

            <Card className="w-full mb-8 text-left border-none shadow-md bg-white/80 backdrop-blur">
                <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">What we'll set up:</h3>
                    <div className="space-y-3">
                        <StepPreview title="Business Details" desc="Name, address, and contact info" />
                        <StepPreview title="Menu Creation" desc="Add your first category and item" />
                        <StepPreview title="Table Layout" desc="Configure your seating arrangement" />
                        <StepPreview title="Tax & Billing" desc="Set up GST or service charges" />
                        <StepPreview title="QR Generation" desc="Get your digital menu ready" />
                    </div>
                </CardContent>
            </Card>

            <Button 
                size="lg" 
                onClick={onStart}
                className="w-full md:w-auto min-w-[200px] h-12 text-lg bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all hover:scale-105"
            >
                Start Setup <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="mt-4 text-sm text-gray-500">
                You can save & resume at any time.
            </p>
        </div>
    );
};

const StepPreview = ({ title, desc }) => (
    <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-gray-300 mt-0.5" />
        <div>
            <p className="font-medium text-gray-900">{title}</p>
            <p className="text-sm text-gray-500">{desc}</p>
        </div>
    </div>
);

export default WelcomeScreen;
