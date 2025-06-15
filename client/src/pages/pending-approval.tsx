import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, CheckCircle } from "lucide-react";

export default function PendingApproval() {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-100 rounded-full p-3 mr-3">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-gray-600 text-lg">
              Thank you for registering! Your account has been created successfully.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-medium text-yellow-800">Awaiting Administrator Approval</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your account is currently being reviewed by an administrator. 
                    You'll receive access once your registration has been approved.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">What happens next?</h4>
              <div className="space-y-2 text-sm text-gray-600 text-left">
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>An administrator will review your registration details</span>
                </div>
                <div className="flex items-start">
                  <Mail className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>You'll be notified via email once your account is approved</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Once approved, you can sign in and start managing permit packages</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-gray-500 mb-4">
              If you have questions about your registration status, please contact your administrator.
            </p>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}