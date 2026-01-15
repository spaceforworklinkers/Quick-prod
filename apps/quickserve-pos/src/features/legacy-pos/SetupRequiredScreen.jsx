import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { UtensilsCrossed, Settings, LayoutGrid } from 'lucide-react';

export const SetupRequiredScreen = ({ missingItems, setActiveView }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-lg w-full shadow-xl border-orange-100">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                        <UtensilsCrossed className="w-8 h-8 text-orange-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Let's Get Started!</CardTitle>
                    <CardDescription>Your QuickServe POS is almost ready.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <p className="text-center text-gray-600 mb-4">
                        We noticed a few things are missing. Please complete the setup to start taking orders.
                    </p>
                    
                    <div className="space-y-3">
                        {missingItems.includes('menu') && (
                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><LayoutGrid size={20}/></div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm">Add Menu Items</h4>
                                    <p className="text-xs text-gray-500">Add at least one category and item.</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setActiveView('menu')}>Go</Button>
                            </div>
                        )}
                        {missingItems.includes('tables') && (
                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><LayoutGrid size={20}/></div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm">Setup Tables</h4>
                                    <p className="text-xs text-gray-500">Create your floor plan.</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setActiveView('settings')}>Go</Button>
                            </div>
                        )}
                         {missingItems.includes('settings') && (
                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Settings size={20}/></div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm">Review Settings</h4>
                                    <p className="text-xs text-gray-500">Check taxes and billing info.</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setActiveView('settings')}>Go</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t border-gray-100 justify-center text-xs text-gray-400 py-4">
                    QuickServe Setup Assistant
                </CardFooter>
            </Card>
        </div>
    );
};
