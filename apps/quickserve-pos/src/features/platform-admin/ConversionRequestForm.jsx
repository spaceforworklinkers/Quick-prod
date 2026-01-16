import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ConversionRequestService } from '@/services/ConversionRequestService';
import { Building2, User, Mail, Phone, Store, Calendar, FileText } from 'lucide-react';

const ConversionRequestForm = ({ onSuccess, userId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    outletName: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    businessType: '',
    subscriptionIntent: 'trial',
    subscriptionType: null,
    trialDuration: 15,
    internalNotes: ''
  });

  const businessTypes = [
    'Café',
    'Restaurant',
    'Hotel',
    'Cloud Kitchen',
    'Bakery',
    'Bar',
    'Food Truck',
    'Catering',
    'Other'
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.outletName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Outlet name is required' });
      return false;
    }
    if (!formData.ownerName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Owner name is required' });
      return false;
    }
    if (!formData.ownerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Valid email is required' });
      return false;
    }
    if (!formData.ownerPhone.trim() || !/^\d{10}$/.test(formData.ownerPhone)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Valid 10-digit phone is required' });
      return false;
    }
    if (!formData.businessType) {
      toast({ variant: 'destructive', title: 'Error', description: 'Business type is required' });
      return false;
    }
    if (formData.subscriptionIntent === 'paid' && !formData.subscriptionType) {
      toast({ variant: 'destructive', title: 'Error', description: 'Subscription type is required for paid plans' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await ConversionRequestService.createRequest(formData, userId);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Conversion request ${result.data.request_number} created successfully`
        });
        
        // Reset form
        setFormData({
          outletName: '',
          ownerName: '',
          ownerEmail: '',
          ownerPhone: '',
          businessType: '',
          subscriptionIntent: 'trial',
          subscriptionType: null,
          trialDuration: 15,
          internalNotes: ''
        });
        
        if (onSuccess) onSuccess(result.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to create request'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-orange-600" />
          New Outlet Conversion Request
        </CardTitle>
        <CardDescription>
          Submit a request to create a new outlet for a converted customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Outlet Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Store className="h-5 w-5 text-gray-600" />
              Outlet Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outletName">Outlet Name *</Label>
                <Input
                  id="outletName"
                  placeholder="e.g., Café Delight"
                  value={formData.outletName}
                  onChange={(e) => handleChange('outletName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={formData.businessType} onValueChange={(value) => handleChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Owner Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              Owner Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  placeholder="Full name"
                  value={formData.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Owner Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="email@example.com"
                    className="pl-10"
                    value={formData.ownerEmail}
                    onChange={(e) => handleChange('ownerEmail', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerPhone">Owner Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="ownerPhone"
                    type="tel"
                    placeholder="10-digit number"
                    className="pl-10"
                    value={formData.ownerPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleChange('ownerPhone', value);
                    }}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Subscription Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriptionIntent">Subscription Intent *</Label>
                <Select 
                  value={formData.subscriptionIntent} 
                  onValueChange={(value) => {
                    handleChange('subscriptionIntent', value);
                    if (value === 'trial') {
                      handleChange('subscriptionType', null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.subscriptionIntent === 'trial' && (
                <div className="space-y-2">
                  <Label htmlFor="trialDuration">Trial Duration *</Label>
                  <Select 
                    value={formData.trialDuration.toString()} 
                    onValueChange={(value) => handleChange('trialDuration', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.subscriptionIntent === 'paid' && (
                <div className="space-y-2">
                  <Label htmlFor="subscriptionType">Subscription Type *</Label>
                  <Select 
                    value={formData.subscriptionType || ''} 
                    onValueChange={(value) => handleChange('subscriptionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="internalNotes" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              Internal Notes (Optional)
            </Label>
            <Textarea
              id="internalNotes"
              placeholder="Any additional notes for the manager..."
              value={formData.internalNotes}
              onChange={(e) => handleChange('internalNotes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  outletName: '',
                  ownerName: '',
                  ownerEmail: '',
                  ownerPhone: '',
                  businessType: '',
                  subscriptionIntent: 'trial',
                  subscriptionType: null,
                  trialDuration: 15,
                  internalNotes: ''
                });
              }}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ConversionRequestForm;
