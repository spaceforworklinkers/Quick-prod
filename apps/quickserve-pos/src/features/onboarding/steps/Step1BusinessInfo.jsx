import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingService } from '@/services/OnboardingService';
import { Loader2 } from 'lucide-react';

const Step1BusinessInfo = ({ outletId, initialData, onNext }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        address: initialData?.address || '',
        phone: initialData?.phone || '',
        gst: initialData?.gst_number || '' // Assuming we fetch this too, though service didn't select it specifically. 
        // Need to update service to select gst_number if it exists or pass logic. 
        // Assuming initialData might have it or we start blank.
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'phone') {
            // Strict 10 digit validation
            if (/^\d{0,10}$/.test(value)) {
                setFormData({ ...formData, [name]: value });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const isPhoneValid = formData.phone && formData.phone.length === 10;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isPhoneValid) {
            alert("Phone number must be exactly 10 digits.");
            return;
        }

        setLoading(true);
        try {
            await OnboardingService.updateBusinessInfo(outletId, formData);
            onNext(2);
        } catch (error) {
            console.error("Failed to save business info", error);
            alert("Failed to save. Please ensure you ran the '51_add_onboarding_cols.sql' migration. Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full shadow-lg border-t-4 border-t-orange-600">
            <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                    Tell us about your restaurant. This will appear on receipts and the digital menu.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Restaurant Name *</Label>
                        <Input 
                            id="name" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            placeholder="e.g. The Burger Joint" 
                            required 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input 
                            id="address" 
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange} 
                            placeholder="Street, City, Zip" 
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Contact Number *</Label>
                            <Input 
                                id="phone" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                placeholder="9876543210" 
                                required 
                                type="tel"
                                inputMode="numeric"
                            />
                            {!isPhoneValid && formData.phone.length > 0 && (
                                <p className="text-xs text-red-500">Must be 10 digits</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gst">GST Number (Optional)</Label>
                            <Input 
                                id="gst" 
                                name="gst" 
                                value={formData.gst} 
                                onChange={handleChange} 
                                placeholder="GSTIN..." 
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button 
                            type="submit" 
                            disabled={loading || !formData.name || !formData.address || !isPhoneValid}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                             {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                             Save & Continue
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default Step1BusinessInfo;
