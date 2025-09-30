#!/usr/bin/env python3
"""
Backend Testing Script for Academic Portal API
Tests all endpoints to ensure everything is working correctly
"""

import requests
import json
import sys
from datetime import datetime

# API Base URL
BASE_URL = "http://localhost:8000"

def test_endpoint(method, endpoint, data=None, headers=None):
    """Test an API endpoint and return the result"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        return {
            "status_code": response.status_code,
            "success": 200 <= response.status_code < 300,
            "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            "url": url
        }
    except requests.exceptions.ConnectionError:
        return {"error": "Connection failed - is the server running?", "url": url}
    except Exception as e:
        return {"error": str(e), "url": url}

def run_backend_tests():
    """Run comprehensive backend tests"""
    print("🧪 Academic Portal API Backend Testing")
    print("=" * 50)
    
    tests = []
    
    # Test 1: Root endpoint
    print("1. Testing Root Endpoint...")
    result = test_endpoint("GET", "/")
    tests.append(("Root Endpoint", result))
    if result.get("success"):
        print("   ✅ Root endpoint working")
        print(f"   📄 Response: {result['data'].get('message', 'N/A')}")
    else:
        print(f"   ❌ Root endpoint failed: {result.get('error', 'Unknown error')}")
    
    # Test 2: Health check
    print("\n2. Testing Health Check...")
    result = test_endpoint("GET", "/health")
    tests.append(("Health Check", result))
    if result.get("success"):
        print("   ✅ Health check working")
        print(f"   📊 Status: {result['data'].get('status', 'N/A')}")
    else:
        print(f"   ❌ Health check failed: {result.get('error', 'Unknown error')}")
    
    # Test 3: API Documentation
    print("\n3. Testing API Documentation...")
    result = test_endpoint("GET", "/docs")
    tests.append(("API Docs", result))
    if result.get("success"):
        print("   ✅ API documentation accessible")
    else:
        print(f"   ❌ API docs failed: {result.get('error', 'Unknown error')}")
    
    # Test 4: OpenAPI Schema
    print("\n4. Testing OpenAPI Schema...")
    result = test_endpoint("GET", "/openapi.json")
    tests.append(("OpenAPI Schema", result))
    if result.get("success"):
        print("   ✅ OpenAPI schema available")
        print(f"   📋 Title: {result['data'].get('info', {}).get('title', 'N/A')}")
    else:
        print(f"   ❌ OpenAPI schema failed: {result.get('error', 'Unknown error')}")
    
    # Test 5: Courses endpoint
    print("\n5. Testing Courses API...")
    result = test_endpoint("GET", "/api/v1/courses/")
    tests.append(("Courses API", result))
    if result.get("success"):
        courses = result['data']
        print(f"   ✅ Courses API working - Found {len(courses)} courses")
        if courses:
            print(f"   📚 Sample course: {courses[0].get('name', 'N/A')}")
    else:
        print(f"   ❌ Courses API failed: {result.get('error', 'Unknown error')}")
    
    # Test 6: Schedule endpoint
    print("\n6. Testing Schedule API...")
    result = test_endpoint("GET", "/api/v1/schedule/")
    tests.append(("Schedule API", result))
    if result.get("success"):
        schedule = result['data']
        print(f"   ✅ Schedule API working - Found {len(schedule)} schedule entries")
        if schedule:
            print(f"   📅 Sample class: {schedule[0].get('course_name', 'N/A')}")
    else:
        print(f"   ❌ Schedule API failed: {result.get('error', 'Unknown error')}")
    
    # Test 7: Schedule by day
    print("\n7. Testing Schedule by Day...")
    result = test_endpoint("GET", "/api/v1/schedule/day/monday")
    tests.append(("Schedule by Day", result))
    if result.get("success"):
        schedule = result['data']
        print(f"   ✅ Schedule by day working - Found {len(schedule)} Monday classes")
    else:
        print(f"   ❌ Schedule by day failed: {result.get('error', 'Unknown error')}")
    
    # Test 8: Course by department
    print("\n8. Testing Course by Department...")
    result = test_endpoint("GET", "/api/v1/courses/department/Computer Science")
    tests.append(("Course by Department", result))
    if result.get("success"):
        courses = result['data']
        print(f"   ✅ Course by department working - Found {len(courses)} CS courses")
    else:
        print(f"   ❌ Course by department failed: {result.get('error', 'Unknown error')}")
    
    # Test Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in tests if result.get("success"))
    total = len(tests)
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Your backend is working perfectly!")
        print("\n🚀 Your Academic Portal API is ready for:")
        print("   • Mobile app integration")
        print("   • Frontend development") 
        print("   • Production deployment")
    else:
        print(f"\n⚠️  {total - passed} tests failed. Check the errors above.")
    
    print(f"\n📍 API Documentation: {BASE_URL}/docs")
    print(f"📍 Health Check: {BASE_URL}/health")
    
    return passed == total

if __name__ == "__main__":
    success = run_backend_tests()
    sys.exit(0 if success else 1)