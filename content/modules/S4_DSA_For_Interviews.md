# Data Structures and Algorithms for Interviews — Patterns, Not Memorisation

Egyptian product companies and anyone hiring for remote roles usually include a live coding round, on a shared editor, HackerRank or Codility. Outsourcing and enterprise shops often skip it or keep it light. Either way, the bar for entry and mid level is **easy-to-medium problems, solved cleanly, with the complexity explained**. This module teaches the dozen patterns that cover most of those problems, in C# (your strongest language) with notes for JavaScript and Python.

> [!focus]
> **Entry must:** state Big-O for your own code; choose between array, list, hash map, set, stack, queue and heap; solve easy problems with hashing, two pointers and simple recursion; talk while you code.
> **Mid adds:** sliding window, BFS/DFS on grids and graphs, binary search on the answer, heaps for top-k, basic dynamic programming.
> **Most asked patterns:** *two-sum (hash map)* · *valid parentheses (stack)* · *longest substring without repeats (sliding window)* · *merge intervals (sort)* · *number of islands (BFS/DFS)* · *top-k frequent (heap)* · *climbing stairs or coin change (DP)*.
> **Time budget:** this module takes 4 hours to read; the skill takes 3–4 weeks of 2–3 problems a day.

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

Other classics: two-sum on a sorted array (move left up if the sum is too small, right down if too big), remove duplicates in place, container with most water, merging two sorted arrays.

## S4.6 Pattern 3 — Sliding window 🟡 ⭐

**Signal:** "longest/shortest **contiguous** subarray or substring such that…".

Grow the window with the right pointer; when it breaks the rule, shrink from the left.

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
