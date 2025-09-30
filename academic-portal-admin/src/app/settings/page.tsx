import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon,
  Save,
  Database,
  Mail,
  Shield,
  Globe,
  Bell,
  Users,
  Palette,
  Key,
  Server,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function SettingsPage() {
  const settingsCategories = [
    {
      id: 'general',
      title: 'General Settings',
      description: 'Basic configuration and site information',
      icon: SettingsIcon,
      settings: [
        { name: 'Site Name', value: 'Greenwich University Vietnam', type: 'text' },
        { name: 'Site Description', value: 'Leading international university in Vietnam', type: 'textarea' },
        { name: 'Admin Email', value: 'admin@greenwich.edu.vn', type: 'email' },
        { name: 'Timezone', value: 'Asia/Ho_Chi_Minh', type: 'select' }
      ]
    },
    {
      id: 'security',
      title: 'Security & Authentication',
      description: 'Security policies and authentication settings',
      icon: Shield,
      settings: [
        { name: 'Two-Factor Authentication', value: true, type: 'boolean' },
        { name: 'Password Minimum Length', value: '8', type: 'number' },
        { name: 'Session Timeout (minutes)', value: '60', type: 'number' },
        { name: 'Failed Login Attempts', value: '5', type: 'number' }
      ]
    },
    {
      id: 'email',
      title: 'Email Configuration',
      description: 'SMTP settings and email templates',
      icon: Mail,
      settings: [
        { name: 'SMTP Server', value: 'smtp.gmail.com', type: 'text' },
        { name: 'SMTP Port', value: '587', type: 'number' },
        { name: 'SMTP Username', value: 'noreply@greenwich.edu.vn', type: 'email' },
        { name: 'Use TLS', value: true, type: 'boolean' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Configure system notifications and alerts',
      icon: Bell,
      settings: [
        { name: 'Email Notifications', value: true, type: 'boolean' },
        { name: 'SMS Notifications', value: false, type: 'boolean' },
        { name: 'Push Notifications', value: true, type: 'boolean' },
        { name: 'Digest Frequency', value: 'daily', type: 'select' }
      ]
    }
  ];

  const systemHealth = [
    {
      component: 'Database Connection',
      status: 'healthy',
      lastCheck: '2 minutes ago',
      icon: Database
    },
    {
      component: 'Email Service',
      status: 'healthy',
      lastCheck: '5 minutes ago',
      icon: Mail
    },
    {
      component: 'Authentication Service',
      status: 'warning',
      lastCheck: '1 minute ago',
      icon: Key
    },
    {
      component: 'File Storage',
      status: 'healthy',
      lastCheck: '3 minutes ago',
      icon: Server
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderSettingInput = (setting: { name: string; value: string | number | boolean; type: string }) => {
    switch (setting.type) {
      case 'textarea':
        return (
          <textarea 
            defaultValue={String(setting.value)} 
            className="mt-1 w-full p-2 border rounded-md"
            rows={3}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center mt-1">
            <input 
              type="checkbox" 
              defaultChecked={Boolean(setting.value)}
              className="mr-2"
            />
            <span className="text-sm text-muted-foreground">
              {setting.value ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      case 'number':
        return (
          <Input 
            type="number" 
            defaultValue={String(setting.value)} 
            className="mt-1"
          />
        );
      case 'email':
        return (
          <Input 
            type="email" 
            defaultValue={String(setting.value)} 
            className="mt-1"
          />
        );
      case 'select':
        return (
          <select className="mt-1 w-full p-2 border rounded-md">
            <option value={String(setting.value)}>{String(setting.value)}</option>
          </select>
        );
      default:
        return (
          <Input 
            type="text" 
            defaultValue={String(setting.value)} 
            className="mt-1"
          />
        );
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* System Health Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Health
            </CardTitle>
            <CardDescription>Monitor system components and services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemHealth.map((component, index) => {
                const Icon = component.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium text-foreground">{component.component}</h4>
                        <p className="text-xs text-muted-foreground">Last checked: {component.lastCheck}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(component.status)}
                      {getStatusBadge(component.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {category.title}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.settings.map((setting, index) => (
                      <div key={index} className="space-y-2">
                        <label htmlFor={`${category.id}-${index}`} className="text-sm font-medium">
                          {setting.name}
                        </label>
                        {renderSettingInput(setting)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Advanced Configuration
            </CardTitle>
            <CardDescription>Database and system maintenance tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Download className="w-4 h-4" />
                    Backup Database
                  </CardTitle>
                  <CardDescription>Create a backup of the system database</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Create Backup</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="w-4 h-4" />
                    Restore Database
                  </CardTitle>
                  <CardDescription>Restore system from a backup file</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Restore Backup</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <RefreshCw className="w-4 h-4" />
                    Clear Cache
                  </CardTitle>
                  <CardDescription>Clear system cache and temporary files</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Clear Cache</Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>Configure user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Roles</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>Customize the portal appearance</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Customize Theme</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                API Configuration
              </CardTitle>
              <CardDescription>Manage API keys and integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">API Settings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}