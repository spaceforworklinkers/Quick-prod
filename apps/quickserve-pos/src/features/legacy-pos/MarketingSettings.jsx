import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Share2, Sparkles, Heart, Users, Calendar, Megaphone, Gift, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const WHATSAPP_TEMPLATES = [
  { id: 'tpl1', text: "Hi, thanks for visiting {{cafe_name}}. Your bill is {{final_amount}}. View details: {{invoice_url}}" },
  { id: 'tpl2', text: "Here is your invoice from {{cafe_name}}: {{invoice_url}}. Total Amount: {{final_amount}}. Hope to see you again!" },
  { id: 'tpl3', text: "Your order is complete! Total: {{final_amount}}. You saved {{discount}} today! Invoice: {{invoice_url}}" },
  { id: 'tpl4', text: "Thanks for dining at {{cafe_name}}! 🧾 Bill: {{final_amount}}. View PDF: {{invoice_url}}" },
  { id: 'tpl5', text: "Hello from {{cafe_name}}! 👋 Your total bill is {{final_amount}}. Download invoice: {{invoice_url}}" },
  { id: 'tpl6', text: "Payment received of {{final_amount}} at {{cafe_name}}. We hope you enjoyed the food! Invoice: {{invoice_url}}" },
  { id: 'tpl7', text: "Digital Receipt: {{invoice_url}} | Total: {{final_amount}} | {{cafe_name}}" }
];

const FOOTER_TEMPLATES = [
  { id: 'option1', text: "Thank you for visiting! We hope to serve you again." },
  { id: 'option2', text: "We hope you enjoyed your meal! Have a great day." },
  { id: 'option3', text: "Follow us on social media for daily specials!" },
  { id: 'option4', text: "Your satisfaction is our priority. Let us know how we did!" },
  { id: 'option5', text: "Made with love, served with a smile." },
  { id: 'option6', text: "Tag us in your photos to get featured!" },
  { id: 'option7', text: "Ask our staff about our loyalty program!" }
];

const MarketingSettings = ({ settings, onUpdate }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("whatsapp");
  
  // State Initialization
  const [whatsappConfig, setWhatsappConfig] = useState({
    enabled: false,
    message_type: 'template',
    selected_template_id: 'tpl1',
    custom_text: 'Thank you for dining at {{cafe_name}}! Your bill is {{final_amount}}.',
  });

  const [engagementConfig, setEngagementConfig] = useState({
    footer_message: { 
      enabled: true, 
      message_type: 'template',
      selected_template_id: 'option1',
      custom_text: '',
    },
    action_link: { 
      enabled: false, 
      link_type: 'Leave a Review', 
      url: '',
    },
    promo_tools: {} // Container for promo tool state if we want to persist it
  });

  const [repeatVisitConfig, setRepeatVisitConfig] = useState({
    enabled: false,
    milestones: [
      { visits: 2, message: "Welcome back! Great to see you again." },
      { visits: 5, message: "You're one of our favorites! Thanks for the support." },
      { visits: 10, message: "A true regular! We appreciate your loyalty." }
    ],
  });

  const [groupVisitConfig, setGroupVisitConfig] = useState({
    enabled: false,
    message: "Loved the food? Bring your squad next time for even more fun!",
  });

  const [eventConfig, setEventConfig] = useState({
    enabled: false,
    custom_events: [
        { name: "Weekend Special", message: "Join us this weekend for live music!", active: true }
    ],
  });

  // --- Promo Tools State (Ephemeral Generator) ---
  const [promoToolType, setPromoToolType] = useState('bogo');
  const [promoToolInputs, setPromoToolInputs] = useState({
      item_name: '', quantity: '1', discount_val: '', condition: '', event_name: ''
  });
  const [generatedPromoText, setGeneratedPromoText] = useState('');

  // --- PERSISTENCE FIX: Sync state with props whenever settings prop changes ---
  useEffect(() => {
      if (settings) {
          if (settings.whatsapp_settings) setWhatsappConfig(prev => ({...prev, ...settings.whatsapp_settings}));
          if (settings.engagement_settings) setEngagementConfig(prev => ({...prev, ...settings.engagement_settings}));
          if (settings.repeat_visit_settings) setRepeatVisitConfig(prev => ({...prev, ...settings.repeat_visit_settings}));
          if (settings.group_visit_settings) setGroupVisitConfig(prev => ({...prev, ...settings.group_visit_settings}));
          if (settings.event_prompt_settings) setEventConfig(prev => ({...prev, ...settings.event_prompt_settings}));
          
          // Legacy Mappings Fix
          if (settings.engagement_settings?.footer_message?.selected_option) {
             const oldOpt = settings.engagement_settings.footer_message.selected_option;
             const isCustom = oldOpt === 'custom';
             setEngagementConfig(prev => ({
                 ...prev,
                 footer_message: { 
                     ...prev.footer_message, 
                     message_type: isCustom ? 'custom' : 'template',
                     selected_template_id: isCustom ? prev.footer_message.selected_template_id : oldOpt 
                 }
             }));
         }
      }
  }, [settings]);


  // Generate Promo Text Logic
  useEffect(() => {
      let text = "";
      const { item_name, quantity, discount_val, condition, event_name } = promoToolInputs;
      const cafeName = settings?.store_name || "Us";

      switch (promoToolType) {
          case 'bogo':
              text = `🍔 BOGO Alert at ${cafeName}! Buy ${quantity} ${item_name || 'Item'} & Get 1 FREE! 🎁 ${condition ? `*${condition}` : ''}`;
              break;
          case 'flat':
              text = `💸 FLAT ₹${discount_val} OFF at ${cafeName}! Enjoy your favorites for less. 🍕 ${condition ? `*${condition}` : ''}`;
              break;
          case 'percentage':
              text = `🎉 Get ${discount_val}% OFF on your next order at ${cafeName}! Don't miss out. 🥳 ${condition ? `*${condition}` : ''}`;
              break;
          case 'event':
              text = `✨ Special Offer for ${event_name || 'Event'}! Visit ${cafeName} and get amazing deals. 🎈 ${condition ? `*${condition}` : ''}`;
              break;
          case 'birthday':
              text = `🎂 Happy Birthday! Treat yourself at ${cafeName} with a special ${discount_val || 'Surprise'} discount! 🍰 ${condition ? `*${condition}` : ''}`;
              break;
          case 'anniversary':
              text = `💑 Happy Anniversary! Celebrate love at ${cafeName} with ${discount_val || 'Special'} off! 🥂 ${condition ? `*${condition}` : ''}`;
              break;
          default: text = "";
      }
      setGeneratedPromoText(text);
  }, [promoToolType, promoToolInputs, settings?.store_name]);


  const handleSave = async () => {
    const finalFooterConfig = {
        ...engagementConfig.footer_message,
        selected_option: engagementConfig.footer_message.message_type === 'custom' ? 'custom' : engagementConfig.footer_message.selected_template_id
    };

    const payload = {
      whatsapp_settings: whatsappConfig,
      engagement_settings: {
          ...engagementConfig,
          footer_message: finalFooterConfig,
          promo_tools: { last_type: promoToolType, last_inputs: promoToolInputs } // Persist tool state if needed
      },
      repeat_visit_settings: repeatVisitConfig,
      group_visit_settings: groupVisitConfig,
      event_prompt_settings: eventConfig
    };
    onUpdate(payload);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(generatedPromoText);
      toast({ title: "Copied!", description: "Promo text copied to clipboard." });
  };

  const safeStr = (str) => str || '';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5 bg-gradient-to-r from-orange-50 to-white -mx-6 px-6 pt-2 rounded-t-xl">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MegaphoneIcon className="w-6 h-6 text-orange-600" /> 
            Marketing & Engagement
          </h3>
          <p className="text-sm text-gray-500 mt-1">Tools to engage customers and promote your store.</p>
        </div>
        <Button onClick={handleSave} className="bg-orange-600 text-white hover:bg-orange-700 shadow-sm transition-all hover:shadow-md">
            Save Changes
        </Button>
      </div>

      <Tabs defaultValue="whatsapp" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-gray-100 p-1.5 mb-8 rounded-lg border border-gray-200 gap-1">
            <TabItem value="whatsapp" icon={<MessageSquare className="w-4 h-4"/>} label="WhatsApp Bill" active={activeTab === 'whatsapp'} />
            <TabItem value="engagement" icon={<Share2 className="w-4 h-4"/>} label="Bill Footer" active={activeTab === 'engagement'} />
            <TabItem value="loyalty" icon={<Heart className="w-4 h-4"/>} label="Loyalty" active={activeTab === 'loyalty'} />
            <TabItem value="events" icon={<Calendar className="w-4 h-4"/>} label="Events" active={activeTab === 'events'} />
            <TabItem value="promotools" icon={<Gift className="w-4 h-4"/>} label="Promo Tools" active={activeTab === 'promotools'} />
        </TabsList>

        {/* 1. WhatsApp Bill Message */}
        <TabsContent value="whatsapp" className="space-y-4 animate-in fade-in-50 duration-300">
          <Card className="border-green-100 shadow-sm">
            <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                <CardTitle className="text-green-800 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5"/> WhatsApp Bill Configuration
                </CardTitle>
                <CardDescription className="text-green-700/80">Configure the message sent when sharing bills via WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                 <div className="space-y-1">
                    <Label className="text-base font-semibold">Enable WhatsApp Bill Sharing</Label>
                    <p className="text-sm text-gray-500">Allows sending bill summaries directly to customer numbers.</p>
                 </div>
                 <Switch 
                    checked={whatsappConfig?.enabled || false} 
                    onCheckedChange={(checked) => setWhatsappConfig({...whatsappConfig, enabled: checked})}
                    className="data-[state=checked]:bg-green-600" 
                 />
              </div>

              {whatsappConfig?.enabled && (
                <div className="space-y-6">
                    <div>
                        <Label className="text-base font-semibold text-gray-800 mb-3 block">Message Type</Label>
                        <RadioGroup 
                            defaultValue="template" 
                            value={whatsappConfig.message_type || 'template'} 
                            onValueChange={(val) => setWhatsappConfig({...whatsappConfig, message_type: val})}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <div className="flex items-center space-x-2 border p-3 rounded-md w-full sm:w-auto hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value="template" id="wa-template" />
                                <Label htmlFor="wa-template" className="cursor-pointer">Use Predefined Template</Label>
                            </div>
                            <div className="flex items-center space-x-2 border p-3 rounded-md w-full sm:w-auto hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value="custom" id="wa-custom" />
                                <Label htmlFor="wa-custom" className="cursor-pointer">Write Custom Message</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {whatsappConfig.message_type === 'template' ? (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <Label>Select a Template</Label>
                             <Select 
                                value={whatsappConfig.selected_template_id} 
                                onValueChange={(val) => setWhatsappConfig({...whatsappConfig, selected_template_id: val})}
                             >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-black">
                                    {WHATSAPP_TEMPLATES.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <span className="line-clamp-1 text-xs">{t.text}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                             <div className="mt-2 p-3 bg-white border rounded text-sm text-gray-700 italic">
                                "{WHATSAPP_TEMPLATES.find(t => t.id === whatsappConfig.selected_template_id)?.text}"
                             </div>
                        </div>
                    ) : (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <Label>Custom Message</Label>
                            <Textarea 
                                placeholder="Enter custom message..." 
                                value={safeStr(whatsappConfig.custom_text)}
                                onChange={(e) => setWhatsappConfig({...whatsappConfig, custom_text: e.target.value})}
                                className="min-h-[100px] bg-white"
                            />
                            <p className="text-xs text-gray-500">Supports emojis and variables.</p>
                        </div>
                    )}
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-2">
                      <p className="font-bold flex items-center gap-2"><Sparkles className="w-3 h-3 text-blue-500"/> Available Variables:</p>
                      <div className="flex flex-wrap gap-2">
                        {['{{cafe_name}}', '{{subtotal}}', '{{discount}}', '{{final_amount}}', '{{invoice_url}}'].map(ph => (
                            <code key={ph} className="bg-white px-2 py-1 border border-blue-200 rounded text-blue-600 font-medium shadow-sm cursor-pointer hover:bg-blue-50" onClick={() => {
                                if(whatsappConfig.message_type === 'custom') {
                                    setWhatsappConfig(prev => ({...prev, custom_text: prev.custom_text + " " + ph}));
                                }
                            }}>{ph}</code>
                        ))}
                      </div>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Bill Engagement */}
        <TabsContent value="engagement" className="space-y-4 animate-in fade-in-50 duration-300">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Share2 className="w-5 h-5"/> Receipt Footer & Links
                </CardTitle>
                <CardDescription className="text-blue-700/80">Customize what appears at the bottom of your printed and digital receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <Label className="text-base font-bold text-gray-900">Footer Message</Label>
                      <Switch 
                          checked={engagementConfig.footer_message.enabled}
                          onCheckedChange={(c) => setEngagementConfig(prev => ({...prev, footer_message: {...prev.footer_message, enabled: c}}))}
                          className="data-[state=checked]:bg-blue-600"
                      />
                  </div>
                  
                  {engagementConfig.footer_message.enabled && (
                      <div className="pl-0 sm:pl-4 border-l-2 border-gray-200 space-y-4">
                           <RadioGroup 
                                value={engagementConfig.footer_message.message_type || 'template'}
                                onValueChange={(val) => setEngagementConfig(prev => ({...prev, footer_message: {...prev.footer_message, message_type: val}}))}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="template" id="foot-tpl" />
                                    <Label htmlFor="foot-tpl">Predefined Template</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="custom" id="foot-cust" />
                                    <Label htmlFor="foot-cust">Custom Text</Label>
                                </div>
                           </RadioGroup>

                           {engagementConfig.footer_message.message_type === 'template' ? (
                               <div className="space-y-2">
                                   <Select 
                                        value={engagementConfig.footer_message.selected_template_id}
                                        onValueChange={(val) => setEngagementConfig(prev => ({...prev, footer_message: {...prev.footer_message, selected_template_id: val}}))}
                                   >
                                       <SelectTrigger>
                                           <SelectValue placeholder="Choose a message" />
                                       </SelectTrigger>
                                       <SelectContent className="bg-white text-black">
                                            {FOOTER_TEMPLATES.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.text}</SelectItem>
                                            ))}
                                       </SelectContent>
                                   </Select>
                               </div>
                           ) : (
                               <Textarea 
                                   placeholder="e.g. Thanks for visiting! Follow us on Instagram."
                                   value={engagementConfig.footer_message.custom_text}
                                   onChange={(e) => setEngagementConfig(prev => ({...prev, footer_message: {...prev.footer_message, custom_text: e.target.value}}))}
                               />
                           )}
                      </div>
                  )}
              </div>

              <div className="border-t border-gray-100 my-4"></div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                        <Label className="text-base font-bold text-gray-900">Social / Action Link</Label>
                        <p className="text-xs text-gray-500">Adds a clickable link to your bill (e.g. Google Review).</p>
                   </div>
                   <Switch 
                        checked={engagementConfig?.action_link?.enabled || false} 
                        onCheckedChange={(c) => setEngagementConfig({...engagementConfig, action_link: {...engagementConfig.action_link, enabled: c}})} 
                        className="data-[state=checked]:bg-blue-600"
                   />
                </div>

                {engagementConfig?.action_link?.enabled && (
                  <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                       <Label className="mb-2 block">Display Text (Label)</Label>
                       <Input 
                          placeholder="e.g. Leave us a Review"
                          value={safeStr(engagementConfig.action_link.link_type)} 
                          onChange={(e) => setEngagementConfig({...engagementConfig, action_link: {...engagementConfig.action_link, link_type: e.target.value}})}
                       />
                    </div>
                    <div>
                      <Label className="mb-2 block">Exact URL</Label>
                      <Input 
                        placeholder="https://..." 
                        value={safeStr(engagementConfig.action_link.url)}
                        onChange={(e) => setEngagementConfig({...engagementConfig, action_link: {...engagementConfig.action_link, url: e.target.value}})}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Repeat Visit & Loyalty */}
        <TabsContent value="loyalty" className="space-y-4 animate-in fade-in-50 duration-300">
           <Card className="border-red-100 shadow-sm">
              <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
                  <CardTitle className="text-red-800 flex items-center gap-2"><Heart className="w-5 h-5"/> Repeat Visit Appreciation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="space-y-1">
                          <h4 className="font-bold text-gray-900">Enable Appreciation Messages</h4>
                          <p className="text-xs text-gray-500">Prints a special line on invoice when visit count matches.</p>
                      </div>
                      <Switch 
                        checked={repeatVisitConfig?.enabled || false} 
                        onCheckedChange={(c) => setRepeatVisitConfig({...repeatVisitConfig, enabled: c})} 
                        className="data-[state=checked]:bg-red-600"
                      />
                  </div>

                  {repeatVisitConfig?.enabled && (
                    <div className="space-y-4">
                        <Label className="text-gray-700 font-semibold">Milestone Messages</Label>
                        <div className="grid gap-3">
                            {repeatVisitConfig.milestones.map((m, idx) => (
                            <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                                <div className="w-24">
                                    <Label className="text-[10px] uppercase text-gray-500 tracking-wider">Visits</Label>
                                    <Input type="number" className="h-8 bg-white" value={m.visits} onChange={(e) => {
                                        const newMs = [...repeatVisitConfig.milestones];
                                        newMs[idx].visits = parseInt(e.target.value);
                                        setRepeatVisitConfig({...repeatVisitConfig, milestones: newMs});
                                    }} />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-[10px] uppercase text-gray-500 tracking-wider">Message</Label>
                                    <Input className="h-8 bg-white" value={m.message} onChange={(e) => {
                                        const newMs = [...repeatVisitConfig.milestones];
                                        newMs[idx].message = e.target.value;
                                        setRepeatVisitConfig({...repeatVisitConfig, milestones: newMs});
                                    }} />
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                  )}
              </CardContent>
           </Card>

           <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                  <CardTitle className="text-gray-800 flex items-center gap-2"><Users className="w-5 h-5"/> Group Visit Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg border">
                      <div className="space-y-1">
                        <Label className="cursor-pointer font-bold" htmlFor="group-visit-toggle">Enable Group Prompt</Label>
                      </div>
                      <Switch 
                        id="group-visit-toggle"
                        checked={groupVisitConfig?.enabled || false} 
                        onCheckedChange={(c) => setGroupVisitConfig({...groupVisitConfig, enabled: c})} 
                        className="data-[state=checked]:bg-gray-800"
                      />
                  </div>
                  {groupVisitConfig?.enabled && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <Label className="mb-2 block">Prompt Message</Label>
                      <Input value={safeStr(groupVisitConfig.message)} onChange={(e) => setGroupVisitConfig({...groupVisitConfig, message: e.target.value})} />
                    </div>
                  )}
              </CardContent>
           </Card>
        </TabsContent>

        {/* 4. Events & Campaigns (RESTORED) */}
        <TabsContent value="events" className="space-y-4 animate-in fade-in-50 duration-300">
            <Card className="border-purple-100 shadow-sm">
                <CardHeader className="bg-purple-50/50 border-b border-purple-100 pb-4">
                    <CardTitle className="text-purple-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5"/> Events & Campaigns
                    </CardTitle>
                    <CardDescription className="text-purple-700/80">
                        Promote special events on your bills.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="space-y-1">
                            <h4 className="font-bold text-gray-900">Enable Event Prompts</h4>
                            <p className="text-sm text-gray-500">Add event details to customer receipts.</p>
                        </div>
                        <Switch 
                            checked={eventConfig?.enabled || false} 
                            onCheckedChange={(c) => setEventConfig({...eventConfig, enabled: c})} 
                            className="data-[state=checked]:bg-purple-600"
                        />
                    </div>
                    {eventConfig?.enabled && (
                         <div className="space-y-4">
                             <Label>Active Event Message</Label>
                             <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                 {eventConfig.custom_events?.map((evt, idx) => (
                                     <div key={idx} className="space-y-3">
                                         <div>
                                             <Label className="text-xs text-gray-500 uppercase">Event Title</Label>
                                             <Input value={evt.name} onChange={(e) => {
                                                 const newEvts = [...eventConfig.custom_events];
                                                 newEvts[idx].name = e.target.value;
                                                 setEventConfig({...eventConfig, custom_events: newEvts});
                                             }} className="bg-white" />
                                         </div>
                                          <div>
                                             <Label className="text-xs text-gray-500 uppercase">Promotional Message</Label>
                                             <Textarea value={evt.message} onChange={(e) => {
                                                 const newEvts = [...eventConfig.custom_events];
                                                 newEvts[idx].message = e.target.value;
                                                 setEventConfig({...eventConfig, custom_events: newEvts});
                                             }} className="bg-white" />
                                         </div>
                                     </div>
                                 ))}
                                 {(!eventConfig.custom_events || eventConfig.custom_events.length === 0) && (
                                     <Button variant="outline" size="sm" onClick={() => setEventConfig({...eventConfig, custom_events: [{ name: "New Event", message: "Join us!", active: true }]})}>
                                         + Add Event
                                     </Button>
                                 )}
                             </div>
                         </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        {/* 5. Promo Tools (RESTORED) */}
        <TabsContent value="promotools" className="space-y-4 animate-in fade-in-50 duration-300">
            <Card className="border-orange-100 shadow-sm">
                <CardHeader className="bg-orange-50/50 border-b border-orange-100 pb-4">
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                        <Gift className="w-5 h-5"/> Promo Text Generator
                    </CardTitle>
                    <CardDescription className="text-orange-700/80">
                        Create catchy promotional messages for WhatsApp or SMS.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Label>Promotion Type</Label>
                                <Select value={promoToolType} onValueChange={setPromoToolType}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent className="bg-white">
                                        <SelectItem value="bogo">BOGO (Buy X Get Y)</SelectItem>
                                        <SelectItem value="flat">Flat Discount (₹)</SelectItem>
                                        <SelectItem value="percentage">Percentage Off (%)</SelectItem>
                                        <SelectItem value="event">Any Event</SelectItem>
                                        <SelectItem value="birthday">Birthday Special</SelectItem>
                                        <SelectItem value="anniversary">Anniversary Special</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dynamic Inputs based on Type */}
                            <div className="space-y-3 bg-gray-50 p-4 rounded border border-gray-100">
                                {promoToolType === 'bogo' && (
                                    <>
                                        <div><Label className="text-xs">Item Name</Label><Input placeholder="e.g. Pizza" value={promoToolInputs.item_name} onChange={e => setPromoToolInputs({...promoToolInputs, item_name: e.target.value})}/></div>
                                        <div><Label className="text-xs">Buy Quantity</Label><Input placeholder="1" value={promoToolInputs.quantity} onChange={e => setPromoToolInputs({...promoToolInputs, quantity: e.target.value})}/></div>
                                    </>
                                )}
                                {(promoToolType === 'flat' || promoToolType === 'percentage') && (
                                    <div><Label className="text-xs">{promoToolType === 'flat' ? 'Amount (₹)' : 'Percent (%)'}</Label><Input placeholder={promoToolType === 'flat' ? '50' : '20'} value={promoToolInputs.discount_val} onChange={e => setPromoToolInputs({...promoToolInputs, discount_val: e.target.value})}/></div>
                                )}
                                {promoToolType === 'event' && (
                                    <>
                                        <div><Label className="text-xs">Event Name</Label><Input placeholder="e.g. Holi Bash" value={promoToolInputs.event_name} onChange={e => setPromoToolInputs({...promoToolInputs, event_name: e.target.value})}/></div>
                                    </>
                                )}
                                {(promoToolType === 'birthday' || promoToolType === 'anniversary' || promoToolType === 'event') && (
                                     <div><Label className="text-xs">Discount/Offer Details</Label><Input placeholder="e.g. 15% Off" value={promoToolInputs.discount_val} onChange={e => setPromoToolInputs({...promoToolInputs, discount_val: e.target.value})}/></div>
                                )}

                                <div>
                                    <Label className="text-xs">Condition (Optional)</Label>
                                    <Input placeholder="e.g. Valid today only" value={promoToolInputs.condition} onChange={e => setPromoToolInputs({...promoToolInputs, condition: e.target.value})}/>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <Label>Generated Message</Label>
                             <div className="relative">
                                 <Textarea 
                                    readOnly 
                                    value={generatedPromoText} 
                                    className="h-40 bg-gray-50 text-base font-medium resize-none border-orange-200"
                                 />
                                 <Button 
                                    size="sm" 
                                    className="absolute bottom-2 right-2 bg-green-600 text-white hover:bg-green-700 border shadow-sm"
                                    onClick={copyToClipboard}
                                 >
                                     <Copy className="h-4 w-4 mr-2" /> Copy
                                 </Button>
                             </div>
                             <p className="text-xs text-gray-500">Copy this text and paste it into WhatsApp or SMS.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TabItem = ({ value, icon, label, active }) => (
    <TabsTrigger 
      value={value} 
      className={`flex-1 min-w-[120px] py-2.5 transition-all duration-200 border-b-2 rounded-none bg-transparent hover:bg-white/50 
        ${active 
            ? 'border-orange-600 text-orange-700 font-bold bg-white shadow-sm' 
            : 'border-transparent text-gray-600 font-medium hover:text-gray-900'
        }`
      }
    >
        <span className={`mr-2 ${active ? 'text-orange-600' : 'text-gray-400'}`}>{icon}</span> {label}
    </TabsTrigger>
);

const MegaphoneIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
)

export default MarketingSettings;