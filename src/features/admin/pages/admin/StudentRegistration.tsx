"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Upload, CheckCircle, Copy, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    course: "",
    intake: "",
    amount: "",
  });

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success("Student registered successfully");
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Card className="border-success/20 shadow-sm">
          <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Registration Successful</h2>
            <p className="text-text-secondary mb-8">
              The student profile has been created and enrollment is pending verification.
            </p>

            <div className="w-full bg-surface-muted rounded-lg p-6 space-y-4 mb-8 text-left border border-border">
              <div>
                <Label className="text-text-muted mb-1 block">Student ID</Label>
                <div className="flex items-center justify-between bg-background border border-border rounded-md px-3 py-2">
                  <span className="font-mono font-medium text-foreground">NPU-STU-202600046</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard("NPU-STU-202600046")}>
                    <Copy className="h-3.5 w-3.5 text-text-secondary" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-text-muted mb-1 block">Temporary Email</Label>
                <div className="flex items-center justify-between bg-background border border-border rounded-md px-3 py-2">
                  <span className="font-medium text-foreground">{formData.email || "student@example.com"}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(formData.email || "student@example.com")}>
                    <Copy className="h-3.5 w-3.5 text-text-secondary" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-text-muted mb-1 block">Temporary Password</Label>
                <div className="flex items-center justify-between bg-background border border-border rounded-md px-3 py-2">
                  <span className="font-mono font-medium text-foreground">npU$8x9L2</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard("npU$8x9L2")}>
                    <Copy className="h-3.5 w-3.5 text-text-secondary" />
                  </Button>
                </div>
                <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> User will be forced to change password on first login.
                </p>
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <Button variant="outline" className="flex-1" onClick={() => {
                setStep(1);
                setIsSuccess(false);
                setFormData({firstName: "", lastName: "", email: "", phone: "", course: "", intake: "", amount: ""});
              }}>
                Register Another
              </Button>
              <Button className="flex-1" onClick={() => navigate("/students")}>
                View Directory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/students">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Register New Student</h1>
          <p className="text-text-secondary">Step {step} of 2</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-brand-primary" : "bg-surface-muted"}`}></div>
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-brand-primary" : "bg-surface-muted"}`}></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{step === 1 ? "Student Information" : "Academic & Enrollment"}</CardTitle>
          <CardDescription>
            {step === 1 
              ? "Enter personal details to create the student profile." 
              : "Select course intake and upload payment verification."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="akon" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Perera" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="akon@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+94 77 123 4567" />
                  </div>
                </div>
                <div className="space-y-2 border-t border-border pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-2">Guardian Information (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gname">Guardian Name</Label>
                      <Input id="gname" placeholder="Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gphone">Guardian Phone</Label>
                      <Input id="gphone" placeholder="Phone" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Programme / Course</Label>
                    <select 
                      id="course" 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
                      required
                      value={formData.course}
                      onChange={e => setFormData({...formData, course: e.target.value})}
                    >
                      <option value="">Select a course...</option>
                      <option value="wd">Web Development Bootcamp</option>
                      <option value="ds">Data Science Fundamentals</option>
                      <option value="gd">Graphic Design Masterclass</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intake">Intake Batch</Label>
                    <select 
                      id="intake" 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
                      required
                      value={formData.intake}
                      onChange={e => setFormData({...formData, intake: e.target.value})}
                    >
                      <option value="">Select active intake...</option>
                      <option value="wd-26-2">WD-26.2 (Starts Sep 2026)</option>
                      <option value="wd-26-3">WD-26.3 (Starts Nov 2026)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border pt-6 mt-6">
                  <h4 className="text-sm font-medium">Payment Verification</h4>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Registration Amount Paid (LKR)</Label>
                    <Input id="amount" type="number" required placeholder="e.g. 5000" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Payment Slip / Receipt</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-surface-muted/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 text-text-muted mb-4" />
                      <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-text-muted mt-1">SVG, PNG, JPG or PDF (max. 5MB)</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border p-6">
            {step === 1 ? (
              <>
                <Button type="button" variant="ghost" onClick={() => navigate("/students")}>Cancel</Button>
                <Button type="submit">Continue to Enrollment</Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Complete Registration"}
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
