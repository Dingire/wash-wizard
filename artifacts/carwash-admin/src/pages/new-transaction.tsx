import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTransaction, useListServices } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListTransactionsQueryKey, getGetReportSummaryQueryKey } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

const formSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string(),
  sendSms: z.boolean(),
  vehiclePlate: z.string().min(1, 'Vehicle plate is required'),
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  amountPaid: z.string().min(1, 'Amount is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
}).superRefine((values, context) => {
  if (values.sendSms && !/^0\d{9}$/.test(values.customerPhone.replace(/\D/g, ''))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['customerPhone'],
      message: 'Enter a valid phone number with country code',
    });
  }
});

export default function NewTransaction() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: services, isLoading: servicesLoading } = useListServices();
  const createTransaction = useCreateTransaction();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: '',
      customerName: '',
      customerPhone: '',
      sendSms: false,
      vehiclePlate: '',
      vehicleType: '',
      amountPaid: '',
      paymentMethod: 'Cash',
      notes: '',
    },
  });

  const selectedServiceId = form.watch('serviceId');
  const selectedService = services?.find((s) => s.id === Number(selectedServiceId));

  // Auto-fill amount when service is selected
  if (selectedService && !form.getValues('amountPaid')) {
    form.setValue('amountPaid', selectedService.price.toString());
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTransaction.mutate(
      {
        data: {
          serviceId: Number(values.serviceId),
          customerName: values.customerName,
          customerPhone: values.customerPhone ? `+26${values.customerPhone.replace(/\D/g, '')}` : undefined,
          sendSms: values.sendSms,
          vehiclePlate: values.vehiclePlate,
          vehicleType: values.vehicleType,
          amountPaid: Number(values.amountPaid),
          paymentMethod: values.paymentMethod,
          notes: values.notes || undefined,
        },
      },
      {
        onSuccess: (data) => {
          toast({
            title: 'Receipt created',
            description: 'Transaction recorded successfully',
          });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetReportSummaryQueryKey() });
          setLocation('/transactions');
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to create transaction',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6">
        <Link href="/transactions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4" data-testid="link-back">
          <ArrowLeft className="w-4 h-4" />
          Back to transactions
        </Link>
      </div>

      <PageHeader
        title="New Receipt"
        description="Record a new car wash transaction"
      />

      <div className="max-w-2xl">
        <Card className="border-card-border">
          <CardHeader className="border-b border-card-border">
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={servicesLoading}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-service">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services?.filter(s => s.isActive).map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name} - K{service.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehiclePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Plate</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC-1234" {...field} data-testid="input-vehicle-plate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sendSms"
                  render={({ field }) => (
                    <FormItem className="rounded-md border border-card-border p-4">
                      <div className="flex items-center gap-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            data-testid="checkbox-send-sms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">Send SMS receipt</FormLabel>
                          <p className="text-sm text-muted-foreground">Send the customer their receipt after it is issued.</p>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Phone {form.watch('sendSms') ? '' : '(Optional)'}</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="rounded-l-md border border-r-0 border-input bg-muted px-3 py-2 text-sm text-muted-foreground">+26</span>
                          <Input
                            type="tel"
                            inputMode="tel"
                            placeholder="0971234567"
                            maxLength={10}
                            disabled={!form.watch('sendSms')}
                            value={field.value.replace(/\D/g, '')}
                            onChange={(event) => field.onChange(event.target.value.replace(/\D/g, ''))}
                            className="rounded-l-none"
                            data-testid="input-customer-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle-type">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sedan">Sedan</SelectItem>
                          <SelectItem value="SUV">SUV</SelectItem>
                          <SelectItem value="Truck">Truck</SelectItem>
                          <SelectItem value="Van">Van</SelectItem>
                          <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amountPaid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Paid</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            data-testid="input-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-method">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Mobile">Mobile</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes..."
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createTransaction.isPending}
                    className="flex-1"
                    data-testid="button-submit"
                  >
                    {createTransaction.isPending ? 'Creating...' : 'Issue Receipt'}
                  </Button>
                  <Link href="/transactions">
                    <Button type="button" variant="outline" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
