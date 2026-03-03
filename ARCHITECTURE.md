# Pragmatic Domain-Driven Architecture (PDDA)

## 1. Architectural Philosophy & Core Tenets

Think of your backend as a high-end restaurant kitchen.

- **Express.js (The Waiter):** Only takes orders (Requests) and delivers food (Responses). It does not cook.
- **Services (The Chefs):** Contain all the business logic (Recipes). They are completely isolated from the HTTP layer.
- **Repositories (The Pantry Managers):** Fetch ingredients (Data) from the fridge (Database). The Chef doesn't need to know how the fridge is organized.
- **`tsyringe` (The Kitchen Manager):** Automatically hands the Chef the exact Pantry Manager they need via Dependency Injection.
- **The Shared Kernel (The Master Recipe Book):** A neutral zone where common definitions (like what a "User" is) live, so different stations (Modules) can share an understanding without stepping into each other's workspaces.

**Core Rules:**

- **Strict Unidirectional Data Flow:** Route -> Validator -> Controller -> Service -> Repository -> Database.
- **Framework Agnosticism:** Business logic never touches `req`, `res`, or `next`.
- **No Horizontal Dependencies:** Modules (e.g., Auth and Users) do not import from each other. They communicate via interfaces defined in the Shared Kernel.

---

## 2. Folder Organization

Organized by **Domain** (Feature), with internal grouping by **Architectural Role**.

```text
src/
├── config/                     # Static configs & Env validations (Zod schemas)
├── core/                       # The "Shared Kernel" & Cross-domain mechanisms
│   ├── di/                     # tsyringe container bootstrap
│   ├── errors/                 # AppError, UnauthenticatedError
│   ├── interfaces/             # THE SHARED KERNEL (Domain Entities & Types)
│   │   ├── user.types.ts       # Shared User definition
│   │   └── session.types.ts    # Shared Session definition
│   ├── middlewares/            # Express logic: authGuard, globalErrorHandler
│   └── security/               # Hashing (Argon2), JWT signing wrappers
├── infrastructure/             # External Systems (Singletons)
│   ├── database/               # DB Connection pool / ORM client
│   ├── docs/                   # OpenAPI spec (one file per endpoint)
│   │   ├── paths/              # paths/auth/*.path.ts, paths/health/*.path.ts, paths/users/*.path.ts
│   │   ├── components.ts       # securitySchemes
│   │   ├── spec.ts             # Assembles full spec
│   │   └── docs.routes.ts      # Mounts Swagger UI at /docs
│   ├── cache/                  # Redis client
│   └── mailer/                 # Nodemailer / SendGrid client
├── modules/                    # Domain Modules
│   ├── auth/                   # Core Auth Domain
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── oauth.service.ts
│   │   │   └── email-verify.service.ts
│   │   └── schemas/
│   │       └── auth.schemas.ts
│   └── users/                  # User Management Domain
│       ├── controllers/
│       │   └── user.controller.ts
│       ├── routes/
│       │   └── user.routes.ts
│       ├── services/
│       │   └── user.service.ts
│       └── repositories/
│           └── user.repository.ts
├── workers/                    # Background job processors (BullMQ)
│   ├── definitions/            # Worker configs (queue, processor, concurrency)
│   │   ├── index.ts            # Exports WORKER_DEFINITIONS
│   │   └── *.worker.ts
│   ├── processors/             # Job logic (e.g., SendWelcomeEmail)
│   │   └── *.processor.ts
│   ├── worker.types.ts         # WorkerContext, WorkerDefinition, JobProcessor
│   ├── worker.bootstrap.ts     # Creates workers, wires events, shutdown
│   └── worker.entry.ts         # Entry point
├── app.ts                      # Express application assembly
└── server.ts                   # Entry point: cluster setup, reflect-metadata

```

---

## 3. The Shared Kernel & Layer Breakdown

### 3.1. The Shared Kernel (`core/interfaces/`)

To prevent the `Auth` module from importing directly from the `Users` module (which creates messy, tightly coupled code), we elevate shared definitions here.

- **Rule:** Only TypeScript types, interfaces, and generic enums live here. No business logic.
- **Why it works:** `AuthService` and `UserService` both import `User` from `core/interfaces/user.types.ts`. They share an understanding of the data without depending on each other's implementation details.

### 3.2. Controllers (The HTTP Adapter)

Extracts data from Express and formats the response.

- **Rule:** Max 50 lines. Zero business logic. Must reside in `modules/<feature>/controllers/`.
- **Pseudocode:**

```typescript
import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.registerWithEmail(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
```

### 3.3. Services (Core Business Logic)

The brain of the operation.

- **Rule:** Completely unaware of Express or HTTP. Resides in `modules/<feature>/services/`.
- **Pseudocode:**

```typescript
import { injectable, inject } from 'tsyringe';
import { User } from '../../../core/interfaces/user.types'; // Shared Kernel
import { UserRepository } from '../../users/repositories/user.repository'; // Cross-module DI is allowed

@injectable()
export class AuthService {
  constructor(@inject(UserRepository) private userRepo: UserRepository) {}

  async validateLogin(email: string): Promise<User> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
```

### 3.4. Repositories (Data Access)

Translates domain needs into database queries. Hides the ORM.

- **Rule:** Methods are named purely after data operations. Resides in `modules/<feature>/repositories/`.

---

## 4. Workers (Background Jobs)

BullMQ workers process jobs from Redis queues. Structure follows PDDA and mirrors the queue registry pattern.

### Structure

- **definitions/** — Worker configs per queue (queue name, processor factory, concurrency, label)
- **processors/** — Job logic; each processor is a factory `(deps) => (job) => Promise<void>`
- **worker.bootstrap.ts** — Creates workers from definitions, wires events, handles shutdown
- **worker.entry.ts** — Thin entry: bootstrap + run

### Adding a Worker

1. Add queue name to `infrastructure/queue/queue-names.ts`
2. Create processor in `processors/<name>.processor.ts`
3. Create definition in `definitions/<name>.worker.ts`
4. Add definition to `WORKER_DEFINITIONS` in `definitions/index.ts`

### Run

```bash
pnpm run worker
```

---

## 5. Engineering Standards & DX Rules

1. **Line Limits:** Core logic functions max out at **20 lines**. Files max out at **200-300 lines**.
2. **Early Returns:** Validate negative conditions first. Avoid nested `if/else` hell.
3. **Authorization:** Roles are checked in Express middleware, taking $O(1)$ time and requiring zero database joins.
4. **Error Handling:** Never throw a generic `Error`. Throw custom classes (e.g., `ConflictError`) so the global middleware maps them to proper HTTP status codes.
5. **Performance:**

- **Node Clustering:** `server.ts` forks workers across all CPU cores.
- **Redis Caching:** Valid active `Session` IDs and dynamic `Tier` limits are cached in Redis to prevent hitting PostgreSQL on every authenticated request.
- **Background Jobs:** Non-blocking tasks (sending emails) are handled by a separate queue worker process (e.g., BullMQ).

6. Strictly abiding by **SOLID** & **DRY** rules.
7. Enforces Software Design Patterns such as - **Structural**, **Behavioural** & **Creational**

---

## 6. LLM Context Instructions

_(Paste this to any LLM when generating code for this project)_

> "Act as a Senior Backend Engineer. Adhere strictly to the 'Pragmatic Domain-Driven Architecture (PDDA)'. Use Node.js, Express, TypeScript, and `tsyringe`. Use `@injectable()` and constructor injection. Files are grouped by role within modules (e.g., `modules/auth/services/`). Shared interfaces live in `core/interfaces/` (Shared Kernel). Controllers handle ONLY HTTP semantics (<50 lines). Services contain ALL business logic. Repositories handle database access. Enforce strict early returns, max 20 lines per core function, and throw custom domain errors."
