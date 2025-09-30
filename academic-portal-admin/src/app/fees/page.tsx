import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  User,
  MoreHorizontal
} from 'lucide-react';

export default function FeesPage() {
  const mockPayments = [
    {
      id: 1,
      studentName: 'John Doe',
      studentId: 'GRW001234',
      amount: '$2,500.00',
      feeType: 'Tuition Fee',
      semester: 'Fall 2024',
      dueDate: '2024-02-15',
      paidDate: '2024-02-10',
      status: 'Paid',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      studentId: 'GRW001235',
      amount: '$2,500.00',
      feeType: 'Tuition Fee',
      semester: 'Fall 2024',
      dueDate: '2024-02-15',
      paidDate: null,
      status: 'Pending',
      paymentMethod: null
    },
    {
      id: 3,
      studentName: 'Mike Johnson',
      studentId: 'GRW001236',
      amount: '$500.00',
      feeType: 'Lab Fee',
      semester: 'Fall 2024',
      dueDate: '2024-02-20',
      paidDate: '2024-02-18',
      status: 'Paid',
      paymentMethod: 'Credit Card'
    },
    {
      id: 4,
      studentName: 'Sarah Wilson',
      studentId: 'GRW001237',
      amount: '$2,500.00',
      feeType: 'Tuition Fee',
      semester: 'Fall 2024',
      dueDate: '2024-02-10',
      paidDate: null,
      status: 'Overdue',
      paymentMethod: null
    },
    {
      id: 5,
      studentName: 'David Brown',
      studentId: 'GRW001238',
      amount: '$1,000.00',
      feeType: 'Housing Fee',
      semester: 'Fall 2024',
      dueDate: '2024-02-25',
      paidDate: '2024-02-22',
      status: 'Paid',
      paymentMethod: 'Online Payment'
    }
  ];

  const feeStats = [
    {
      label: 'Total Revenue',
      value: '$125,450',
      change: '+8.2%',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      label: 'Pending Payments',
      value: '$23,750',
      change: '+12',
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      label: 'Overdue Payments',
      value: '$8,500',
      change: '+3',
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      label: 'Payment Rate',
      value: '94.2%',
      change: '+2.1%',
      icon: TrendingUp,
      color: 'text-blue-600'
    }
  ];

  const feeTypes = [
    'All Fees',
    'Tuition Fee',
    'Lab Fee',
    'Housing Fee',
    'Library Fee',
    'Activity Fee',
    'Graduation Fee'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Paid
        </Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>;
      case 'Overdue':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Overdue
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    if (!method) return null;
    switch (method) {
      case 'Credit Card':
        return <CreditCard className="w-4 h-4" />;
      case 'Bank Transfer':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Fee
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {feeStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                      <p className="text-sm text-green-600 mt-1">{stat.change} this month</p>
                    </div>
                    <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Fee Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fee Management</CardTitle>
                <CardDescription>Manage tuition, fees, and payment processing</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search payments..." 
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Fee Type Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {feeTypes.map((type, index) => (
                <Button 
                  key={index}
                  variant={index === 0 ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {type}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {mockPayments.map((payment) => (
                <div key={payment.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground">
                      {payment.studentName}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>ID: {payment.studentId}</span>
                      <span>•</span>
                      <span>{payment.feeType}</span>
                      <span>•</span>
                      <span>{payment.semester}</span>
                      <span>•</span>
                      <span>Due: {payment.dueDate}</span>
                      {payment.paidDate && (
                        <>
                          <span>•</span>
                          <span>Paid: {payment.paidDate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">
                      {payment.amount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(payment.status)}
                  </div>

                  {payment.paymentMethod && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                      <span className="text-xs">{payment.paymentMethod}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Calendar className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Overdue Notices
              </CardTitle>
              <CardDescription>Send payment reminders to students</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Send Reminders</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Plans
              </CardTitle>
              <CardDescription>Manage installment payment options</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Configure Plans</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Financial Reports
              </CardTitle>
              <CardDescription>Generate revenue and payment reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Reports</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}