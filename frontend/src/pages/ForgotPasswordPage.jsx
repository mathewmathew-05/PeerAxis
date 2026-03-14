import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, KeyRound, ArrowRight, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import api from '../lib/api';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = enter email, 2 = enter token + new password
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetToken, setResetToken] = useState(''); // shown after step 1
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (res.data.token) {
                setResetToken(res.data.token);
                toast.success('Reset token generated! Copy it below and use it to reset your password.');
            } else {
                toast.info(res.data.message);
            }
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate reset token');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!token.trim() || !newPassword.trim()) {
            toast.error('Please fill in the token and new password');
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', { token: token.trim(), newPassword });
            toast.success('Password reset successfully! Please log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid or expired token');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Card className="border-border shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                            <KeyRound className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-2xl font-display font-bold">
                            {step === 1 ? 'Forgot Password' : 'Reset Password'}
                        </CardTitle>
                        <CardDescription>
                            {step === 1
                                ? 'Enter your email to receive a reset token'
                                : 'Enter your reset token and set a new password'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {step === 1 ? (
                            <form onSubmit={handleRequestReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                                    {isLoading ? 'Generating token...' : <>Get Reset Token <ArrowRight className="ml-2 w-4 h-4" /></>}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                {/* Show the token to copy (since no email server) */}
                                {resetToken && (
                                    <div className="p-3 bg-muted rounded-lg border border-border">
                                        <p className="text-xs text-muted-foreground mb-1 font-medium">Your Reset Token (copy this):</p>
                                        <p className="text-xs font-mono break-all text-primary select-all">{resetToken}</p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="token">Reset Token</Label>
                                    <Input
                                        id="token"
                                        placeholder="Paste your reset token here"
                                        value={token}
                                        onChange={e => setToken(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                                    {isLoading ? 'Resetting...' : <>Reset Password <ArrowRight className="ml-2 w-4 h-4" /></>}
                                </Button>
                            </form>
                        )}
                    </CardContent>

                    <CardFooter>
                        <p className="text-sm text-center text-muted-foreground w-full">
                            Remember your password?{' '}
                            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
