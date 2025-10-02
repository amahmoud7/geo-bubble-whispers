import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppTopBar from '@/components/layout/AppTopBar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useThemePreference } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ChevronRight, Moon, Sun, Bell, Shield, MapPin, Users, Wifi, LifeBuoy, Globe, Lock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingItem =
  | {
      key: string;
      label: string;
      description?: string;
      type: 'toggle';
      icon?: React.ReactNode;
      value: boolean;
      onChange: (value: boolean) => void;
    }
  | {
      key: string;
      label: string;
      description?: string;
      type: 'link';
      icon?: React.ReactNode;
      onClick: () => void;
    };

interface SettingSection {
  title: string;
  items: SettingItem[];
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useThemePreference();
  const isDarkMode = theme === 'dark';

  const handleComingSoon = (label: string) => {
    toast({
      title: `${label} coming soon`,
      description: 'We are polishing this experience.',
    });
  };

  const sections: SettingSection[] = [
    {
      title: 'Profile & Display',
      items: [
        {
          key: 'dark-mode',
          label: 'Dark Mode',
          description: 'Reduce glare and rest your eyes with a darker palette.',
          type: 'toggle',
          icon: isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />,
          value: isDarkMode,
          onChange: (value) => setTheme(value ? 'dark' : 'light'),
        },
        {
          key: 'edit-profile',
          label: 'Edit Profile',
          description: 'Update your name, photo, and personal details.',
          type: 'link',
          icon: <Users className="h-4 w-4" />,
          onClick: () => handleComingSoon('Profile editing'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          key: 'push-notifications',
          label: 'Push Notifications',
          description: 'Choose which updates you receive across Lo.',
          type: 'link',
          icon: <Bell className="h-4 w-4" />,
          onClick: () => handleComingSoon('Notification controls'),
        },
        {
          key: 'email-digest',
          label: 'Email Digest',
          description: 'Stay in the loop with occasional highlights.',
          type: 'link',
          icon: <Info className="h-4 w-4" />,
          onClick: () => handleComingSoon('Email digest'),
        },
      ],
    },
    {
      title: 'Privacy & Safety',
      items: [
        {
          key: 'privacy-controls',
          label: 'Privacy Controls',
          description: 'Manage who can see your Los and messages.',
          type: 'link',
          icon: <Shield className="h-4 w-4" />,
          onClick: () => handleComingSoon('Privacy settings'),
        },
        {
          key: 'security',
          label: 'Security',
          description: 'Update password, login approvals, and devices.',
          type: 'link',
          icon: <Lock className="h-4 w-4" />,
          onClick: () => handleComingSoon('Security options'),
        },
      ],
    },
    {
      title: 'Map & Location',
      items: [
        {
          key: 'map-preferences',
          label: 'Map Preferences',
          description: 'Customize map layers, pins, and auto-centering.',
          type: 'link',
          icon: <MapPin className="h-4 w-4" />,
          onClick: () => handleComingSoon('Map preferences'),
        },
        {
          key: 'data-usage',
          label: 'Data & Bandwidth',
          description: 'Optimize livestreams and map streaming for travel.',
          type: 'link',
          icon: <Wifi className="h-4 w-4" />,
          onClick: () => handleComingSoon('Data usage controls'),
        },
      ],
    },
    {
      title: 'Community & Support',
      items: [
        {
          key: 'community-guidelines',
          label: 'Community Guidelines',
          description: 'Understand how to keep Lo friendly and safe.',
          type: 'link',
          icon: <Globe className="h-4 w-4" />,
          onClick: () => handleComingSoon('Community guidelines'),
        },
        {
          key: 'help-center',
          label: 'Help & Support',
          description: 'Browse FAQs or contact our support team.',
          type: 'link',
          icon: <LifeBuoy className="h-4 w-4" />,
          onClick: () => handleComingSoon('Help center'),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-900">
      <AppTopBar
        title="Settings"
        subtitle="preferences"
        leading={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="px-6 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="rounded-3xl bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-800/80">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-300">
              {section.title}
            </h2>
            <div className="mt-4 space-y-3">
              {section.items.map((item, index) => (
                <React.Fragment key={item.key}>
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-2xl px-3 py-3 transition',
                      'hover:bg-slate-100/80 dark:hover:bg-slate-700/80'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-slate-500 dark:text-slate-300">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {item.label}
                        </p>
                        {item.description ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {item.type === 'toggle' ? (
                      <Switch
                        checked={item.value}
                        onCheckedChange={item.onChange}
                        aria-label={`${item.label} toggle`}
                      />
                    ) : (
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        onClick={item.onClick}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {index < section.items.length - 1 ? (
                    <Separator className="mx-3" />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
