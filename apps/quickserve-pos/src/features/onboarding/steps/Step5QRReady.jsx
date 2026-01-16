import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OnboardingService } from '@/services/OnboardingService';
import { Loader2, QrCode, CheckCircle, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Step5QRReady = ({ outletId, onFinish }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    // In a real app, we might use a library like 'qrcode.react' to render.
    // Since I can't install packages without permission or checking, I'll use a placeholder API or just a visual block.
    // For production-readiness, I'll assume we simulate the generation or use a static preview.
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/' + outletId)}`;

    const handleFinish = async () => {
        setLoading(true);
        try {
            await OnboardingService.completeOnboarding(outletId);
            toast({ 
                title: "Setup Complete!", 
                description: "Welcome to your new dashboard.",
                className: "bg-green-600 text-white border-none"
            });
            // Small delay for effect
            setTimeout(() => {
                onFinish();
            }, 500);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
            setLoading(false);
        }
    };

    return (
        <Card className="w-full shadow-lg border-t-4 border-t-green-600">
            <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">You're All Set!</CardTitle>
                <CardDescription>
                    Your restaurant is ready to verify. Here is your unique QR code.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 flex flex-col items-center">
                
                <div className="bg-white p-4 border rounded-xl shadow-sm text-center">
                    <img src={qrUrl} alt="Restaurant QR" className="mx-auto" />
                    <p className="mt-2 text-xs text-gray-400 font-mono break-all max-w-[200px]">
                        {window.location.host}/{outletId}
                    </p>
                </div>

                <div className="text-center max-w-sm text-gray-600">
                    <p>Customers can scan this code to browse your menu and place orders (if enabled).</p>
                    <Button variant="outline" size="sm" className="mt-4 gap-2">
                        <Download className="h-4 w-4" /> Download QR Pack
                    </Button>
                </div>

                <div className="w-full pt-4">
                    <Button 
                        onClick={handleFinish} 
                        disabled={loading}
                        className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-md shadow-green-200"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Launch Dashboard"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default Step5QRReady;
