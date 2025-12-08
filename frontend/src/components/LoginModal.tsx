
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { login as apiLogin, register as apiRegister } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'student' | 'teacher';
}

const LoginModal = ({ isOpen, onClose, mode }: LoginModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    (async () => {
      try {
        if (isLogin) {
          const res = await apiLogin({ email: formData.email, password: formData.password });
          if (res && res.token && res.user) {
            login({ id: res.user.id, name: res.user.name, email: res.user.email, role: res.user.role }, res.token);
            toast.success(`Welcome ${res.user.name}!`);
            onClose();
            navigate(res.user.role === 'student' ? '/student-dashboard' : '/teacher-dashboard');
          } else {
            toast.error(res.message || 'Login failed');
          }
        } else {
          const payload: any = { name: formData.name, email: formData.email, password: formData.password, role: mode };
          const res = await apiRegister(payload);
          if (res && res.token && res.user) {
            login({ id: res.user.id, name: res.user.name, email: res.user.email, role: res.user.role }, res.token);
            toast.success(`Welcome ${res.user.name}!`);
            onClose();
            navigate(res.user.role === 'student' ? '/student-dashboard' : '/teacher-dashboard');
          } else {
            toast.error(res.message || 'Registration failed');
          }
        }
      } catch (err: any) {
        console.error('Auth error:', err?.response?.data);
        // Handle validation errors
        if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
          const errorMessages = err.response.data.errors.map((e: any) => e.msg).join(', ');
          toast.error(errorMessages);
        } else {
          toast.error(err?.response?.data?.message || err?.message || 'Authentication failed');
        }
      }
    })();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {mode === 'student' ? 'Student' : 'Teacher'} {isLogin ? 'Login' : 'Sign Up'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(value) => setIsLogin(value === 'login')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <p
              className='text-sm    cursor-pointer text-blue-600 mt-2'
              onClick={()=>navigate("/forgot-password")} // try 
              >
                Forget Password
              </p>
              <Button type="submit" className="w-full">
                Login as {mode === 'student' ? 'Student' : 'Teacher'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign Up as {mode === 'student' ? 'Student' : 'Teacher'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
