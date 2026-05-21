# Security Guidelines and Best Practices

**Document Version:** 1.0  
**Last Updated:** 2026-05-21  
**Owner:** CTO  
**Status:** Active

## Purpose

This document defines comprehensive security guidelines, best practices, and requirements for developing, deploying, and operating secure software systems. Security is everyone's responsibility.

## Security Principles

### Core Security Principles

1. **Defense in Depth**
   - Multiple layers of security controls
   - No single point of failure
   - Assume breach mentality
   - Compartmentalization

2. **Least Privilege**
   - Minimum necessary access
   - Role-based permissions
   - Time-limited access
   - Regular permission reviews

3. **Secure by Default**
   - Secure configurations by default
   - Opt-out security features
   - Secure failure modes
   - Zero-trust architecture

4. **Fail Securely**
   - Deny by default
   - Graceful degradation
   - Secure error handling
   - No sensitive data in errors

5. **Zero Trust**
   - Verify every access request
   - Never trust, always verify
   - Micro-segmentation
   - Continuous authentication

## Secure Development Lifecycle

### Security in Requirements

**Security Requirements Checklist:**
- [ ] Authentication and authorization requirements
- [ ] Data classification and protection needs
- [ ] Compliance requirements (GDPR, HIPAA, SOC 2)
- [ ] Third-party integration security
- [ ] Audit and logging requirements
- [ ] Incident response planning

**Threat Modeling:**
- Conduct during design phase
- Identify assets and entry points
- Identify threats and vulnerabilities
- Define countermeasures
- Review and update regularly

**STRIDE Model:**
- **S**poofing: Impersonating users or systems
- **T**ampering: Modifying data
- **R**epudiation: Denying actions
- **I**nformation Disclosure: Data leakage
- **D**enial of Service: Service disruption
- **E**levation of Privilege: Unauthorized access

### Security in Design

**Secure Design Principles:**
- Input validation at entry points
- Output encoding to prevent injection
- Parameterized queries only
- Secure session management
- Cryptographic best practices
- Secure defaults

**Attack Surface Analysis:**
- Identify all entry points
- Map data flows
- Identify trust boundaries
- Document security controls
- Prioritize high-risk areas

### Security in Implementation

**Secure Coding Standards:**
- Follow OWASP Top 10 prevention
- Use security-focused code reviews
- Automated security scanning
- Dependency vulnerability management
- Secrets management

**Code Review Security Checklist:**
- [ ] Input validation on all user inputs
- [ ] Output encoding for dynamic content
- [ ] Authentication checks on all endpoints
- [ ] Authorization checks for sensitive operations
- [ ] Secure error handling (no stack traces to users)
- [ ] Cryptographic implementations reviewed
- [ ] No hardcoded secrets or credentials
- [ ] Logging of security events

## Authentication and Authorization

### Authentication Best Practices

**Password Authentication:**
- Minimum 12 characters (preferably 16+)
- Require complexity (uppercase, lowercase, numbers, symbols)
- Password history (prevent reuse)
- Account lockout after failed attempts
- Secure password storage (Argon2, bcrypt, scrypt)
- No password hints or security questions

**Multi-Factor Authentication (MFA):**
- Require MFA for privileged accounts
- Support TOTP (Google Authenticator, Authy)
- Support hardware tokens (YubiKey)
- Backup codes for recovery
- Step-up authentication for sensitive operations

**Session Management:**
- Secure, HttpOnly cookies
- Short session timeouts (15-30 minutes)
- Rotation of session IDs
- Secure logout (invalidate session)
- Concurrent session limits
- Device fingerprinting

**Token-Based Authentication:**
- JWT for stateless authentication
- Short expiration times (15 minutes)
- Refresh token rotation
- Token binding
- Secure storage (HttpOnly cookies)
- Revocation capability

### Authorization Best Practices

**Role-Based Access Control (RBAC):**
- Define clear roles and permissions
- Principle of least privilege
- Regular access reviews
- Automated provisioning/deprovisioning
- Separation of duties

**Permission Implementation:**
```python
# Good: Explicit permission checks
def delete_user(current_user, user_id):
    if not current_user.has_permission('user:delete'):
        raise AuthorizationError("Insufficient permissions")
    
    if not current_user.can_delete_user(user_id):
        raise AuthorizationError("Cannot delete this user")
    
    # Perform deletion
    user_service.delete(user_id)
```

**Attribute-Based Access Control (ABAC):**
- Resource attributes
- User attributes
- Environmental conditions
- Policy-based decisions

**API Authorization:**
- OAuth 2.0 for delegation
- JWT for claims
- Scope-based permissions
- Resource-based authorization
- Rate limiting per user/role

## Input Validation and Output Encoding

### Input Validation

**Validation Principles:**
- Validate all input (never trust user data)
- Whitelist over blacklist
- Validate on server side (client-side is UX only)
- Type, length, format, and range validation
- Context-aware validation

**Validation Implementation:**
```python
from pydantic import BaseModel, EmailStr, validator

class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    age: int
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        return v
    
    @validator('age')
    def age_range(cls, v):
        if v < 13 or v > 120:
            raise ValueError('Age must be between 13 and 120')
        return v
```

**Common Validation Rules:**
- Email format and domain validation
- Phone number format
- File type and size limits
- Path traversal prevention
- Command injection prevention
- LDAP injection prevention
- XML/XXE attack prevention

### Output Encoding

**Context-Aware Encoding:**
```python
# HTML context
from markupsafe import escape
user_input = "<script>alert('xss')</script>"
safe_output = escape(user_input)  # &lt;script&gt;alert('xss')&lt;/script&gt;

# JavaScript context
import json
data = {"message": user_input}
safe_js = json.dumps(data)  # {"message": "<script>..."}

# URL context
from urllib.parse import quote
user_input = "../../etc/passwd"
safe_url = quote(user_input, safe='')
```

**Encoding Contexts:**
- HTML encoding
- JavaScript encoding
- CSS encoding
- URL encoding
- SQL encoding (use parameterized queries instead)
- LDAP encoding
- XML encoding

## Database Security

### SQL Injection Prevention

**Parameterized Queries Only:**
```python
# Never do this
query = f"SELECT * FROM users WHERE username = '{user_input}'"

# Always do this
query = "SELECT * FROM users WHERE username = %s"
cursor.execute(query, (user_input,))
```

**ORM Security:**
```python
# Good: ORM with proper parameterization
user = session.query(User).filter(User.email == email).first()

# Bad: Raw SQL with string formatting
user = session.execute(f"SELECT * FROM users WHERE email = '{email}'").first()
```

**NoSQL Injection Prevention:**
```javascript
// MongoDB - use operators, not string concatenation
// Bad
db.users.find({ username: req.query.username });

// Good
db.users.find({ username: { $eq: req.query.username } });
```

### Database Configuration

**Secure Configuration:**
- Least privilege database users
- Separate users per application
- No administrative access from application
- Connection encryption (TLS)
- Audit logging enabled
- Regular security patches
- Backup encryption

## Cryptography

### Encryption Best Practices

**Data at Rest:**
- AES-256 for symmetric encryption
- RSA-2048 or higher for asymmetric
- Proper key management
- Secure key storage (HSM, Key Vault)
- Regular key rotation

**Data in Transit:**
- TLS 1.2 or higher only
- Strong cipher suites
- Certificate validation
- Perfect forward secrecy
- HSTS enabled

**Password Storage:**
```python
import argon2

# Argon2id (winner of Password Hashing Competition)
ph = argon2.PasswordHasher(
    time_cost=3,        # Number of iterations
    memory_cost=65536,  # 64MB memory cost
    parallelism=4,      # Number of parallel threads
    hash_len=32,        # Length of hash
    salt_len=16         # Length of random salt
)

hash = ph.hash("user_password")

# Verification
try:
    ph.verify(hash, "user_password")
    # Password matches
except argon2.exceptions.VerifyMismatchError:
    # Password doesn't match
```

**Key Management:**
- Use managed key services (Azure Key Vault, AWS KMS)
- Never hardcode encryption keys
- Separate keys per environment
- Regular key rotation
- Access logging and monitoring
- Key backup and recovery

**Cryptographic Libraries:**
- Use well-maintained, audited libraries
- Avoid custom cryptographic implementations
- Keep libraries updated
- Follow language-specific best practices

## API Security

### REST API Security

**Authentication:**
- OAuth 2.0 / JWT for stateless auth
- API keys for service-to-service
- Mutual TLS for high-security scenarios
- Rate limiting by user/API key

**Authorization:**
- Scope-based permissions
- Resource-level access control
- Rate limiting
- IP whitelisting (where appropriate)

**Input Validation:**
```python
from flask import request, abort
from marshmallow import Schema, fields, validate

class UserUpdateSchema(Schema):
    email = fields.Email(required=True)
    role = fields.Str(validate=validate.OneOf(['user', 'admin']))
    age = fields.Int(validate=validate.Range(min=13, max=120))

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@require_auth
def update_user(user_id):
    schema = UserUpdateSchema()
    errors = schema.validate(request.json)
    if errors:
        abort(400, str(errors))
    
    # Additional authorization check
    if not current_user.can_update_user(user_id):
        abort(403, "Permission denied")
    
    # Process update
    user_service.update(user_id, request.json)
    return jsonify({'status': 'success'}), 200
```

**GraphQL Security:**
- Query complexity analysis
- Depth limiting
- Rate limiting by query cost
- Authentication on all resolvers
- Authorization in business logic
- Field-level permissions

**Rate Limiting:**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route("/api/expensive-operation")
@limiter.limit("10 per minute")
def expensive_operation():
    # Process request
    pass
```

**CORS Configuration:**
```python
from flask_cors import CORS

CORS(app, 
     resources={r"/api/*": {"origins": "https://app.example.com"}},
     supports_credentials=True,
     max_age=3600)
```

## Dependency Security

### Dependency Management

**Vulnerability Scanning:**
- Automated scanning (Dependabot, Snyk, OWASP Dependency Check)
- Fail builds on high/critical vulnerabilities
- Regular security updates
- License compliance checking

**Dependency Updates:**
- Regular update schedule
- Automated minor/patch updates
- Manual review of major updates
- Testing after updates
- Rollback plan

**Dependency Selection:**
- Prefer well-maintained libraries
- Check security track record
- Review community support
- Assess project maturity
- Consider package size and attack surface

### Supply Chain Security

**Package Integrity:**
- Verify package signatures
- Use lock files (package-lock.json, Pipfile.lock)
- Pin dependencies to specific versions
- Use private package repositories
- Audit build tools and plugins

**SBOM (Software Bill of Materials):**
- Maintain inventory of all dependencies
- Track versions and licenses
- Monitor for vulnerabilities
- Compliance reporting

## Container and Infrastructure Security

### Container Security

**Image Security:**
- Use minimal base images (distroless, Alpine)
- Scan images for vulnerabilities
- No secrets in images
- Run as non-root user
- Read-only root filesystem
- Drop unnecessary capabilities

**Example Dockerfile:**
```dockerfile
# Use minimal base image
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY --chown=nextjs:nodejs . .

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

# Run application
CMD ["npm", "start"]
```

**Kubernetes Security:**
- RBAC for access control
- Network policies
- Pod security policies
- Secrets encryption at rest
- Runtime security monitoring
- Admission controllers

### Infrastructure Security

**Network Security:**
- Network segmentation
- Firewall rules (deny by default)
- VPN for admin access
- Bastion hosts or jump boxes
- DDoS protection
- WAF (Web Application Firewall)

**Identity and Access Management:**
- Managed identity for cloud resources
- No long-lived credentials
- Key rotation automation
- MFA for all accounts
- Least privilege access
- Regular access reviews

**Secret Management:**
- Use secret management services (Azure Key Vault, AWS Secrets Manager)
- No secrets in code or config files
- Secrets injected at runtime
- Access logging
- Regular rotation

## Monitoring and Incident Response

### Security Monitoring

**Log Everything:**
```python
import logging
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

def authenticate_user(email, password):
    logger.info("authentication_attempt", email=email, ip=request.remote_addr)
    
    try:
        user = user_service.authenticate(email, password)
        logger.info("authentication_success", user_id=user.id, email=email)
        return user
    except AuthenticationError as e:
        logger.warning("authentication_failed", email=email, reason=str(e))
        raise
```

**Security Events to Log:**
- Authentication attempts (success and failure)
- Authorization failures
- Privilege escalations
- Data access (especially sensitive data)
- Configuration changes
- Failed input validation
- System errors and exceptions

**Monitoring and Alerting:**
- SIEM (Security Information and Event Management)
- Anomaly detection
- Failed login attempts
- Privilege escalation
- Unusual data access patterns
- Configuration drift
- Vulnerability scanning results

### Incident Response

**Incident Response Plan:**
1. **Detection:** Automated alerts, user reports
2. **Analysis:** Determine scope and impact
3. **Containment:** Stop the attack, prevent spread
4. **Eradication:** Remove threat, fix vulnerabilities
5. **Recovery:** Restore systems, verify integrity
6. **Lessons Learned:** Post-mortem and improvements

**Response Team:**
- Incident Commander
- Technical Lead
- Communications Lead
- Legal/Compliance Representative

**Communication Plan:**
- Internal communication channels
- Customer notification procedures
- Regulatory reporting requirements
- Public relations coordination

## Compliance and Auditing

### Regulatory Compliance

**GDPR Requirements:**
- Data minimization
- Purpose limitation
- Consent management
- Right to access
- Right to erasure
- Data portability
- Breach notification (72 hours)

**Data Protection:**
- Data classification
- Encryption in transit and at rest
- Access controls
- Audit logging
- Regular security assessments

**Compliance Frameworks:**
- SOC 2 Type II
- ISO 27001
- HIPAA (healthcare)
- PCI DSS (payment processing)
- FedRAMP (government)

### Security Auditing

**Internal Audits:**
- Quarterly security reviews
- Access control audits
- Configuration reviews
- Penetration testing
- Vulnerability assessments

**Third-Party Audits:**
- Annual security assessments
- Penetration testing
- Compliance audits
- Code security reviews

**Audit Trail Requirements:**
- Immutable logs
- Tamper detection
- Retention policies
- Secure storage
- Access controls

## Security Training and Awareness

### Developer Security Training

**Required Training:**
- Secure coding practices
- OWASP Top 10
- Company security policies
- Incident response procedures
- Phishing awareness

**Ongoing Education:**
- Security newsletters and alerts
- Threat intelligence sharing
- Security champion program
- Capture the flag exercises
- Security incident reviews

### Security Culture

**Responsibilities:**
- Security is everyone's responsibility
- "See something, say something"
- Continuous improvement
- Learning from mistakes
- No blame culture for reporting issues

## Security Tools and Automation

### Security Tooling

**SAST (Static Application Security Testing):**
- SonarQube
- Checkmarx
- Semgrep
- CodeQL

**DAST (Dynamic Application Security Testing):**
- OWASP ZAP
- Burp Suite
- Acunetix

**SCA (Software Composition Analysis):**
- Snyk
- Dependabot
- OWASP Dependency Check
- WhiteSource

**Container Security:**
- Trivy
- Clair
- Anchore
- Falco

**Infrastructure as Code Security:**
- Checkov
- tfsec
- cfn-lint

**Secret Scanning:**
- GitGuardian
- TruffleHog
- Git-secrets

### Automation in CI/CD

```yaml
# GitHub Actions security pipeline
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Run SAST
      uses: github/super-linter@v3
    
    - name: Dependency Scanning
      uses: snyk/actions/python@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    
    - name: Secret Scanning
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
    
    - name: Container Scan (if applicable)
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'myapp:latest'
```

---

**Document History:**
- Version 1.0 (2026-05-21): Initial release

**Approval:**
- CTO: _____________________ Date: ___________
- CISO: _____________________ Date: ___________
- VP Engineering: _____________________ Date: ___________