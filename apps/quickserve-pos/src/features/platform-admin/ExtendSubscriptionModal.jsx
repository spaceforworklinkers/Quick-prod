import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { SubscriptionService } from '@/services/SubscriptionService';
import { Loader2 } from 'lucide-react';

const ExtendSubscriptionModal = ({ isOpen, onClose, subscription, onSuccess }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [extensionDays, setExtensionDays] = useState('30');
    
    const handleExtend = async () => {
        setLoading(true);
        try {
            const days = parseInt(extensionDays);
            const result = await SubscriptionService.extendSubscription(subscription.restaurant_id, days);
            
            if (result.success) {
                toast({ 
                    title: "Extension Successful", 
                    description: `Subscription extended by ${days} days.` 
                });
                onSuccess();
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({ 
                variant: 'destructive',
                title: "Extension Failed", 
                description: error.message 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Extend Subscription</DialogTitle>
                    <DialogDescription>
                        Manually extend the subscription period for <strong>{subscription?.restaurant?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="days" className="text-right">
                            Extend By
                        </Label>
                        <Select value={extensionDays} onValueChange={setExtensionDays}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7 Days (Week)</SelectItem>
                                <SelectItem value="30">30 Days (Month)</SelectItem>
                                <SelectItem value="90">90 Days (Quarter)</SelectItem>
                                <SelectItem value="365">365 Days (Year)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                        Current Expiry: {new Date(subscription?.end_date).toLocaleDateString()}
                        <br/>
                        New Expiry: { (() => {
                             const d = new Date(subscription?.end_date);
                             d.setDate(d.getDate() + parseInt(extensionDays));
                             return d.toLocaleDateString();
                        })()}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleExtend} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Extension"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExtendSubscriptionModal;
