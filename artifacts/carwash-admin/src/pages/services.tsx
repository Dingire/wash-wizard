import { useState } from 'react';
import { useListServices, useCreateService, useUpdateService, useDeleteService, getListServicesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  isActive: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function Services() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<number | null>(null);
  const [deletingService, setDeletingService] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: services, isLoading } = useListServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      isActive: true,
    },
  });

  const handleCreate = (values: ServiceFormData) => {
    createService.mutate(
      {
        data: {
          name: values.name,
          description: values.description,
          price: Number(values.price),
          isActive: values.isActive,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Service created successfully' });
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          setIsCreateOpen(false);
          form.reset();
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleEdit = (values: ServiceFormData) => {
    if (!editingService) return;

    updateService.mutate(
      {
        id: editingService,
        data: {
          name: values.name,
          description: values.description,
          price: Number(values.price),
          isActive: values.isActive,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Service updated successfully' });
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          setEditingService(null);
          form.reset();
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingService) return;

    deleteService.mutate(
      { id: deletingService },
      {
        onSuccess: () => {
          toast({ title: 'Service deleted successfully' });
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          setDeletingService(null);
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const openEditDialog = (serviceId: number) => {
    const service = services?.find((s) => s.id === serviceId);
    if (service) {
      form.reset({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        isActive: service.isActive,
      });
      setEditingService(serviceId);
    }
  };

  return (
    <div className="p-8 min-h-screen">
      <PageHeader
        title="Services"
        description="Manage your car wash service packages"
        action={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-new-service">
                <PlusCircle className="w-4 h-4" />
                New Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Service</DialogTitle>
                <DialogDescription>
                  Add a new car wash service package
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Premium Wash" {...field} data-testid="input-service-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Full exterior and interior cleaning..."
                            rows={3}
                            {...field}
                            data-testid="input-service-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            data-testid="input-service-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel>Active</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Service is available for new transactions
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-service-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={createService.isPending}
                      className="flex-1"
                      data-testid="button-create-service"
                    >
                      {createService.isPending ? 'Creating...' : 'Create Service'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateOpen(false);
                        form.reset();
                      }}
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="border-card-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading services...
            </div>
          ) : !services || services.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No services created yet
              </p>
              <Button onClick={() => setIsCreateOpen(true)} size="sm" data-testid="button-create-first-service">
                Create first service
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-6 flex items-start justify-between hover:bg-muted/20 transition-colors"
                  data-testid={`service-${service.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {service.description}
                    </p>
                    <p className="text-2xl font-mono font-bold text-primary">
                      {formatCurrency(service.price)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(service.id)}
                      data-testid={`button-edit-${service.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingService(service.id)}
                      data-testid={`button-delete-${service.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editingService !== null} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service details
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} data-testid="input-edit-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-edit-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Service is available for new transactions
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={updateService.isPending}
                  className="flex-1"
                  data-testid="button-save-edit"
                >
                  {updateService.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingService(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingService !== null} onOpenChange={(open) => !open && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
