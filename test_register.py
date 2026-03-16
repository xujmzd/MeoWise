import requests

BASE_URL = "http://127.0.0.1:8080/api/v1"

def test_register():
    payload = {
        "email": "test@example.com",
        "password": "123456"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=payload)
    print("Status:", r.status_code)
    print("Raw Response:", r.text)  # 打印原始响应

if __name__ == "__main__":
    test_register()
