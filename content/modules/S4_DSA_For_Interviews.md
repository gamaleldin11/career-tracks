# Data Structures and Algorithms for Interviews — Patterns, Not Memorisation

Egyptian product companies and anyone hiring for remote roles usually include a live coding round, on a shared editor, HackerRank or Codility. Outsourcing and enterprise shops often skip it or keep it light. Either way, the bar for entry and mid level is **easy-to-medium problems, solved cleanly, with the complexity explained**. This module teaches the dozen patterns that cover most of those problems, in C# (your strongest language) with notes for JavaScript and Python.

> [!focus]
> **Entry must:** state Big-O for your own code; choose between array, list, hash map, set, stack, queue and heap; solve easy problems with hashing, two pointers and simple recursion; talk while you code.
> **Mid adds:** sliding window, BFS/DFS on grids and graphs, binary search on the answer, heaps for top-k, basic dynamic programming.
> **Most asked patterns:** *two-sum (hash map)* · *valid parentheses (stack)* · *longest substring without repeats (sliding window)* · *merge intervals (sort)* · *number of islands (BFS/DFS)* · *top-k frequent (heap)* · *climbing stairs or coin change (DP)*.
> **Time budget:** this module takes 4 hours to read; the skill takes 3–4 weeks of 2–3 problems a day.

## S4.0 Foundations: memory, references, hashing and the call stack 🟢

A data structure is a way of arranging data in memory so that the operations you need are cheap. Four ideas explain almost every cost in the tables later in this module.

### Memory is one long row of numbered bytes

Reading any address in RAM takes roughly the same time. An **array** puts its items side by side, so item `i` lives at *start + i × item size*: one multiplication away, which is why indexing is O(1). A **linked list** keeps each item in its own node, anywhere in memory, with a pointer to the next node, so reaching the k-th item means following k pointers.

<figure class="dia"><svg viewBox="0 0 720 295" role="img" aria-label="An array stores items side by side so any index is one calculation away; a linked list scatters nodes and links them with pointers">
<text class="sT" x="20" y="14">Array int[5]: one contiguous block</text>
<rect class="sA" x="140" y="38" width="76" height="40" rx="4"/>
<text class="sT" x="178" y="63" text-anchor="middle">7</text>
<text class="sC" x="178" y="94" text-anchor="middle">@1000</text>
<text class="sM" x="178" y="33" text-anchor="middle">[0]</text>
<rect class="sA" x="220" y="38" width="76" height="40" rx="4"/>
<text class="sT" x="258" y="63" text-anchor="middle">3</text>
<text class="sC" x="258" y="94" text-anchor="middle">@1004</text>
<text class="sM" x="258" y="33" text-anchor="middle">[1]</text>
<rect class="sA" x="300" y="38" width="76" height="40" rx="4"/>
<text class="sT" x="338" y="63" text-anchor="middle">9</text>
<text class="sC" x="338" y="94" text-anchor="middle">@1008</text>
<text class="sM" x="338" y="33" text-anchor="middle">[2]</text>
<rect class="sA" x="380" y="38" width="76" height="40" rx="4"/>
<text class="sT" x="418" y="63" text-anchor="middle">4</text>
<text class="sC" x="418" y="94" text-anchor="middle">@1012</text>
<text class="sM" x="418" y="33" text-anchor="middle">[3]</text>
<rect class="sA" x="460" y="38" width="76" height="40" rx="4"/>
<text class="sT" x="498" y="63" text-anchor="middle">1</text>
<text class="sC" x="498" y="94" text-anchor="middle">@1016</text>
<text class="sM" x="498" y="33" text-anchor="middle">[4]</text>
<text class="sM" x="20" y="63">a</text>
<text class="sGt" x="20" y="118">address of a[i] = 1000 + i × 4: one multiplication, so index access is O(1)</text>
<text class="sT" x="20" y="150">Linked list: nodes anywhere, each pointing to the next</text>
<rect class="sB" x="30" y="190" width="56" height="30" rx="4"/>
<text class="sT" x="58" y="210" text-anchor="middle">7</text>
<rect class="sB" x="86" y="190" width="34" height="30" rx="4"/>
<circle class="sFm" cx="103" cy="205" r="3"/>
<text class="sC" x="75" y="184" text-anchor="middle">@2040</text>
<line class="sL" x1="106" y1="205" x2="207" y2="237" marker-end="url(#ah)"/>
<rect class="sB" x="210" y="222" width="56" height="30" rx="4"/>
<text class="sT" x="238" y="242" text-anchor="middle">3</text>
<rect class="sB" x="266" y="222" width="34" height="30" rx="4"/>
<circle class="sFm" cx="283" cy="237" r="3"/>
<text class="sC" x="255" y="216" text-anchor="middle">@5120</text>
<line class="sL" x1="286" y1="237" x2="387" y2="191" marker-end="url(#ah)"/>
<rect class="sB" x="390" y="176" width="56" height="30" rx="4"/>
<text class="sT" x="418" y="196" text-anchor="middle">9</text>
<rect class="sB" x="446" y="176" width="34" height="30" rx="4"/>
<circle class="sFm" cx="463" cy="191" r="3"/>
<text class="sC" x="435" y="170" text-anchor="middle">@1380</text>
<line class="sL" x1="466" y1="191" x2="557" y2="229" marker-end="url(#ah)"/>
<rect class="sB" x="560" y="214" width="56" height="30" rx="4"/>
<text class="sT" x="588" y="234" text-anchor="middle">4</text>
<rect class="sB" x="616" y="214" width="34" height="30" rx="4"/>
<circle class="sFm" cx="633" cy="229" r="3"/>
<text class="sC" x="605" y="208" text-anchor="middle">@7200</text>
<text class="sM" x="672" y="234" text-anchor="middle">null</text>
<text class="sWt" x="20" y="280">reaching the 4th item means following 3 pointers: O(n), and every hop may miss the CPU cache</text>
</svg><figcaption>Why arrays have O(1) indexing and linked lists don't. Walking an array is also far friendlier to the CPU cache, so arrays usually win in practice even when both are O(n).</figcaption></figure>

Big-O hides one practical detail: CPUs fetch memory in 64-byte **cache lines**, so scanning an array reads many neighbours for free, while each linked-list hop may wait for memory. That is why `List<T>` beats `LinkedList<T>` for nearly everything.

### Values and references

In C#, `int`, `double`, `bool` and `struct`s are **value types**: assigning one copies the data. Classes, arrays, `List<T>` and `string` are **reference types**: the variable holds a reference (an address), so assigning it copies the address and both names see the same object. JavaScript objects and arrays behave the same way, and in Python every name is a reference.

```csharp
int x = 5;  int y = x;  y++;                         // x is still 5: the value was copied
var a = new List<int> { 1 };  var b = a;  b.Add(2);  // a is now [1, 2]: one list, two names
```

This is why a function that changes an array it was given changes the caller's array too. More in [[B1]].

### How a hash table gets O(1)

<figure class="dia steps"><svg viewBox="0 0 720 250" role="img" aria-label="Hash table: keys are hashed to bucket numbers; a collision is chained; a lookup hashes the key and compares along one short chain">
<text class="sM" x="20" y="22">key</text>
<rect class="sB" x="130" y="30" width="250" height="60" rx="8"/>
<text class="sT" x="255" y="54" text-anchor="middle">bucket = hash(key) mod 8</text>
<text class="sC" x="255" y="74" text-anchor="middle">(hash values made up for the example)</text>
<rect class="sB" x="440" y="24" width="46" height="23" rx="3"/>
<text class="sM" x="430" y="40" text-anchor="end">0</text>
<rect class="sB" x="440" y="51" width="46" height="23" rx="3"/>
<text class="sM" x="430" y="67" text-anchor="end">1</text>
<rect class="sB" x="440" y="78" width="46" height="23" rx="3"/>
<text class="sM" x="430" y="94" text-anchor="end">2</text>
<rect class="sB" x="440" y="105" width="46" height="23" rx="3"/>
<text class="sM" x="430" y="121" text-anchor="end">3</text>
<rect class="sB" x="440" y="132" width="46" height="23" rx="3"/>
<text class="sM" x="430" y="148" text-anchor="end">4</text>
<rect class="sB" x="440" y="159" width="46" height="23" rx="3"/>
<text class="sM" x="430" y="175" text-anchor="end">5</text>
<rect class="sB" x="440" y="186" width="46" height="23" rx="3"/>
<text class="sM" x="430" y="202" text-anchor="end">6</text>
<rect class="sB" x="440" y="213" width="46" height="23" rx="3"/>
<text class="sM" x="430" y="229" text-anchor="end">7</text>
<g data-s="1-1"><rect class="sV" x="20" y="30" width="90" height="26" rx="13"/><text class="sC" x="65" y="48" text-anchor="middle">"cairo"</text><text class="sM" x="255" y="112" text-anchor="middle">hash = 241 → 241 mod 8 = 1</text><line class="sL" x1="380" y1="60" x2="436" y2="62" marker-end="url(#ah)"/></g>
<g data-s="2-2"><rect class="sV" x="20" y="30" width="90" height="26" rx="13"/><text class="sC" x="65" y="48" text-anchor="middle">"giza"</text><text class="sM" x="255" y="112" text-anchor="middle">hash = 1053 → 1053 mod 8 = 5</text><line class="sL" x1="380" y1="60" x2="436" y2="170" marker-end="url(#ah)"/></g>
<g data-s="3-3"><rect class="sV" x="20" y="30" width="90" height="26" rx="13"/><text class="sC" x="65" y="48" text-anchor="middle">"luxor"</text><text class="sM" x="255" y="112" text-anchor="middle">hash = 97 → 97 mod 8 = 1</text><line class="sL" x1="380" y1="60" x2="436" y2="62" marker-end="url(#ah)"/></g>
<g data-s="1"><rect class="sA" x="510" y="51" width="86" height="23" rx="3"/><text class="sC" x="553" y="67" text-anchor="middle">cairo</text><line class="sLm" x1="486" y1="62" x2="508" y2="62"/></g>
<g data-s="2"><rect class="sA" x="510" y="159" width="86" height="23" rx="3"/><text class="sC" x="553" y="175" text-anchor="middle">giza</text><line class="sLm" x1="486" y1="170" x2="508" y2="170"/></g>
<g data-s="3"><rect class="sW" x="616" y="51" width="86" height="23" rx="3"/><text class="sC" x="659" y="67" text-anchor="middle">luxor</text><line class="sLm" x1="596" y1="62" x2="614" y2="62" marker-end="url(#ahm)"/></g>
<g data-s="3-3"><text class="sWt" x="255" y="140" text-anchor="middle">collision: bucket 1 is taken, so chain it</text></g>
<g data-s="4-4"><rect class="sG" x="20" y="30" width="90" height="26" rx="13"/><text class="sC" x="65" y="48" text-anchor="middle">find "luxor"</text><text class="sM" x="255" y="112" text-anchor="middle">hash = 97 → bucket 1</text><line class="sLg" x1="380" y1="60" x2="436" y2="62" marker-end="url(#ahg)"/><text class="sRt" x="553" y="47" text-anchor="middle">≠</text><text class="sGt" x="659" y="47" text-anchor="middle">= ✓</text><text class="sGt" x="255" y="140" text-anchor="middle">compare keys along one short chain</text></g>
<g data-s="5"><text class="sS" x="20" y="176">load factor = 3 keys / 8 buckets = 0.375</text><text class="sS" x="20" y="196">Past a threshold (about 0.75) the table doubles</text><text class="sS" x="20" y="214">and re-inserts every key. That is rare, so</text><text class="sS" x="20" y="232">inserts stay O(1) on average (amortised).</text></g>
</svg><ol class="dia-steps">
<li>Insert "cairo": hash the key to a big number, then take it modulo the number of buckets. It lands in bucket 1.</li>
<li>Insert "giza": a different hash, bucket 5. No searching was needed for either insert.</li>
<li>Insert "luxor": it also maps to bucket 1, a <b>collision</b>. This table keeps a small chain (list) per bucket.</li>
<li>Look up "luxor": hash it again, jump straight to bucket 1, and compare keys along that one chain. With a good hash function chains stay short, so lookups are O(1) on average.</li>
<li>As the table fills, chains would grow. So when the load factor passes a threshold, the table doubles and re-inserts everything. This is the same amortised O(1) trick as a growing <code>List&lt;T&gt;</code>.</li>
</ol><figcaption>How a hash table reaches O(1). C#'s <code>Dictionary</code> chains entries like this; Python's <code>dict</code> probes for the next free slot instead. The idea is the same.</figcaption></figure>

> [!mistake] Changing a key after inserting it
> A hash table finds an item by re-hashing its key. If you mutate an object that's already a key (or a member of a `HashSet`), its hash changes and the table looks in the wrong bucket: the item is "lost" while still inside. Use immutable keys such as strings, numbers or records.

### The call stack

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 240" role="img" aria-label="The call stack during Fact(3): frames are pushed for Fact(3), Fact(2), Fact(1), then popped as each returns">
<text class="sM" x="20" y="40">int Fact(int n) =&gt;</text>
<text class="sM" x="36" y="60">n &lt;= 1 ? 1 : n * Fact(n - 1);</text>
<text class="sM" x="20" y="100">var result = Fact(3);</text>
<line class="sLm" x1="700" y1="215" x2="700" y2="50" marker-end="url(#ahm)"/>
<text class="sC" x="692" y="232" text-anchor="end">stack grows ↑</text>
<rect class="sB" x="420" y="176" width="260" height="36" rx="6"/><text class="sT" x="432" y="199">Main</text>
<g data-s="1-5"><rect class="sA" x="420" y="136" width="260" height="36" rx="6"/><text class="sT" x="432" y="159">Fact(3)</text></g>
<g data-s="2-4"><rect class="sA" x="420" y="96" width="260" height="36" rx="6"/><text class="sT" x="432" y="119">Fact(2)</text></g>
<g data-s="3-3"><rect class="sG" x="420" y="56" width="260" height="36" rx="6"/><text class="sT" x="432" y="79">Fact(1)</text><text class="sGt" x="668" y="79" text-anchor="end">base case → 1</text></g>
<g data-s="1-4"><text class="sC" x="668" y="159" text-anchor="end">n = 3, waiting…</text></g>
<g data-s="5-5"><text class="sGt" x="668" y="159" text-anchor="end">3 × 2 = 6 ↩</text></g>
<g data-s="2-3"><text class="sC" x="668" y="119" text-anchor="end">n = 2, waiting…</text></g>
<g data-s="4-4"><text class="sGt" x="668" y="119" text-anchor="end">2 × 1 = 2 ↩</text></g>
<g data-s="1-5"><text class="sC" x="668" y="199" text-anchor="end">result = ?</text></g>
<g data-s="6-6"><text class="sGt" x="668" y="199" text-anchor="end">result = 6</text></g>
<g data-s="6"><text class="sS" x="20" y="150">Deepest point: 3 frames, so O(n) stack space.</text><text class="sRt" x="20" y="170">Fact(100000) would overflow the stack.</text></g>
</svg><ol class="dia-steps">
<li><code>Main</code> calls <code>Fact(3)</code>. A new <b>frame</b> holding <code>n = 3</code> is pushed; it can't finish until <code>Fact(2)</code> answers.</li>
<li><code>Fact(3)</code> calls <code>Fact(2)</code>: another frame on top, with its own <code>n = 2</code>.</li>
<li><code>Fact(1)</code> hits the base case and returns 1 without calling anything.</li>
<li>Its frame is popped. <code>Fact(2)</code> resumes where it stopped and returns 2 × 1 = 2.</li>
<li><code>Fact(3)</code> resumes and returns 3 × 2 = 6.</li>
<li>Back in <code>Main</code>, <code>result</code> is 6. The stack was 3 frames deep at most: recursion costs O(depth) memory even when it stores nothing else.</li>
</ol><figcaption>The call stack. Every call pushes a frame with its own parameters and locals; every return pops one.</figcaption></figure>

Deep recursion runs out of stack: about 1 MB per thread by default for .NET on Windows, where a `StackOverflowException` ends the process and can't be caught; JavaScript throws `RangeError: Maximum call stack size exceeded`; Python stops at a recursion limit of 1,000 by default. For inputs that can be deep (a long linked list, a huge grid), use a loop with an explicit `Stack<T>`.

## S4.1 How to run a live coding interview 🟢 ⭐

The interviewer is scoring **communication and process** as much as the answer. Use the same six steps every time:

1. **Restate and clarify.** "So I get an array of integers and a target, and return the two indices. Can there be duplicates? Exactly one answer? Can I use the same element twice?"
2. **Examples.** Walk one normal case and one edge case (empty input, one element, all equal, negative numbers).
3. **Brute force first, out loud.** "The simple way is to check every pair, O(n²). Let me improve that."
4. **Better approach.** Name the pattern ("I'll trade memory for time with a hash map"), and agree on it before typing.
5. **Code it cleanly.** Good names, small helper functions, no clever one-liners.
6. **Test and analyse.** Trace your example by hand, run the edge cases, state time and space complexity.

> [!say]
> "Let me make sure I understand the problem... The brute force is to compare every pair, which is O(n squared). I can do better by remembering what I've seen in a hash map, which makes it a single pass, O(n) time and O(n) space. Shall I go with that?"

> [!story]
> At ITI you worked through DSA labs and Codeforces problems, and CS Visualizer is literally a tool that visualises algorithms step by step. Mention it: "I built a C# interpreter that animates code execution, so I've thought hard about how algorithms move through memory."

## S4.2 Big-O in plain words 🟢 ⭐

> [!term] Big-O notation
> How the running time or memory of an algorithm **grows** as the input size *n* grows, ignoring constants and smaller terms. It describes the worst case unless you say otherwise.

| Big-O | Name | Example | n = 1,000,000 → roughly |
|---|---|---|---|
| O(1) | Constant | Hash map lookup, array index | 1 step |
| O(log n) | Logarithmic | Binary search, balanced tree lookup | 20 steps |
| O(n) | Linear | One pass over an array | 10⁶ |
| O(n log n) | Linearithmic | Good sorting algorithms | 2 × 10⁷ |
| O(n²) | Quadratic | Nested loops over the same data | 10¹² (too slow) |
| O(2ⁿ) | Exponential | All subsets, naive recursion | impossible |

<figure class="dia"><svg viewBox="0 0 720 280" role="img" aria-label="Growth of 1, log n, n, n log n and n squared steps for n up to 20">
<line class="sLm" x1="70" y1="250" x2="640" y2="250" marker-end="url(#ahm)"/>
<line class="sLm" x1="70" y1="250" x2="70" y2="16" marker-end="url(#ahm)"/>
<line class="sD" x1="70" y1="195.0" x2="630" y2="195.0" opacity=".5"/>
<text class="sC" x="62" y="199" text-anchor="end">50</text>
<line class="sD" x1="70" y1="140.0" x2="630" y2="140.0" opacity=".5"/>
<text class="sC" x="62" y="144" text-anchor="end">100</text>
<line class="sD" x1="70" y1="85.0" x2="630" y2="85.0" opacity=".5"/>
<text class="sC" x="62" y="89" text-anchor="end">150</text>
<line class="sD" x1="70" y1="30.0" x2="630" y2="30.0" opacity=".5"/>
<text class="sC" x="62" y="34" text-anchor="end">200</text>
<text class="sC" x="210" y="268" text-anchor="middle">5</text>
<text class="sC" x="350" y="268" text-anchor="middle">10</text>
<text class="sC" x="490" y="268" text-anchor="middle">15</text>
<text class="sC" x="630" y="268" text-anchor="middle">20</text>
<text class="sM" x="644" y="254">n</text>
<text class="sM" x="62" y="18">steps</text>
<polyline class="sLr" points="98.0,248.9 105.0,248.3 112.0,247.5 119.0,246.6 126.0,245.6 133.0,244.4 140.0,243.1 147.0,241.7 154.0,240.1 161.0,238.4 168.0,236.5 175.0,234.5 182.0,232.4 189.0,230.1 196.0,227.7 203.0,225.2 210.0,222.5 217.0,219.7 224.0,216.7 231.0,213.6 238.0,210.4 245.0,207.0 252.0,203.5 259.0,199.9 266.0,196.1 273.0,192.2 280.0,188.1 287.0,183.9 294.0,179.6 301.0,175.1 308.0,170.5 315.0,165.8 322.0,160.9 329.0,155.9 336.0,150.7 343.0,145.4 350.0,140.0 357.0,134.4 364.0,128.7 371.0,122.9 378.0,116.9 385.0,110.8 392.0,104.5 399.0,98.1 406.0,91.6 413.0,84.9 420.0,78.1 427.0,71.2 434.0,64.1 441.0,56.9 448.0,49.5 455.0,42.0 462.0,34.4 469.0,26.6 476.0,18.7 483.0,12.4"/>
<line class="sLr" x1="100" y1="36" x2="130" y2="36"/>
<text class="sRt" x="138" y="40">O(n²)</text>
<polyline class="sLw" points="98.0,250.0 105.0,249.6 112.0,249.0 119.0,248.4 126.0,247.8 133.0,247.1 140.0,246.4 147.0,245.6 154.0,244.8 161.0,243.9 168.0,243.0 175.0,242.1 182.0,241.2 189.0,240.2 196.0,239.3 203.0,238.3 210.0,237.2 217.0,236.2 224.0,235.1 231.0,234.0 238.0,232.9 245.0,231.8 252.0,230.7 259.0,229.5 266.0,228.4 273.0,227.2 280.0,226.0 287.0,224.8 294.0,223.6 301.0,222.4 308.0,221.1 315.0,219.9 322.0,218.6 329.0,217.3 336.0,216.1 343.0,214.8 350.0,213.5 357.0,212.1 364.0,210.8 371.0,209.5 378.0,208.1 385.0,206.8 392.0,205.4 399.0,204.1 406.0,202.7 413.0,201.3 420.0,199.9 427.0,198.5 434.0,197.1 441.0,195.7 448.0,194.2 455.0,192.8 462.0,191.4 469.0,189.9 476.0,188.5 483.0,187.0 490.0,185.5 497.0,184.1 504.0,182.6 511.0,181.1 518.0,179.6 525.0,178.1 532.0,176.6 539.0,175.1 546.0,173.6 553.0,172.0 560.0,170.5 567.0,169.0 574.0,167.4 581.0,165.9 588.0,164.3 595.0,162.8 602.0,161.2 609.0,159.7 616.0,158.1 623.0,156.5 630.0,154.9"/>
<line class="sLw" x1="100" y1="56" x2="130" y2="56"/>
<text class="sWt" x="138" y="60">O(n log n)</text>
<polyline class="sL" points="98.0,248.9 105.0,248.6 112.0,248.3 119.0,248.1 126.0,247.8 133.0,247.5 140.0,247.2 147.0,247.0 154.0,246.7 161.0,246.4 168.0,246.2 175.0,245.9 182.0,245.6 189.0,245.3 196.0,245.1 203.0,244.8 210.0,244.5 217.0,244.2 224.0,243.9 231.0,243.7 238.0,243.4 245.0,243.1 252.0,242.8 259.0,242.6 266.0,242.3 273.0,242.0 280.0,241.8 287.0,241.5 294.0,241.2 301.0,240.9 308.0,240.7 315.0,240.4 322.0,240.1 329.0,239.8 336.0,239.6 343.0,239.3 350.0,239.0 357.0,238.7 364.0,238.4 371.0,238.2 378.0,237.9 385.0,237.6 392.0,237.3 399.0,237.1 406.0,236.8 413.0,236.5 420.0,236.2 427.0,236.0 434.0,235.7 441.0,235.4 448.0,235.2 455.0,234.9 462.0,234.6 469.0,234.3 476.0,234.1 483.0,233.8 490.0,233.5 497.0,233.2 504.0,232.9 511.0,232.7 518.0,232.4 525.0,232.1 532.0,231.8 539.0,231.6 546.0,231.3 553.0,231.0 560.0,230.8 567.0,230.5 574.0,230.2 581.0,229.9 588.0,229.7 595.0,229.4 602.0,229.1 609.0,228.8 616.0,228.6 623.0,228.3 630.0,228.0"/>
<line class="sL" x1="100" y1="76" x2="130" y2="76"/>
<text class="sM" x="138" y="80">O(n)</text>
<polyline class="sLg" points="98.0,250.0 105.0,249.6 112.0,249.4 119.0,249.1 126.0,248.9 133.0,248.7 140.0,248.5 147.0,248.4 154.0,248.3 161.0,248.1 168.0,248.0 175.0,247.9 182.0,247.8 189.0,247.7 196.0,247.6 203.0,247.5 210.0,247.4 217.0,247.4 224.0,247.3 231.0,247.2 238.0,247.2 245.0,247.1 252.0,247.0 259.0,247.0 266.0,246.9 273.0,246.9 280.0,246.8 287.0,246.8 294.0,246.7 301.0,246.7 308.0,246.6 315.0,246.6 322.0,246.5 329.0,246.5 336.0,246.4 343.0,246.4 350.0,246.3 357.0,246.3 364.0,246.3 371.0,246.2 378.0,246.2 385.0,246.2 392.0,246.1 399.0,246.1 406.0,246.1 413.0,246.0 420.0,246.0 427.0,246.0 434.0,245.9 441.0,245.9 448.0,245.9 455.0,245.8 462.0,245.8 469.0,245.8 476.0,245.8 483.0,245.7 490.0,245.7 497.0,245.7 504.0,245.7 511.0,245.6 518.0,245.6 525.0,245.6 532.0,245.6 539.0,245.5 546.0,245.5 553.0,245.5 560.0,245.5 567.0,245.4 574.0,245.4 581.0,245.4 588.0,245.4 595.0,245.3 602.0,245.3 609.0,245.3 616.0,245.3 623.0,245.3 630.0,245.2"/>
<line class="sLg" x1="100" y1="96" x2="130" y2="96"/>
<text class="sGt" x="138" y="100">O(log n)</text>
<polyline class="sLm" points="98.0,248.9 105.0,248.9 112.0,248.9 119.0,248.9 126.0,248.9 133.0,248.9 140.0,248.9 147.0,248.9 154.0,248.9 161.0,248.9 168.0,248.9 175.0,248.9 182.0,248.9 189.0,248.9 196.0,248.9 203.0,248.9 210.0,248.9 217.0,248.9 224.0,248.9 231.0,248.9 238.0,248.9 245.0,248.9 252.0,248.9 259.0,248.9 266.0,248.9 273.0,248.9 280.0,248.9 287.0,248.9 294.0,248.9 301.0,248.9 308.0,248.9 315.0,248.9 322.0,248.9 329.0,248.9 336.0,248.9 343.0,248.9 350.0,248.9 357.0,248.9 364.0,248.9 371.0,248.9 378.0,248.9 385.0,248.9 392.0,248.9 399.0,248.9 406.0,248.9 413.0,248.9 420.0,248.9 427.0,248.9 434.0,248.9 441.0,248.9 448.0,248.9 455.0,248.9 462.0,248.9 469.0,248.9 476.0,248.9 483.0,248.9 490.0,248.9 497.0,248.9 504.0,248.9 511.0,248.9 518.0,248.9 525.0,248.9 532.0,248.9 539.0,248.9 546.0,248.9 553.0,248.9 560.0,248.9 567.0,248.9 574.0,248.9 581.0,248.9 588.0,248.9 595.0,248.9 602.0,248.9 609.0,248.9 616.0,248.9 623.0,248.9 630.0,248.9"/>
<line class="sLm" x1="100" y1="116" x2="130" y2="116"/>
<text class="sC" x="138" y="120">O(1)</text>
</svg><figcaption>How the classes grow. At n = 20 they are already 1, about 4, 20, about 86 and 400 steps; at n = 10⁶ the gap is the difference between instant and never.</figcaption></figure>

**Rules of thumb:** sequential steps add (O(n) + O(n) = O(n)); nested loops multiply; halving the problem each step gives log n; recursion's cost is calls × work per call. A typical judge does very roughly 10⁸ simple operations per second, so for n = 10⁵ you need O(n log n) or better.

**Space complexity** counts extra memory: a hash map of n items is O(n); recursion uses O(depth) stack space.

> [!term] Amortised O(1)
> An operation that is occasionally expensive but cheap on average. Appending to `List<T>` or a JavaScript array sometimes copies everything into a bigger buffer, but because capacity doubles, the average cost per append is constant.

## S4.3 Know your collections 🟢 ⭐

| Need | C# | JavaScript | Python | Lookup | Insert / remove |
|---|---|---|---|---|---|
| Indexed sequence | `T[]`, `List<T>` | `Array` | `list` | O(1) by index | O(1) at end, O(n) in the middle |
| Key → value | `Dictionary<K,V>` | `Map` (or object) | `dict` | O(1) average | O(1) average |
| Unique items | `HashSet<T>` | `Set` | `set` | O(1) average | O(1) average |
| Sorted keys | `SortedDictionary`, `SortedSet` (red-black tree) | — (sort, or a library) | `sortedcontainers` (third-party) | O(log n) | O(log n) |
| LIFO stack | `Stack<T>` | `Array` with `push`/`pop` | `list` with `append`/`pop` | top O(1) | O(1) |
| FIFO queue | `Queue<T>` | Array with an index pointer (`shift()` is O(n)) | `collections.deque` | front O(1) | O(1) |
| Min or max first | `PriorityQueue<TElement,TPriority>` (.NET 6+, a min-heap) | — (write a small heap) | `heapq` (min-heap) | peek O(1) | O(log n) |
| Linked list | `LinkedList<T>` | — | `deque` | O(n) to find | O(1) at a known node |

> [!mistake] Hidden O(n) operations
> `list.Contains(x)` on a `List<T>`, `array.includes(x)` and `x in my_list` are all O(n). Inside a loop they make your "linear" solution quadratic. Use a `HashSet`, `Set` or `set` for membership tests. Likewise `array.shift()` in JavaScript and `list.pop(0)` in Python are O(n).

<figure class="dia"><svg viewBox="0 0 720 254" role="img" aria-label="Time for one membership test of a missing value, measured in Python: for a list it grows linearly from well under a microsecond at 100 items to several milliseconds at a million, while for a set it stays around tens of nanoseconds; a million such lookups would take over an hour with a list and a few hundredths of a second with a set">
<line class="sLm" x1="80" y1="210" x2="480" y2="210"/><line class="sLm" x1="80" y1="210" x2="80" y2="30"/>
<text class="sS" x="80" y="226" text-anchor="middle">100</text>
<text class="sS" x="180" y="226" text-anchor="middle">1,000</text>
<text class="sS" x="280" y="226" text-anchor="middle">10,000</text>
<text class="sS" x="380" y="226" text-anchor="middle">100,000</text>
<text class="sS" x="480" y="226" text-anchor="middle">1,000,000</text>
<text class="sS" x="72" y="184" text-anchor="end">100 ns</text><line class="sLm" x1="80" y1="180" x2="480" y2="180" opacity=".12"/>
<text class="sS" x="72" y="154" text-anchor="end">1 µs</text><line class="sLm" x1="80" y1="150" x2="480" y2="150" opacity=".12"/>
<text class="sS" x="72" y="124" text-anchor="end">10 µs</text><line class="sLm" x1="80" y1="120" x2="480" y2="120" opacity=".12"/>
<text class="sS" x="72" y="94" text-anchor="end">100 µs</text><line class="sLm" x1="80" y1="90" x2="480" y2="90" opacity=".12"/>
<text class="sS" x="72" y="64" text-anchor="end">1 ms</text><line class="sLm" x1="80" y1="60" x2="480" y2="60" opacity=".12"/>
<text class="sS" x="72" y="34" text-anchor="end">10 ms</text><line class="sLm" x1="80" y1="30" x2="480" y2="30" opacity=".12"/>
<text class="sS" x="280" y="244" text-anchor="middle">items in the collection (log scale)</text>
<polyline class="sLr" points="80.0,163.7 180.0,134.6 280.0,104.8 380.0,74.7 480.0,41.0" style="fill:none;stroke-width:2.4"/>
<circle class="sPr" cx="80.0" cy="163.7" r="3.5"/>
<circle class="sPr" cx="180.0" cy="134.6" r="3.5"/>
<circle class="sPr" cx="280.0" cy="104.8" r="3.5"/>
<circle class="sPr" cx="380.0" cy="74.7" r="3.5"/>
<circle class="sPr" cx="480.0" cy="41.0" r="3.5"/>
<polyline class="sLg" points="80.0,196.2 180.0,196.3 280.0,196.4 380.0,196.1 480.0,196.2" style="fill:none;stroke-width:2.4"/>
<circle class="sPg" cx="80.0" cy="196.2" r="3.5"/>
<circle class="sPg" cx="180.0" cy="196.3" r="3.5"/>
<circle class="sPg" cx="280.0" cy="196.4" r="3.5"/>
<circle class="sPg" cx="380.0" cy="196.1" r="3.5"/>
<circle class="sPg" cx="480.0" cy="196.2" r="3.5"/>
<text class="sRt" x="474" y="31.0135" text-anchor="end">list: 4.3 ms per lookup</text><text class="sGt" x="474" y="186.193" text-anchor="end">set: 29 ns</text>
<rect class="sN" x="500" y="30" width="206" height="180" rx="8"/><text class="sT" x="603" y="52" text-anchor="middle">inside a loop over n items</text>
<text class="sS" x="603" y="80" text-anchor="middle">n = 1,000,000 lookups:</text><text class="sRt" x="603" y="104" text-anchor="middle">list ≈ 72 minutes</text><text class="sGt" x="603" y="124" text-anchor="middle">set ≈ 29 ms</text>
<text class="sS" x="603" y="156" text-anchor="middle">O(n) per lookup makes the</text><text class="sS" x="603" y="172" text-anchor="middle">whole loop O(n²)</text>
</svg><figcaption>The hidden O(n), measured with timeit (worst case: the value is absent).</figcaption></figure>

> [!note] Sorting stability
> A **stable** sort keeps equal items in their original order. JavaScript's `Array.prototype.sort` (since ES2019), Python's `sorted` and LINQ's `OrderBy` are stable. C#'s `Array.Sort` and `List<T>.Sort` use introsort, which is **not** stable.

## S4.4 Pattern 1 — Hash map: remember what you've seen 🟢 ⭐

**Signal:** "find a pair", "count occurrences", "first duplicate", "group by some key".

```csharp
// Two Sum: indices of the two numbers that add up to target. O(n) time, O(n) space.
int[] TwoSum(int[] nums, int target)
{
    var seen = new Dictionary<int, int>();            // value → index
    for (int i = 0; i < nums.Length; i++)
    {
        if (seen.TryGetValue(target - nums[i], out int j)) return new[] { j, i };
        seen[nums[i]] = i;
    }
        return Array.Empty<int>();
}
```

<figure class="dia steps"><svg viewBox="0 0 720 230" role="img" aria-label="Two Sum traced on 3, 8, 11, 4, 7 with target 15: each number computes the complement it needs and checks the dictionary of values seen so far; 3, 8 and 11 are added; at 4 the complement 11 is found at index 2, so the answer is indices 2 and 3">
<text class="sS" x="50" y="52" text-anchor="end">nums</text><text class="sT" x="215" y="22" text-anchor="middle">target = 15</text>
<rect class="sN" x="60" y="34" width="56" height="30" rx="5"/><text class="sT" x="88" y="54" text-anchor="middle">3</text><text class="sS" x="88" y="78" text-anchor="middle">[0]</text>
<rect class="sN" x="122" y="34" width="56" height="30" rx="5"/><text class="sT" x="150" y="54" text-anchor="middle">8</text><text class="sS" x="150" y="78" text-anchor="middle">[1]</text>
<rect class="sN" x="184" y="34" width="56" height="30" rx="5"/><text class="sT" x="212" y="54" text-anchor="middle">11</text><text class="sS" x="212" y="78" text-anchor="middle">[2]</text>
<rect class="sN" x="246" y="34" width="56" height="30" rx="5"/><text class="sT" x="274" y="54" text-anchor="middle">4</text><text class="sS" x="274" y="78" text-anchor="middle">[3]</text>
<rect class="sN" x="308" y="34" width="56" height="30" rx="5"/><text class="sT" x="336" y="54" text-anchor="middle">7</text><text class="sS" x="336" y="78" text-anchor="middle">[4]</text>
<rect class="sN" x="420" y="30" width="286" height="190" rx="8"/><text class="sT" x="563" y="50" text-anchor="middle">seen: value → index</text>
<g data-s="1-1"><rect class="sA" x="58" y="32" width="60" height="34" rx="6" style="fill:none;stroke-width:2.5"/><text class="sWt" x="88" y="100" text-anchor="middle">↑ i</text><text class="sS" x="20" y="134" xml:space="preserve" style="white-space:pre">need = 15 − 3 = 12</text><text class="sS" x="20" y="158" xml:space="preserve" style="white-space:pre">12 not in seen → add 3 → 0</text><text class="sS" x="200" y="196" text-anchor="middle">one pass, one lookup per element: O(n)</text><rect class="sW" x="440" y="64" width="246" height="26" rx="5"/><text class="sT" x="500" y="82" text-anchor="middle">3</text><text class="sS" x="563" y="82" text-anchor="middle">→</text><text class="sT" x="626" y="82" text-anchor="middle">0</text><text class="sWt" x="563" y="108" text-anchor="middle">added</text></g>
<g data-s="2-2"><rect class="sA" x="120" y="32" width="60" height="34" rx="6" style="fill:none;stroke-width:2.5"/><text class="sWt" x="150" y="100" text-anchor="middle">↑ i</text><text class="sS" x="20" y="134" xml:space="preserve" style="white-space:pre">need = 15 − 8 = 7</text><rect class="sB" x="440" y="64" width="246" height="26" rx="5" opacity=".55"/><text class="sT" x="500" y="82" text-anchor="middle">3</text><text class="sS" x="563" y="82" text-anchor="middle">→</text><text class="sT" x="626" y="82" text-anchor="middle">0</text><text class="sS" x="20" y="158" xml:space="preserve" style="white-space:pre">7 not in seen → add 8 → 1</text><text class="sS" x="200" y="196" text-anchor="middle">one pass, one lookup per element: O(n)</text><rect class="sW" x="440" y="94" width="246" height="26" rx="5"/><text class="sT" x="500" y="112" text-anchor="middle">8</text><text class="sS" x="563" y="112" text-anchor="middle">→</text><text class="sT" x="626" y="112" text-anchor="middle">1</text><text class="sWt" x="563" y="138" text-anchor="middle">added</text></g>
<g data-s="3-3"><rect class="sA" x="182" y="32" width="60" height="34" rx="6" style="fill:none;stroke-width:2.5"/><text class="sWt" x="212" y="100" text-anchor="middle">↑ i</text><text class="sS" x="20" y="134" xml:space="preserve" style="white-space:pre">need = 15 − 11 = 4</text><rect class="sB" x="440" y="64" width="246" height="26" rx="5" opacity=".55"/><text class="sT" x="500" y="82" text-anchor="middle">3</text><text class="sS" x="563" y="82" text-anchor="middle">→</text><text class="sT" x="626" y="82" text-anchor="middle">0</text><rect class="sB" x="440" y="94" width="246" height="26" rx="5" opacity=".55"/><text class="sT" x="500" y="112" text-anchor="middle">8</text><text class="sS" x="563" y="112" text-anchor="middle">→</text><text class="sT" x="626" y="112" text-anchor="middle">1</text><text class="sS" x="20" y="158" xml:space="preserve" style="white-space:pre">4 not in seen → add 11 → 2</text><text class="sS" x="200" y="196" text-anchor="middle">one pass, one lookup per element: O(n)</text><rect class="sW" x="440" y="124" width="246" height="26" rx="5"/><text class="sT" x="500" y="142" text-anchor="middle">11</text><text class="sS" x="563" y="142" text-anchor="middle">→</text><text class="sT" x="626" y="142" text-anchor="middle">2</text><text class="sWt" x="563" y="168" text-anchor="middle">added</text></g>
<g data-s="4-4"><rect class="sA" x="244" y="32" width="60" height="34" rx="6" style="fill:none;stroke-width:2.5"/><text class="sWt" x="274" y="100" text-anchor="middle">↑ i</text><text class="sS" x="20" y="134" xml:space="preserve" style="white-space:pre">need = 15 − 4 = 11</text><rect class="sB" x="440" y="64" width="246" height="26" rx="5" opacity=".55"/><text class="sT" x="500" y="82" text-anchor="middle">3</text><text class="sS" x="563" y="82" text-anchor="middle">→</text><text class="sT" x="626" y="82" text-anchor="middle">0</text><rect class="sB" x="440" y="94" width="246" height="26" rx="5" opacity=".55"/><text class="sT" x="500" y="112" text-anchor="middle">8</text><text class="sS" x="563" y="112" text-anchor="middle">→</text><text class="sT" x="626" y="112" text-anchor="middle">1</text><rect class="sG" x="440" y="124" width="246" height="26" rx="5"/><text class="sT" x="500" y="142" text-anchor="middle">11</text><text class="sS" x="563" y="142" text-anchor="middle">→</text><text class="sT" x="626" y="142" text-anchor="middle">2</text><text class="sGt" x="20" y="158" xml:space="preserve" style="white-space:pre">11 is in seen at index 2</text><text class="sGt" x="200" y="196" text-anchor="middle">return [2, 3]: 11 + 4 = 15</text></g>
</svg><ol class="dia-steps">
<li>i = 0: need 12. Not seen yet, so remember 3 at index 0.</li>
<li>i = 1: need 7. Not seen yet, so remember 8 at index 1.</li>
<li>i = 2: need 4. Not seen yet, so remember 11 at index 2.</li>
<li>i = 3: need 11. 11 was seen at index 2: answer [2, 3].</li>
</ol><figcaption>Two Sum, traced by running the algorithm: the dictionary remembers every value seen, so each complement check is O(1).</figcaption></figure>

```csharp
// Group anagrams: the sorted letters are the key.
IList<IList<string>> GroupAnagrams(string[] words) =>
    words.GroupBy(w => new string(w.OrderBy(c => c).ToArray()))
         .Select(g => (IList<string>)g.ToList()).ToList();
```

## S4.5 Pattern 2 — Two pointers 🟢 ⭐

**Signal:** a **sorted** array, or comparing from both ends, or removing items in place.

```csharp
// Is the string a palindrome, ignoring non-letters and case? O(n) time, O(1) space.
bool IsPalindrome(string s)
{
    int i = 0, j = s.Length - 1;
    while (i < j)
    {
        if (!char.IsLetterOrDigit(s[i])) { i++; continue; }
        if (!char.IsLetterOrDigit(s[j])) { j--; continue; }
        if (char.ToLowerInvariant(s[i]) != char.ToLowerInvariant(s[j])) return false;
        i++; j--;
    }
    return true;
}
```

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 180" role="img" aria-label="Two pointers on a sorted array closing in on a pair that sums to 10">
<rect class="sB" x="140" y="50" width="64" height="44" rx="6"/><text class="sX" x="172" y="78" text-anchor="middle">1</text><text class="sC" x="172" y="40" text-anchor="middle">0</text>
<rect class="sB" x="216" y="50" width="64" height="44" rx="6"/><text class="sX" x="248" y="78" text-anchor="middle">3</text><text class="sC" x="248" y="40" text-anchor="middle">1</text>
<rect class="sB" x="292" y="50" width="64" height="44" rx="6"/><text class="sX" x="324" y="78" text-anchor="middle">4</text><text class="sC" x="324" y="40" text-anchor="middle">2</text>
<rect class="sB" x="368" y="50" width="64" height="44" rx="6"/><text class="sX" x="400" y="78" text-anchor="middle">6</text><text class="sC" x="400" y="40" text-anchor="middle">3</text>
<rect class="sB" x="444" y="50" width="64" height="44" rx="6"/><text class="sX" x="476" y="78" text-anchor="middle">8</text><text class="sC" x="476" y="40" text-anchor="middle">4</text>
<rect class="sB" x="520" y="50" width="64" height="44" rx="6"/><text class="sX" x="552" y="78" text-anchor="middle">11</text><text class="sC" x="552" y="40" text-anchor="middle">5</text>
<text class="sM" x="20" y="78">target 10</text>
<g data-s="1-1"><path class="sFg" d="M172 100 l-8 12 h16z"/><text class="sGt" x="172" y="128" text-anchor="middle">i</text><path class="sFw" d="M552 100 l-8 12 h16z"/><text class="sWt" x="552" y="128" text-anchor="middle">j</text><text class="sS" x="360" y="160" text-anchor="middle">1 + 11 = 12 &gt; 10 → too big: move j left</text></g>
<g data-s="2-2"><path class="sFg" d="M172 100 l-8 12 h16z"/><text class="sGt" x="172" y="128" text-anchor="middle">i</text><path class="sFw" d="M476 100 l-8 12 h16z"/><text class="sWt" x="476" y="128" text-anchor="middle">j</text><text class="sS" x="360" y="160" text-anchor="middle">1 + 8 = 9 &lt; 10 → too small: move i right</text></g>
<g data-s="3-3"><path class="sFg" d="M248 100 l-8 12 h16z"/><text class="sGt" x="248" y="128" text-anchor="middle">i</text><path class="sFw" d="M476 100 l-8 12 h16z"/><text class="sWt" x="476" y="128" text-anchor="middle">j</text><text class="sS" x="360" y="160" text-anchor="middle">3 + 8 = 11 &gt; 10 → move j left</text></g>
<g data-s="4-4"><path class="sFg" d="M248 100 l-8 12 h16z"/><text class="sGt" x="248" y="128" text-anchor="middle">i</text><path class="sFw" d="M400 100 l-8 12 h16z"/><text class="sWt" x="400" y="128" text-anchor="middle">j</text><text class="sS" x="360" y="160" text-anchor="middle">3 + 6 = 9 &lt; 10 → move i right</text></g>
<g data-s="5-5"><path class="sFg" d="M324 100 l-8 12 h16z"/><text class="sGt" x="324" y="128" text-anchor="middle">i</text><path class="sFw" d="M400 100 l-8 12 h16z"/><text class="sWt" x="400" y="128" text-anchor="middle">j</text><text class="sGt" x="360" y="160" text-anchor="middle">4 + 6 = 10 ✓ found it</text></g>
</svg><ol class="dia-steps">
<li>Start with i at the smallest value and j at the largest. Their sum, 12, is too big, and the only way to shrink it is to move j left.</li>
<li>Now the sum, 9, is too small, so move i right to a bigger value.</li>
<li>11 is too big again: j moves left.</li>
<li>9 is too small: i moves right.</li>
<li>Exactly 10. Each step ruled out a whole row or column of pairs, so at most n steps instead of n² pairs: O(n) time, O(1) space.</li>
</ol><figcaption>Two pointers on sorted input. Sortedness tells you which pointer to move.</figcaption></figure>

Other classics: two-sum on a sorted array (move left up if the sum is too small, right down if too big), remove duplicates in place, container with most water, merging two sorted arrays.

## S4.6 Pattern 3 — Sliding window 🟡 ⭐

**Signal:** "longest/shortest **contiguous** subarray or substring such that…".

Grow the window with the right pointer; when it breaks the rule, shrink from the left.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 175" role="img" aria-label="Sliding window over abcabcbb finding the longest substring without repeats">
<text class="sC" x="136" y="36" text-anchor="middle">0</text>
<text class="sC" x="200" y="36" text-anchor="middle">1</text>
<text class="sC" x="264" y="36" text-anchor="middle">2</text>
<text class="sC" x="328" y="36" text-anchor="middle">3</text>
<text class="sC" x="392" y="36" text-anchor="middle">4</text>
<text class="sC" x="456" y="36" text-anchor="middle">5</text>
<text class="sC" x="520" y="36" text-anchor="middle">6</text>
<text class="sC" x="584" y="36" text-anchor="middle">7</text>
<g data-s="1-1"><rect class="sA" x="105" y="44" width="62" height="54" rx="8"/><text class="sS" x="360" y="132" text-anchor="middle">right = 0: 'a' is new → the window grows</text><text class="sM" x="360" y="156" text-anchor="middle">window "a", length 1, best so far 1</text></g>
<g data-s="2-2"><rect class="sA" x="105" y="44" width="126" height="54" rx="8"/><text class="sS" x="360" y="132" text-anchor="middle">right = 1: 'b' is new → the window grows</text><text class="sM" x="360" y="156" text-anchor="middle">window "ab", length 2, best so far 2</text></g>
<g data-s="3-3"><rect class="sA" x="105" y="44" width="190" height="54" rx="8"/><text class="sS" x="360" y="132" text-anchor="middle">right = 2: 'c' is new → the window grows</text><text class="sM" x="360" y="156" text-anchor="middle">window "abc", length 3, best so far 3</text></g>
<g data-s="4-4"><rect class="sA" x="169" y="44" width="190" height="54" rx="8"/><text class="sS" x="360" y="132" text-anchor="middle">right = 3: 'a' was already in the window → left jumps to 1</text><text class="sM" x="360" y="156" text-anchor="middle">window "bca", length 3, best so far 3</text></g>
<g data-s="5-5"><rect class="sA" x="233" y="44" width="190" height="54" rx="8"/><text class="sS" x="360" y="132" text-anchor="middle">right = 4: 'b' was already in the window → left jumps to 2</text><text class="sM" x="360" y="156" text-anchor="middle">window "cab", length 3, best so far 3</text></g>
<g data-s="6-6"><rect class="sA" x="297" y="44" width="190" height="54" rx="8"/><text class="sS" x="360" y="132" text-anchor="middle">right = 5: 'c' was already in the window → left jumps to 3</text><text class="sM" x="360" y="156" text-anchor="middle">window "abc", length 3, best so far 3</text></g>
<g data-s="7-7"><rect class="sA" x="425" y="44" width="126" height="54" rx="8"/><text class="sS" x="360" y="132" text-anchor="middle">right = 6: 'b' was already in the window → left jumps to 5</text><text class="sM" x="360" y="156" text-anchor="middle">window "cb", length 2, best so far 3</text></g>
<g data-s="8-8"><rect class="sA" x="553" y="44" width="62" height="54" rx="8"/><text class="sS" x="360" y="132" text-anchor="middle">right = 7: 'b' was already in the window → left jumps to 7</text><text class="sM" x="360" y="156" text-anchor="middle">window "b", length 1, best so far 3</text></g>
<rect class="sB" x="110" y="50" width="52" height="42" rx="6"/><text class="sX" x="136" y="77" text-anchor="middle">a</text>
<rect class="sB" x="174" y="50" width="52" height="42" rx="6"/><text class="sX" x="200" y="77" text-anchor="middle">b</text>
<rect class="sB" x="238" y="50" width="52" height="42" rx="6"/><text class="sX" x="264" y="77" text-anchor="middle">c</text>
<rect class="sB" x="302" y="50" width="52" height="42" rx="6"/><text class="sX" x="328" y="77" text-anchor="middle">a</text>
<rect class="sB" x="366" y="50" width="52" height="42" rx="6"/><text class="sX" x="392" y="77" text-anchor="middle">b</text>
<rect class="sB" x="430" y="50" width="52" height="42" rx="6"/><text class="sX" x="456" y="77" text-anchor="middle">c</text>
<rect class="sB" x="494" y="50" width="52" height="42" rx="6"/><text class="sX" x="520" y="77" text-anchor="middle">b</text>
<rect class="sB" x="558" y="50" width="52" height="42" rx="6"/><text class="sX" x="584" y="77" text-anchor="middle">b</text>
</svg><ol class="dia-steps">
<li>right = 0: the window grows to include it. Best length is now 1.</li>
<li>right = 1: the window grows to include it. Best length is now 2.</li>
<li>right = 2: the window grows to include it. Best length is now 3.</li>
<li>right = 3: the character was already inside the window, so <code>left</code> jumps just past its earlier copy, to 1.</li>
<li>right = 4: the character was already inside the window, so <code>left</code> jumps just past its earlier copy, to 2.</li>
<li>right = 5: the character was already inside the window, so <code>left</code> jumps just past its earlier copy, to 3.</li>
<li>right = 6: the character was already inside the window, so <code>left</code> jumps just past its earlier copy, to 5.</li>
<li>right = 7: another repeat; the window shrinks to just "b". The answer is the best length seen, 3 ("abc").</li>
</ol><figcaption>Grow on the right, shrink on the left. Each index enters and leaves the window at most once, so the whole scan is O(n), not O(n²).</figcaption></figure>

```csharp
// Longest substring without repeating characters. O(n).
int LengthOfLongestSubstring(string s)
{
    var lastSeen = new Dictionary<char, int>();
    int best = 0, left = 0;
    for (int right = 0; right < s.Length; right++)
    {
        if (lastSeen.TryGetValue(s[right], out int prev) && prev >= left)
            left = prev + 1;                       // jump past the earlier copy
        lastSeen[s[right]] = right;
        best = Math.Max(best, right - left + 1);
    }
    return best;
}
```

## S4.7 Pattern 4 — Stack 🟢 ⭐

**Signal:** matching pairs, "most recent", undo, nested structures, "next greater element".

```csharp
bool IsValid(string s)                            // "({[]})" → true, "(]" → false
{
    var pairs = new Dictionary<char, char> { [')'] = '(', [']'] = '[', ['}'] = '{' };
    var stack = new Stack<char>();
    foreach (char c in s)
    {
        if (pairs.TryGetValue(c, out char open))
        {
            if (stack.Count == 0 || stack.Pop() != open) return false;
        }
        else stack.Push(c);
    }
    return stack.Count == 0;
}
```

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Tracing the bracket checker: for the string with nested brackets each opener is pushed and each closer pops its matching opener, leaving an empty stack, so it is valid; for an opening parenthesis followed by a closing square bracket, the pop finds a parenthesis where a square bracket was needed, so it is invalid">
<text class="sM" x="14" y="22">IsValid("({[]})")</text>
<rect class="sB" x="14" y="34" width="64" height="28" rx="6"/><text class="sT" x="46" y="53" text-anchor="middle">(</text>
<text class="sS" x="46" y="78" text-anchor="middle">push</text>
<line class="sLm" x1="18" y1="196" x2="74" y2="196"/>
<rect class="sA" x="26" y="168" width="40" height="24" rx="4"/><text class="sT" x="46" y="185" text-anchor="middle">(</text>
<rect class="sB" x="92" y="34" width="64" height="28" rx="6"/><text class="sT" x="124" y="53" text-anchor="middle">{</text>
<text class="sS" x="124" y="78" text-anchor="middle">push</text>
<line class="sLm" x1="96" y1="196" x2="152" y2="196"/>
<rect class="sA" x="104" y="168" width="40" height="24" rx="4"/><text class="sT" x="124" y="185" text-anchor="middle">(</text>
<rect class="sA" x="104" y="142" width="40" height="24" rx="4"/><text class="sT" x="124" y="159" text-anchor="middle">{</text>
<rect class="sB" x="170" y="34" width="64" height="28" rx="6"/><text class="sT" x="202" y="53" text-anchor="middle">[</text>
<text class="sS" x="202" y="78" text-anchor="middle">push</text>
<line class="sLm" x1="174" y1="196" x2="230" y2="196"/>
<rect class="sA" x="182" y="168" width="40" height="24" rx="4"/><text class="sT" x="202" y="185" text-anchor="middle">(</text>
<rect class="sA" x="182" y="142" width="40" height="24" rx="4"/><text class="sT" x="202" y="159" text-anchor="middle">{</text>
<rect class="sA" x="182" y="116" width="40" height="24" rx="4"/><text class="sT" x="202" y="133" text-anchor="middle">[</text>
<rect class="sG" x="248" y="34" width="64" height="28" rx="6"/><text class="sT" x="280" y="53" text-anchor="middle">]</text>
<text class="sGt" x="280" y="78" text-anchor="middle">pop</text>
<line class="sLm" x1="252" y1="196" x2="308" y2="196"/>
<rect class="sA" x="260" y="168" width="40" height="24" rx="4"/><text class="sT" x="280" y="185" text-anchor="middle">(</text>
<rect class="sA" x="260" y="142" width="40" height="24" rx="4"/><text class="sT" x="280" y="159" text-anchor="middle">{</text>
<rect class="sG" x="326" y="34" width="64" height="28" rx="6"/><text class="sT" x="358" y="53" text-anchor="middle">}</text>
<text class="sGt" x="358" y="78" text-anchor="middle">pop</text>
<line class="sLm" x1="330" y1="196" x2="386" y2="196"/>
<rect class="sA" x="338" y="168" width="40" height="24" rx="4"/><text class="sT" x="358" y="185" text-anchor="middle">(</text>
<rect class="sG" x="404" y="34" width="64" height="28" rx="6"/><text class="sT" x="436" y="53" text-anchor="middle">)</text>
<text class="sGt" x="436" y="78" text-anchor="middle">pop</text>
<line class="sLm" x1="408" y1="196" x2="464" y2="196"/>
<text class="sS" x="436" y="188" text-anchor="middle">empty</text>
<text class="sGt" x="241" y="222" text-anchor="middle">empty at the end → true</text>
<text class="sM" x="520" y="22">IsValid("(]")</text>
<rect class="sB" x="520" y="34" width="64" height="28" rx="6"/><text class="sT" x="552" y="53" text-anchor="middle">(</text>
<text class="sS" x="552" y="78" text-anchor="middle">push</text>
<line class="sLm" x1="524" y1="196" x2="580" y2="196"/>
<rect class="sA" x="532" y="168" width="40" height="24" rx="4"/><text class="sT" x="552" y="185" text-anchor="middle">(</text>
<rect class="sR" x="598" y="34" width="64" height="28" rx="6"/><text class="sT" x="630" y="53" text-anchor="middle">]</text>
<text class="sRt" x="630" y="78" text-anchor="middle">mismatch</text>
<line class="sLm" x1="602" y1="196" x2="658" y2="196"/>
<text class="sS" x="630" y="188" text-anchor="middle">empty</text>
<text class="sRt" x="591" y="222" text-anchor="middle">')' expected, got ']' → false</text>
</svg><figcaption>The stack after each character, traced by running the algorithm: most recent opener on top, so the innermost pair always closes first.</figcaption></figure>

> [!term] Monotonic stack
> A stack kept in increasing or decreasing order: before pushing, pop everything that breaks the order. It answers "next greater element" or "daily temperatures" in O(n), because each item is pushed and popped once.

## S4.8 Pattern 5 — Sorting first 🟢 ⭐

**Signal:** intervals, scheduling, "closest pair", anything easier once ordered. Sorting costs O(n log n) and often turns an O(n²) problem into O(n) after it.

```csharp
// Merge overlapping intervals: [[1,3],[2,6],[8,10]] → [[1,6],[8,10]]
int[][] Merge(int[][] intervals)
{
    var sorted = intervals.OrderBy(iv => iv[0]).ToList();
    var result = new List<int[]>();
    foreach (var iv in sorted)
    {
        if (result.Count > 0 && iv[0] <= result[^1][1])
            result[^1][1] = Math.Max(result[^1][1], iv[1]);   // overlap: extend
        else
            result.Add(new[] { iv[0], iv[1] });
    }
    return result.ToArray();
}
```

## S4.9 Pattern 6 — Binary search 🟢 🟡 ⭐

**Signal:** sorted data, or "find the smallest value that works" when *works* is monotonic (if 5 works, 6 works too).

```csharp
int BinarySearch(int[] a, int target)
{
    int lo = 0, hi = a.Length - 1;
    while (lo <= hi)
    {
        int mid = lo + (hi - lo) / 2;                 // avoids int overflow of (lo+hi)
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
```

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 175" role="img" aria-label="Binary search for 12 in a sorted array of 11 numbers, halving the range at each step">
<text class="sC" x="75" y="38" text-anchor="middle">0</text>
<text class="sC" x="132" y="38" text-anchor="middle">1</text>
<text class="sC" x="189" y="38" text-anchor="middle">2</text>
<text class="sC" x="246" y="38" text-anchor="middle">3</text>
<text class="sC" x="303" y="38" text-anchor="middle">4</text>
<text class="sC" x="360" y="38" text-anchor="middle">5</text>
<text class="sC" x="417" y="38" text-anchor="middle">6</text>
<text class="sC" x="474" y="38" text-anchor="middle">7</text>
<text class="sC" x="531" y="38" text-anchor="middle">8</text>
<text class="sC" x="588" y="38" text-anchor="middle">9</text>
<text class="sC" x="645" y="38" text-anchor="middle">10</text>
<rect class="sB" x="50" y="46" width="50" height="40" rx="6"/><text class="sT" x="75" y="72" text-anchor="middle">2</text>
<rect class="sB" x="107" y="46" width="50" height="40" rx="6"/><text class="sT" x="132" y="72" text-anchor="middle">5</text>
<rect class="sB" x="164" y="46" width="50" height="40" rx="6"/><text class="sT" x="189" y="72" text-anchor="middle">8</text>
<rect class="sB" x="221" y="46" width="50" height="40" rx="6"/><text class="sT" x="246" y="72" text-anchor="middle">12</text>
<rect class="sB" x="278" y="46" width="50" height="40" rx="6"/><text class="sT" x="303" y="72" text-anchor="middle">16</text>
<rect class="sB" x="335" y="46" width="50" height="40" rx="6"/><text class="sT" x="360" y="72" text-anchor="middle">23</text>
<rect class="sB" x="392" y="46" width="50" height="40" rx="6"/><text class="sT" x="417" y="72" text-anchor="middle">38</text>
<rect class="sB" x="449" y="46" width="50" height="40" rx="6"/><text class="sT" x="474" y="72" text-anchor="middle">56</text>
<rect class="sB" x="506" y="46" width="50" height="40" rx="6"/><text class="sT" x="531" y="72" text-anchor="middle">72</text>
<rect class="sB" x="563" y="46" width="50" height="40" rx="6"/><text class="sT" x="588" y="72" text-anchor="middle">91</text>
<rect class="sB" x="620" y="46" width="50" height="40" rx="6"/><text class="sT" x="645" y="72" text-anchor="middle">99</text>
<g data-s="2"><rect class="sFs" x="333" y="44" width="339" height="44" rx="6" opacity=".78"/></g>
<g data-s="3"><rect class="sFs" x="48" y="44" width="168" height="44" rx="6" opacity=".78"/></g>
<g data-s="1-1"><text class="sGt" x="75" y="108" text-anchor="middle">lo</text><text class="sWt" x="645" y="108" text-anchor="middle">hi</text><rect class="sN" x="332" y="42" width="56" height="48" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><text class="sM" x="360" y="126" text-anchor="middle">mid</text><text class="sS" x="360" y="156" text-anchor="middle">mid = 5 → 23 &gt; 12, so the answer can only be left of mid: hi = 4</text></g>
<g data-s="2-2"><text class="sGt" x="75" y="108" text-anchor="middle">lo</text><text class="sWt" x="303" y="108" text-anchor="middle">hi</text><rect class="sN" x="161" y="42" width="56" height="48" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><text class="sM" x="189" y="126" text-anchor="middle">mid</text><text class="sS" x="360" y="156" text-anchor="middle">mid = 2 → 8 &lt; 12, so it can only be right of mid: lo = 3</text></g>
<g data-s="3-3"><text class="sGt" x="246" y="108" text-anchor="middle">lo</text><text class="sWt" x="303" y="108" text-anchor="middle">hi</text><rect class="sN" x="218" y="42" width="56" height="48" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><text class="sM" x="246" y="126" text-anchor="middle">mid</text><text class="sGt" x="360" y="156" text-anchor="middle">mid = 3 → 12 = 12 ✓ found after 3 comparisons</text></g>
<g data-s="4-4"><text class="sS" x="360" y="156" text-anchor="middle">Each comparison halves what is left: 11 → 5 → 2 → 1. At most ⌈log₂(n+1)⌉ comparisons: 4 here, 20 for a million items.</text></g>
</svg><ol class="dia-steps">
<li>Look at the middle. 23 is bigger than 12, and the array is sorted, so everything from index 5 onwards can be thrown away at once.</li>
<li>The middle of what remains is 8, smaller than 12, so indexes 0 to 2 go too.</li>
<li>Only indexes 3 and 4 remain, and the middle one is 12. Found.</li>
<li>Halving is what makes it O(log n). The same idea works on any yes/no question that flips only once as the value grows ("binary search on the answer").</li>
</ol><figcaption>Binary search for 12. Shaded cells are ruled out.</figcaption></figure>

**Binary search on the answer:** "minimum capacity to ship packages within D days". Capacity is monotonic, so binary search over capacities and test each with an O(n) check, giving O(n log(sum)) in total.

## S4.10 Pattern 7 — Trees and recursion 🟢 ⭐

> [!term] Binary search tree (BST)
> A binary tree where every node's left subtree holds smaller keys and the right subtree larger ones, so search, insert and delete take O(height): O(log n) if balanced, O(n) if it degenerates into a line.

Traversals:

| Order | Visit | Use |
|---|---|---|
| Pre-order | node, left, right | Copy or serialise a tree |
| **In-order** | left, node, right | A BST in **sorted** order |
| Post-order | left, right, node | Delete a tree, compute sizes bottom-up |
| Level-order | breadth-first with a queue | Shortest path in levels, "print by level" |

```csharp
public class TreeNode { public int Val; public TreeNode? Left, Right; }

int MaxDepth(TreeNode? n) => n is null ? 0 : 1 + Math.Max(MaxDepth(n.Left), MaxDepth(n.Right));

bool IsValidBst(TreeNode? n, long min = long.MinValue, long max = long.MaxValue) =>
    n is null || (n.Val > min && n.Val < max
                  && IsValidBst(n.Left, min, n.Val) && IsValidBst(n.Right, n.Val, max));
```

**How to think recursively:** trust that the function works on smaller inputs, then define (1) the **base case** and (2) how to combine the results for the children.

## S4.11 Pattern 8 — Graphs: BFS and DFS 🟡 ⭐

Graphs are nodes plus edges, stored as an **adjacency list** (`Dictionary<int, List<int>>`). A grid is a graph where each cell links to its four neighbours.

| | BFS (breadth-first) | DFS (depth-first) |
|---|---|---|
| Structure | Queue | Stack or recursion |
| Explores | Level by level | One path as deep as possible, then backtracks |
| Finds | **Shortest path in an unweighted graph** | Connected components, cycles, topological order |

<figure class="dia steps"><svg viewBox="0 0 720 235" role="img" aria-label="Breadth-first and depth-first search visiting the same tree in different orders, with the queue and stack contents">
<text class="sT" x="180" y="24" text-anchor="middle">BFS · queue</text>
<line class="sLm" x1="180" y1="52" x2="110" y2="112"/>
<line class="sLm" x1="180" y1="52" x2="250" y2="112"/>
<line class="sLm" x1="110" y1="112" x2="65" y2="177"/>
<line class="sLm" x1="110" y1="112" x2="150" y2="177"/>
<line class="sLm" x1="250" y1="112" x2="250" y2="177"/>
<circle class="sB" cx="180" cy="52" r="16"/>
<g data-s="1"><circle class="sA" cx="180" cy="52" r="16"/><text class="sM" x="204" y="42">1</text></g>
<text class="sT" x="180" y="57" text-anchor="middle">A</text>
<circle class="sB" cx="110" cy="112" r="16"/>
<g data-s="2"><circle class="sA" cx="110" cy="112" r="16"/><text class="sM" x="134" y="102">2</text></g>
<text class="sT" x="110" y="117" text-anchor="middle">B</text>
<circle class="sB" cx="250" cy="112" r="16"/>
<g data-s="3"><circle class="sA" cx="250" cy="112" r="16"/><text class="sM" x="274" y="102">3</text></g>
<text class="sT" x="250" y="117" text-anchor="middle">C</text>
<circle class="sB" cx="65" cy="177" r="16"/>
<g data-s="4"><circle class="sA" cx="65" cy="177" r="16"/><text class="sM" x="89" y="167">4</text></g>
<text class="sT" x="65" y="182" text-anchor="middle">D</text>
<circle class="sB" cx="150" cy="177" r="16"/>
<g data-s="5"><circle class="sA" cx="150" cy="177" r="16"/><text class="sM" x="174" y="167">5</text></g>
<text class="sT" x="150" y="182" text-anchor="middle">E</text>
<circle class="sB" cx="250" cy="177" r="16"/>
<g data-s="6"><circle class="sA" cx="250" cy="177" r="16"/><text class="sM" x="274" y="167">6</text></g>
<text class="sT" x="250" y="182" text-anchor="middle">F</text>
<g data-s="1-1"><text class="sC" x="180" y="218" text-anchor="middle">queue (front first): B C</text></g>
<g data-s="2-2"><text class="sC" x="180" y="218" text-anchor="middle">queue (front first): C D E</text></g>
<g data-s="3-3"><text class="sC" x="180" y="218" text-anchor="middle">queue (front first): D E F</text></g>
<g data-s="4-4"><text class="sC" x="180" y="218" text-anchor="middle">queue (front first): E F</text></g>
<g data-s="5-5"><text class="sC" x="180" y="218" text-anchor="middle">queue (front first): F</text></g>
<g data-s="6-6"><text class="sC" x="180" y="218" text-anchor="middle">queue (front first): (empty)</text></g>
<text class="sT" x="540" y="24" text-anchor="middle">DFS · stack</text>
<line class="sLm" x1="540" y1="52" x2="470" y2="112"/>
<line class="sLm" x1="540" y1="52" x2="610" y2="112"/>
<line class="sLm" x1="470" y1="112" x2="425" y2="177"/>
<line class="sLm" x1="470" y1="112" x2="510" y2="177"/>
<line class="sLm" x1="610" y1="112" x2="610" y2="177"/>
<circle class="sB" cx="540" cy="52" r="16"/>
<g data-s="1"><circle class="sA" cx="540" cy="52" r="16"/><text class="sM" x="564" y="42">1</text></g>
<text class="sT" x="540" y="57" text-anchor="middle">A</text>
<circle class="sB" cx="470" cy="112" r="16"/>
<g data-s="2"><circle class="sA" cx="470" cy="112" r="16"/><text class="sM" x="494" y="102">2</text></g>
<text class="sT" x="470" y="117" text-anchor="middle">B</text>
<circle class="sB" cx="610" cy="112" r="16"/>
<g data-s="5"><circle class="sA" cx="610" cy="112" r="16"/><text class="sM" x="634" y="102">5</text></g>
<text class="sT" x="610" y="117" text-anchor="middle">C</text>
<circle class="sB" cx="425" cy="177" r="16"/>
<g data-s="3"><circle class="sA" cx="425" cy="177" r="16"/><text class="sM" x="449" y="167">3</text></g>
<text class="sT" x="425" y="182" text-anchor="middle">D</text>
<circle class="sB" cx="510" cy="177" r="16"/>
<g data-s="4"><circle class="sA" cx="510" cy="177" r="16"/><text class="sM" x="534" y="167">4</text></g>
<text class="sT" x="510" y="182" text-anchor="middle">E</text>
<circle class="sB" cx="610" cy="177" r="16"/>
<g data-s="6"><circle class="sA" cx="610" cy="177" r="16"/><text class="sM" x="634" y="167">6</text></g>
<text class="sT" x="610" y="182" text-anchor="middle">F</text>
<g data-s="1-1"><text class="sC" x="540" y="218" text-anchor="middle">stack (top first): B C</text></g>
<g data-s="2-2"><text class="sC" x="540" y="218" text-anchor="middle">stack (top first): D E C</text></g>
<g data-s="3-3"><text class="sC" x="540" y="218" text-anchor="middle">stack (top first): E C</text></g>
<g data-s="4-4"><text class="sC" x="540" y="218" text-anchor="middle">stack (top first): C</text></g>
<g data-s="5-5"><text class="sC" x="540" y="218" text-anchor="middle">stack (top first): F</text></g>
<g data-s="6-6"><text class="sC" x="540" y="218" text-anchor="middle">stack (top first): (empty)</text></g>
<line class="sD" x1="360" y1="14" x2="360" y2="228"/>
</svg><ol class="dia-steps">
<li>Both start at A. BFS puts A's neighbours B and C in a queue; DFS pushes them on a stack.</li>
<li>Both visit B next. BFS adds D and E to the <i>back</i> of the queue; DFS pushes them on <i>top</i> of the stack.</li>
<li>Now they differ: BFS takes C from the front of the queue (finishing level 1), while DFS takes D from the top of the stack (going deeper).</li>
<li>BFS visits D; DFS visits E, finishing B's subtree.</li>
<li>BFS visits E; DFS finally backtracks to C.</li>
<li>Both visit F last. BFS went level by level, so it finds the shortest path in an unweighted graph; DFS went deep first, which suits components, cycles and topological order.</li>
</ol><figcaption>Same graph, same neighbours, different container. The numbers are the visit order.</figcaption></figure>

```csharp
// Number of islands: count groups of connected '1's in a grid. O(rows × cols).
int NumIslands(char[][] grid)
{
    int rows = grid.Length, cols = grid[0].Length, count = 0;
    void Sink(int r, int c)
    {
        if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] != '1') return;
        grid[r][c] = '0';                                 // mark visited
        Sink(r + 1, c); Sink(r - 1, c); Sink(r, c + 1); Sink(r, c - 1);
    }
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            if (grid[r][c] == '1') { count++; Sink(r, c); }
    return count;
}
```

> [!term] Topological sort
> An ordering of a directed acyclic graph where every edge goes from earlier to later, like build steps or course prerequisites. It's exactly how Airflow orders the tasks in a DAG and how a build tool orders projects ([[DE7]]).

Weighted shortest paths use **Dijkstra's algorithm** (a priority queue, non-negative weights). Know the name and the idea; implementing it is a mid-to-senior question.

## S4.12 Pattern 9 — Heaps for "top k" 🟡 ⭐

**Signal:** "k largest", "k most frequent", "merge k sorted lists", "running median".

<figure class="dia"><svg viewBox="0 0 720 310" role="img" aria-label="A min-heap drawn as a tree and stored as an array, with the index formulas">
<line class="sLm" x1="360" y1="40" x2="220" y2="100"/>
<line class="sLm" x1="360" y1="40" x2="500" y2="100"/>
<line class="sLm" x1="220" y1="100" x2="150" y2="160"/>
<line class="sLm" x1="220" y1="100" x2="290" y2="160"/>
<line class="sLm" x1="500" y1="100" x2="430" y2="160"/>
<line class="sLm" x1="500" y1="100" x2="570" y2="160"/>
<circle class="sG" cx="360" cy="40" r="18"/><text class="sT" x="360" y="45" text-anchor="middle">1</text><text class="sC" x="384" y="28">[0]</text>
<circle class="sA" cx="220" cy="100" r="18"/><text class="sT" x="220" y="105" text-anchor="middle">3</text><text class="sC" x="244" y="88">[1]</text>
<circle class="sA" cx="500" cy="100" r="18"/><text class="sT" x="500" y="105" text-anchor="middle">2</text><text class="sC" x="524" y="88">[2]</text>
<circle class="sA" cx="150" cy="160" r="18"/><text class="sT" x="150" y="165" text-anchor="middle">7</text><text class="sC" x="174" y="148">[3]</text>
<circle class="sA" cx="290" cy="160" r="18"/><text class="sT" x="290" y="165" text-anchor="middle">4</text><text class="sC" x="314" y="148">[4]</text>
<circle class="sA" cx="430" cy="160" r="18"/><text class="sT" x="430" y="165" text-anchor="middle">5</text><text class="sC" x="454" y="148">[5]</text>
<circle class="sA" cx="570" cy="160" r="18"/><text class="sT" x="570" y="165" text-anchor="middle">9</text><text class="sC" x="594" y="148">[6]</text>
<rect class="sG" x="160" y="206" width="52" height="32" rx="4"/><text class="sT" x="186" y="227" text-anchor="middle">1</text><text class="sC" x="186" y="252" text-anchor="middle">0</text>
<rect class="sB" x="218" y="206" width="52" height="32" rx="4"/><text class="sT" x="244" y="227" text-anchor="middle">3</text><text class="sC" x="244" y="252" text-anchor="middle">1</text>
<rect class="sB" x="276" y="206" width="52" height="32" rx="4"/><text class="sT" x="302" y="227" text-anchor="middle">2</text><text class="sC" x="302" y="252" text-anchor="middle">2</text>
<rect class="sB" x="334" y="206" width="52" height="32" rx="4"/><text class="sT" x="360" y="227" text-anchor="middle">7</text><text class="sC" x="360" y="252" text-anchor="middle">3</text>
<rect class="sB" x="392" y="206" width="52" height="32" rx="4"/><text class="sT" x="418" y="227" text-anchor="middle">4</text><text class="sC" x="418" y="252" text-anchor="middle">4</text>
<rect class="sB" x="450" y="206" width="52" height="32" rx="4"/><text class="sT" x="476" y="227" text-anchor="middle">5</text><text class="sC" x="476" y="252" text-anchor="middle">5</text>
<rect class="sB" x="508" y="206" width="52" height="32" rx="4"/><text class="sT" x="534" y="227" text-anchor="middle">9</text><text class="sC" x="534" y="252" text-anchor="middle">6</text>
<text class="sM" x="20" y="226">array</text>
<text class="sS" x="20" y="280">children of i: 2i + 1 and 2i + 2 · parent of i: (i − 1) / 2</text>
<text class="sGt" x="20" y="298">every parent ≤ its children, so the minimum is always at [0]</text>
</svg><figcaption>A binary heap is a tree stored in an array, with no pointers. Insert adds at the end and swaps upward; removing the minimum moves the last item to the top and swaps it down. Both walk one path, so O(log n).</figcaption></figure>

```csharp
// Top k frequent numbers: count, then keep a min-heap of size k. O(n log k).
int[] TopKFrequent(int[] nums, int k)
{
    var freq = nums.GroupBy(x => x).ToDictionary(g => g.Key, g => g.Count());
    var heap = new PriorityQueue<int, int>();            // min-heap by frequency
    foreach (var (num, f) in freq)
    {
        heap.Enqueue(num, f);
        if (heap.Count > k) heap.Dequeue();               // drop the least frequent
    }
    var result = new int[k];
    for (int i = k - 1; i >= 0; i--) result[i] = heap.Dequeue();
    return result;
}
```

## S4.13 Pattern 10 — Dynamic programming 🟡 ⭐

> [!term] Dynamic programming
> Solving a problem by combining answers to **overlapping subproblems**, storing each answer once so it's never recomputed. Top-down = recursion plus a cache (**memoisation**); bottom-up = fill a table from the smallest case up (**tabulation**).

**The recipe:** (1) define the state: "`dp[i]` = number of ways to reach step i"; (2) write the transition: `dp[i] = dp[i-1] + dp[i-2]`; (3) set base cases; (4) choose the order to fill it; (5) see if only the last few values are needed (space optimisation).

```csharp
// Coin change: fewest coins to make amount, or -1. O(amount × coins).
int CoinChange(int[] coins, int amount)
{
    var dp = new int[amount + 1];
    Array.Fill(dp, amount + 1);                          // "infinity"
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        foreach (int c in coins)
            if (c <= a) dp[a] = Math.Min(dp[a], dp[a - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}
```

Classic DP problems to recognise: climbing stairs, house robber, coin change, longest common subsequence, longest increasing subsequence, 0/1 knapsack, edit distance.

<figure class="dia steps"><svg viewBox="0 0 720 205" role="img" aria-label="Bottom-up dynamic programming table for the fewest coins from 1, 3 and 4 that make 6">
<text class="sM" x="132" y="44" text-anchor="middle">dp[0]</text>
<rect class="sB" x="100" y="52" width="64" height="44" rx="6"/>
<text class="sM" x="214" y="44" text-anchor="middle">dp[1]</text>
<rect class="sB" x="182" y="52" width="64" height="44" rx="6"/>
<text class="sM" x="296" y="44" text-anchor="middle">dp[2]</text>
<rect class="sB" x="264" y="52" width="64" height="44" rx="6"/>
<text class="sM" x="378" y="44" text-anchor="middle">dp[3]</text>
<rect class="sB" x="346" y="52" width="64" height="44" rx="6"/>
<text class="sM" x="460" y="44" text-anchor="middle">dp[4]</text>
<rect class="sB" x="428" y="52" width="64" height="44" rx="6"/>
<text class="sM" x="542" y="44" text-anchor="middle">dp[5]</text>
<rect class="sB" x="510" y="52" width="64" height="44" rx="6"/>
<text class="sM" x="624" y="44" text-anchor="middle">dp[6]</text>
<rect class="sB" x="592" y="52" width="64" height="44" rx="6"/>
<text class="sM" x="20" y="80">coins</text>
<text class="sC" x="20" y="96">1, 3, 4</text>
<g data-s="1"><text class="sX" x="132" y="81" text-anchor="middle">0</text></g>
<g data-s="1-1"><rect class="sN" x="97" y="49" width="70" height="50" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><text class="sS" x="360" y="186" text-anchor="middle">dp[0] = 0: zero coins make 0. Everything else starts at "infinity".</text></g>
<g data-s="2"><text class="sX" x="214" y="81" text-anchor="middle">1</text></g>
<g data-s="2-2"><rect class="sN" x="179" y="49" width="70" height="50" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><path class="sLg" d="M132 100 Q173.0 136 214 100" marker-end="url(#ahg)"/><text class="sS" x="360" y="186" text-anchor="middle">dp[1] = dp[0] + 1 = 1   (coin 1)</text></g>
<g data-s="3"><text class="sX" x="296" y="81" text-anchor="middle">2</text></g>
<g data-s="3-3"><rect class="sN" x="261" y="49" width="70" height="50" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><path class="sLg" d="M214 100 Q255.0 136 296 100" marker-end="url(#ahg)"/><text class="sS" x="360" y="186" text-anchor="middle">dp[2] = dp[1] + 1 = 2   (coins 3 and 4 are too big)</text></g>
<g data-s="4"><text class="sX" x="378" y="81" text-anchor="middle">1</text></g>
<g data-s="4-4"><rect class="sN" x="343" y="49" width="70" height="50" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><path class="sLg" d="M132 100 Q255.0 148 378 100" marker-end="url(#ahg)"/><text class="sS" x="360" y="186" text-anchor="middle">dp[3] = min(dp[2] + 1, dp[0] + 1) = min(3, 1) = 1   (coin 3)</text></g>
<g data-s="5"><text class="sX" x="460" y="81" text-anchor="middle">1</text></g>
<g data-s="5-5"><rect class="sN" x="425" y="49" width="70" height="50" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><path class="sLg" d="M132 100 Q296.0 154 460 100" marker-end="url(#ahg)"/><text class="sS" x="360" y="186" text-anchor="middle">dp[4] = min(dp[3] + 1, dp[1] + 1, dp[0] + 1) = 1   (coin 4)</text></g>
<g data-s="6"><text class="sX" x="542" y="81" text-anchor="middle">2</text></g>
<g data-s="6-6"><rect class="sN" x="507" y="49" width="70" height="50" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><path class="sLg" d="M460 100 Q501.0 136 542 100" marker-end="url(#ahg)"/><text class="sS" x="360" y="186" text-anchor="middle">dp[5] = min(dp[4] + 1, dp[2] + 1, dp[1] + 1) = min(2, 3, 2) = 2</text></g>
<g data-s="7"><text class="sX" x="624" y="81" text-anchor="middle">2</text></g>
<g data-s="7-7"><rect class="sN" x="589" y="49" width="70" height="50" rx="8" style="stroke:var(--accent);stroke-width:2.5"/><path class="sLg" d="M378 100 Q501.0 148 624 100" marker-end="url(#ahg)"/><text class="sS" x="360" y="186" text-anchor="middle">dp[6] = min(dp[5] + 1, dp[3] + 1, dp[2] + 1) = min(3, 2, 3) = 2   (3 + 3)</text></g>
<g data-s="8-8"><text class="sWt" x="360" y="186" text-anchor="middle">Greedy (largest coin first) takes 4 + 1 + 1 = 3 coins. DP finds 3 + 3 = 2.</text></g>
</svg><ol class="dia-steps">
<li>State: <code>dp[a]</code> = the fewest coins that make amount <code>a</code>. Base case: <code>dp[0] = 0</code>.</li>
<li>For each amount, try every coin and reuse an answer you already have: <code>dp[a] = min(dp[a − c] + 1)</code>.</li>
<li>Only coin 1 fits, so 2 coins.</li>
<li>Coin 3 jumps straight from <code>dp[0]</code>: one coin beats three.</li>
<li>Coin 4 likewise: one coin.</li>
<li>Two candidates tie at 2 coins (4 + 1, or 1 + 4).</li>
<li>Coin 3 from <code>dp[3]</code> gives 2 coins: 3 + 3. Each cell was computed once from earlier cells: O(amount × coins).</li>
<li>Why not greedy? Taking the biggest coin first gives 4 + 1 + 1, three coins. DP checks every option at every amount, so it can't be fooled.</li>
</ol><figcaption>Coin change, bottom-up. The green arc shows which earlier answer the new one was built from.</figcaption></figure>

## S4.14 Pattern 11 — Backtracking 🟡

**Signal:** "all combinations / permutations / subsets", or "place items under constraints" (N-queens, sudoku). Build a candidate step by step, recurse, then undo the step.

```csharp
IList<IList<int>> Subsets(int[] nums)
{
    var result = new List<IList<int>>();
    var current = new List<int>();
    void Go(int start)
    {
        result.Add(new List<int>(current));
        for (int i = start; i < nums.Length; i++)
        {
            current.Add(nums[i]);       // choose
            Go(i + 1);                  // explore
            current.RemoveAt(current.Count - 1);  // un-choose
        }
    }
    Go(0);
    return result;
}
```

<figure class="dia steps"><svg viewBox="0 0 720 246" role="img" aria-label="The recursion tree of Subsets of 1, 2, 3: the empty set at the root, branches adding 1, 2 or 3, and eight nodes in the order they are recorded: empty, 1, 1 2, 1 2 3, 1 3, 2, 2 3, 3">
<g data-s="2"><line class="sLm" x1="62" y1="50" x2="147" y2="76" marker-end="url(#ahm)"/><text class="sGt" x="112.5" y="65">+1</text></g>
<g data-s="2"><line class="sLm" x1="147" y1="108" x2="232" y2="134" marker-end="url(#ahm)"/><text class="sGt" x="197.5" y="123">+2</text></g>
<g data-s="2"><line class="sLm" x1="232" y1="166" x2="317" y2="192" marker-end="url(#ahm)"/><text class="sGt" x="282.5" y="181">+3</text></g>
<g data-s="2"><line class="sLm" x1="147" y1="108" x2="402" y2="134" marker-end="url(#ahm)"/><text class="sGt" x="282.5" y="123">+3</text></g>
<g data-s="3"><line class="sLm" x1="62" y1="50" x2="487" y2="76" marker-end="url(#ahm)"/><text class="sGt" x="282.5" y="65">+2</text></g>
<g data-s="3"><line class="sLm" x1="487" y1="108" x2="572" y2="134" marker-end="url(#ahm)"/><text class="sGt" x="537.5" y="123">+3</text></g>
<g data-s="4"><line class="sLm" x1="62" y1="50" x2="657" y2="76" marker-end="url(#ahm)"/><text class="sGt" x="367.5" y="65">+3</text></g>
<rect class="sA" x="26" y="19" width="72" height="30" rx="8"/><text class="sT" x="62" y="39" text-anchor="middle">[]</text><text class="sS" x="94" y="16" text-anchor="end">1</text>
<g data-s="2"><rect class="sB" x="111" y="77" width="72" height="30" rx="8"/><text class="sT" x="147" y="97" text-anchor="middle">[1]</text><text class="sS" x="179" y="74" text-anchor="end">2</text></g>
<g data-s="2"><rect class="sB" x="196" y="135" width="72" height="30" rx="8"/><text class="sT" x="232" y="155" text-anchor="middle">[1, 2]</text><text class="sS" x="264" y="132" text-anchor="end">3</text></g>
<g data-s="2"><rect class="sB" x="281" y="193" width="72" height="30" rx="8"/><text class="sT" x="317" y="213" text-anchor="middle">[1, 2, 3]</text><text class="sS" x="349" y="190" text-anchor="end">4</text></g>
<g data-s="2"><rect class="sB" x="366" y="135" width="72" height="30" rx="8"/><text class="sT" x="402" y="155" text-anchor="middle">[1, 3]</text><text class="sS" x="434" y="132" text-anchor="end">5</text></g>
<g data-s="3"><rect class="sB" x="451" y="77" width="72" height="30" rx="8"/><text class="sT" x="487" y="97" text-anchor="middle">[2]</text><text class="sS" x="519" y="74" text-anchor="end">6</text></g>
<g data-s="3"><rect class="sB" x="536" y="135" width="72" height="30" rx="8"/><text class="sT" x="572" y="155" text-anchor="middle">[2, 3]</text><text class="sS" x="604" y="132" text-anchor="end">7</text></g>
<g data-s="4"><rect class="sB" x="621" y="77" width="72" height="30" rx="8"/><text class="sT" x="657" y="97" text-anchor="middle">[3]</text><text class="sS" x="689" y="74" text-anchor="end">8</text></g>
<text class="sS" x="700" y="236" text-anchor="end">8 subsets = 2³: every call records one</text>
</svg><ol class="dia-steps">
<li>Go(0) records the empty subset first (result #1), then tries each number as the next choice.</li>
<li>Choose 1 and explore everything that starts with it: [1], [1, 2], [1, 2, 3], then un-choose 2 and try [1, 3].</li>
<li>Un-choose 1, choose 2: [2] and [2, 3]. Starting at i + 1 is what prevents [2, 1], a duplicate of [1, 2].</li>
<li>Finally [3]. Eight calls, eight subsets: 2ⁿ, which is why backtracking is exponential by nature.</li>
</ol><figcaption>The call tree of the code above for nums = [1, 2, 3], generated by running it. Numbers show the order subsets enter result.</figcaption></figure>

The cost is exponential by nature (2ⁿ subsets, n! permutations); say so.

## S4.15 Quick pattern finder 🟢 ⭐

| If the problem says… | Reach for |
|---|---|
| "pair / complement / seen before / count" | Hash map or set |
| "sorted array", "from both ends", "in place" | Two pointers |
| "longest or shortest contiguous…" | Sliding window |
| "matching brackets", "next greater", "undo" | Stack |
| "intervals", "meetings", "closest" | Sort first |
| "sorted", or "minimum value that works" | Binary search |
| "tree", "depth", "path sum" | Recursion (DFS) |
| "shortest number of steps", "levels" | BFS with a queue |
| "connected", "islands", "regions" | DFS/BFS or union-find |
| "k largest / most frequent" | Heap |
| "number of ways", "minimum cost", "can you reach" with overlapping choices | Dynamic programming |
| "all combinations / permutations" | Backtracking |

> [!lab] A three-week plan
> Use a curated list such as [NeetCode 150](https://neetcode.io/practice) or [LeetCode's Top Interview 150](https://leetcode.com/studyplan/top-interview-150/). Week 1: arrays, hashing, two pointers, stack (easy). Week 2: sliding window, binary search, trees, heaps. Week 3: graphs, intervals, 1-D DP. Solve in C#, then re-solve your hardest five in the language of the job. Time-box each problem to 30 minutes; if stuck, read the idea (not the code), then write it yourself.

## S4.16 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What does O(n log n) mean? | The work grows a bit faster than linearly: n items times log n levels, as in merge sort. |
| Average lookup cost in a hash map, and the worst case? | O(1) average; O(n) worst case if many keys collide (rare with a good hash function). |
| Array vs linked list? | Arrays give O(1) index access and cache-friendly memory but O(n) middle inserts; linked lists give O(1) insert at a known node but O(n) access. |
| Stack vs queue? | Stack is last-in-first-out; queue is first-in-first-out. |
| When would you use BFS over DFS? | For the shortest path in an unweighted graph, because BFS explores level by level. |
| What's a heap good for? | Repeatedly getting the smallest or largest item in O(log n), such as top-k or scheduling. |
| Memoisation vs tabulation? | Both are DP: memoisation caches recursive calls top-down; tabulation fills a table bottom-up. |
| What makes binary search applicable? | A sorted order, or a monotonic yes/no condition over the answer space. |
| Is `List<T>.Contains` fast? | No, it's O(n); use a HashSet for membership. |
| Why is in-order traversal of a BST useful? | It visits the keys in sorted order. |
| What's the space complexity of recursion? | O(maximum depth) for the call stack, beyond any data you store. |
| How do you find a cycle in a linked list? | Floyd's fast and slow pointers: if they ever meet, there's a cycle. O(n) time, O(1) space. |

## Key takeaways

> [!check]
> - Clarify, give examples, start brute force, name the pattern, code cleanly, test and state complexity, out loud.
> - Most interview problems are one of about a dozen patterns. Learn to recognise the signal words.
> - Hash maps trade memory for speed; sorting first often removes a nested loop.
> - Know the hidden O(n) operations in your language's collections.
> - Practise daily for weeks; reading solutions isn't the same skill as producing them.

## Sources

- Microsoft Learn: [Collections and data structures in .NET](https://learn.microsoft.com/en-us/dotnet/standard/collections/), [PriorityQueue<TElement,TPriority>](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.priorityqueue-2), [Array.Sort (unstable, introspective sort)](https://learn.microsoft.com/en-us/dotnet/api/system.array.sort).
- MDN: [Array.prototype.sort (stable since ES2019)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).
- Python docs: [Time complexity of built-in types (wiki)](https://wiki.python.org/moin/TimeComplexity), [heapq](https://docs.python.org/3/library/heapq.html).
- Cormen, Leiserson, Rivest and Stein, *Introduction to Algorithms*, 4th ed. (MIT Press, 2022), the standard reference.
- Practice lists: [NeetCode](https://neetcode.io/practice), [LeetCode study plans](https://leetcode.com/studyplan/).
