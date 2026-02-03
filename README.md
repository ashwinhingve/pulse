# PulseLogic - Secure Military Medical MVP

A zero-trust, secure medical decision-support system for military doctors with role-based and clearance-based access control.

## 🔒 Security Features

- **Zero-Trust Architecture**: Every request authenticated, authorized, and audited
- **Role-Based Access Control (RBAC)**: Admin, Doctor, Medic, Public roles
- **Clearance-Based Access**: UNCLASSIFIED, CONFIDENTIAL, SECRET levels
- **Multi-Factor Authentication**: TOTP-based MFA support
- **End-to-End Encryption**: E2EE chat with XSalsa20-Poly1305
- **Audit Logging**: Tamper-proof hash chain for all actions
- **AI Anonymization**: PII/PHI stripped before AI processing
- **Rate Limiting**: Protection against brute force and DDoS

## 🏗️ Architecture

```
Frontend (Next.js) → API Gateway (NGINX) → Backend (NestJS) → Database (PostgreSQL)
                                         ↓
                                    AI Service (Server-side only)
                                         ↓
                                    Anonymization Layer
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1. Clone and Install

```bash
cd "d:\Do Not Open\New folder"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Database Services

```bash
# From project root
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your configuration

# Frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Run Database Migrations

```bash
cd backend
npm run migration:run
```

### 5. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- API Docs: http://localhost:3001/api/docs (if Swagger enabled)

## 📁 Project Structure

```
pulselogic/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── users/          # User management
│   │   ├── audit/          # Audit logging
│   │   ├── ai/             # AI service with anonymization
│   │   ├── chat/           # WebSocket chat
│   │   └── common/         # Shared utilities
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   └── package.json
└── docker-compose.yml     # Local development services
```

## 🔐 Default Users

For development only:

```
Admin:
  Username: admin
  Password: Admin123!
  Role: admin
  Clearance: SECRET

Doctor:
  Username: dr.smith
  Password: Doctor123!
  Role: doctor
  Clearance: SECRET

Medic:
  Username: medic.jones
  Password: Medic123!
  Role: medic
  Clearance: CONFIDENTIAL
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test              # Unit tests
npm run test:e2e          # Integration tests
npm run test:cov          # Coverage report

# Frontend tests
cd frontend
npm run test              # Component tests
npm run test:e2e          # Playwright E2E tests
```

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/enable` - Enable MFA
- `POST /api/auth/mfa/disable` - Disable MFA

### AI Services

- `POST /api/ai/analyze-symptoms` - Symptom analysis (anonymized)
- `POST /api/ai/analyze-ecg` - ECG interpretation support
- `POST /api/ai/query-protocol` - Clinical protocol queries

### Users (Admin only)

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user

## 🛡️ Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Rotate secrets regularly** - JWT secrets, encryption keys
3. **Use strong passwords** - Minimum 8 characters, complexity required
4. **Enable MFA** - For all privileged accounts
5. **Monitor audit logs** - Review daily for suspicious activity
6. **Keep dependencies updated** - Run `npm audit` regularly
7. **Use HTTPS in production** - TLS 1.3 only
8. **Implement rate limiting** - Protect against brute force

## 🚨 Important Disclaimers

> **⚠️ MVP NOTICE**
> 
> This is an MVP (Minimum Viable Product) for demonstration and development purposes.
> It is NOT production-ready and should NOT be used in real clinical settings without:
> 
> - Full security audit and penetration testing
> - HIPAA compliance certification
> - Legal review and approval
> - Proper deployment infrastructure
> - Incident response procedures
> - User training and documentation

> **⚠️ AI DISCLAIMER**
> 
> The AI features provide **decision support only**, NOT diagnosis or treatment recommendations.
> All AI outputs must be reviewed by qualified medical professionals.
> No patient identifiable information is sent to AI services.

## 📄 License

UNLICENSED - Proprietary software for military use only.

## 🤝 Contributing

This is a closed-source project. For internal development only.

## 📞 Support

For issues or questions, contact the development team.

---

**Built with security and compliance in mind for military medical professionals.**
