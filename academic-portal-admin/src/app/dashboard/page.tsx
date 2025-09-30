import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Users, BookOpen, GraduationCap } from 'lucide-react';

export default function Dashboard() {
  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        }
      />
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Total Students</h3>
                <p className="text-3xl font-bold mt-2 text-blue-600">1,247</p>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  +12% from last month
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Active Courses</h3>
                <p className="text-3xl font-bold mt-2 text-green-600">64</p>
                <p className="text-sm text-muted-foreground">+3 new courses</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Faculty Members</h3>
                <p className="text-3xl font-bold mt-2 text-purple-600">89</p>
                <p className="text-sm text-muted-foreground">+2 this month</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Enrollment Rate</h3>
                <p className="text-3xl font-bold mt-2 text-orange-600">94.2%</p>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  +2.1% increase
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="bg-card rounded-lg border">
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New student registration</p>
                    <p className="text-xs text-muted-foreground">John Doe enrolled in Computer Science</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
                
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Course published</p>
                    <p className="text-xs text-muted-foreground">Introduction to Machine Learning is now live</p>
                  </div>
                  <span className="text-xs text-muted-foreground">4 hours ago</span>
                </div>
                
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment processed</p>
                    <p className="text-xs text-muted-foreground">Tuition fee payment received from Jane Smith</p>
                  </div>
                  <span className="text-xs text-muted-foreground">6 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
