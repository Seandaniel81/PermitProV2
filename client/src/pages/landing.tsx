import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, Users, Shield, ArrowRight } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary rounded-lg p-3 mr-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Permit Package Tracker
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your building permit process with our comprehensive package management system. 
            Track documents, manage workflows, and ensure compliance from start to finish.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle>Document Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Keep track of all required documents with automated checklists and progress monitoring.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Assign packages to team members and collaborate seamlessly throughout the permit process.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <CardTitle>Compliance Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ensure all packages meet regulatory requirements before submission with built-in validation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built specifically for construction professionals and permit departments
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Automated Workflows</h3>
                  <p className="text-gray-600">Smart status progression guides packages through each phase</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Template-Based Creation</h3>
                  <p className="text-gray-600">Pre-configured templates for common permit types</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Real-Time Analytics</h3>
                  <p className="text-gray-600">Dashboard insights into package status and team performance</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Authentication</h3>
                  <p className="text-gray-600">Role-based access control with administrator privileges</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Configurable Settings</h3>
                  <p className="text-gray-600">Customize the system to match your workflow requirements</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Database Integration</h3>
                  <p className="text-gray-600">Persistent storage with PostgreSQL for reliable data management</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Examples */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Track Every Stage of Your Permit Process
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="text-sm py-2 px-4">
              📝 Draft
            </Badge>
            <Badge variant="outline" className="text-sm py-2 px-4 border-yellow-500 text-yellow-700">
              🔄 In Progress
            </Badge>
            <Badge variant="outline" className="text-sm py-2 px-4 border-blue-500 text-blue-700">
              ✅ Ready to Submit
            </Badge>
            <Badge variant="default" className="text-sm py-2 px-4 bg-green-500">
              🚀 Submitted
            </Badge>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Join Our Platform Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600">
                Create your free account to start managing permit packages, tracking documents, 
                and collaborating with your team on construction projects.
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleLogin}
                  size="lg" 
                  className="w-full"
                >
                  Sign Up / Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-gray-500">
                  New users will be automatically registered upon first sign-in
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-2">What you get with your account:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Upload and manage scanned documents</li>
                  <li>• Track progress across multiple permit packages</li>
                  <li>• Collaborate with team members</li>
                  <li>• Access to all permit types and templates</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}