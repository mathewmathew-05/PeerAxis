import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Users, Mail, Lock, User, GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { USER_ROLES, DEPARTMENTS } from '../types';

const RegisterPage = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.MENTEE,
    department: '',
    year: '2'
  });
  const [isLoading, setIsLoading] = useState(false);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      // Validate step 1 and move to step 2
      if (!formData.name || !formData.email || !formData.password) {
        toast.error('Please fill all required fields');
        return;
      }
      setStep(2);
      return;
    }

    // Final submission
    setIsLoading(true);

    try {
      await register(formData);
      toast.success('Account created successfully!', {
        description: 'Welcome to PeerAxis'
      });
      navigate('/dashboard');
    } catch (error) {
      toast.error('Registration failed', {
        description: 'Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-secondary to-accent p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-primary-foreground rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        </div>
        
        <Link to="/" className="flex items-center space-x-3 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
            <Users className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-primary-foreground">PeerAxis</span>
        </Link>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-display font-bold text-primary-foreground mb-6 leading-tight">
              Start Your Journey to Academic Excellence
            </h2>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              Join our community of learners and mentors. Set goals, track progress, and achieve more together.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-primary-foreground mb-1">500+</div>
              <div className="text-sm text-primary-foreground/80">Active Mentors</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-primary-foreground mb-1">1,200+</div>
              <div className="text-sm text-primary-foreground/80">Students</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-primary-foreground mb-1">3,500+</div>
              <div className="text-sm text-primary-foreground/80">Sessions</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-primary-foreground mb-1">4.8/5</div>
              <div className="text-sm text-primary-foreground/80">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="border-border shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 lg:hidden">
                <Users className="w-7 h-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-display font-bold">Create Account</CardTitle>
              <CardDescription>
                {step === 1 ? 'Enter your basic information' : 'Complete your profile'}
              </CardDescription>
              
              {/* Progress indicator */}
              <div className="flex items-center justify-center space-x-2 pt-4">
                <div className={`h-2 w-16 rounded-full transition-smooth ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`h-2 w-16 rounded-full transition-smooth ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {step === 1 ? (
                  // Step 1: Basic Info
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  // Step 2: Role & Academic Info
                  <>
                    <div className="space-y-3">
                      <Label>I want to join as</Label>
                      <RadioGroup
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value={USER_ROLES.MENTEE} id="mentee" className="peer sr-only" />
                          <Label
                            htmlFor="mentee"
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-smooth"
                          >
                            <GraduationCap className="mb-2 h-6 w-6" />
                            <span className="font-semibold">Mentee</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">Seek guidance</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value={USER_ROLES.MENTOR} id="mentor" className="peer sr-only" />
                          <Label
                            htmlFor="mentor"
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-smooth"
                          >
                            <Users className="mb-2 h-6 w-6" />
                            <span className="font-semibold">Mentor</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">Help others</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => setFormData({ ...formData, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Academic Year</Label>
                      <Select
                        value={formData.year}
                        onValueChange={(value) => setFormData({ ...formData, year: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  {step === 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                  )}
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <>
                        {step === 1 ? 'Continue' : 'Create Account'}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-center text-muted-foreground w-full">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;