import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, User, Building, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface OnboardingForm {
  firstName: string;
  lastName: string;
  role: string;
  company?: string;
  phone?: string;
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<OnboardingForm>({
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "",
      company: "",
      phone: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: OnboardingForm) => {
      return apiRequest("PATCH", "/api/auth/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome!",
        description: "Your profile has been set up successfully.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: OnboardingForm) => {
    updateProfileMutation.mutate(data);
  };

  const nextStep = () => {
    if (step === 1) {
      const firstName = form.getValues("firstName");
      const lastName = form.getValues("lastName");
      if (!firstName.trim() || !lastName.trim()) {
        toast({
          title: "Required Fields",
          description: "Please enter your first and last name.",
          variant: "destructive",
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const roleOptions = [
    { value: "contractor", label: "Contractor" },
    { value: "architect", label: "Architect" },
    { value: "engineer", label: "Engineer" },
    { value: "project_manager", label: "Project Manager" },
    { value: "permit_coordinator", label: "Permit Coordinator" },
    { value: "inspector", label: "Inspector" },
    { value: "admin", label: "Administrator" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3 mr-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Welcome to Permit Package Tracker</CardTitle>
          </div>
          <p className="text-gray-600">
            Let's set up your profile to get you started with managing permit packages
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Personal Info</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                {step > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Role & Company</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Tell us about yourself</h3>
                    <p className="text-gray-600">We'll use this information to personalize your experience</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="button" onClick={nextStep}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">What's your role?</h3>
                    <p className="text-gray-600">This helps us customize the platform for your workflow</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Role *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company/Organization (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Building className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Ready to start managing permits?</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Once you complete setup, you'll be able to create permit packages, 
                          upload documents, and track progress through our dashboard.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Setting up..." : "Complete Setup"}
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}