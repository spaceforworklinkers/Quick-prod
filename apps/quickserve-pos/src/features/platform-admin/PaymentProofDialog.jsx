import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { SubscriptionService } from '@/services/SubscriptionService';
import { Loader2, Upload, FileImage } from 'lucide-react';

const PaymentProofDialog = ({ isOpen, onClose, subscription, onSuccess }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    
    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const result = await SubscriptionService.uploadPaymentProof(subscription.restaurant_id, file);
            
            if (result.success) {
                toast({ title: "Proof Uploaded", description: "Payment document saved." });
                onSuccess();
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Upload Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Payment Proof</DialogTitle>
                    <DialogDescription>
                        View or upload payment verification for {subscription?.restaurant?.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* View Existing */}
                    {subscription?.payment_proof_url ? (
                         <div className="border rounded-lg p-2 bg-gray-50 text-center">
                             <a 
                                 href={subscription.payment_proof_url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                             >
                                <img 
                                    src={subscription.payment_proof_url} 
                                    alt="Payment Proof" 
                                    className="max-h-64 mx-auto rounded shadow-sm hover:opacity-90 transition-opacity"
                                />
                                <p className="text-xs text-blue-600 mt-2 underline">Click to enlarge</p>
                             </a>
                         </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 border border-dashed rounded-lg text-gray-400">
                             <FileImage className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                             No proof submitted yet
                        </div>
                    )}

                    {/* Upload New */}
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="proof">Manual Upload (Admin Override)</Label>
                        <Input 
                            id="proof" 
                            type="file" 
                            accept="image/*,application/pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={handleUpload} disabled={loading || !file} className="bg-emerald-600 hover:bg-emerald-700">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <> <Upload className="mr-2 h-4 w-4"/> Upload New Proof </>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentProofDialog;
