"""
Script to reset admin password or verify existing credentials
"""
from database import SessionLocal, User
from auth import get_password_hash, verify_password

def reset_admin_password():
    db = SessionLocal()
    try:
        # Find admin user
        admin = db.query(User).filter(User.username == "admin").first()
        
        if not admin:
            print("❌ Admin user not found!")
            return
        
        print(f"✅ Found admin user: {admin.username} ({admin.email})")
        print(f"Current password hash: {admin.password_hash}")
        
        # Test current passwords
        passwords_to_test = ["secret", "admin123", "admin", "password"]
        
        print("\n🔍 Testing common passwords:")
        for pwd in passwords_to_test:
            if verify_password(pwd, admin.password_hash):
                print(f"✅ CURRENT PASSWORD IS: '{pwd}'")
                break
        else:
            print("❌ None of the common passwords matched")
        
        # Option to reset password
        print("\n" + "="*50)
        reset = input("Do you want to reset admin password to 'admin123'? (yes/no): ").strip().lower()
        
        if reset == "yes":
            new_hash = get_password_hash("admin123")
            admin.password_hash = new_hash
            db.commit()
            print("✅ Admin password has been reset to 'admin123'")
            print(f"New hash: {new_hash}")
        else:
            print("❌ Password not changed")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("="*50)
    print("Admin Password Reset Utility")
    print("="*50)
    reset_admin_password()
