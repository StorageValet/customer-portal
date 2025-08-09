#\!/bin/bash
echo "=== Testing Authentication Flow ==="

# 1. Create a new user via signup
echo -e "\n1. Creating new test user..."
TIMESTAMP=$(date +%s)
EMAIL="test.user.${TIMESTAMP}@example.com"
PASSWORD="TestPassword123\!"

SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"plan\": \"starter\"
  }")

echo "Signup response: $(echo $SIGNUP_RESPONSE | jq -c .)"
USER_ID=$(echo $SIGNUP_RESPONSE | jq -r '.user.id')

# 2. Test login with credentials
echo -e "\n2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

echo "Login response: $(echo $LOGIN_RESPONSE | jq -c .)"

# 3. Test session persistence
echo -e "\n3. Testing session persistence (getting user data)..."
USER_RESPONSE=$(curl -s http://localhost:3000/api/auth/user \
  -b cookies.txt)

echo "User data response: $(echo $USER_RESPONSE | jq -c '.id, .email, .firstName' 2>/dev/null || echo $USER_RESPONSE)"

# 4. Test accessing protected endpoint
echo -e "\n4. Testing protected endpoint (items)..."
ITEMS_RESPONSE=$(curl -s http://localhost:3000/api/items \
  -b cookies.txt)

echo "Items response: $(echo $ITEMS_RESPONSE | jq -c 'if type == "array" then length else . end' 2>/dev/null || echo "Access denied or error")"

# 5. Test logout
echo -e "\n5. Testing logout..."
LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt)

echo "Logout response: $(echo $LOGOUT_RESPONSE | jq -c .)"

# 6. Verify session is cleared
echo -e "\n6. Verifying session is cleared..."
USER_AFTER_LOGOUT=$(curl -s http://localhost:3000/api/auth/user \
  -b cookies.txt)

echo "User after logout: $(echo $USER_AFTER_LOGOUT | jq -c .)"

# Clean up
rm -f cookies.txt

echo -e "\n=== Auth Flow Test Complete ==="
echo "Test user created: ${EMAIL}"
