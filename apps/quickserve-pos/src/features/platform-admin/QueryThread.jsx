import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { ConversionRequestService } from '@/services/ConversionRequestService';
import { MessageSquare, Send } from 'lucide-react';

const QueryThread = ({ queries, requestId, requestStatus, userId, userRole, onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const canReply = userRole === 'SALESPERSON' && requestStatus === 'query_from_manager';

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a reply message'
      });
      return;
    }

    setLoading(true);
    try {
      const result = await ConversionRequestService.replySalespersonQuery(requestId, replyMessage, userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Reply sent to manager'
        });
        setReplyMessage('');
        setShowReplyForm(false);
        if (onUpdate) onUpdate();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to send reply'
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-orange-600" />
          Query Thread
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Query List */}
          {queries.map((query, index) => {
            const isManagerQuery = query.query_type === 'manager_query';
            
            return (
              <div
                key={query.id}
                className={`flex gap-3 ${isManagerQuery ? '' : 'flex-row-reverse'}`}
              >
                <Avatar className={isManagerQuery ? 'bg-purple-100' : 'bg-blue-100'}>
                  <AvatarFallback className={isManagerQuery ? 'text-purple-700' : 'text-blue-700'}>
                    {getInitials(query.created_by_user?.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 ${isManagerQuery ? '' : 'text-right'}`}>
                  <div className={`inline-block max-w-[80%] ${isManagerQuery ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${isManagerQuery ? 'text-purple-700' : 'text-blue-700'}`}>
                        {query.created_by_user?.full_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(query.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{query.message}</p>
                  </div>
                  
                  <div className={`text-xs text-gray-500 mt-1 ${isManagerQuery ? 'text-left' : 'text-right'}`}>
                    {isManagerQuery ? 'Manager Query' : 'Salesperson Reply'}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Reply Form */}
          {canReply && (
            <div className="pt-4 border-t">
              {showReplyForm ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your reply here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyMessage('');
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReply}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowReplyForm(true)}
                  variant="outline"
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Reply to Manager
                </Button>
              )}
            </div>
          )}

          {!canReply && requestStatus === 'query_from_manager' && userRole !== 'SALESPERSON' && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 text-center italic">
                Waiting for salesperson's reply...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QueryThread;
