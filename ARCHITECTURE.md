# Pragmatic Domain-Driven Architecture (PDDA)

## Core Edition: Authentication & Identity Boilerplate

## 1. Architectural Philosophy & Core Tenets

Think of your backend as a high-end restaurant.

- **Express.js (The Waiter):** Only takes orders (Requests) and delivers food (Responses). It does not cook.
- **Services (The Chefs):** Contain all the business logic (Recipes). They don't know or care how the order arrived (HTTP, WebSockets, or a CLI).
- **Repositories (The Pantry Managers):** Fetch ingredients (Data) from the fridge (Database). The Chef doesn't need to know how the fridge is organized, just how to ask for tomatoes.
- **`tsyringe` (The Kitchen Manager):** Dependency Injection. Automatically hands the Chef the exact Pantry Manager they need, meaning you don't manually pass dependencies around.

**Core Rules:**

- **Strict Unidirectional Data Flow:** Route -> Validator -> Controller -> Service -> Repository -> Database.
- **Framework Agnosticism:** Business logic never touches `req`, `res`, or `next`.
- **Database Agnosticism:** Services interact with Repositories using standard TypeScript interfaces. You can swap Prisma for Raw SQL without changing a single line of business logic.

---

## 2. Folder Organization

Organized by **Domain** (Feature), not by Technical Role. This prevents "folder hopping" and scales beautifully.

```text
src/
├── config/                 # Static configs & Env validations (Zod schemas for process.env)
├── core/                   # Shared cross-domain mechanisms
│   ├── di/                 # tsyringe container bootstrap
│   ├── errors/             # AppError, UnauthenticatedError (Custom error classes)
│   ├── middlewares/        # Express logic: authGuard, globalErrorHandler
│   └── security/           # Hashing (Argon2), JWT signing/verification wrappers
├── infrastructure/         # External Systems (Singletons)
│   ├── database/           # DB Connection pool / ORM client
│   ├── cache/              # Redis client (for session blocklists & rate limits)
│   └── mailer/             # Nodemailer / SendGrid client
├── modules/                # Domain Modules
│   ├── auth/               # Core Auth Domain
│   │   ├── auth.routes.ts          # Express Router wiring
│   │   ├── auth.controller.ts      # HTTP Adapter (Req/Res handling)
│   │   ├── auth.service.ts         # Email/Pass logic, login, register
│   │   ├── oauth.service.ts        # Google/GitHub provider logic
│   │   ├── email-verify.service.ts # OTP token generation & validation
│   │   └── auth.schemas.ts         # Zod validation schemas
│   └── users/              # User Management Domain
│       ├── user.repository.ts      # Data access (findByEmail, create)
│       └── user.types.ts           # Domain interfaces (User entity)
├── workers/                # BullMQ background job processors (e.g., SendWelcomeEmail)
├── app.ts                  # Express application assembly
└── server.ts               # Entry point: cluster setup, port binding, reflect-metadata

```

---

## 3. Layer Breakdown & Software Patterns

### 3.1. Infrastructure Layer (Singleton Pattern)

Manages heavy, persistent connections to external systems.

- **Rule:** Zero business logic. Strictly connection handling and generic wrappers.
- **Pattern:** `@singleton()` via `tsyringe` ensures only one Redis or DB connection pool exists application-wide.

### 3.2. Controllers (Adapter Pattern)

Extracts data from Express and formats the response.

- **Rule:** Max 50 lines. No business logic.
- **Pseudocode:**

```typescript
@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {}

  // Bouncer pattern: Extract, Call Service, Respond, Catch Errors
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.registerWithEmail(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error); // Passes to global error middleware
    }
  };
}
```

### 3.3. Services (Core Domain Logic)

The brain of the operation. Orchestrates Repositories and Infrastructure.

- **Rule:** Completely unaware of Express or HTTP.
- **Pseudocode:**

```typescript
@injectable()
export class AuthService {
  constructor(
    @inject(UserRepository) private userRepo: UserRepository,
    @inject(EmailVerifyService) private emailVerifier: EmailVerifyService,
    @inject(Hasher) private hasher: Hasher,
  ) {}

  async registerWithEmail(data: RegisterDTO) {
    // 1. Early Return / Guard
    if (await this.userRepo.findByEmail(data.email)) {
      throw new ConflictError("Email already in use");
    }

    // 2. Core Logic
    const hashedPassword = await this.hasher.hash(data.password);
    const user = await this.userRepo.create({
      ...data,
      password: hashedPassword,
    });

    // 3. Side Effects (Background processing)
    await this.emailVerifier.generateAndSend(user);

    return { id: user.id, email: user.email };
  }
}
```

### 3.4. Repositories (Data Access Layer)

Translates domain needs into database queries. Hides the ORM.

- **Rule:** Methods are named after data operations, not business processes (e.g., `updateVerificationStatus`, NOT `verifyUser`).
- **Pseudocode:**

```typescript
@injectable()
export class UserRepository {
  constructor(@inject("Database") private db: DbClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.db.users.findUnique({ where: { email } });
  }
}
```

---

## 4. Engineering Standards & Developer Experience (DX)

1. **Strict Line Limits:**

- **Functions:** Max 20 lines of core logic. If it exceeds this, abstract it into a private helper method. This forces the Single Responsibility Principle (SRP).
- **Files:** Max 200-300 lines.

2. **The Bouncer Pattern (Early Returns):**

- Check for negative conditions first and throw/return immediately. Keep the "happy path" un-indented at the bottom of the function.

3. **Dependency Injection (`tsyringe`):**

- Always import `import 'reflect-metadata';` at the absolute top of `server.ts`.
- Avoid tight coupling (`new Service()`). Let the container resolve the dependency graph. This makes unit testing trivial (you just inject mock repositories).

4. **Error Handling:**

- Never `throw new Error("Something went wrong")`.
- Always throw custom domain errors (`throw new NotFoundError("User not found")`). A central Express error middleware maps these specific classes to standard HTTP status codes (404, 400, 401).

---

## 5. Scalability & Production Readiness

- **Graceful Shutdown:** When deploying or crashing, `server.ts` intercepts `SIGTERM`. It stops accepting new requests, waits for active requests to finish, cleanly closes Database/Redis connections, and exits. This prevents corrupted data and dropped user requests.
- **Clustering (High Throughput):** Because Node is single-threaded, `server.ts` uses the native `cluster` module to fork the process across all available CPU cores, load-balancing incoming traffic natively.
- **Background Workers:** The API must remain snappy (sub-200ms). Tasks like sending the "Verify Email" magic link or hashing heavy passwords are offloaded to Redis-backed queues (e.g., BullMQ). A separate worker process handles them asynchronously.
- **Authentication Strategy:**
- **Access Tokens (JWT):** Short-lived (15m), sent in JSON response, stored in memory on the frontend.
- **Refresh Tokens:** Long-lived (7d), sent as `HttpOnly`, `Secure`, `SameSite=Strict` cookies. Completely immune to XSS attacks.
- **Stateless yet Revocable:** On logout, the Access Token ID (jti) is placed in a Redis blocklist until it naturally expires.

---

## 6. LLM Context Instructions

_(Paste this system prompt to any LLM when generating code for this project)_

> "Act as a Senior Backend Engineer. Adhere strictly to the 'Pragmatic Domain-Driven Architecture (PDDA)'. Use Node.js, Express, TypeScript, and `tsyringe` for Dependency Injection. Use `@injectable()` and constructor injection. Controllers handle ONLY HTTP semantics and must be under 50 lines. Services contain ALL business logic and are framework-agnostic. Repositories handle ALL database access. Enforce strict early returns, max 20 lines per core function, and throw custom domain errors. Do not use generic Error classes."
