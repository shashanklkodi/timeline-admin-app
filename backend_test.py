import requests
import sys
from datetime import datetime
import json

class MuseumCMSAPITester:
    def __init__(self, base_url="https://museum-admin-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, status_code=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test": test_name,
            "success": success,
            "status_code": status_code,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {test_name}: {'PASSED' if success else 'FAILED'}")
        if status_code:
            print(f"   Status Code: {status_code}")
        if error:
            print(f"   Error: {error}")
        print()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
            
        if headers:
            test_headers.update(headers)

        print(f"🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_result(name, True, response.status_code)
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            else:
                try:
                    error_detail = response.json().get('detail', f'HTTP {response.status_code}')
                except:
                    error_detail = f'HTTP {response.status_code}'
                    
                self.log_result(name, False, response.status_code, error_detail)
                return {}

        except requests.exceptions.Timeout:
            self.log_result(name, False, None, "Request timeout")
            return {}
        except requests.exceptions.ConnectionError:
            self.log_result(name, False, None, "Connection error")
            return {}
        except Exception as e:
            self.log_result(name, False, None, str(e))
            return {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("🏥 TESTING HEALTH ENDPOINTS")
        print("=" * 50)
        
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_seed_database(self):
        """Test database seeding"""
        print("\n🌱 TESTING DATABASE SEEDING")
        print("=" * 50)
        
        response = self.run_test("Seed Database", "POST", "seed", 200)
        return response

    def test_login(self):
        """Test login functionality"""
        print("\n🔐 TESTING AUTHENTICATION")
        print("=" * 50)
        
        # Test login with admin credentials
        login_data = {
            "email": "admin@museum.com",
            "password": "admin123"
        }
        
        response = self.run_test("Admin Login", "POST", "admin/auth/login", 200, login_data)
        
        if response and 'access_token' in response:
            self.token = response['access_token']
            print(f"   🔑 Token obtained successfully")
            
            # Test get current user
            self.run_test("Get Current User", "GET", "admin/auth/me", 200)
            return True
        else:
            print("   ❌ Failed to obtain token")
            return False

    def test_role_management(self):
        """Test role management endpoints"""
        print("\n👥 TESTING ROLE MANAGEMENT")
        print("=" * 50)
        
        # List permissions
        self.run_test("List Permissions", "GET", "admin/roles/permissions", 200)
        
        # List roles
        roles = self.run_test("List Roles", "GET", "admin/roles", 200)
        
        if roles and len(roles) > 0:
            role_id = roles[0]['id']
            self.run_test("Get Role Details", "GET", f"admin/roles/{role_id}", 200)

    def test_user_management(self):
        """Test user management endpoints"""
        print("\n👤 TESTING USER MANAGEMENT")
        print("=" * 50)
        
        users = self.run_test("List Users", "GET", "admin/users", 200)
        
        if users and len(users) > 0:
            user_id = users[0]['id']
            self.run_test("Get User Details", "GET", f"admin/users/{user_id}", 200)

    def test_category_management(self):
        """Test category management endpoints"""
        print("\n📂 TESTING CATEGORY MANAGEMENT")
        print("=" * 50)
        
        categories = self.run_test("List Categories", "GET", "admin/categories", 200)
        
        if categories and len(categories) > 0:
            category_id = categories[0]['id']
            self.run_test("Get Category Details", "GET", f"admin/categories/{category_id}", 200)

    def test_artifact_management(self):
        """Test artifact management endpoints"""
        print("\n🏺 TESTING ARTIFACT MANAGEMENT")
        print("=" * 50)
        
        artifacts = self.run_test("List Artifacts", "GET", "admin/artifacts", 200)
        
        # Test artifact search and filtering
        self.run_test("Search Artifacts", "GET", "admin/artifacts?search=test", 200)
        self.run_test("Filter by Status", "GET", "admin/artifacts?status=draft", 200)

    def test_gallery_management(self):
        """Test gallery management endpoints"""
        print("\n🖼️ TESTING GALLERY MANAGEMENT")
        print("=" * 50)
        
        galleries = self.run_test("List Galleries", "GET", "admin/galleries", 200)

    def test_timeline_management(self):
        """Test timeline management endpoints"""
        print("\n⏰ TESTING TIMELINE MANAGEMENT")
        print("=" * 50)
        
        timelines = self.run_test("List Timelines", "GET", "admin/timelines", 200)

    def test_media_management(self):
        """Test media management endpoints"""
        print("\n📁 TESTING MEDIA MANAGEMENT")
        print("=" * 50)
        
        media = self.run_test("List Media", "GET", "admin/media", 200)

    def test_frontend_sections(self):
        """Test frontend sections endpoints"""
        print("\n🏗️ TESTING FRONTEND SECTIONS")
        print("=" * 50)
        
        sections = self.run_test("List Sections", "GET", "admin/frontend-sections", 200)

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints"""
        print("\n📊 TESTING DASHBOARD")
        print("=" * 50)
        
        self.run_test("Dashboard Stats", "GET", "admin/dashboard/stats", 200)
        self.run_test("Recent Activity", "GET", "admin/dashboard/recent_activity", 200)

def main():
    print("🏛️ MUSEUM CMS API TESTING SUITE")
    print("=" * 60)
    print(f"Starting tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Initialize tester
    tester = MuseumCMSAPITester()
    
    try:
        # Run tests in sequence
        tester.test_health_endpoints()
        tester.test_seed_database()
        
        # Login is required for all subsequent tests
        if not tester.test_login():
            print("❌ LOGIN FAILED - Cannot proceed with authenticated tests")
            return 1
        
        # Run all authenticated tests
        tester.test_role_management()
        tester.test_user_management()
        tester.test_category_management()
        tester.test_artifact_management()
        tester.test_gallery_management()
        tester.test_timeline_management()
        tester.test_media_management()
        tester.test_frontend_sections()
        tester.test_dashboard_endpoints()
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1
    
    # Print final results
    print("\n" + "=" * 60)
    print("📋 FINAL TEST RESULTS")
    print("=" * 60)
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    
    print(f"✅ Tests Passed: {tester.tests_passed}")
    print(f"❌ Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"📊 Total Tests: {tester.tests_run}")
    print(f"🎯 Success Rate: {success_rate:.1f}%")
    
    # Save detailed results to file
    results_file = "/app/test_reports/backend_test_results.json"
    with open(results_file, 'w') as f:
        json.dump({
            "summary": {
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "failed_tests": tester.tests_run - tester.tests_passed,
                "success_rate": success_rate,
                "timestamp": datetime.now().isoformat()
            },
            "detailed_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())