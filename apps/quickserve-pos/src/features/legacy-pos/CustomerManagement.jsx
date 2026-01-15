
import React, { useState, useEffect } from 'react';
import { Users, Search, Download, Calendar, Mail, Phone, DollarSign, Trash2, UserMinus, MessageCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOutlet } from '@/context/OutletContext';

const CustomerManagement = () => {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inactive Customers
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [selectedInactiveCustomer, setSelectedInactiveCustomer] = useState(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  
  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const predefinedMessages = [
      "Hey {{name}}! We've missed you ☕ Drop by this week and enjoy something special.",
      "It's been a while since your last visit 😊 Come by soon for a fresh experience.",
      "Your favorite spot is waiting for you ☕ See you again soon!",
      "We've added some exciting options recently – visit us again!",
      "Missing our regulars ❤️ Drop in anytime this week.",
      "A warm cup and a warm welcome await you ☕",
      "Come back this week and treat yourself!"
  ];

  useEffect(() => {
    fetchCustomers();
  }, [outletId]);

  const fetchCustomers = async () => {
    if (!outletId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', outletId)
        .order('last_visit', { ascending: false });

      if (error) throw error;

      setCustomers(data || []);
      setFilteredCustomers(data || []);
      
      // Process inactive list
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const inactive = (data || []).filter(c => {
          if (!c.last_visit) return false;
          return new Date(c.last_visit) < thirtyDaysAgo;
      });
      setInactiveCustomers(inactive);

    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load customer data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        (customer.name && customer.name.toLowerCase().includes(term)) ||
        (customer.mobile && customer.mobile.includes(term)) ||
        (customer.email && customer.email.toLowerCase().includes(term))
      );
      setFilteredCustomers(filtered);
    }
  };

  const confirmDelete = (customer) => {
      setCustomerToDelete(customer);
      setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
      if (!customerToDelete || !outletId) return;

      try {
          const { error } = await supabase
              .from('customers')
              .delete()
              .eq('id', customerToDelete.id)
              .eq('restaurant_id', outletId); // Safety

          if (error) throw error;

          toast({ title: 'Deleted', description: 'Customer deleted successfully.' });
          fetchCustomers();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
          setDeleteDialogOpen(false);
          setCustomerToDelete(null);
      }
  };

  const openMessageDialog = (customer) => {
      setSelectedInactiveCustomer(customer);
      setMessageDialogOpen(true);
  };

const handleSendMessage = (template) => {
  if (!selectedInactiveCustomer || !selectedInactiveCustomer.mobile) return;

  const name = selectedInactiveCustomer.name || 'Friend';

  // Build message
  let message = template.replace('{{name}}', name);

  // IMPORTANT: normalize unicode (prevents corruption)
  message = message.normalize("NFC");

  // Encode ONLY once
  const encodedMessage = encodeURIComponent(message);

  const url = `https://api.whatsapp.com/send?phone=91${selectedInactiveCustomer.mobile}&text=${encodedMessage}`;

  window.open(url, '_blank');
  setMessageDialogOpen(false);
};

  const exportToCSV = () => {
    if (customers.length === 0) {
      toast({ title: "No data", description: "No customers to export." });
      return;
    }

    // CSV Headers
    const headers = ["Customer Name", "Mobile Number", "Email", "Total Visits", "Total Spent", "Last Visit", "Joined Date"];
    
    // CSV Rows
    const rows = customers.map(c => [
      c.name || 'N/A',
      c.mobile || 'N/A',
      c.email || 'N/A',
      c.total_visits,
      (c.total_spent || 0).toFixed(2),
      new Date(c.last_visit).toLocaleDateString(),
      new Date(c.created_at).toLocaleDateString()
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `QuickServe_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getDaysSinceLastVisit = (dateString) => {
      if (!dateString) return 'N/A';
      const last = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - last);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-600" />
            Customer Management
          </h2>
          <p className="text-gray-500 mt-1">View and manage your loyal customer base.</p>
        </div>
        <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white">
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
         <TabsList className="mb-6">
            <TabsTrigger value="all">All Customers</TabsTrigger>
            <TabsTrigger value="inactive" className="text-red-600 data-[state=active]:bg-red-50">Inactive Customers ({inactiveCustomers.length})</TabsTrigger>
         </TabsList>
         
         <TabsContent value="all">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                    placeholder="Search by name, phone or email..." 
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-9 bg-white"
                    />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    Total Customers: {filteredCustomers.length}
                </div>
                </div>

                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-3 text-left">Customer</th>
                        <th className="px-6 py-3 text-left">Contact Info</th>
                        <th className="px-6 py-3 text-left">Stats</th>
                        <th className="px-6 py-3 text-left">Joined</th>
                        <th className="px-6 py-3 text-left">Last Visit</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading customers...</td></tr>
                    ) : filteredCustomers.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-500">No customers found matching your search.</td></tr>
                    ) : (
                        filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{customer.name || 'Unknown Guest'}</div>
                            <div className="text-xs text-gray-400">ID: {customer.id.slice(0, 8)}...</div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                    {customer.mobile}
                                </div>
                                {customer.email && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                        {customer.email}
                                    </div>
                                )}
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-orange-600">{customer.total_visits}</span>
                                    <span className="text-[10px] text-gray-500 uppercase">Visits</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-green-600">₹{(customer.total_spent || 0).toFixed(0)}</span>
                                    <span className="text-[10px] text-gray-500 uppercase">Spent</span>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                {new Date(customer.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                {new Date(customer.last_visit).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => confirmDelete(customer)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
                </div>
            </div>
         </TabsContent>

         <TabsContent value="inactive">
            <div className="bg-white rounded-xl shadow-sm border border-red-100">
                <div className="p-4 border-b border-red-100 bg-red-50/30">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UserMinus className="h-5 w-5 text-red-500" /> Inactive List (30+ Days)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Customers who haven't visited in over a month. Send them a message to bring them back!</p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3 text-left">Customer</th>
                                <th className="px-6 py-3 text-left">Mobile</th>
                                <th className="px-6 py-3 text-left">Last Visit</th>
                                <th className="px-6 py-3 text-left">Days Since</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {inactiveCustomers.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No inactive customers found. Good job retaining them!</td></tr>
                            ) : (
                                inactiveCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-red-50/30">
                                        <td className="px-6 py-4 font-medium text-gray-900">{customer.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-gray-600">{customer.mobile}</td>
                                        <td className="px-6 py-4 text-gray-600">{new Date(customer.last_visit).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">
                                                {getDaysSinceLastVisit(customer.last_visit)} days
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {customer.mobile && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openMessageDialog(customer)}>
                                                    <MessageCircle className="h-3 w-3 mr-2" /> WhatsApp
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
         </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete Customer</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete <strong>{customerToDelete?.name || customerToDelete?.mobile}</strong>? 
                    This action cannot be undone and will remove their history.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete Customer</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* WhatsApp Message Selection Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent className="max-w-md">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-green-600" /> Select Message
                  </DialogTitle>
                  <DialogDescription>
                      Choose a template to send to <strong>{selectedInactiveCustomer?.name || 'Customer'}</strong> via WhatsApp.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-2">
                  {predefinedMessages.map((msg, idx) => (
                      <button 
                        key={idx}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-sm text-gray-700 group"
                        onClick={() => handleSendMessage(msg)}
                      >
                          <div className="flex justify-between items-start">
                              <span>{msg.replace('{{name}}', selectedInactiveCustomer?.name || 'Friend')}</span>
                              <div className="opacity-0 group-hover:opacity-100 text-green-600">
                                  <Copy className="h-4 w-4" />
                              </div>
                          </div>
                      </button>
                  ))}
              </div>
              
              <DialogFooter>
                  <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>Cancel</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;