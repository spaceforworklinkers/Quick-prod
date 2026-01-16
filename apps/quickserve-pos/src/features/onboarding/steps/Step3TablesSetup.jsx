import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingService } from '@/services/OnboardingService';
import { supabase } from '@/lib/supabase';
import { Loader2, LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Step3TablesSetup = ({ outletId, onNext, onBack }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [tableCount, setTableCount] = useState(5); // Default suggestion
    const [existingTables, setExistingTables] = useState([]);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchTables();
    }, [outletId]);

    const fetchTables = async () => {
        const { data } = await supabase
            .from('restaurant_tables')
            .select('*')
            .eq('restaurant_id', outletId)
            .order('table_number');
        if (data) setExistingTables(data);
    };

    const handleAutoGenerate = async () => {
        if (tableCount < 1) return;
        setGenerating(true);
        try {
            // Logic: Create N tables. 
            // Warning: This could duplicate if not careful, but for onboarding we assume clean slate or append.
            // Let's check max table number currently.
            // Simplified: Just insert loop.
            
            const tablesToInsert = [];
            const startNum = existingTables.length + 1;
            
            for (let i = 0; i < tableCount; i++) {
                tablesToInsert.push({
                    restaurant_id: outletId,
                    table_number: `${startNum + i}`,
                    capacity: 4, // Default
                    floor: 'Main'
                });
            }

            const { error } = await supabase
                .from('restaurant_tables')
                .insert(tablesToInsert);

            if (error) throw error;
            
            toast({ title: `Generated ${tableCount} tables` });
            await fetchTables();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setGenerating(false);
        }
    };
    
    const handleContinue = async () => {
        // if (existingTables.length === 0) {
        //     // OPTIONAL: Warn but allow? Or strictly existing logic?
        //     // QSR Update: Allow 0 tables.
        // }

        setLoading(true);
        try {
            await OnboardingService.completeTableStep(outletId, existingTables.length);
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
                <CardTitle>Setup Tables</CardTitle>
                <CardDescription>
                    How many tables do you have? We'll create identifiers for them.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {existingTables.length === 0 ? (
                    <div className="bg-blue-50 p-6 rounded-lg text-center border border-blue-100">
                        <LayoutGrid className="mx-auto h-12 w-12 text-blue-500 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Quick Generate</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter the number of tables in your restaurant to auto-generate them.
                        </p>
                        <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
                            <Input 
                                type="number" 
                                min="1" 
                                max="100" 
                                value={tableCount} 
                                onChange={(e) => setTableCount(parseInt(e.target.value) || '')}
                                className="w-24 text-center bg-white" 
                            />
                            <Button onClick={handleAutoGenerate} disabled={generating || !tableCount}>
                                {generating ? <Loader2 className="animate-spin h-4 w-4" /> : "Generate"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span className="text-green-800 font-medium">{existingTables.length} Tables Configured</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setExistingTables([])} className="text-xs text-red-500 hover:text-red-700 h-auto p-0 hover:bg-transparent">
                                Needs Reset? (Contact Support)
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border rounded bg-gray-50/50">
                            {existingTables.map(t => (
                                <div key={t.id} className="bg-white border rounded p-2 text-center text-sm font-semibold shadow-sm">
                                    T-{t.table_number}
                                </div>
                            ))}
                        </div>
                        
                        <div className="text-center">
                            <p className="text-xs text-gray-400">You can edit capacities and floor plans later in Settings.</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onBack} disabled={loading}>Back</Button>
                    <Button 
                        onClick={handleContinue} 
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                        {existingTables.length === 0 ? "Skip (No Tables)" : "Save & Continue"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Missing import fix
import { CheckCircle2 } from 'lucide-react';

export default Step3TablesSetup;
