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

The question to ask is how old the data may be when someone, or something, acts on it. This plot is computed for three cadences over one day, assuming events arrive all day: a nightly job that loads data up to 02:00 and finishes at 03:00, an hourly job that takes 10 minutes, and a stream whose consumer runs about 2 seconds behind:

<figure class="dia"><svg viewBox="0 0 720 330" role="img" aria-label="How old the newest data is at each moment of a day, on a log scale. A nightly batch that loads data up to 02:00 and finishes at 03:00 shows data between 1 and 25 hours old, 13 hours on average. An hourly batch that takes 10 minutes shows data 10 to 70 minutes old, 40 minutes on average. A stream with a consumer lag of about 2 seconds stays near 2 seconds all day."><line class="sD" x1="90" y1="250" x2="680" y2="250"/><text class="sS" x="82" y="254" text-anchor="end">1 s</text><line class="sD" x1="90" y1="180.4" x2="680" y2="180.4"/><text class="sS" x="82" y="184.4" text-anchor="end">1 min</text><line class="sD" x1="90" y1="110.9" x2="680" y2="110.9"/><text class="sS" x="82" y="114.9" text-anchor="end">1 h</text><line class="sD" x1="90" y1="56.9" x2="680" y2="56.9"/><text class="sS" x="82" y="60.9" text-anchor="end">1 day</text><line class="sL" x1="90" y1="250" x2="680" y2="250"/><text class="sS" x="90" y="268" text-anchor="middle">00:00</text><text class="sS" x="237.5" y="268" text-anchor="middle">06:00</text><text class="sS" x="385" y="268" text-anchor="middle">12:00</text><text class="sS" x="532.5" y="268" text-anchor="middle">18:00</text><text class="sS" x="680" y="268" text-anchor="middle">24:00</text><polyline class="sLr" fill="none" points="90,58.4 94.1,58.2 98.2,58.1 102.3,58 106.4,57.9 110.5,57.7 114.6,57.6 118.7,57.5 122.8,57.4 126.9,57.2 131,57.1 135.1,57 139.2,56.9 143.3,56.8 147.4,56.7 151.5,56.5 155.6,56.4 159.7,56.3 163.8,56.2 163.8,110.9 167.8,108.3 171.9,106 176,104 180.1,102.2 184.2,100.6 188.3,99.1 192.4,97.7 196.5,96.5 200.6,95.3 204.7,94.2 208.8,93.2 212.9,92.2 217,91.3 221.1,90.4 225.2,89.6 229.3,88.8 233.4,88.1 237.5,87.3 241.6,86.6 245.7,86 249.8,85.3 253.9,84.7 258,84.1 262.1,83.5 266.2,83 270.3,82.4 274.4,81.9 278.5,81.4 282.6,80.9 286.7,80.4 290.8,80 294.9,79.5 299,79.1 303.1,78.7 307.2,78.2 311.3,77.8 315.3,77.4 319.4,77 323.5,76.6 327.6,76.3 331.7,75.9 335.8,75.6 339.9,75.2 344,74.9 348.1,74.5 352.2,74.2 356.3,73.9 360.4,73.6 364.5,73.2 368.6,72.9 372.7,72.6 376.8,72.3 380.9,72 385,71.8 389.1,71.5 393.2,71.2 397.3,70.9 401.4,70.7 405.5,70.4 409.6,70.1 413.7,69.9 417.8,69.6 421.9,69.4 426,69.1 430.1,68.9 434.2,68.7 438.3,68.4 442.4,68.2 446.5,68 450.6,67.7 454.7,67.5 458.8,67.3 462.8,67.1 466.9,66.9 471,66.7 475.1,66.5 479.2,66.2 483.3,66 487.4,65.8 491.5,65.6 495.6,65.4 499.7,65.3 503.8,65.1 507.9,64.9 512,64.7 516.1,64.5 520.2,64.3 524.3,64.1 528.4,64 532.5,63.8 536.6,63.6 540.7,63.4 544.8,63.3 548.9,63.1 553,62.9 557.1,62.7 561.2,62.6 565.3,62.4 569.4,62.3 573.5,62.1 577.6,61.9 581.7,61.8 585.8,61.6 589.9,61.5 594,61.3 598.1,61.2 602.2,61 606.3,60.9 610.3,60.7 614.4,60.6 618.5,60.4 622.6,60.3 626.7,60.1 630.8,60 634.9,59.8 639,59.7 643.1,59.6 647.2,59.4 651.3,59.3 655.4,59.2 659.5,59 663.6,58.9 667.7,58.8 671.8,58.6 675.9,58.5 680,58.4"/><polyline class="sLw" fill="none" points="90,110.9 94.1,108.3 94.1,141.3 98.2,129.5 102.3,122.7 106.4,117.8 110.5,114 114.6,110.9 118.7,108.3 118.7,141.3 122.8,129.5 126.9,122.7 131,117.8 135.1,114 139.2,110.9 143.3,108.3 143.3,141.3 147.4,129.5 151.5,122.7 155.6,117.8 159.7,114 163.8,110.9 167.8,108.3 167.8,141.3 171.9,129.5 176,122.7 180.1,117.8 184.2,114 188.3,110.9 192.4,108.3 192.4,141.3 196.5,129.5 200.6,122.7 204.7,117.8 208.8,114 212.9,110.9 217,108.3 217,141.3 221.1,129.5 225.2,122.7 229.3,117.8 233.4,114 237.5,110.9 241.6,108.3 241.6,141.3 245.7,129.5 249.8,122.7 253.9,117.8 258,114 262.1,110.9 266.2,108.3 266.2,141.3 270.3,129.5 274.4,122.7 278.5,117.8 282.6,114 286.7,110.9 290.8,108.3 290.8,141.3 294.9,129.5 299,122.7 303.1,117.8 307.2,114 311.3,110.9 315.3,108.3 315.3,141.3 319.4,129.5 323.5,122.7 327.6,117.8 331.7,114 335.8,110.9 339.9,108.3 339.9,141.3 344,129.5 348.1,122.7 352.2,117.8 356.3,114 360.4,110.9 364.5,108.3 364.5,141.3 368.6,129.5 372.7,122.7 376.8,117.8 380.9,114 385,110.9 389.1,108.3 389.1,141.3 393.2,129.5 397.3,122.7 401.4,117.8 405.5,114 409.6,110.9 413.7,108.3 413.7,141.3 417.8,129.5 421.9,122.7 426,117.8 430.1,114 434.2,110.9 438.3,108.3 438.3,141.3 442.4,129.5 446.5,122.7 450.6,117.8 454.7,114 458.8,110.9 462.8,108.3 462.8,141.3 466.9,129.5 471,122.7 475.1,117.8 479.2,114 483.3,110.9 487.4,108.3 487.4,141.3 491.5,129.5 495.6,122.7 499.7,117.8 503.8,114 507.9,110.9 512,108.3 512,141.3 516.1,129.5 520.2,122.7 524.3,117.8 528.4,114 532.5,110.9 536.6,108.3 536.6,141.3 540.7,129.5 544.8,122.7 548.9,117.8 553,114 557.1,110.9 561.2,108.3 561.2,141.3 565.3,129.5 569.4,122.7 573.5,117.8 577.6,114 581.7,110.9 585.8,108.3 585.8,141.3 589.9,129.5 594,122.7 598.1,117.8 602.2,114 606.3,110.9 610.3,108.3 610.3,141.3 614.4,129.5 618.5,122.7 622.6,117.8 626.7,114 630.8,110.9 634.9,108.3 634.9,141.3 639,129.5 643.1,122.7 647.2,117.8 651.3,114 655.4,110.9 659.5,108.3 659.5,141.3 663.6,129.5 667.7,122.7 671.8,117.8 675.9,114 680,110.9"/><polyline class="sLg" fill="none" points="90,238.2 94.1,238.2 98.2,238.2 102.3,238.2 106.4,238.2 110.5,238.2 114.6,238.2 118.7,238.2 122.8,238.2 126.9,238.2 131,238.2 135.1,238.2 139.2,238.2 143.3,238.2 147.4,238.2 151.5,238.2 155.6,238.2 159.7,238.2 163.8,238.2 167.8,238.2 171.9,238.2 176,238.2 180.1,238.2 184.2,238.2 188.3,238.2 192.4,238.2 196.5,238.2 200.6,238.2 204.7,238.2 208.8,238.2 212.9,238.2 217,238.2 221.1,238.2 225.2,238.2 229.3,238.2 233.4,238.2 237.5,238.2 241.6,238.2 245.7,238.2 249.8,238.2 253.9,238.2 258,238.2 262.1,238.2 266.2,238.2 270.3,238.2 274.4,238.2 278.5,238.2 282.6,238.2 286.7,238.2 290.8,238.2 294.9,238.2 299,238.2 303.1,238.2 307.2,238.2 311.3,238.2 315.3,238.2 319.4,238.2 323.5,238.2 327.6,238.2 331.7,238.2 335.8,238.2 339.9,238.2 344,238.2 348.1,238.2 352.2,238.2 356.3,238.2 360.4,238.2 364.5,238.2 368.6,238.2 372.7,238.2 376.8,238.2 380.9,238.2 385,238.2 389.1,238.2 393.2,238.2 397.3,238.2 401.4,238.2 405.5,238.2 409.6,238.2 413.7,238.2 417.8,238.2 421.9,238.2 426,238.2 430.1,238.2 434.2,238.2 438.3,238.2 442.4,238.2 446.5,238.2 450.6,238.2 454.7,238.2 458.8,238.2 462.8,238.2 466.9,238.2 471,238.2 475.1,238.2 479.2,238.2 483.3,238.2 487.4,238.2 491.5,238.2 495.6,238.2 499.7,238.2 503.8,238.2 507.9,238.2 512,238.2 516.1,238.2 520.2,238.2 524.3,238.2 528.4,238.2 532.5,238.2 536.6,238.2 540.7,238.2 544.8,238.2 548.9,238.2 553,238.2 557.1,238.2 561.2,238.2 565.3,238.2 569.4,238.2 573.5,238.2 577.6,238.2 581.7,238.2 585.8,238.2 589.9,238.2 594,238.2 598.1,238.2 602.2,238.2 606.3,238.2 610.3,238.2 614.4,238.2 618.5,238.2 622.6,238.2 626.7,238.2 630.8,238.2 634.9,238.2 639,238.2 643.1,238.2 647.2,238.2 651.3,238.2 655.4,238.2 659.5,238.2 663.6,238.2 667.7,238.2 671.8,238.2 675.9,238.2 680,238.2"/><text class="sT" x="20" y="22">How old is the newest row when someone looks?</text><text class="sRt" x="409.6" y="50">nightly load: 1–25 h old, 13 h on average</text><text class="sWt" x="311.3" y="159.8">hourly load: 10–70 min, 40 min on average</text><text class="sGt" x="311.3" y="228.2">stream: ≈ 2 s of consumer lag, all day</text><text class="sM" x="360" y="298" text-anchor="middle">A fraud check needs the bottom line; a monthly report is fine with the top one.</text></svg><figcaption>Data age is now minus the cut-off of the last finished load, so batch ages climb steadily and drop when a run lands. The averages are the numbers to quote: about 13 hours for the nightly load, 40 minutes for the hourly one, and seconds for the stream. Running the batch more often narrows the sawtooth but never closes it; at 5-minute micro-batches the floor is still the job’s own run time. If the decision can wait an hour, the hourly load is far cheaper to build and operate ([[DE1.4]]). If it can’t, watch consumer lag the same way ([[DE8.9]]).</figcaption></figure>

## DE8.2 How Kafka works 🟢 ⭐

> [!term] Apache Kafka
> A distributed, **append-only commit log**. Producers write records to **topics**; each topic is split into **partitions**; each partition is an ordered, immutable sequence of records identified by an increasing **offset**. Records are **retained** for a configured time or size (not deleted when read), so many independent consumers can read the same data, and re-read it.

<figure class="dia anim"><svg viewBox="0 0 720 240" role="img" aria-label="Animation: Kafka topic with three partitions, producers writing by key, a consumer group with consumers assigned to partitions">
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
<circle class="sP" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.100;1" path="M120 110 L185 75"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.100;0.102;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.450;0.550;1" path="M505 75 L585 93"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.448;0.452;0.550;0.552;1"/></circle>
<circle class="sP" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.100;0.200;1" path="M120 110 L185 125"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.098;0.102;0.200;0.202;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.550;0.650;1" path="M505 125 L585 130"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.548;0.552;0.650;0.652;1"/></circle>
<circle class="sP" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.300;1" path="M120 110 L185 175"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.300;0.302;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.650;0.750;1" path="M505 175 L585 167"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.648;0.652;0.750;0.752;1"/></circle>
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

<figure class="dia anim"><svg viewBox="0 0 720 212" role="img" aria-label="Animation: committing the offset before processing loses a record if the consumer crashes; processing before committing causes a duplicate after a crash">
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
<circle class="sPr" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.400;1" path="M140 80 L544 80"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.400;0.402;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.500;0.900;1" path="M140 160 L544 160"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.498;0.502;0.900;0.902;1"/></circle>
</svg><figcaption>Where the crash falls relative to the commit decides whether you lose data or see it twice. Design for twice.</figcaption></figure>

> [!say]
> "By default you get at-least-once: process, then commit, so a crash can cause duplicates. Kafka gives exactly-once between Kafka topics with idempotent producers and transactions that commit outputs and offsets together. End to end, into a database or a lakehouse, I make the sink idempotent, upserting by a key or using Delta with checkpoints, so duplicates don't change the result."

## DE8.4 Ordering and keys 🟡 ⭐

- Kafka guarantees order **within a partition only**. Choose the **key** so that events that must be ordered relative to each other share it: `order_id` for an order's status changes, `account_id` for a balance, `courier_id` for GPS pings.
- A **hot key** (one huge merchant, a NULL key) overloads one partition, the streaming version of skew ([[DE6.7]]). Spread with a composite key if strict per-key ordering isn't needed.
- Changing the partition count changes which partition a key maps to, breaking ordering for in-flight keys, so plan the count up front.

<figure class="dia anim"><svg viewBox="0 0 720 232" role="img" aria-label="Animation: Kafka keys and ordering: events for order-17, order-42 and order-9 are hashed by key to partitions P0, P2 and P1; each partition is an append-only log, so created, paid and shipped for order-17 stay in order in P0, while there is no ordering between partitions">
<text class="sM" x="90" y="22" text-anchor="middle">events, in arrival order</text>
<text class="sM" x="560" y="22" text-anchor="middle">partitions: an append-only log each</text>
<rect class="sN" x="250" y="92" width="120" height="44" rx="8"/><text class="sT" x="310" y="112" text-anchor="middle">hash(key) % 3</text><text class="sC" x="310" y="128" text-anchor="middle">key → partition</text>
<rect class="sB" x="14" y="34" width="152" height="24" rx="4"/><text class="sC" x="90" y="50" text-anchor="middle">order-17: created</text>
<rect class="sV" x="14" y="64" width="152" height="24" rx="4"/><text class="sC" x="90" y="80" text-anchor="middle">order-42: created</text>
<rect class="sB" x="14" y="94" width="152" height="24" rx="4"/><text class="sC" x="90" y="110" text-anchor="middle">order-17: paid</text>
<rect class="sA" x="14" y="124" width="152" height="24" rx="4"/><text class="sC" x="90" y="140" text-anchor="middle">order-9: created</text>
<rect class="sV" x="14" y="154" width="152" height="24" rx="4"/><text class="sC" x="90" y="170" text-anchor="middle">order-42: paid</text>
<rect class="sB" x="14" y="184" width="152" height="24" rx="4"/><text class="sC" x="90" y="200" text-anchor="middle">order-17: shipped</text>
<rect class="sN" x="420" y="40" width="286" height="40" rx="6"/><text class="sT" x="434" y="65">P0</text>
<rect class="sN" x="420" y="96" width="286" height="40" rx="6"/><text class="sT" x="434" y="121">P1</text>
<rect class="sN" x="420" y="152" width="286" height="40" rx="6"/><text class="sT" x="434" y="177">P2</text>
<rect class="sB" x="458" y="50" width="64" height="20" rx="4" opacity=".55"/><text class="sC" x="490" y="64" text-anchor="middle">created</text>
<rect class="sV" x="458" y="162" width="64" height="20" rx="4" opacity=".55"/><text class="sC" x="490" y="176" text-anchor="middle">created</text>
<rect class="sB" x="530" y="50" width="64" height="20" rx="4" opacity=".55"/><text class="sC" x="562" y="64" text-anchor="middle">paid</text>
<rect class="sA" x="458" y="106" width="64" height="20" rx="4" opacity=".55"/><text class="sC" x="490" y="120" text-anchor="middle">created</text>
<rect class="sV" x="530" y="162" width="64" height="20" rx="4" opacity=".55"/><text class="sC" x="562" y="176" text-anchor="middle">paid</text>
<rect class="sB" x="602" y="50" width="64" height="20" rx="4" opacity=".55"/><text class="sC" x="634" y="64" text-anchor="middle">shipped</text>
<text class="sS" x="360" y="222" text-anchor="middle">order holds within a partition, so all events for order-17 are read in order; there is no order across partitions</text>
<circle class="sP" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.040;0.140;1" path="M166 46 L250 114 L370 114 L490 60"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.038;0.042;0.140;0.142;1"/></circle>
<circle class="sPv" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.170;0.270;1" path="M166 76 L250 114 L370 114 L490 172"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.168;0.172;0.270;0.272;1"/></circle>
<circle class="sP" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.300;0.400;1" path="M166 106 L250 114 L370 114 L562 60"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.298;0.302;0.400;0.402;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.430;0.530;1" path="M166 136 L250 114 L370 114 L490 116"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.428;0.432;0.530;0.532;1"/></circle>
<circle class="sPv" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.560;0.660;1" path="M166 166 L250 114 L370 114 L562 172"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.558;0.562;0.660;0.662;1"/></circle>
<circle class="sP" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.690;0.790;1" path="M166 196 L250 114 L370 114 L634 60"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.688;0.692;0.790;0.792;1"/></circle>
</svg><figcaption>Pick the key that needs ordering, usually the entity ID. A hot key overloads one partition, and changing the partition count reshuffles which partition a key maps to.</figcaption></figure>

## DE8.5 Schemas and evolution 🟡 ⭐

Producers and consumers evolve independently, so the record format needs a contract.

- Serialise with **Avro**, **Protobuf** or JSON Schema, and register schemas in a **Schema Registry** (Confluent Schema Registry, Apicurio, Azure Schema Registry in Event Hubs). Each record carries a schema ID.
- **Compatibility rules** checked at registration:

| Mode | Meaning | Allowed change, typically |
|---|---|---|
| **Backward** | New consumers can read old data | Add optional fields (with defaults), remove fields |
| **Forward** | Old consumers can read new data | Add fields, remove optional fields |
| **Full** | Both | Only add or remove optional fields with defaults |

<figure class="dia steps"><svg viewBox="0 0 720 262" role="img" aria-label="Avro schema resolution in three cases. A record written with schema version 1 and read with version 2, which adds currency with a default of EGP, gets currency filled with EGP: backward compatible. A record written with version 2 and read with version 1 has the unknown currency field skipped: forward compatible. A version 3 that requires a total field with no default cannot read version 1 records, so a registry in BACKWARD mode rejects it">
<rect class="sV" x="14" y="14" width="262" height="46" rx="6"/><text class="sS" x="24" y="31">written with v1</text><text class="sM" x="24" y="50">{order_id: 17, amount: 250}</text><line class="sLg" x1="276" y1="37" x2="324" y2="37" marker-end="url(#ahg)"/><rect class="sG" x="328" y="14" width="200" height="46" rx="6"/><text class="sS" x="338" y="31">read with v2</text><text class="sS" x="338" y="50">adds currency, default "EGP"</text><text class="sGt" x="542" y="31">backward ✓</text><text class="sS" x="542" y="50">currency filled with "EGP"</text>
<g data-s="2"><rect class="sG" x="14" y="84" width="262" height="46" rx="6"/><text class="sS" x="24" y="101">written with v2</text><text class="sM" x="24" y="120">amount: 250, currency: "USD"</text><line class="sLg" x1="276" y1="107" x2="324" y2="107" marker-end="url(#ahg)"/><rect class="sV" x="328" y="84" width="200" height="46" rx="6"/><text class="sS" x="338" y="101">read with v1</text><text class="sS" x="338" y="120">knows no currency field</text><text class="sGt" x="542" y="101">forward ✓</text><text class="sS" x="542" y="120">unknown field skipped</text></g>
<g data-s="3"><rect class="sV" x="14" y="154" width="262" height="46" rx="6"/><text class="sS" x="24" y="171">written with v1</text><text class="sM" x="24" y="190">{order_id: 17, amount: 250}</text><line class="sLr" x1="276" y1="177" x2="324" y2="177" marker-end="url(#ahr)"/><rect class="sR" x="328" y="154" width="200" height="46" rx="6"/><text class="sS" x="338" y="171">read with v3</text><text class="sS" x="338" y="190">requires total, no default</text><text class="sRt" x="542" y="171">error</text><text class="sS" x="542" y="190">registry rejects v3</text></g>
<text class="sS" x="14" y="230">Avro reads with two schemas, the writer's and the reader's: fields only the reader knows take its default,</text>
<text class="sS" x="14" y="248">fields only the writer knows are skipped, and a reader field with no default and no value is an error.</text>
</svg><ol class="dia-steps">
<li>Adding an optional field with a default: a new consumer reads old records and fills the gap from the default.</li>
<li>The same change seen the other way: an old consumer skips the field it does not know. Both directions work, so the change is fully compatible.</li>
<li>A required field with no default (or a rename, which is a remove plus an add) breaks new readers on old data; the registry refuses to register it.</li>
</ol><figcaption>Why “add optional fields with defaults” is the safe change. Check the subject's compatibility mode before relying on it: Confluent Schema Registry defaults to BACKWARD.</figcaption></figure>

## DE8.6 Getting data in and out: Kafka Connect and CDC 🟡 ⭐

**Kafka Connect** runs **source** connectors (databases, files, SaaS into Kafka) and **sink** connectors (Kafka into S3/ADLS, Snowflake, Elasticsearch, databases) with configuration rather than code, handling offsets, retries and scaling.

**Change data capture with Debezium:** Debezium reads a database's transaction log (SQL Server, PostgreSQL, MySQL, Oracle, MongoDB) and publishes every insert, update and delete as an event, with before and after values, keyed by the primary key, in commit order per key. Uses:

- Replicating OLTP tables into the lakehouse in near real time (bronze), then **applying** changes with MERGE ([[DE3.1]]).
- Feeding search indexes and caches.
- The **outbox pattern** ([[B8.7]]): Debezium publishes rows from an outbox table, so an application's database commit and its event publication can't diverge.

<figure class="dia anim"><svg viewBox="0 0 720 242" role="img" aria-label="Animation: change data capture: Debezium, a Kafka Connect source, reads the database transaction log rather than the tables and publishes each insert, update and delete to a Kafka topic, from which sink connectors and consumers update a lakehouse, a search index and a cache">
<rect class="sB" x="14" y="70" width="130" height="56" rx="8"/><text class="sT" x="79" y="96" text-anchor="middle">orders DB</text><text class="sC" x="79" y="112" text-anchor="middle">SQL / Postgres</text>
<rect class="sN" x="14" y="140" width="130" height="26" rx="4"/><text class="sC" x="79" y="158" text-anchor="middle">transaction log</text>
<rect class="sV" x="196" y="84" width="130" height="56" rx="8"/><text class="sT" x="261" y="110" text-anchor="middle">Debezium</text><text class="sC" x="261" y="126" text-anchor="middle">Kafka Connect</text>
<rect class="sW" x="378" y="84" width="130" height="56" rx="8"/><text class="sT" x="443" y="110" text-anchor="middle">Kafka topic</text><text class="sC" x="443" y="126" text-anchor="middle">db.orders changes</text>
<rect class="sG" x="560" y="20" width="146" height="44" rx="8"/><text class="sT" x="633" y="40" text-anchor="middle">lakehouse</text><text class="sC" x="633" y="56" text-anchor="middle">sink connector</text>
<rect class="sG" x="560" y="90" width="146" height="44" rx="8"/><text class="sT" x="633" y="110" text-anchor="middle">search index</text><text class="sC" x="633" y="126" text-anchor="middle">sink connector</text>
<rect class="sG" x="560" y="160" width="146" height="44" rx="8"/><text class="sT" x="633" y="180" text-anchor="middle">cache invalidation</text><text class="sC" x="633" y="196" text-anchor="middle">a consumer</text>
<line class="sLm" x1="144" y1="153" x2="196" y2="118" marker-end="url(#ahm)"/>
<line class="sLm" x1="326" y1="112" x2="376" y2="112" marker-end="url(#ahm)"/>
<line class="sLm" x1="508" y1="112" x2="558" y2="42" marker-end="url(#ahm)"/>
<line class="sLm" x1="508" y1="112" x2="558" y2="112" marker-end="url(#ahm)"/>
<line class="sLm" x1="508" y1="112" x2="558" y2="182" marker-end="url(#ahm)"/>
<text class="sS" x="170" y="190" text-anchor="middle">reads the log, not the tables:</text><text class="sS" x="170" y="206" text-anchor="middle">no extra load, no missed deletes</text>
<text class="sS" x="360" y="232" text-anchor="middle">each change arrives as an event with before and after values, in commit order per key</text>
<circle class="sP" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.050;1" path="M79 126 L79 140"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.050;0.052;1"/></circle>
<circle class="sP" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.070;0.150;1" path="M144 153 L196 118"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.068;0.072;0.150;0.152;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.280;1" path="M326 112 L376 112"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.280;0.282;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.340;0.440;1" path="M508 112 L558 42"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.338;0.342;0.440;0.442;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.340;0.440;1" path="M508 112 L558 112"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.338;0.342;0.440;0.442;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.340;0.440;1" path="M508 112 L558 182"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.338;0.342;0.440;0.442;1"/></circle>
</svg><figcaption>CDC turns a database into an event stream without touching the application. Polling a <code>LastModified</code> column misses deletes and adds load; reading the log misses nothing.</figcaption></figure>

## DE8.7 Stream processing concepts 🟡 ⭐

| Concept | Meaning |
|---|---|
| **Event time vs processing time** | When it happened (in the record) vs when the system processed it. Report on event time; phones and networks delay events |
| **Windows** | **Tumbling** (fixed, non-overlapping: per minute), **hopping/sliding** (overlapping: 10-minute windows every minute), **session** (activity separated by a gap of inactivity) |
| **Watermark** | The processor's estimate of "event time has progressed to here": windows close when the watermark passes them, and data later than the allowed lateness is dropped or sent aside |
| **State** | What the processor remembers between events (counts per window, the last location per courier), kept fault-tolerant through checkpoints |
| **Stream–table join** | Enrich events with the latest reference data (a compacted topic or a lookup table) |
| **Stream–stream join** | Join two streams within a time bound (an order and its payment within 30 minutes) |

<figure class="dia anim"><svg viewBox="0 0 720 226" role="img" aria-label="Animation: the same events grouped by tumbling 30-second windows, overlapping hopping windows and session windows separated by 15 seconds of inactivity, with one late event">
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
<circle class="sP" r="4" opacity="0"><animateMotion dur="14s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.850;1" path="M170 42 L698 42"/><animate attributeName="opacity" dur="14s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.850;0.852;1"/></circle>
<circle class="sPr" r="4" opacity="0"><animateMotion dur="14s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.450;0.500;1" path="M328.4 10 L328.4 24"/><animate attributeName="opacity" dur="14s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.448;0.452;0.500;0.502;1"/></circle>
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

<figure class="dia anim"><svg viewBox="0 0 720 246" role="img" aria-label="Animation: streaming into the lakehouse: events from a Kafka topic are read by a stream job in one-minute micro-batches with offsets in a checkpoint, appended to a bronze table, then processed incrementally to silver and gold; the many small files streaming writes create need scheduled compaction">
<rect class="sW" x="14" y="70" width="140" height="56" rx="8"/><text class="sT" x="84" y="96" text-anchor="middle">Kafka topic</text><text class="sC" x="84" y="112" text-anchor="middle">orders events</text>
<rect class="sV" x="210" y="70" width="150" height="56" rx="8"/><text class="sT" x="285" y="96" text-anchor="middle">stream job</text><text class="sC" x="285" y="112" text-anchor="middle">micro-batch / 1 min</text>
<rect class="sB" x="416" y="70" width="130" height="56" rx="8"/><text class="sT" x="481" y="96" text-anchor="middle">bronze</text><text class="sC" x="481" y="112" text-anchor="middle">raw, append</text>
<rect class="sA" x="586" y="30" width="120" height="50" rx="8"/><text class="sT" x="646" y="53" text-anchor="middle">silver</text><text class="sC" x="646" y="69" text-anchor="middle">cleaned</text>
<rect class="sG" x="586" y="110" width="120" height="50" rx="8"/><text class="sT" x="646" y="133" text-anchor="middle">gold</text><text class="sC" x="646" y="149" text-anchor="middle">aggregates</text>
<line class="sLm" x1="154" y1="98" x2="208" y2="98" marker-end="url(#ahm)"/>
<line class="sLm" x1="360" y1="98" x2="414" y2="98" marker-end="url(#ahm)"/>
<line class="sLm" x1="546" y1="90" x2="584" y2="56" marker-end="url(#ahm)"/>
<line class="sLm" x1="646" y1="80" x2="646" y2="108" marker-end="url(#ahm)"/>
<rect class="sN" x="416" y="160" width="130" height="30" rx="4"/><text class="sRt" x="481" y="179" text-anchor="middle">many small files</text>
<text class="sGt" x="481" y="208" text-anchor="middle">scheduled compaction</text>
<text class="sC" x="285" y="160" text-anchor="middle">checkpoint: offsets</text>
<text class="sS" x="360" y="236" text-anchor="middle">the checkpoint makes restarts exactly where they stopped; compaction keeps reads fast</text>
<circle class="sP" r="3" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.020;0.080;1" path="M154 98 L208 98"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.018;0.022;0.080;0.082;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.120;0.180;1" path="M154 98 L208 98"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.118;0.122;0.180;0.182;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.220;0.280;1" path="M154 98 L208 98"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.218;0.222;0.280;0.282;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.340;0.420;1" path="M360 98 L414 98"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.338;0.342;0.420;0.422;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.500;0.580;1" path="M546 90 L584 56"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.498;0.502;0.580;0.582;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.640;0.720;1" path="M646 80 L646 108"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.638;0.642;0.720;0.722;1"/></circle>
</svg><figcaption>Bronze keeps the raw events so silver and gold can be rebuilt; incremental processing keeps each step cheap.</figcaption></figure>

## DE8.9 Operating Kafka 🟡 ⭐

> [!term] Consumer lag
> The difference between the latest offset in a partition and the group's committed offset: how far behind a consumer is. Rising lag means consumers can't keep up (too slow, too few, stuck on a poison message) and is the first streaming metric to alert on.

<figure class="dia anim"><svg viewBox="0 0 720 220" role="img" aria-label="Animation: consumer lag: the latest offset keeps rising while the committed offset falls behind after a downstream slowdown at minute 30, so the gap between them grows">
<line class="sLm" x1="60" y1="190" x2="668" y2="190" marker-end="url(#ahm)"/>
<polyline class="sL" points="60,190 110,178 160,165 210,153 260,141 310,128 360,116 410,104 460,92 510,79 560,67 610,55 660,42" fill="none" stroke-width="2.5"/>
<polyline class="sLw" points="60,190 110,178 160,165 210,153 260,141 310,128 360,116 410,113 460,110 510,107 560,104 610,101 660,98" fill="none" stroke-width="2.5"/>
<line class="sLr" x1="660" y1="42.3077" x2="660" y2="97.6923" stroke-width="3"/><text class="sRt" x="652" y="70" text-anchor="end">lag</text>
<line class="sD" x1="360" y1="30" x2="360" y2="190"/><text class="sC" x="364" y="40">a slow downstream DB from minute 30</text>
<text class="sC" x="200" y="120" text-anchor="middle">latest offset</text><text class="sWt" x="540" y="176" text-anchor="middle">committed offset</text>
<text class="sC" x="60" y="208" text-anchor="middle">0 min</text>
<text class="sC" x="360" y="208" text-anchor="middle">30 min</text>
<text class="sC" x="660" y="208" text-anchor="middle">60 min</text>
<circle class="sP" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.850;1" path="M60 190 L110 178 L160 165 L210 153 L260 141 L310 128 L360 116 L410 104 L460 92 L510 79 L560 67 L610 55 L660 42"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.850;0.852;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.850;1" path="M60 190 L110 178 L160 165 L210 153 L260 141 L310 128 L360 116 L410 113 L460 110 L510 107 L560 104 L610 101 L660 98"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.850;0.852;1"/></circle>
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
