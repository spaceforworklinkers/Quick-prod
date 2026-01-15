import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, LogOut, Building2 } from 'lucide-react';
import { ROLES } from '@/config/permissions';

export default function PlatformAdmin() {
    const { user, role, login, logout, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [restaurants, setRestaurants] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newRestName, setNewRestName] = useState('');

    useEffect(() => {
        if (user && role === ROLES.OWNER) { // Owner/SuperAdmin (mapped in permissions)
             fetchRestaurants();
        }
    }, [user, role]);

    const fetchRestaurants = async () => {
        const { data, error } = await supabase.from('restaurants').select('*');
        if (!error && data) setRestaurants(data);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { success, error } = await login(email, password);
        setLoading(false);
        if (!success) setError(error);
    };

    const handleLogout = async () => {
        await logout();
    };

    const createRestaurant = async () => {
        if (!newRestName) return;
        setLoading(true);
        // Create Logic (Simulated or Real if schema supports)
        // Ideally we need an Owner ID logic, but for now just create the record
        // Assuming current user is owner for testing
        const { data: owner } = await supabase.from('restaurant_owners').select('id').eq('user_id', user.id).single();
        
        if (owner) {
             const { error } = await supabase.from('restaurants').insert({
                 owner_id: owner.id,
                 name: newRestName,
                 subscription_status: 'active'
             });
             if (!error) {
                 setNewRestName('');
                 setShowCreate(false);
                 fetchRestaurants();
             } else {
                 setError(error.message);
             }
        }
        setLoading(false);
    };

    if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Platform Admin Login</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : 'Login'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // Simple Guard
    if (role !== ROLES.OWNER && role !== 'OWNER_SUPER_ADMIN') {
        return <div className="p-8 text-center text-red-500">Access Denied. You are not a Platform Admin. ({role}) <Button variant="link" onClick={logout}>Logout</Button></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b px-8 h-16 flex items-center justify-between">
                <h1 className="font-bold text-lg">QuickServe Platform</h1>
                <div className="flex items-center gap-4">
                    <span>{user.email}</span>
                    <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
                </div>
            </header>

            <main className="p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Restaurants / Tenants</h2>
                    <Button onClick={() => setShowCreate(!showCreate)}><Plus className="w-4 h-4 mr-2" /> New Restaurant</Button>
                </div>

                {showCreate && (
                    <Card className="mb-6">
                        <CardContent className="pt-6 flex gap-4">
                            <Input placeholder="Restaurant Name" value={newRestName} onChange={e => setNewRestName(e.target.value)} />
                            <Button onClick={createRestaurant} disabled={loading}>Create</Button>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {restaurants.map(rest => (
                        <Card key={rest.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">status: {rest.subscription_status}</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{rest.name}</div>
                                <p className="text-xs text-muted-foreground">{rest.city}, {rest.state}</p>
                                <div className="mt-4 pt-4 border-t text-xs text-gray-400 font-mono select-all">
                                    ID: {rest.id}
                                </div>
                                <Button className="w-full mt-4" variant="secondary" onClick={() => window.open(`/${rest.id}`, '_blank')}>
                                    Open POS
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {restaurants.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No restaurants found.</p>}
                </div>
            </main>
        </div>
    );
}
