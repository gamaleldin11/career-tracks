# Streaming and Kafka — Topics, Partitions, Consumer Groups, Exactly-Once, CDC and Windows

Telecoms, payments and delivery apps produce continuous streams: calls and data sessions, card transactions, courier GPS pings, app events. Data engineers move and process them with **Apache Kafka** (or a Kafka-compatible service such as Azure Event Hubs) and a stream processor (Spark Structured Streaming, Flink, Kafka Streams). Kafka is on your gaps list, and Kafka questions are some of the most predictable in DE interviews: partitions, consumer groups, offsets, ordering and delivery guarantees. [[B8]] introduced brokers from the backend side; this module goes deep from the data side, current as of **Kafka 4.x** (ZooKeeper removed).

> [!focus]
> **Entry must:** explain topics, partitions, offsets, producers, consumers and consumer groups; how keys determine ordering; at-least-once delivery and why consumers must be idempotent; what CDC is.
> **Mid adds:** replication and acknowledgements, idempotent producers and transactions (exactly-once), schema registries and compatibility, Kafka Connect and Debezium, event time vs processing time, windows and watermarks, consumer lag, streaming into a lakehouse.
> **Most asked:** *How does Kafka work?* · *What's a partition and why does it matter?* · *How do consumer groups scale?* · *How is ordering guaranteed?* · *At-least-once vs exactly-once?* · *What happens when a consumer dies?* · *How do you handle late events?* · *What is consumer lag?*
> **Time budget:** 3.5 hours, with Kafka in Docker (`apache/kafka` image, KRaft mode).

## DE8.0 Foundations: a log, not a queue 🟢

A message **queue** hands each message to one worker and deletes it once processed ([[B8.3]]). Kafka is different: it's a **log**. Producers append records to the end; records stay for a configured time (days, or forever) whether or not anyone has read them; and every reader keeps its own **offset**, its position in the log.

That one design choice gives streaming platforms their super-powers: many independent consumers (billing, fraud, the lake loader) read the same events without interfering, a new consumer can **replay** history from the start, and a crashed consumer resumes from its last committed offset.

<figure class="dia anim" data-rest="2"><svg viewBox="0 0 720 230" role="img" aria-label="Animation: a Kafka partition as an append-only log with numbered offsets, and three consumers reading at different positions independently, one replaying from the start">
<text class="sM" x="14" y="22">topic partition: append-only, kept for days</text>
<rect class="sB" x="30" y="60" width="42" height="36" rx="4"/><text class="sC" x="51" y="83" text-anchor="middle">0</text>
<rect class="sB" x="76" y="60" width="42" height="36" rx="4"/><text class="sC" x="97" y="83" text-anchor="middle">1</text>
<rect class="sB" x="122" y="60" width="42" height="36" rx="4"/><text class="sC" x="143" y="83" text-anchor="middle">2</text>
<rect class="sB" x="168" y="60" width="42" height="36" rx="4"/><text class="sC" x="189" y="83" text-anchor="middle">3</text>
<rect class="sB" x="214" y="60" width="42" height="36" rx="4"/><text class="sC" x="235" y="83" text-anchor="middle">4</text>
<rect class="sB" x="260" y="60" width="42" height="36" rx="4"/><text class="sC" x="281" y="83" text-anchor="middle">5</text>
<rect class="sB" x="306" y="60" width="42" height="36" rx="4"/><text class="sC" x="327" y="83" text-anchor="middle">6</text>
<rect class="sB" x="352" y="60" width="42" height="36" rx="4"/><text class="sC" x="373" y="83" text-anchor="middle">7</text>
<rect class="sB" x="398" y="60" width="42" height="36" rx="4"/><text class="sC" x="419" y="83" text-anchor="middle">8</text>
<rect class="sB" x="444" y="60" width="42" height="36" rx="4"/><text class="sC" x="465" y="83" text-anchor="middle">9</text>
<rect class="sB" x="490" y="60" width="42" height="36" rx="4"/><text class="sC" x="511" y="83" text-anchor="middle">10</text>
<rect class="sB" x="536" y="60" width="42" height="36" rx="4"/><text class="sC" x="557" y="83" text-anchor="middle">11</text>
<rect class="sN" x="582" y="60" width="42" height="36" rx="4" stroke-dasharray="4 3"/><text class="sC" x="603" y="83" text-anchor="middle">…</text>
<rect class="sN" x="628" y="60" width="42" height="36" rx="4" stroke-dasharray="4 3"/><text class="sC" x="649" y="83" text-anchor="middle">…</text>
<rect class="sV" x="600" y="8" width="106" height="40" rx="8"/><text class="sT" x="653" y="26" text-anchor="middle">producer</text><text class="sC" x="653" y="42" text-anchor="middle">appends</text><line class="sLm" x1="612" y1="48" x2="590" y2="60" marker-end="url(#ahm)"/>
<text class="sC" x="14" y="134">billing service</text><g><animateTransform attributeName="transform" type="translate" values="143 0;557 0;143 0" dur="7s" repeatCount="indefinite"/><line class="sD" x1="0" y1="100" x2="0" y2="108"/><polygon class="sPg" points="-7,120 7,120 0,108"/></g>
<text class="sC" x="14" y="174">fraud model</text><g><animateTransform attributeName="transform" type="translate" values="327 0;557 0;327 0" dur="4s" repeatCount="indefinite"/><line class="sD" x1="0" y1="100" x2="0" y2="148"/><polygon class="sPw" points="-7,160 7,160 0,148"/></g>
<text class="sC" x="14" y="214">lake loader (replaying)</text><g><animateTransform attributeName="transform" type="translate" values="51 0;465 0;51 0" dur="9s" repeatCount="indefinite"/><line class="sD" x1="0" y1="100" x2="0" y2="188"/><polygon class="sPr" points="-7,200 7,200 0,188"/></g>
<text class="sC" x="470" y="140">each group keeps its own offset;</text><text class="sC" x="470" y="158">reading never removes a record</text>
<text class="sC" x="470" y="196">a new consumer can replay</text><text class="sC" x="470" y="214">the whole retained history</text>
</svg><figcaption>Kafka is a log, not a queue. Records stay after they are read, and every consumer group moves through them at its own pace.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 236" role="img" aria-label="A consumer group reading six partitions: two consumers take three each, three take two each, a seventh consumer sits idle, and when one dies its partitions are reassigned">
<rect class="sB" x="30" y="30" width="90" height="26" rx="4"/><text class="sC" x="75" y="48" text-anchor="middle">partition 0</text>
<rect class="sB" x="30" y="62" width="90" height="26" rx="4"/><text class="sC" x="75" y="80" text-anchor="middle">partition 1</text>
<rect class="sB" x="30" y="94" width="90" height="26" rx="4"/><text class="sC" x="75" y="112" text-anchor="middle">partition 2</text>
<rect class="sB" x="30" y="126" width="90" height="26" rx="4"/><text class="sC" x="75" y="144" text-anchor="middle">partition 3</text>
<rect class="sB" x="30" y="158" width="90" height="26" rx="4"/><text class="sC" x="75" y="176" text-anchor="middle">partition 4</text>
<rect class="sB" x="30" y="190" width="90" height="26" rx="4"/><text class="sC" x="75" y="208" text-anchor="middle">partition 5</text>
<g data-s="1-1"><rect class="sA" x="420" y="30" width="120" height="26" rx="4"/><text class="sC" x="480" y="48" text-anchor="middle">consumer 1</text><rect class="sA" x="420" y="126" width="120" height="26" rx="4"/><text class="sC" x="480" y="144" text-anchor="middle">consumer 2</text><line class="sLm" x1="120" y1="43" x2="416" y2="43" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="75" x2="416" y2="43" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="107" x2="416" y2="43" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="139" x2="416" y2="139" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="171" x2="416" y2="139" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="203" x2="416" y2="139" marker-end="url(#ahm)"/><text class="sC" x="630" y="120" text-anchor="middle">3 partitions each</text></g>
<g data-s="2-2"><rect class="sA" x="420" y="30" width="120" height="26" rx="4"/><text class="sC" x="480" y="48" text-anchor="middle">consumer 1</text><rect class="sA" x="420" y="94" width="120" height="26" rx="4"/><text class="sC" x="480" y="112" text-anchor="middle">consumer 2</text><rect class="sA" x="420" y="158" width="120" height="26" rx="4"/><text class="sC" x="480" y="176" text-anchor="middle">consumer 3</text><line class="sLm" x1="120" y1="43" x2="416" y2="43" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="75" x2="416" y2="43" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="107" x2="416" y2="107" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="139" x2="416" y2="107" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="171" x2="416" y2="171" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="203" x2="416" y2="171" marker-end="url(#ahm)"/><text class="sC" x="630" y="120" text-anchor="middle">2 each: faster</text></g>
<g data-s="3-3"><rect class="sA" x="420" y="30" width="120" height="26" rx="4"/><text class="sC" x="480" y="48" text-anchor="middle">consumer 1</text><rect class="sA" x="420" y="57.4286" width="120" height="26" rx="4"/><text class="sC" x="480" y="75.4286" text-anchor="middle">consumer 2</text><rect class="sA" x="420" y="84.8571" width="120" height="26" rx="4"/><text class="sC" x="480" y="102.857" text-anchor="middle">consumer 3</text><rect class="sA" x="420" y="112.286" width="120" height="26" rx="4"/><text class="sC" x="480" y="130.286" text-anchor="middle">consumer 4</text><rect class="sA" x="420" y="139.714" width="120" height="26" rx="4"/><text class="sC" x="480" y="157.714" text-anchor="middle">consumer 5</text><rect class="sA" x="420" y="167.143" width="120" height="26" rx="4"/><text class="sC" x="480" y="185.143" text-anchor="middle">consumer 6</text><rect class="sN" x="420" y="194.571" width="120" height="26" rx="4"/><text class="sC" x="480" y="212.571" text-anchor="middle">consumer 7 (idle)</text><line class="sLm" x1="120" y1="43" x2="416" y2="43" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="75" x2="416" y2="70.4286" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="107" x2="416" y2="97.8571" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="139" x2="416" y2="125.286" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="171" x2="416" y2="152.714" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="203" x2="416" y2="180.143" marker-end="url(#ahm)"/><text class="sWt" x="630" y="120" text-anchor="middle">7th consumer idle</text></g>
<g data-s="4-4"><rect class="sA" x="420" y="30" width="120" height="26" rx="4"/><text class="sC" x="480" y="48" text-anchor="middle">consumer 1</text><rect class="sR" x="420" y="94" width="120" height="26" rx="4"/><text class="sC" x="480" y="112" text-anchor="middle">consumer 2 ✗</text><rect class="sA" x="420" y="158" width="120" height="26" rx="4"/><text class="sC" x="480" y="176" text-anchor="middle">consumer 3</text><line class="sLm" x1="120" y1="43" x2="416" y2="43" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="75" x2="416" y2="43" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="107" x2="416" y2="171" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="139" x2="416" y2="171" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="171" x2="416" y2="43" marker-end="url(#ahm)"/><line class="sLm" x1="120" y1="203" x2="416" y2="171" marker-end="url(#ahm)"/><text class="sGt" x="630" y="120" text-anchor="middle">rebalanced</text></g>
</svg><ol class="dia-steps">
<li>Two consumers in one group split the six partitions, three each.</li>
<li>Add a third consumer and the group rebalances to two partitions each: more throughput.</li>
<li>Beyond six consumers there's nothing left to assign: the seventh sits idle. <b>The partition count caps a group's parallelism.</b></li>
<li>If a consumer dies, its partitions move to the survivors, which resume from the last committed offsets.</li>
</ol><figcaption>Partitions are the unit of parallelism, so choose their number for the throughput you'll need, not the one you have.</figcaption></figure>

> [!say]
> "Kafka is a replicated, partitioned log. Producers write to a topic, and the record key decides the partition, so all events for one order stay in order. Consumers in a group split the partitions, one consumer per partition, which is how you scale, up to the partition count, and each group tracks its own committed offsets, so many independent applications can read the same stream and replay it."

## DE8.3 Delivery guarantees 🟡 ⭐

| Guarantee | How it arises | Risk |
|---|---|---|
| **At-most-once** | Commit the offset **before** processing | A crash after commit loses the record |
| **At-least-once** (the usual default) | Process, **then** commit | A crash after processing but before commit reprocesses: **duplicates** |
| **Exactly-once** (effectively) | Kafka's **idempotent producer** (no duplicates from producer retries) + **transactions** (atomically write outputs and commit input offsets) for Kafka-to-Kafka processing; **end to end**, at-least-once delivery plus **idempotent or transactional sinks** | Requires discipline at every hop |

**Producer settings that matter:** `acks=all` with `min.insync.replicas=2` (with replication factor 3) so an acknowledged write survives a broker failure; `enable.idempotence=true` (the default in modern clients) so retries don't duplicate.

<figure class="dia"><svg viewBox="0 0 720 212" role="img" aria-label="Committing the offset before processing loses a record if the consumer crashes; processing before committing causes a duplicate after a crash">
<text class="sT" x="14" y="56">at-most-once</text>
<rect class="sB" x="140" y="30" width="124" height="40" rx="6"/><text class="sC" x="202" y="55" text-anchor="middle">commit offset</text>
<line class="sLm" x1="264" y1="50" x2="278" y2="50" marker-end="url(#ahm)"/>
<rect class="sA" x="280" y="30" width="124" height="40" rx="6"/><text class="sC" x="342" y="55" text-anchor="middle">process</text>
<line class="sLm" x1="404" y1="50" x2="418" y2="50" marker-end="url(#ahm)"/>
<rect class="sR" x="420" y="30" width="124" height="40" rx="6"/><text class="sC" x="482" y="55" text-anchor="middle">✗ crash</text>
<text class="sC" x="560" y="55">restart skips it</text><text class="sRt" x="560" y="73">lost</text>
<text class="sT" x="14" y="136">at-least-once</text>
<rect class="sA" x="140" y="110" width="124" height="40" rx="6"/><text class="sC" x="202" y="135" text-anchor="middle">process</text>
<line class="sLm" x1="264" y1="130" x2="278" y2="130" marker-end="url(#ahm)"/>
<rect class="sR" x="280" y="110" width="124" height="40" rx="6"/><text class="sC" x="342" y="135" text-anchor="middle">✗ crash</text>
<line class="sLm" x1="404" y1="130" x2="418" y2="130" marker-end="url(#ahm)"/>
<rect class="sN" x="420" y="110" width="124" height="40" rx="6" stroke-dasharray="4 3"/><text class="sC" x="482" y="135" text-anchor="middle">commit offset</text>
<text class="sC" x="560" y="135">restart redoes it</text><text class="sWt" x="560" y="153">duplicate</text>
<text class="sS" x="360" y="200" text-anchor="middle">the usual answer: at-least-once delivery + idempotent processing (dedupe by event ID, MERGE on keys)</text>
</svg><figcaption>Where the crash falls relative to the commit decides whether you lose data or see it twice. Design for twice.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="The same events grouped by tumbling 30-second windows, overlapping hopping windows and session windows separated by 15 seconds of inactivity, with one late event">
<text class="sC" x="160" y="34" text-anchor="end">events</text><line class="sLm" x1="170" y1="30" x2="698" y2="30"/>
<circle class="sP" cx="183.2" cy="30" r="4"/>
<circle class="sP" cx="205.2" cy="30" r="4"/>
<circle class="sP" cx="231.60000000000002" cy="30" r="4"/>
<circle class="sP" cx="253.60000000000002" cy="30" r="4"/>
<circle class="sP" cx="266.8" cy="30" r="4"/>
<circle class="sP" cx="376.8" cy="30" r="4"/>
<circle class="sP" cx="394.4" cy="30" r="4"/>
<circle class="sP" cx="425.20000000000005" cy="30" r="4"/>
<circle class="sP" cx="526.4000000000001" cy="30" r="4"/>
<circle class="sP" cx="557.2" cy="30" r="4"/>
<circle class="sP" cx="574.8" cy="30" r="4"/>
<circle class="sP" cx="588.0" cy="30" r="4"/>
<circle class="sP" cx="684.8000000000001" cy="30" r="4"/>
<circle class="sPr" cx="328.4" cy="30" r="5"/><text class="sRt" x="328.4" y="18" text-anchor="middle">late</text>
<text class="sC" x="160" y="67" text-anchor="end">tumbling 30 s</text>
<rect class="sA" x="171" y="54" width="130" height="16" rx="3" opacity=".75"/>
<rect class="sA" x="303" y="54" width="130" height="16" rx="3" opacity=".75"/>
<rect class="sA" x="435" y="54" width="130" height="16" rx="3" opacity=".75"/>
<rect class="sA" x="567" y="54" width="130" height="16" rx="3" opacity=".75"/>
<text class="sC" x="160" y="107" text-anchor="end">hopping 60 s / 30 s</text>
<rect class="sV" x="171" y="94" width="262" height="16" rx="3" opacity=".75"/>
<rect class="sV" x="303" y="102" width="262" height="16" rx="3" opacity=".75"/>
<rect class="sV" x="435" y="94" width="262" height="16" rx="3" opacity=".75"/>
<text class="sC" x="160" y="147" text-anchor="end">session gap 15 s</text>
<rect class="sG" x="184.2" y="134" width="81.6" height="16" rx="3" opacity=".75"/>
<rect class="sG" x="377.8" y="134" width="46.4" height="16" rx="3" opacity=".75"/>
<rect class="sG" x="527.4" y="134" width="59.6" height="16" rx="3" opacity=".75"/>
<rect class="sG" x="685.8" y="134" width="6" height="16" rx="3" opacity=".75"/>
<text class="sC" x="170" y="196" text-anchor="middle">0 s</text>
<text class="sC" x="302" y="196" text-anchor="middle">30 s</text>
<text class="sC" x="434" y="196" text-anchor="middle">60 s</text>
<text class="sC" x="566" y="196" text-anchor="middle">90 s</text>
<text class="sC" x="698" y="196" text-anchor="middle">120 s</text>
<text class="sC" x="360" y="216" text-anchor="middle">a watermark decides when a window closes; the red event arrived after its window closed</text>
</svg><figcaption>Three ways to cut an endless stream into finite groups. Choose by the question: per minute, a rolling average, or per visit.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="Consumer lag: the latest offset keeps rising while the committed offset falls behind after a downstream slowdown at minute 30, so the gap between them grows">
<line class="sLm" x1="60" y1="190" x2="668" y2="190" marker-end="url(#ahm)"/>
<polyline class="sL" points="60,190 110,178 160,165 210,153 260,141 310,128 360,116 410,104 460,92 510,79 560,67 610,55 660,42" fill="none" stroke-width="2.5"/>
<polyline class="sLw" points="60,190 110,178 160,165 210,153 260,141 310,128 360,116 410,113 460,110 510,107 560,104 610,101 660,98" fill="none" stroke-width="2.5"/>
<line class="sLr" x1="660" y1="42.3077" x2="660" y2="97.6923" stroke-width="3"/><text class="sRt" x="652" y="70" text-anchor="end">lag</text>
<line class="sD" x1="360" y1="30" x2="360" y2="190"/><text class="sC" x="364" y="40">a slow downstream DB from minute 30</text>
<text class="sC" x="200" y="120" text-anchor="middle">latest offset</text><text class="sWt" x="540" y="176" text-anchor="middle">committed offset</text>
<text class="sC" x="60" y="208" text-anchor="middle">0 min</text>
<text class="sC" x="360" y="208" text-anchor="middle">30 min</text>
<text class="sC" x="660" y="208" text-anchor="middle">60 min</text>
</svg><figcaption>Lag is the one Kafka metric everyone should alert on: it measures how stale the consumers' view of the world is.</figcaption></figure>

Also: partition count planning (throughput per partition, target parallelism, growth); retention sized to recovery needs (enough to replay after a multi-day outage); a **dead-letter topic** for records that fail repeatedly ([[B8.4]]); monitoring under-replicated partitions and broker disk usage; and security (TLS, SASL authentication, ACLs per topic).

## DE8.10 A worked design: live courier tracking 🟡

**Requirements:** couriers' phones send GPS every 5 seconds; customers see their courier's position live; operations sees zone heat maps per minute; data lands in the lakehouse for ETA models.

**Design:** phones → API → Kafka topic `courier-locations` keyed by `courier_id` (ordered per courier), about 12 partitions sized to peak throughput, 3-day retention, Avro with a schema registry → (1) a **Kafka Streams or Flink** job keeps the **latest position per courier** (a compacted topic or a Redis cache) that the customer app reads via the API and SignalR ([[FS3.2]]); (2) a **Spark Structured Streaming** job computes per-zone counts in **1-minute tumbling windows on event time** with a 2-minute watermark into a gold Delta table for the operations dashboard; (3) a raw sink to **bronze** for model training. Monitor consumer lag per group; late events beyond the watermark go to a side table.

<figure class="dia anim"><svg viewBox="0 0 720 244" role="img" aria-label="Animation: courier GPS updates flow through an API into a Kafka topic keyed by courier, read independently by a latest-position store for customers, a Flink job for zone heat maps, and a lake loader for model training">
<rect class="sB" x="14" y="90" width="100" height="50" rx="8"/><text class="sT" x="64" y="113" text-anchor="middle">phones</text><text class="sC" x="64" y="129" text-anchor="middle">GPS every 5 s</text>
<line class="sL" x1="114" y1="115" x2="146" y2="115" marker-end="url(#ah)"/><rect class="sA" x="150" y="90" width="90" height="50" rx="8"/><text class="sT" x="195" y="120" text-anchor="middle">API</text>
<line class="sL" x1="240" y1="115" x2="272" y2="115" marker-end="url(#ah)"/><rect class="sW" x="276" y="80" width="150" height="70" rx="8"/><text class="sT" x="351" y="113" text-anchor="middle">courier-locations</text><text class="sC" x="351" y="129" text-anchor="middle">keyed by courier</text>
<line class="sL" x1="426" y1="100" x2="490" y2="44" marker-end="url(#ah)"/><rect class="sG" x="494" y="20" width="212" height="46" rx="8"/><text class="sT" x="600" y="41" text-anchor="middle">latest position (Redis)</text><text class="sC" x="600" y="57" text-anchor="middle">→ customer app, live</text>
<line class="sL" x1="426" y1="115" x2="490" y2="115" marker-end="url(#ah)"/><rect class="sV" x="494" y="92" width="212" height="46" rx="8"/><text class="sT" x="600" y="113" text-anchor="middle">Flink: per-minute zone counts</text><text class="sC" x="600" y="129" text-anchor="middle">→ operations heat map</text>
<line class="sL" x1="426" y1="130" x2="490" y2="186" marker-end="url(#ah)"/><rect class="sB" x="494" y="164" width="212" height="46" rx="8"/><text class="sT" x="600" y="185" text-anchor="middle">lake bronze (Delta)</text><text class="sC" x="600" y="201" text-anchor="middle">→ ETA model training</text>
<circle class="sPg" r="5"><animateMotion dur="3s" repeatCount="indefinite" path="M114 115 H426 L494 44"/></circle><circle class="sPv" r="5"><animateMotion dur="3s" begin="1s" repeatCount="indefinite" path="M114 115 H494"/></circle><circle class="sP" r="5"><animateMotion dur="3s" begin="2s" repeatCount="indefinite" path="M114 115 H426 L494 186"/></circle>
<text class="sS" x="360" y="232" text-anchor="middle">one topic, three independent consumer groups, three latencies</text>
</svg><figcaption>The live-tracking design: Kafka decouples one producer from three consumers with very different needs.</figcaption></figure>

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
