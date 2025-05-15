# Blackfyre-App

Blackfyre-App is a web application developed using Node.js, Express, EJS, and Microsoft SQL Server Express. It facilitates user registration by integrating with Second Life (SL), auto-populating SL credentials, and ensuring secure token-based verification.

## 🚀 **Features**

- **User Registration:**
  - Auto-populates SL UUID and SL Username.
  - Validates user input.
  - Secure password hashing using bcrypt.
  
- **Token-Based Verification:**
  - Generates JWT tokens that expire every 15 minutes to ensure authenticity.
  
- **Security Enhancements:**
  - Utilizes Helmet for securing HTTP headers.
  - Implements rate limiting to prevent abuse.
  
- **Database Integration:**
  - Connects to Microsoft SQL Server Express using SQL Server Authentication.
  
## 📦 **Prerequisites**

- **Node.js** (v14 or above)
- **npm** (v6 or above)
- **Microsoft SQL Server Express** installed and running
- **Git** (optional, for version control)

## 🛠 **Setup Instructions**

### 1. **Clone the Repository**

```bash
git clone https://github.com/yourusername/blackfyre-app.git
cd blackfyre-app
