import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { OnboardingService } from '@/services/OnboardingService';
import { Loader2, Percent } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Step4TaxConfig = ({ outletId, onNext, onBack }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [hasTax, setHasTax] = useState(true);
    const [taxRate, setTaxRate] = useState('5');
    const [taxName, setTaxName] = useState('GST');

    const handleContinue = async () => {
        setLoading(true);
        try {
            const settings = {
                tax_enabled: hasTax,
                tax_rate: hasTax ? parseFloat(taxRate) : 0,
                tax_name: taxName
            };
            
            await OnboardingService.updateTaxConfig(outletId, settings);
            onNext();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full shadow-lg border-t-4 border-t-orange-600">
            <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
                <CardDescription>
                    Configure how taxes are calculated for your orders.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-0.5">
                        <Label className="text-base">Enable Tax</Label>
                        <p className="text-sm text-gray-500">Apply tax to all orders</p>
                    </div>
                    <Switch checked={hasTax} onCheckedChange={setHasTax} />
                </div>

                {hasTax && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        {/* Presets */}
                        <div className="flex gap-2">
                            {['GST 5%', 'GST 12%', 'GST 18%', 'VAT 5%'].map(preset => (
                                <Button
                                    key={preset}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const [name, rate] = preset.split(' ');
                                        setTaxName(name);
                                        setTaxRate(rate.replace('%', ''));
                                    }}
                                    className="text-xs"
                                >
                                    {preset}
                                </Button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tax Name</Label>
                                <Input 
                                    value={taxName} 
                                    onChange={(e) => setTaxName(e.target.value)} 
                                    placeholder="e.g. GST, VAT" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tax Rate (%)</Label>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        step="0.1"
                                        value={taxRate} 
                                        onChange={(e) => setTaxRate(e.target.value)} 
                                        className="pl-9"
                                    />
                                    <Percent className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-100">
                    <strong>Note:</strong> You can configure more advanced tax rules, service charges, and individual item taxes later in the full settings menu.
                </div>

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onBack} disabled={loading}>Back</Button>
                    <Button 
                        onClick={handleContinue} 
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                        Save & Continue
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default Step4TaxConfig;
