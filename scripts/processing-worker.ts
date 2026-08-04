/**
 * Processing queue worker — Prompt 16.
 *
 * Usage:
 *   npx tsx scripts/processing-worker.ts
 *   npm run worker:processing
 *
 * Env: DATABASE_URL + R2 (same as app). Never expose this process to the browser.
 */
import {hostname} from "node:os";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const {
    QUEUE_HEARTBEAT_INTERVAL_MS,
    QUEUE_POLL_INTERVAL_MS,
    QUEUE_WORKER_PARALLEL_JOBS,
    getQueuePolicy,
  } = await import("../src/server/images/queue-policy");
  const {
    claimQueuedJobs,
    heartbeatLeasedJob,
    markWorkerStopped,
    processClaimedJob,
    recoverDeadWorkers,
    recoverExpiredLeases,
    releaseInFlightLeasesOnShutdown,
    upsertWorkerHeartbeat,
  } = await import("../src/server/images/queue-service");
  const {
    claimQueuedExportJobs,
    executeExportJob,
    heartbeatExportJob,
    recoverExpiredExportLeases,
  } = await import("../src/server/images/export-service");
  const {
    claimQueuedDeliveries,
    executeDelivery,
    recoverExpiredDeliveryLeases,
  } = await import("../src/server/webhooks/delivery");
  const {
    claimQueuedWordpressJobs,
    executeWordpressPublishJob,
    recoverExpiredWordpressLeases,
  } = await import("../src/server/wordpress/publish-service");
  const {
    claimQueuedShopifyJobs,
    executeShopifyPublishJob,
    recoverExpiredShopifyLeases,
  } = await import("../src/server/shopify/publish-service");
  const {
    claimQueuedWebflowJobs,
    executeWebflowPublishJob,
    recoverExpiredWebflowLeases,
  } = await import("../src/server/webflow/publish-service");
  const {
    getWordpressMaxConcurrentPublishes,
    getShopifyMaxConcurrentPublishes,
    getWebflowMaxConcurrentPublishes,
  } = await import("../src/lib/env");

  const workerId = process.env.WORKER_ID?.trim() || `worker-${hostname()}-${process.pid}`;
  const policy = getQueuePolicy();
  console.log(
    `[worker] start id=${workerId} parallel=${policy.parallelJobsPerWorker} leaseTtlMs=${policy.leaseTtlMs}`,
  );

  let shuttingDown = false;
  const inFlight = new Set<string>();

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[worker] graceful shutdown on ${signal}; inFlight=${inFlight.size}`);
    const deadline = Date.now() + policy.leaseTtlMs;
    while (inFlight.size > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 250));
    }
    if (inFlight.size > 0) {
      await releaseInFlightLeasesOnShutdown({
        workerId,
        jobIds: [...inFlight],
      });
      console.log(`[worker] released ${inFlight.size} unfinished leases back to queued`);
    }
    await markWorkerStopped(workerId);
    console.log("[worker] stopped");
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await upsertWorkerHeartbeat({
    workerId,
    hostname: hostname(),
    status: "running",
    inFlight: 0,
  });

  while (!shuttingDown) {
    try {
      await recoverExpiredLeases({limit: 20});
      await recoverExpiredExportLeases({limit: 20});
      await recoverExpiredDeliveryLeases({limit: 20});
      await recoverExpiredWordpressLeases({limit: 20});
      await recoverExpiredShopifyLeases({limit: 20});
      await recoverExpiredWebflowLeases({limit: 20});
      await recoverDeadWorkers();

      const slots = Math.max(0, QUEUE_WORKER_PARALLEL_JOBS - inFlight.size);
      if (slots > 0) {
        const claimed = await claimQueuedJobs({workerId, limit: slots});
        for (const job of claimed) {
          inFlight.add(job.id);
          void (async () => {
            const heartbeat = setInterval(() => {
              void heartbeatLeasedJob({workerId, jobId: job.id});
            }, QUEUE_HEARTBEAT_INTERVAL_MS);
            try {
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
              const result = await processClaimedJob({workerId, job});
              console.log(
                `[worker] job=${job.id.slice(0, 8)} ok=${result.ok} terminal=${result.terminal}`,
              );
            } catch (error) {
              console.error(
                `[worker] job=${job.id.slice(0, 8)} error`,
                error instanceof Error ? error.message : "unknown",
              );
            } finally {
              clearInterval(heartbeat);
              inFlight.delete(job.id);
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
            }
          })();
        }
      }

      // Prompt 19 — export packages (same worker process)
      const exportSlots = Math.max(0, Math.min(1, QUEUE_WORKER_PARALLEL_JOBS - inFlight.size));
      if (exportSlots > 0) {
        const exportJobs = await claimQueuedExportJobs({workerId, limit: exportSlots});
        for (const job of exportJobs) {
          const flightId = `export:${job.id}`;
          inFlight.add(flightId);
          void (async () => {
            const heartbeat = setInterval(() => {
              void heartbeatExportJob({workerId, jobId: job.id});
            }, QUEUE_HEARTBEAT_INTERVAL_MS);
            try {
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
              const result = await executeExportJob({workerId, job});
              console.log(
                `[worker] export=${job.id.slice(0, 8)} ok=${result.ok} terminal=${result.terminal}`,
              );
            } catch (error) {
              console.error(
                `[worker] export=${job.id.slice(0, 8)} error`,
                error instanceof Error ? error.message : "unknown",
              );
            } finally {
              clearInterval(heartbeat);
              inFlight.delete(flightId);
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
            }
          })();
        }
      }

      // Prompt 25 — outbound webhook deliveries (bounded concurrency)
      const webhookSlots = Math.max(0, Math.min(2, QUEUE_WORKER_PARALLEL_JOBS - inFlight.size));
      if (webhookSlots > 0) {
        const deliveries = await claimQueuedDeliveries({workerId, limit: webhookSlots});
        for (const delivery of deliveries) {
          const flightId = `webhook:${delivery.id}`;
          inFlight.add(flightId);
          void (async () => {
            try {
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
              const result = await executeDelivery(delivery.id, workerId);
              console.log(
                `[worker] webhook=${delivery.id.slice(0, 8)} result=${result.result}`,
              );
            } catch (error) {
              console.error(
                `[worker] webhook=${delivery.id.slice(0, 8)} error`,
                error instanceof Error ? error.message : "unknown",
              );
            } finally {
              inFlight.delete(flightId);
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
            }
          })();
        }
      }

      // Prompt 26 — WordPress publish jobs (bounded concurrency, 1-2 per worker)
      const wordpressSlots = Math.max(
        0,
        Math.min(getWordpressMaxConcurrentPublishes(), QUEUE_WORKER_PARALLEL_JOBS - inFlight.size),
      );
      if (wordpressSlots > 0) {
        const wordpressJobs = await claimQueuedWordpressJobs({workerId, limit: wordpressSlots});
        for (const job of wordpressJobs) {
          const flightId = `wordpress:${job.id}`;
          inFlight.add(flightId);
          void (async () => {
            try {
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
              const result = await executeWordpressPublishJob({workerId, job});
              console.log(
                `[worker] wordpress=${job.id.slice(0, 8)} ok=${result.ok} terminal=${result.terminal}`,
              );
            } catch (error) {
              console.error(
                `[worker] wordpress=${job.id.slice(0, 8)} error`,
                error instanceof Error ? error.message : "unknown",
              );
            } finally {
              inFlight.delete(flightId);
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
            }
          })();
        }
      }

      // Prompt 27 — Shopify publish jobs (bounded concurrency, 1-2 per worker)
      const shopifySlots = Math.max(
        0,
        Math.min(getShopifyMaxConcurrentPublishes(), QUEUE_WORKER_PARALLEL_JOBS - inFlight.size),
      );
      if (shopifySlots > 0) {
        const shopifyJobs = await claimQueuedShopifyJobs({workerId, limit: shopifySlots});
        for (const job of shopifyJobs) {
          const flightId = `shopify:${job.id}`;
          inFlight.add(flightId);
          void (async () => {
            try {
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
              const result = await executeShopifyPublishJob({workerId, job});
              console.log(
                `[worker] shopify=${job.id.slice(0, 8)} ok=${result.ok} terminal=${result.terminal}`,
              );
            } catch (error) {
              console.error(
                `[worker] shopify=${job.id.slice(0, 8)} error`,
                error instanceof Error ? error.message : "unknown",
              );
            } finally {
              inFlight.delete(flightId);
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
            }
          })();
        }
      }

      // Prompt 28 — Webflow publish jobs (bounded concurrency, 1-2 per worker)
      const webflowSlots = Math.max(
        0,
        Math.min(getWebflowMaxConcurrentPublishes(), QUEUE_WORKER_PARALLEL_JOBS - inFlight.size),
      );
      if (webflowSlots > 0) {
        const webflowJobs = await claimQueuedWebflowJobs({workerId, limit: webflowSlots});
        for (const job of webflowJobs) {
          const flightId = `webflow:${job.id}`;
          inFlight.add(flightId);
          void (async () => {
            try {
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
              const result = await executeWebflowPublishJob({workerId, job});
              console.log(
                `[worker] webflow=${job.id.slice(0, 8)} ok=${result.ok} terminal=${result.terminal}`,
              );
            } catch (error) {
              console.error(
                `[worker] webflow=${job.id.slice(0, 8)} error`,
                error instanceof Error ? error.message : "unknown",
              );
            } finally {
              inFlight.delete(flightId);
              await upsertWorkerHeartbeat({workerId, inFlight: inFlight.size});
            }
          })();
        }
      }

      await upsertWorkerHeartbeat({
        workerId,
        hostname: hostname(),
        status: "running",
        inFlight: inFlight.size,
      });
    } catch (error) {
      console.error("[worker] loop error", error instanceof Error ? error.message : "unknown");
    }

    await new Promise((r) => setTimeout(r, QUEUE_POLL_INTERVAL_MS));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "worker failed");
  process.exit(1);
});
