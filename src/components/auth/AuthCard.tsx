
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthCard: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex justify-center">
          <img 
            src="/lovable-uploads/70fd8aa8-14a4-44c2-a2f8-de418d48b1d6.png" 
            alt="Lo Logo" 
            className="h-24" // Doubled from h-12 to h-24
          />
        </CardTitle>
        <CardDescription className="text-center">
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="p-6 pt-4">
            <LoginForm setEmail={setEmail} email={email} />
          </TabsContent>
          
          <TabsContent value="register" className="p-6 pt-4">
            <RegisterForm setEmail={setEmail} email={email} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col items-center p-6 pt-0">
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AuthCard;
