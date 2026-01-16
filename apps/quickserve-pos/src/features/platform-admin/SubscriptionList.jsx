import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CreditCard, MoreHorizontal, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SubscriptionList = ({ subscriptions, onViewDetails, onExtend }) => {
  
  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
      expiring_soon: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      expired: 'bg-red-100 text-red-800 hover:bg-red-200',
      cancelled: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      trial: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    };
    
    // Normalize status
    const statusKey = status?.toLowerCase() || 'default';
    const className = styles[statusKey] || 'bg-gray-100 text-gray-800';
    
    return <Badge className={className}>{status?.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Outlet Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Proof</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No subscriptions found.
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((sub) => {
              const daysRemaining = calculateDaysRemaining(sub.end_date);
              
              return (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {sub.restaurant?.name || 'Unknown Outlet'}
                    <div className="text-xs text-muted-foreground">{sub.restaurant?.phone}</div>
                  </TableCell>
                  <TableCell>
                    {sub.restaurant?.owner?.user?.full_name || 'N/A'}
                    <div className="text-xs text-muted-foreground">{sub.restaurant?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="capitalize">{sub.subscription_type?.replace('_', ' ')}</div>
                    <div className="text-xs text-muted-foreground">₹{sub.amount}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(sub.status)}
                  </TableCell>
                  <TableCell>
                     <div className={daysRemaining < 7 ? "text-orange-600 font-bold" : ""}>
                        {new Date(sub.end_date).toLocaleDateString()}
                     </div>
                     <div className="text-xs text-muted-foreground">
                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                     </div>
                  </TableCell>
                  <TableCell>
                    {sub.payment_proof_url ? (
                        <a 
                            href={sub.payment_proof_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline text-xs"
                        >
                            <Download className="h-3 w-3" /> View Proof
                        </a>
                    ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewDetails(sub)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExtend(sub)}>
                            <CreditCard className="mr-2 h-4 w-4" /> Extend Plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubscriptionList;
