# 🔐 ID-Based Authentication System Guide

## 🎯 **Overview**

Your backend now supports **ID and Password** authentication instead of email-based login. This is perfect for academic systems where users have unique Student IDs or Employee IDs.

## 🔑 **Authentication Method**

### **Login Credentials**

- **Students**: Use `Student ID + Password`
- **Teachers**: Use `Employee ID + Password`
- **Admins**: Use `Employee ID + Password`

### **No Firebase Required**

- ✅ Works completely without Firebase
- ✅ Uses JWT tokens for secure authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control

---

## 🧪 **Testing the System**

### **1. View Sample Credentials**

Visit: `http://localhost:8000/api/v1/mock-auth/sample-credentials`

**Sample Login Credentials:**

```json
{
  "student_credentials": [
    {
      "user_id": "2024001",
      "password": "student123",
      "role": "student",
      "name": "John Doe"
    },
    {
      "user_id": "2024002",
      "password": "student123",
      "role": "student",
      "name": "Jane Smith"
    }
  ],
  "teacher_credentials": [
    {
      "user_id": "T001",
      "password": "teacher123",
      "role": "teacher",
      "name": "Prof. Michael Johnson"
    }
  ],
  "admin_credentials": [
    {
      "user_id": "A001",
      "password": "admin123",
      "role": "admin",
      "name": "System Administrator"
    }
  ]
}
```

### **2. Test Login (Mock)**

**Endpoint**: `POST /api/v1/mock-auth/test-login`

**Example Request:**

```json
{
  "user_id": "2024001",
  "password": "student123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "user_id": "2024001",
    "full_name": "John Doe",
    "role": "student",
    "department": "Computer Science"
  }
}
```

---

## 🚀 **Real Authentication Endpoints**

### **1. Register New User**

**Endpoint**: `POST /api/v1/auth/register`

**Request Body:**

```json
{
  "user_id": "2024003",
  "password": "securepass123",
  "full_name": "Alice Johnson",
  "role": "student",
  "phone_number": "0123456789",
  "department": "Computer Science",
  "campus": "Main Campus",
  "email": "alice@student.edu"
}
```

### **2. Login**

**Endpoint**: `POST /api/v1/auth/login`

**Request Body:**

```json
{
  "user_id": "2024001",
  "password": "student123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "student_id": "2024001",
    "full_name": "John Doe",
    "role": "student",
    "status": "active"
  }
}
```

### **3. Get Current User Profile**

**Endpoint**: `GET /api/v1/auth/me`

**Headers:**

```
Authorization: Bearer your_jwt_token_here
```

---

## 📱 **Mobile App Integration**

### **React Native Login Flow**

```typescript
// LoginScreen.tsx
const handleLogin = async (userId: string, password: string) => {
  try {
    const response = await fetch("http://localhost:8000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store JWT token
      await AsyncStorage.setItem("token", data.access_token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      // Navigate to main app
      navigation.navigate("MainTabs");
    } else {
      Alert.alert("Login Failed", data.detail);
    }
  } catch (error) {
    Alert.alert("Error", "Network error occurred");
  }
};
```

### **Authenticated API Calls**

```typescript
// API service with authentication
const apiCall = async (endpoint: string, token: string) => {
  const response = await fetch(`http://localhost:8000${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    navigation.navigate("Login");
    return;
  }

  return response.json();
};
```

---

## 🔐 **Security Features**

### **✅ What's Implemented**

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: 30-minute expiration
- **Role-based Access**: Student, Teacher, Admin roles
- **Input Validation**: Pydantic schemas
- **Error Handling**: Secure error messages

### **🛡️ Security Best Practices**

- Tokens expire in 30 minutes (configurable)
- Passwords require minimum 6 characters
- User IDs are unique across system
- Account status checking (active/inactive)
- Failed login protection

---

## 🎯 **Next Steps**

### **For Mobile Development**

1. **Start Building Login Screen**: Use the sample credentials for testing
2. **Implement Token Storage**: Use AsyncStorage or SecureStore
3. **Add Authentication Context**: Manage login state across app
4. **Test with Mock Data**: Use the mock endpoints for development

### **For Production**

1. **Set Up Database**: Install Docker and run PostgreSQL
2. **Create Real Users**: Use the registration endpoint
3. **Add Password Reset**: Implement forgot password flow
4. **Enable Firebase** (Optional): For real-time features

---

## 🧪 **Testing Commands**

### **Test Registration**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "2024999",
    "password": "testpass123",
    "full_name": "Test User",
    "role": "student",
    "department": "Testing"
  }'
```

### **Test Login**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "2024999",
    "password": "testpass123"
  }'
```

---

## 🎉 **Your System is Ready!**

✅ **ID-based authentication working**  
✅ **Mock data for immediate testing**  
✅ **JWT token security**  
✅ **Role-based access control**  
✅ **Mobile-ready API endpoints**

**You can start building your React Native app right now!** 🚀

Use the mock credentials to test your mobile login flow, then switch to real registration/login when you're ready.
