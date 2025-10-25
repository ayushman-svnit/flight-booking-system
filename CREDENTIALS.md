# 🔐 LOGIN CREDENTIALS

## ✅ ISSUE RESOLVED!

The admin password has been **reset successfully**. You can now login!

---

## 👨‍💼 ADMIN ACCOUNTS

### Default Admin
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** admin@flight.com

### User Admin Accounts
- **Username:** `u24cs103`
- **Password:** (your registered password)

- **Username:** `Spidey`
- **Password:** (your registered password)

---

## 👤 REGULAR USER ACCOUNTS

### User 1
- **Username:** `ayushman27`
- **Password:** (your registered password)

### User 2
- **Username:** `mayank259`
- **Password:** (your registered password)

### User 3
- **Username:** `vegetto19`
- **Password:** (your registered password)

### User 4
- **Username:** `Niggesh`
- **Password:** (your registered password)

---

## 🚀 HOW TO LOGIN

1. **Start Backend Server:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start Frontend Server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser:**
   - Go to: http://localhost:5174 (or the port shown in terminal)

4. **Login:**
   - Use **admin/admin123** for admin access
   - Use your registered username and password for user access

---

## 🔧 TROUBLESHOOTING

### Password Issues?

If you forgot your password for any account, run this script:

```bash
cd backend
python reset_admin_password.py
```

This will:
1. Show current admin password
2. Allow you to reset admin password to `admin123`

### Can't Login?

Make sure:
- ✅ Backend server is running on port 8000
- ✅ Frontend server is running (check terminal for port)
- ✅ You're using the correct credentials
- ✅ CORS is enabled (already configured)

---

## 📝 NOTE

**The original admin password was:** `secret`

**It has been changed to:** `admin123`

All user passwords remain as you set them during registration.

---

*Last Updated: October 25, 2025*
