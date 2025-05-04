
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Map, List, User, Menu, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-full bg-white border-b px-4 py-2 h-16">
      <div className="flex justify-between items-center h-full">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img 
            src="/lovable-uploads/70fd8aa8-14a4-44c2-a2f8-de418d48b1d6.png" 
            alt="Lo Logo" 
            className="h-16" // Doubled from h-8 to h-16
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/home">
            <Button
              variant={isActive('/home') ? "default" : "ghost"}
              className="flex items-center"
              size="sm"
            >
              <Map className="h-4 w-4 mr-2" />
              Map
            </Button>
          </Link>
          <Link to="/list">
            <Button
              variant={isActive('/list') ? "default" : "ghost"}
              className="flex items-center"
              size="sm"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </Link>
        </div>

        {/* Right Side - Profile/Auth */}
        <div className="flex items-center space-x-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
              className="flex items-center"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}

          {/* Mobile Menu Button */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                navigate('/home');
                setIsMenuOpen(false);
              }}>
                <Map className="mr-2 h-4 w-4" />
                Map
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                navigate('/list');
                setIsMenuOpen(false);
              }}>
                <List className="mr-2 h-4 w-4" />
                List
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!user && (
                <DropdownMenuItem onClick={() => {
                  navigate('/auth');
                  setIsMenuOpen(false);
                }}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
