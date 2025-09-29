# Test the backend step by step
echo "Testing backend endpoints..."

echo -e "\n=== 1. Health Check ==="
curl -i http://localhost:5000/health
echo -e "\n"

echo -e "\n=== 2. Root Endpoint ==="
curl -i http://localhost:5000/
echo -e "\n"

echo -e "\n=== 3. Languages Endpoint ==="
curl -i http://localhost:5000/api/v1/languages
echo -e "\n"

echo -e "\n=== 4. Model Info Endpoint ==="
curl -i http://localhost:5000/api/v1/model-info
echo -e "\n"

echo -e "\n=== 5. Check if backend container is running ==="
docker ps | grep whisper-backend

echo -e "\n=== 6. Check backend logs ==="
docker logs whisper-backend-dev --tail 20