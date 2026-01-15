import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Bell, 
  ShieldCheck, 
  Mail, 
  Save, 
  Loader2, 
  Globe, 
  Smartphone,
  Server,
  Key,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

/**
 * SYSTEM SETTINGS (DEFINITIVE)
 * For: OWNER_SUPER_ADMIN ONLY
 */
export const PlatformSettings = () => {
    const { toast } = useToast();
    const [activeSection, setActiveSection] = useState('platform');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast({ title: "Settings Updated", description: "Platform configuration has been synchronized." });
        }, 1200);
    };

    const sections = [
        { id: 'platform', label: 'Platform config', icon: Globe },
        { id: 'security', label: 'Security & Auth', icon: ShieldCheck },
        { id: 'email', label: 'Communications', icon: Mail },
        { id: 'monitoring', label: 'System Health', icon: Server }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">System Settings</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Global platform configuration and security policies</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-xs font-bold px-6 text-white shadow-md">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                    Commit Changes
                </Button>
            </div>

            <div className="flex gap-10">
                {/* Vertical Navigation */}
                <aside className="w-56 shrink-0 space-y-1">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                activeSection === section.id
                                    ? 'bg-white border border-gray-200 text-orange-600 shadow-sm font-bold'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-[13px] font-medium'
                            }`}
                        >
                            <section.icon className={`w-4 h-4 ${activeSection === section.id ? 'opacity-100' : 'opacity-40'}`} />
                            <span className="truncate">{section.label}</span>
                        </button>
                    ))}
                </aside>

                {/* Content Panel */}
                <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-10 shadow-sm relative overflow-hidden">
                    {/* Background Subtle Pattern */}
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                        <Settings className="w-64 h-64 rotate-12" />
                    </div>

                    <div className="relative z-10 max-w-2xl">
                        {activeSection === 'platform' && (
                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">Branding & Environment</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Platform Name</Label>
                                            <Input defaultValue="QuickServe POS" className="h-10 text-xs font-medium border-gray-100 bg-gray-50/50" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Support URL</Label>
                                            <Input defaultValue="https://support.quickserve.com" className="h-10 text-xs font-medium border-gray-100 bg-gray-50/50" />
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-gray-50" />

                                <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Key className="w-4 h-4 text-orange-600" /> API Gateway
                                    </h3>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                         <p className="text-[11px] font-medium text-gray-500 leading-relaxed">External API access is restricted to verified integrations. Changes to the gateway settings may affect outlet connectivity.</p>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="space-y-8">
                                 <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">Authentication Policies</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Enforce Multi-Factor (MFA)</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Require MFA for all Platform Admins</p>
                                            </div>
                                            <div className="w-10 h-5 bg-orange-600 rounded-full flex items-center justify-end p-1"><div className="w-3 h-3 bg-white rounded-full shadow-sm" /></div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-xl opacity-60">
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">IP Whitelisting</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Restrict access to office IP range</p>
                                            </div>
                                            <div className="w-10 h-5 bg-gray-200 rounded-full flex items-center justify-start p-1"><div className="w-3 h-3 bg-white rounded-full shadow-sm" /></div>
                                        </div>
                                    </div>
                                 </section>
                            </div>
                        )}

                        {activeSection === 'monitoring' && (
                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-6">Database Health</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                                            <div className="flex items-center gap-2 mb-2 text-emerald-600">
                                                <Database className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Main Instance</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-700">Healthy (0.4ms lat)</p>
                                        </div>
                                        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                                            <div className="flex items-center gap-2 mb-2 text-blue-600">
                                                <Smartphone className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Push Service</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-700">Operational</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
