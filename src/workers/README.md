# Workers (Background Job Processors)

BullMQ workers process jobs from Redis queues. Structure follows PDDA and mirrors the queue registry pattern.

## Structure

```
workers/
├── definitions/           # Worker configs (queue, processor, concurrency)
│   ├── index.ts           # Exports WORKER_DEFINITIONS
│   ├── email-verification.worker.ts
│   ├── welcome-email.worker.ts
│   └── password-reset.worker.ts
├── processors/            # Job logic (unchanged)
│   └── *.processor.ts
├── worker.types.ts        # WorkerContext, WorkerDefinition, JobProcessor
├── worker.bootstrap.ts    # Creates workers, wires events, shutdown
└── worker.entry.ts        # Entry point: bootstrap + run
```

## Adding a Worker

1. Add queue name to `infrastructure/queue/queue-names.ts`
2. Create processor in `processors/<name>.processor.ts`
3. Create definition in `definitions/<name>.worker.ts`
4. Add definition to `WORKER_DEFINITIONS` in `definitions/index.ts`

## Run

```bash
pnpm run worker
```
