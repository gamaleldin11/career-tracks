# Streaming and Kafka — Topics, Partitions, Consumer Groups, Exactly-Once, CDC and Windows

Telecoms, payments and delivery apps produce continuous streams: calls and data sessions, card transactions, courier GPS pings, app events. Data engineers move and process them with **Apache Kafka** (or a Kafka-compatible service such as Azure Event Hubs) and a stream processor (Spark Structured Streaming, Flink, Kafka Streams). Kafka is on your gaps list, and Kafka questions are some of the most predictable in DE interviews: partitions, consumer groups, offsets, ordering and delivery guarantees. [[B8]] introduced brokers from the backend side; this module goes deep from the data side, current as of **Kafka 4.x** (ZooKeeper removed).

> [!focus]
> **Entry must:** explain topics, partitions, offsets, producers, consumers and consumer groups; how keys determine ordering; at-least-once delivery and why consumers must be idempotent; what CDC is.
> **Mid adds:** replication and acknowledgements, idempotent producers and transactions (exactly-once), schema registries and compatibility, Kafka Connect and Debezium, event time vs processing time, windows and watermarks, consumer lag, streaming into a lakehouse.
> **Most asked:** *How does Kafka work?* · *What's a partition and why does it matter?* · *How do consumer groups scale?* · *How is ordering guaranteed?* · *At-least-once vs exactly-once?* · *What happens when a consumer dies?* · *How do you handle late events?* · *What is consumer lag?*
> **Time budget:** 3.5 hours, with Kafka in Docker (`apache/kafka` image, KRaft mode).

## DE8.1 Streaming in context 🟢

Use streaming when a decision or a user experience needs data within **seconds**: fraud checks, live courier tracking, real-time inventory, operational alerts, personalisation in the session. Otherwise batch is cheaper and simpler ([[DE1.4]]). Kafka is also used purely as a **durable buffer and integration backbone** between systems, even when consumers process in batches.

## DE8.2 How Kafka works 🟢 ⭐

> [!term] Apache Kafka
> A distributed, **append-only commit log**. Producers write records to **topics**; each topic is split into **partitions**; each partition is an ordered, immutable sequence of records identified by an increasing **offset**. Records are **retained** for a configured time or size (not deleted when read), so many independent consumers can read the same data, and re-read it.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Kafka topic with three partitions, producers writing by key, a consumer group with consumers assigned to partitions">
<rect class="sB" x="10" y="80" width="110" height="60" rx="8"/><text class="sT" x="65" y="105" text-anchor="middle">Producers</text><text class="sS" x="65" y="123" text-anchor="middle">key = order_id</text>
<rect class="sW" x="170" y="20" width="350" height="200" rx="10"/><text class="sT" x="185" y="40">topic: orders</text>
<g class="sS">
<rect class="sA" x="185" y="55" width="320" height="40" rx="5"/><text x="195" y="80">P0 │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ … → offsets</text>
<rect class="sA" x="185" y="105" width="320" height="40" rx="5"/><text x="195" y="130">P1 │ 0 │ 1 │ 2 │ 3 │ …</text>
<rect class="sA" x="185" y="155" width="320" height="40" rx="5"/><text x="195" y="180">P2 │ 0 │ 1 │ 2 │ 3 │ 4 │ …</text>
</g>
<rect class="sG" x="570" y="45" width="140" height="150" rx="10"/><text class="sT" x="640" y="65" text-anchor="middle">group "billing"</text>
<rect class="sB" x="585" y="78" width="110" height="30" rx="5"/><text class="sS" x="640" y="98" text-anchor="middle">consumer A ← P0</text>
<rect class="sB" x="585" y="115" width="110" height="30" rx="5"/><text class="sS" x="640" y="135" text-anchor="middle">consumer B ← P1</text>
<rect class="sB" x="585" y="152" width="110" height="30" rx="5"/><text class="sS" x="640" y="172" text-anchor="middle">consumer C ← P2</text>
<line class="sL" x1="120" y1="110" x2="185" y2="75"/><line class="sL" x1="120" y1="110" x2="185" y2="125"/><line class="sL" x1="120" y1="110" x2="185" y2="175"/>
<line class="sD" x1="505" y1="75" x2="585" y2="93"/><line class="sD" x1="505" y1="125" x2="585" y2="130"/><line class="sD" x1="505" y1="175" x2="585" y2="167"/>
</svg><figcaption>Records with the same key go to the same partition (so they stay in order); each partition is read by exactly one consumer in a group.</figcaption></figure>

| Concept | Meaning |
|---|---|
| **Broker** | A Kafka server storing partitions; a cluster has several |
| **Topic** | A named stream (`orders`, `courier-locations`) |
| **Partition** | The unit of parallelism, ordering and storage; a topic has N of them, spread over brokers |
| **Offset** | A record's position in its partition |
| **Key** | Determines the partition (by hash); **same key → same partition → ordered** |
| **Replication factor** | Copies of each partition on different brokers (often 3); one is the **leader**, others are followers |
| **ISR** (in-sync replicas) | Followers that are caught up; with `acks=all`, a write is acknowledged only when all in-sync replicas have it |
| **Retention** | Records are kept for a time or size (days, or forever), regardless of reading |
| **Log compaction** | An alternative retention mode keeping only the **latest record per key**: a changelog of current state |
| **KRaft** | Kafka's built-in Raft-based metadata quorum. **Kafka 4.0 (March 2025) removed ZooKeeper**; clusters now run in KRaft mode only |

### Consumer groups ⭐

Consumers that share a **group ID** split a topic's partitions between them: **each partition is read by exactly one consumer in the group**, while **different groups** each get the full stream independently (billing, analytics and fraud can all read `orders`).

- **Scaling:** add consumers up to the number of partitions; extra consumers sit idle. So the **partition count caps a group's parallelism**; choose it with growth in mind.
- **Rebalancing:** when a consumer joins, leaves or dies, partitions are reassigned. Kafka 4.0 made the **new consumer rebalance protocol** (KIP-848) generally available, which avoids the old "stop-the-world" rebalances.
- **Committed offsets** record each group's progress per partition (in an internal topic), so a restarted or replacement consumer continues where the last one committed.

> [!say]
> "Kafka is a replicated, partitioned log. Producers write to a topic, and the record key decides the partition, so all events for one order stay in order. Consumers in a group split the partitions, one consumer per partition, which is how you scale, up to the partition count, and each group tracks its own committed offsets, so many independent applications can read the same stream and replay it."

## DE8.3 Delivery guarantees 🟡 ⭐

| Guarantee | How it arises | Risk |
|---|---|---|
| **At-most-once** | Commit the offset **before** processing | A crash after commit loses the record |
| **At-least-once** (the usual default) | Process, **then** commit | A crash after processing but before commit reprocesses: **duplicates** |
| **Exactly-once** (effectively) | Kafka's **idempotent producer** (no duplicates from producer retries) + **transactions** (atomically write outputs and commit input offsets) for Kafka-to-Kafka processing; **end to end**, at-least-once delivery plus **idempotent or transactional sinks** | Requires discipline at every hop |

**Producer settings that matter:** `acks=all` with `min.insync.replicas=2` (with replication factor 3) so an acknowledged write survives a broker failure; `enable.idempotence=true` (the default in modern clients) so retries don't duplicate.

> [!say]
> "By default you get at-least-once: process, then commit, so a crash can cause duplicates. Kafka gives exactly-once between Kafka topics with idempotent producers and transactions that commit outputs and offsets together. End to end, into a database or a lakehouse, I make the sink idempotent, upserting by a key or using Delta with checkpoints, so duplicates don't change the result."

## DE8.4 Ordering and keys 🟡 ⭐

- Kafka guarantees order **within a partition only**. Choose the **key** so that events that must be ordered relative to each other share it: `order_id` for an order's status changes, `account_id` for a balance, `courier_id` for GPS pings.
- A **hot key** (one huge merchant, a NULL key) overloads one partition, the streaming version of skew ([[DE6.7]]). Spread with a composite key if strict per-key ordering isn't needed.
- Changing the partition count changes which partition a key maps to, breaking ordering for in-flight keys, so plan the count up front.

## DE8.5 Schemas and evolution 🟡 ⭐

Producers and consumers evolve independently, so the record format needs a contract.

- Serialise with **Avro**, **Protobuf** or JSON Schema, and register schemas in a **Schema Registry** (Confluent Schema Registry, Apicurio, Azure Schema Registry in Event Hubs). Each record carries a schema ID.
- **Compatibility rules** checked at registration:

| Mode | Meaning | Allowed change, typically |
|---|---|---|
| **Backward** | New consumers can read old data | Add optional fields (with defaults), remove fields |
| **Forward** | Old consumers can read new data | Add fields, remove optional fields |
| **Full** | Both | Only add or remove optional fields with defaults |

## DE8.6 Getting data in and out: Kafka Connect and CDC 🟡 ⭐

**Kafka Connect** runs **source** connectors (databases, files, SaaS into Kafka) and **sink** connectors (Kafka into S3/ADLS, Snowflake, Elasticsearch, databases) with configuration rather than code, handling offsets, retries and scaling.

**Change data capture with Debezium:** Debezium reads a database's transaction log (SQL Server, PostgreSQL, MySQL, Oracle, MongoDB) and publishes every insert, update and delete as an event, with before and after values, keyed by the primary key, in commit order per key. Uses:

- Replicating OLTP tables into the lakehouse in near real time (bronze), then **applying** changes with MERGE ([[DE3.1]]).
- Feeding search indexes and caches.
- The **outbox pattern** ([[B8.7]]): Debezium publishes rows from an outbox table, so an application's database commit and its event publication can't diverge.

## DE8.7 Stream processing concepts 🟡 ⭐

| Concept | Meaning |
|---|---|
| **Event time vs processing time** | When it happened (in the record) vs when the system processed it. Report on event time; phones and networks delay events |
| **Windows** | **Tumbling** (fixed, non-overlapping: per minute), **hopping/sliding** (overlapping: 10-minute windows every minute), **session** (activity separated by a gap of inactivity) |
| **Watermark** | The processor's estimate of "event time has progressed to here": windows close when the watermark passes them, and data later than the allowed lateness is dropped or sent aside |
| **State** | What the processor remembers between events (counts per window, the last location per courier), kept fault-tolerant through checkpoints |
| **Stream–table join** | Enrich events with the latest reference data (a compacted topic or a lookup table) |
| **Stream–stream join** | Join two streams within a time bound (an order and its payment within 30 minutes) |

| Engine | Model | Strengths |
|---|---|---|
| **Spark Structured Streaming** | Micro-batch (and a continuous mode) on DataFrames | Same API as batch, lakehouse integration ([[DE6.11]]) |
| **Apache Flink** | True event-at-a-time, rich state and event-time handling | Low latency, complex stateful processing at scale |
| **Kafka Streams** | A Java library inside your service | No separate cluster; Kafka-native; exactly-once |
| **ksqlDB / Flink SQL** | SQL over streams | Accessible for simple transformations |

> [!say]
> "I aggregate on event time, not processing time, with windows, and set a watermark that says how late data may arrive, say ten minutes, so windows can close and state doesn't grow forever. Events later than that go to a side output for a correction job. State is checkpointed so the job restarts exactly where it stopped."

## DE8.8 Streams into the lakehouse 🟡

- Land raw events in **bronze** Delta or Iceberg tables with Spark Structured Streaming, Flink or a Connect sink; process to silver and gold incrementally.
- Streaming writes create **many small files**: schedule **compaction** ([[DE5.6]]).
- On Azure, **Event Hubs** exposes a **Kafka-compatible endpoint**, so Kafka clients work unchanged; **Microsoft Fabric Real-Time Intelligence** (Eventstreams into an Eventhouse queried with KQL) covers real-time analytics. AWS has MSK and Kinesis; Google Cloud has Pub/Sub and Managed Kafka.

## DE8.9 Operating Kafka 🟡 ⭐

> [!term] Consumer lag
> The difference between the latest offset in a partition and the group's committed offset: how far behind a consumer is. Rising lag means consumers can't keep up (too slow, too few, stuck on a poison message) and is the first streaming metric to alert on.

Also: partition count planning (throughput per partition, target parallelism, growth); retention sized to recovery needs (enough to replay after a multi-day outage); a **dead-letter topic** for records that fail repeatedly ([[B8.4]]); monitoring under-replicated partitions and broker disk usage; and security (TLS, SASL authentication, ACLs per topic).

## DE8.10 A worked design: live courier tracking 🟡

**Requirements:** couriers' phones send GPS every 5 seconds; customers see their courier's position live; operations sees zone heat maps per minute; data lands in the lakehouse for ETA models.

**Design:** phones → API → Kafka topic `courier-locations` keyed by `courier_id` (ordered per courier), about 12 partitions sized to peak throughput, 3-day retention, Avro with a schema registry → (1) a **Kafka Streams or Flink** job keeps the **latest position per courier** (a compacted topic or a Redis cache) that the customer app reads via the API and SignalR ([[FS3.2]]); (2) a **Spark Structured Streaming** job computes per-zone counts in **1-minute tumbling windows on event time** with a 2-minute watermark into a gold Delta table for the operations dashboard; (3) a raw sink to **bronze** for model training. Monitor consumer lag per group; late events beyond the watermark go to a side table.

> [!lab] Kafka on your laptop
> Run Kafka 4 in Docker (KRaft). Create an `orders` topic with 3 partitions. Write a Python producer (`confluent-kafka`) keyed by `order_id` and two consumers in one group; kill one and watch the rebalance; start a second group and see it read everything from the beginning. Then simulate a crash between processing and commit to see a duplicate, and make your sink (DuckDB or PostgreSQL) idempotent with an upsert. Finally, add Debezium on a PostgreSQL table and watch changes stream in. These five experiments answer most Kafka interview questions from first-hand experience.

## DE8.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is Kafka? | A distributed, replicated, partitioned, append-only log with retention; producers write, consumers read at their own pace. |
| What's a partition for? | Parallelism, ordering scope and storage distribution; consumers in a group scale up to the partition count. |
| How do consumer groups work? | Partitions are divided among a group's consumers, one consumer per partition; separate groups each get the full stream. |
| How is ordering guaranteed? | Only within a partition; use a key so related events share a partition. |
| What happens if a consumer dies? | A rebalance reassigns its partitions; the new owner resumes from the last committed offset (possibly reprocessing). |
| At-least-once vs exactly-once? | Process-then-commit may duplicate; exactly-once needs idempotent producers and transactions in Kafka, and idempotent sinks end to end. |
| What do acks=all and min.insync.replicas do? | A write is acknowledged only when enough in-sync replicas have it, so it survives a broker failure. |
| What changed in Kafka 4.0? | ZooKeeper was removed (KRaft only) and the new consumer rebalance protocol became generally available. |
| What is log compaction? | Retaining only the latest record per key, turning a topic into a changelog of current state. |
| Why a schema registry? | To enforce a contract and compatible schema evolution between independently deployed producers and consumers. |
| What is Debezium? | A CDC tool that reads database transaction logs and publishes row changes to Kafka. |
| Event time vs processing time? | When it happened vs when it was processed; aggregate on event time. |
| What is a watermark? | The threshold of event-time progress after which windows close and later data is considered late. |
| What is consumer lag? | How far a consumer group is behind the latest offsets; the key streaming health metric. |

## Key takeaways

> [!check]
> - Kafka is a partitioned, replicated, retained log: partitions give parallelism and per-key order.
> - Consumer groups split partitions; separate groups read independently; offsets record progress.
> - Expect at-least-once; get effective exactly-once with idempotent producers, transactions and idempotent sinks.
> - Use schemas with compatibility rules, CDC with Debezium, and the outbox for application events.
> - Process on event time with windows and watermarks, and alert on consumer lag.

## Sources

- Apache Kafka documentation: [Introduction and design](https://kafka.apache.org/documentation/#design), [Kafka 4.0 upgrade notes (ZooKeeper removal)](https://kafka.apache.org/40/getting-started/upgrade/), [KRaft](https://kafka.apache.org/documentation/#kraft); KIP-848 (the next-generation consumer rebalance protocol).
- Neha Narkhede, Gwen Shapira and Todd Palino, *Kafka: The Definitive Guide*, 2nd ed. (O'Reilly, 2021).
- Confluent: [Exactly-once semantics in Kafka](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/), [Schema evolution and compatibility](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html).
- [Debezium documentation](https://debezium.io/documentation/); [Kafka Connect](https://kafka.apache.org/documentation/#connect).
- Tyler Akidau et al., "The Dataflow Model" (VLDB 2015) and *Streaming Systems* (O'Reilly, 2018): event time, windows and watermarks.
- [Apache Flink documentation](https://nightlies.apache.org/flink/flink-docs-stable/); Microsoft Learn: [Event Hubs for Apache Kafka](https://learn.microsoft.com/en-us/azure/event-hubs/azure-event-hubs-kafka-overview), [Fabric Real-Time Intelligence](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/overview).
