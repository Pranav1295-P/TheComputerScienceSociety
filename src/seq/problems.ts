import type { Problem } from '../data/problems'

export const ARRAY_PROBLEMS: Problem[] = [
  {
    n: 1, title: 'Two Sum', slug: 'two-sum', diff: 'Easy', tier: 'standard', pattern: 'Hash map complement',
    train: 'Walk along the shelf with a notebook. For each book, ask whether its partner has already been written down.',
    insight: 'For each x, you are really searching for target - x. A hash map makes that search O(1).',
    walk: ['Keep a map from value to index.', 'For each x, look up target - x.', 'If found, return both indexes.', 'Otherwise store x.'],
    hints: ['What is the brute force, and what does it cost?', 'Given x, what exact value do you need?', 'What structure answers "have I seen this?" fastest?'],
    edges: ['Same element cannot be used twice', 'Duplicates such as [3, 3]', 'Negative numbers'],
    probe: 'Moving from O(n²) to O(n), and being able to explain the space trade-off.',
    time: 'O(n)', space: 'O(n)',
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            auto it = seen.find(target - nums[i]);
            if (it != seen.end()) return {it->second, i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
    py: `class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, x in enumerate(nums):
            if target - x in seen:
                return [seen[target - x], i]
            seen[x] = i
        return []`,
  },
  {
    n: 121, title: 'Best Time to Buy and Sell Stock', slug: 'best-time-to-buy-and-sell-stock', diff: 'Easy', tier: 'standard', pattern: 'Running minimum',
    train: 'Walk the shelf left to right, remembering the cheapest book so far. Each new book asks: what if I sold here?',
    insight: 'The best sale on any day uses the lowest price before that day, which one variable can track.',
    walk: ['Track the minimum price so far.', 'At each price, compute the profit against the minimum.', 'Keep the best profit.'],
    hints: ['If you sell today, which earlier day should you have bought on?', 'Do you need to remember every earlier price?'],
    edges: ['Prices only fall, so the answer is 0', 'Single day'],
    probe: 'Reducing a pair search to one pass by keeping a running summary.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int best = 0, low = INT_MAX;
        for (int p : prices) {
            low = min(low, p);
            best = max(best, p - low);
        }
        return best;
    }
};`,
    py: `class Solution:
    def maxProfit(self, prices):
        best, low = 0, float('inf')
        for p in prices:
            low = min(low, p)
            best = max(best, p - low)
        return best`,
  },
  {
    n: 217, title: 'Contains Duplicate', slug: 'contains-duplicate', diff: 'Easy', tier: 'standard', pattern: 'Hash set',
    train: 'As each book is checked, tick its number on a list. A number already ticked is a duplicate.',
    insight: 'A set answers membership in expected O(1).',
    walk: ['Create an empty set.', 'For each x, return true if it is in the set.', 'Otherwise add it.'],
    hints: ['Sorting works. What does it cost?', 'How can you remember what you have seen?'],
    edges: ['Empty or single element', 'Sorting changes the input order'],
    probe: 'Stating both the sort and hash trade-offs, not only one.',
    time: 'O(n)', space: 'O(n)',
    cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen;
        for (int x : nums)
            if (!seen.insert(x).second) return true;
        return false;
    }
};`,
    py: `class Solution:
    def containsDuplicate(self, nums):
        seen = set()
        for x in nums:
            if x in seen:
                return True
            seen.add(x)
        return False`,
  },
  {
    n: 283, title: 'Move Zeroes', slug: 'move-zeroes', diff: 'Easy', tier: 'standard', pattern: 'Read and write pointers',
    train: 'One bookmark scans the shelf, and another marks where the next real book belongs.',
    insight: 'Everything before the write pointer is finished, so swapping real values into it preserves their order.',
    walk: ['write = 0.', 'Scan with i.', 'When nums[i] is non-zero, swap into write and advance write.'],
    hints: ['Can you do it without an extra array?', 'What does the region before your write position look like?'],
    edges: ['All zeros', 'No zeros', 'Order of non-zero values must be kept'],
    probe: 'The read/write pointer template, which appears in many in-place problems.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int write = 0;
        for (int i = 0; i < (int)nums.size(); i++)
            if (nums[i] != 0) swap(nums[write++], nums[i]);
    }
};`,
    py: `class Solution:
    def moveZeroes(self, nums):
        write = 0
        for i, x in enumerate(nums):
            if x != 0:
                nums[write], nums[i] = nums[i], nums[write]
                write += 1`,
  },
  {
    n: 704, title: 'Binary Search', slug: 'binary-search', diff: 'Easy', tier: 'standard', pattern: 'Binary search',
    train: 'Open the middle of a sorted shelf. One comparison rules out half of it.',
    insight: 'Maintain the invariant that if the target exists, it lies within lo..hi.',
    walk: ['lo = 0, hi = n - 1.', 'While lo <= hi, compute mid.', 'Return on a match, otherwise discard a half.'],
    hints: ['What do you learn from comparing with the middle?', 'When is the search range empty?'],
    edges: ['Target absent', 'Single element', 'mid overflow in fixed-width integers'],
    probe: 'Getting the boundaries right. Use lo + (hi - lo) / 2 in C++ and Java.',
    time: 'O(log n)', space: 'O(1)',
    cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
};`,
    py: `class Solution:
    def search(self, nums, target):
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1`,
  },
  {
    n: 238, title: 'Product of Array Except Self', slug: 'product-of-array-except-self', diff: 'Medium', tier: 'maang', pattern: 'Prefix and suffix',
    train: 'Each slot needs the product of all books to its left and all books to its right. Make one pass each way.',
    insight: 'answer[i] = (product of everything before i) × (product of everything after i), with no division.',
    walk: ['Left pass: store the prefix product in answer.', 'Right pass: multiply in a running suffix.', 'Return answer.'],
    hints: ['What if division were allowed, and why do zeros break it?', 'Split "everything else" into two parts.'],
    edges: ['One zero', 'Two or more zeros', 'Negative values'],
    probe: 'Prefix thinking, and the O(1) extra space follow-up.',
    time: 'O(n)', space: 'O(1) extra',
    cpp: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> ans(n, 1);
        for (int i = 1; i < n; i++) ans[i] = ans[i - 1] * nums[i - 1];
        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            ans[i] *= right;
            right *= nums[i];
        }
        return ans;
    }
};`,
    py: `class Solution:
    def productExceptSelf(self, nums):
        n = len(nums)
        ans = [1] * n
        for i in range(1, n):
            ans[i] = ans[i - 1] * nums[i - 1]
        right = 1
        for i in range(n - 1, -1, -1):
            ans[i] *= right
            right *= nums[i]
        return ans`,
  },
  {
    n: 53, title: 'Maximum Subarray', slug: 'maximum-subarray', diff: 'Medium', tier: 'maang', pattern: "Kadane's algorithm",
    train: 'Carry a running total along the shelf. If the total behind you is negative, drop it and start fresh here.',
    insight: 'A negative prefix can only reduce whatever comes next, so it should be discarded.',
    walk: ['cur = best = nums[0].', 'cur = max(x, cur + x).', 'best = max(best, cur).'],
    hints: ['What is the best subarray that ends exactly here?', 'When is extending worse than starting over?'],
    edges: ['All negative: pick the largest single value', 'Single element'],
    probe: 'Explaining this as dynamic programming with one state.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int cur = nums[0], best = nums[0];
        for (int i = 1; i < (int)nums.size(); i++) {
            cur = max(nums[i], cur + nums[i]);
            best = max(best, cur);
        }
        return best;
    }
};`,
    py: `class Solution:
    def maxSubArray(self, nums):
        cur = best = nums[0]
        for x in nums[1:]:
            cur = max(x, cur + x)
            best = max(best, cur)
        return best`,
  },
  {
    n: 15, title: '3Sum', slug: '3sum', diff: 'Medium', tier: 'maang', pattern: 'Sort + two pointers',
    train: 'Sort the shelf. Fix one book, then squeeze two bookmarks inward from both sides of the rest.',
    insight: 'Sorting turns the inner search into two pointers, and makes duplicates adjacent so they are easy to skip.',
    walk: ['Sort.', 'For each i, skip duplicates.', 'Move L and R by the sign of the sum.', 'On a hit, record and skip duplicates on both sides.'],
    hints: ['Reduce it to a two-sum problem.', 'What does sorting make easy?', 'How do you avoid repeated triples?'],
    edges: ['All zeros', 'Duplicate triples', 'Fewer than 3 numbers'],
    probe: 'Careful duplicate handling while keeping O(n²).',
    time: 'O(n²)', space: 'O(1) extra',
    cpp: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& a) {
        sort(a.begin(), a.end());
        vector<vector<int>> out;
        int n = a.size();
        for (int i = 0; i < n - 2; i++) {
            if (i && a[i] == a[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = a[i] + a[l] + a[r];
                if (s < 0) l++;
                else if (s > 0) r--;
                else {
                    out.push_back({a[i], a[l], a[r]});
                    l++;
                    r--;
                    while (l < r && a[l] == a[l - 1]) l++;
                }
            }
        }
        return out;
    }
};`,
    py: `class Solution:
    def threeSum(self, a):
        a.sort()
        out = []
        for i in range(len(a) - 2):
            if i and a[i] == a[i - 1]:
                continue
            l, r = i + 1, len(a) - 1
            while l < r:
                s = a[i] + a[l] + a[r]
                if s < 0:
                    l += 1
                elif s > 0:
                    r -= 1
                else:
                    out.append([a[i], a[l], a[r]])
                    l += 1
                    r -= 1
                    while l < r and a[l] == a[l - 1]:
                        l += 1
        return out`,
  },
  {
    n: 56, title: 'Merge Intervals', slug: 'merge-intervals', diff: 'Medium', tier: 'maang', pattern: 'Sort by start',
    train: 'Line the bookings up by start time. Each one either extends the current block or starts a new one.',
    insight: 'After sorting, only the most recent merged interval can overlap the next one.',
    walk: ['Sort by start.', 'If the next start is within the last end, extend it.', 'Otherwise append.'],
    hints: ['What order makes overlaps adjacent?', 'Which merged interval could the next one touch?'],
    edges: ['Touching intervals such as [1,4] and [4,5]', 'One interval inside another'],
    probe: 'Using max for the end, so a contained interval does not shrink it.',
    time: 'O(n log n)', space: 'O(n)',
    cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& iv) {
        sort(iv.begin(), iv.end());
        vector<vector<int>> out;
        for (auto& x : iv) {
            if (!out.empty() && x[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], x[1]);
            else out.push_back(x);
        }
        return out;
    }
};`,
    py: `class Solution:
    def merge(self, iv):
        iv.sort()
        out = []
        for s, e in iv:
            if out and s <= out[-1][1]:
                out[-1][1] = max(out[-1][1], e)
            else:
                out.append([s, e])
        return out`,
  },
  {
    n: 42, title: 'Trapping Rain Water', slug: 'trapping-rain-water', diff: 'Hard', tier: 'maang', pattern: 'Two pointers with boundaries',
    train: 'Books of different heights form walls. Water above a slot rises to the shorter of the tallest walls on each side.',
    insight: 'Whichever side has the shorter wall is already decided, because the other side is at least that tall.',
    walk: ['L and R at the ends, with leftMax and rightMax.', 'Process the side with the smaller height.', 'Add max minus height.'],
    hints: ['Find the water above one slot.', 'Can you avoid storing prefix maximums?', 'Why is the smaller side safe to settle?'],
    edges: ['Fewer than 3 bars', 'Strictly increasing heights'],
    probe: 'Justifying the two-pointer step, not just writing it.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    int trap(vector<int>& h) {
        int l = 0, r = (int)h.size() - 1, lm = 0, rm = 0, water = 0;
        while (l < r) {
            if (h[l] < h[r]) {
                lm = max(lm, h[l]);
                water += lm - h[l++];
            } else {
                rm = max(rm, h[r]);
                water += rm - h[r--];
            }
        }
        return water;
    }
};`,
    py: `class Solution:
    def trap(self, h):
        l, r, lm, rm, water = 0, len(h) - 1, 0, 0, 0
        while l < r:
            if h[l] < h[r]:
                lm = max(lm, h[l])
                water += lm - h[l]
                l += 1
            else:
                rm = max(rm, h[r])
                water += rm - h[r]
                r -= 1
        return water`,
  },
]

export const STACK_PROBLEMS: Problem[] = [
  {
    n: 20, title: 'Valid Parentheses', slug: 'valid-parentheses', diff: 'Easy', tier: 'standard', pattern: 'Matching with a stack',
    train: 'Each opening bracket goes into a tin. A closing bracket must match the tin on top.',
    insight: 'The most recently opened bracket has to close first, which is exactly LIFO.',
    walk: ['Push openers.', 'On a closer, the top must be its partner.', 'At the end, the stack must be empty.'],
    hints: ['Which opener must a closer match?', 'What if a closer comes when nothing is open?'],
    edges: ['Starts with a closer', 'Unclosed opener at the end', 'Odd length'],
    probe: 'Checking both the empty stack and the leftover stack.',
    time: 'O(n)', space: 'O(n)',
    cpp: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '[' || c == '{') { st.push(c); continue; }
            if (st.empty()) return false;
            char t = st.top();
            st.pop();
            if ((c == ')' && t != '(') || (c == ']' && t != '[') || (c == '}' && t != '{')) return false;
        }
        return st.empty();
    }
};`,
    py: `class Solution:
    def isValid(self, s):
        pair = {')': '(', ']': '[', '}': '{'}
        st = []
        for c in s:
            if c in pair:
                if not st or st.pop() != pair[c]:
                    return False
            else:
                st.append(c)
        return not st`,
  },
  {
    n: 155, title: 'Min Stack', slug: 'min-stack', diff: 'Medium', tier: 'standard', pattern: 'Auxiliary state per element',
    train: 'Each tin has a label recording the smallest item at or below it, so the answer is always on the top tin.',
    insight: 'The minimum only changes on push and pop, so store it alongside each element.',
    walk: ['Each entry stores value and minimum so far.', 'push computes the new minimum.', 'getMin reads the top.'],
    hints: ['What must be true after popping the current minimum?', 'What if each element remembered more?'],
    edges: ['Duplicates of the minimum', 'Negative values'],
    probe: 'Trading O(n) space for O(1) on every operation.',
    time: 'O(1) per operation', space: 'O(n)',
    cpp: `class MinStack {
    vector<pair<int, int>> st;
public:
    void push(int val) {
        st.push_back({val, st.empty() ? val : min(val, st.back().second)});
    }
    void pop() { st.pop_back(); }
    int top() { return st.back().first; }
    int getMin() { return st.back().second; }
};`,
    py: `class MinStack:
    def __init__(self):
        self.st = []

    def push(self, val):
        low = min(val, self.st[-1][1]) if self.st else val
        self.st.append((val, low))

    def pop(self):
        self.st.pop()

    def top(self):
        return self.st[-1][0]

    def getMin(self):
        return self.st[-1][1]`,
  },
  {
    n: 232, title: 'Implement Queue using Stacks', slug: 'implement-queue-using-stacks', diff: 'Easy', tier: 'standard', pattern: 'Two stacks',
    train: 'Pour one tiffin carrier into another and the order flips: the first tin in is now on top.',
    insight: 'Only pour when the output stack is empty, so each element moves at most once.',
    walk: ['push goes to the in-stack.', 'pop and peek use the out-stack.', 'Refill out only when it is empty.'],
    hints: ['What happens to order when you pop everything onto another stack?', 'When is it safe to transfer?'],
    edges: ['Interleaved push and pop', 'Pouring while out still has items breaks the order'],
    probe: 'Explaining amortized O(1).',
    time: 'Amortized O(1)', space: 'O(n)',
    cpp: `class MyQueue {
    stack<int> in, out;
    void pour() {
        if (!out.empty()) return;
        while (!in.empty()) { out.push(in.top()); in.pop(); }
    }
public:
    void push(int x) { in.push(x); }
    int pop() { pour(); int v = out.top(); out.pop(); return v; }
    int peek() { pour(); return out.top(); }
    bool empty() { return in.empty() && out.empty(); }
};`,
    py: `class MyQueue:
    def __init__(self):
        self.a, self.b = [], []

    def _pour(self):
        if not self.b:
            while self.a:
                self.b.append(self.a.pop())

    def push(self, x):
        self.a.append(x)

    def pop(self):
        self._pour()
        return self.b.pop()

    def peek(self):
        self._pour()
        return self.b[-1]

    def empty(self):
        return not self.a and not self.b`,
  },
  {
    n: 150, title: 'Evaluate Reverse Polish Notation', slug: 'evaluate-reverse-polish-notation', diff: 'Medium', tier: 'standard', pattern: 'Expression stack',
    train: 'Numbers go on as tins. An operator takes off the top two and puts one result back.',
    insight: 'Operands arrive before their operator, so they just wait on the stack.',
    walk: ['Push numbers.', 'On an operator, pop b then a.', 'Push a op b.'],
    hints: ['Where do numbers wait until an operator arrives?', 'Which popped value is the left operand?'],
    edges: ['Division truncates toward zero', 'Subtraction order', 'Negative number tokens'],
    probe: 'Operand order, and truncation in Python.',
    time: 'O(n)', space: 'O(n)',
    cpp: `class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        vector<long long> st;
        for (auto& t : tokens) {
            if (t == "+" || t == "-" || t == "*" || t == "/") {
                long long b = st.back(); st.pop_back();
                long long a = st.back(); st.pop_back();
                if (t == "+") st.push_back(a + b);
                else if (t == "-") st.push_back(a - b);
                else if (t == "*") st.push_back(a * b);
                else st.push_back(a / b);
            } else st.push_back(stoll(t));
        }
        return st.back();
    }
};`,
    py: `class Solution:
    def evalRPN(self, tokens):
        st = []
        for t in tokens:
            if t in '+-*/' and len(t) == 1:
                b, a = st.pop(), st.pop()
                if t == '+':
                    st.append(a + b)
                elif t == '-':
                    st.append(a - b)
                elif t == '*':
                    st.append(a * b)
                else:
                    st.append(int(a / b))
            else:
                st.append(int(t))
        return st[0]`,
  },
  {
    n: 496, title: 'Next Greater Element I', slug: 'next-greater-element-i', diff: 'Easy', tier: 'standard', pattern: 'Monotonic stack',
    train: 'Tins wait for something bigger to arrive. When it does, every smaller tin on top gets its answer.',
    insight: 'One pass over nums2 builds a map of next-greater values, and each element is popped at most once.',
    walk: ['Scan nums2 with a decreasing stack.', 'While top < x, record next[top] = x.', 'Answer queries from the map.'],
    hints: ['What is the brute force on nums2?', 'What are the elements still on the stack waiting for?'],
    edges: ['No greater element returns -1', 'nums1 is a subset of nums2'],
    probe: 'Recognising monotonic stack problems from "next greater" wording.',
    time: 'O(m + n)', space: 'O(n)',
    cpp: `class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& a, vector<int>& b) {
        unordered_map<int, int> nxt;
        vector<int> st;
        for (int x : b) {
            while (!st.empty() && st.back() < x) { nxt[st.back()] = x; st.pop_back(); }
            st.push_back(x);
        }
        vector<int> out;
        for (int x : a) out.push_back(nxt.count(x) ? nxt[x] : -1);
        return out;
    }
};`,
    py: `class Solution:
    def nextGreaterElement(self, a, b):
        nxt, st = {}, []
        for x in b:
            while st and st[-1] < x:
                nxt[st.pop()] = x
            st.append(x)
        return [nxt.get(x, -1) for x in a]`,
  },
  {
    n: 739, title: 'Daily Temperatures', slug: 'daily-temperatures', diff: 'Medium', tier: 'maang', pattern: 'Monotonic stack of indexes',
    train: 'Each day waits in a tin for a warmer day. A warm day clears all cooler days above it.',
    insight: 'Store indexes rather than values, because the answer is a distance.',
    walk: ['Keep indexes with decreasing temperatures.', 'While today is warmer than the top, pop and record the gap.', 'Push today.'],
    hints: ['Who is still waiting at each point?', 'What do you need to compute a distance?'],
    edges: ['Never warmer: answer 0', 'All equal temperatures'],
    probe: 'Explaining why nested loops still give O(n).',
    time: 'O(n)', space: 'O(n)',
    cpp: `class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& t) {
        vector<int> ans(t.size()), st;
        for (int i = 0; i < (int)t.size(); i++) {
            while (!st.empty() && t[st.back()] < t[i]) {
                ans[st.back()] = i - st.back();
                st.pop_back();
            }
            st.push_back(i);
        }
        return ans;
    }
};`,
    py: `class Solution:
    def dailyTemperatures(self, t):
        ans, st = [0] * len(t), []
        for i, x in enumerate(t):
            while st and t[st[-1]] < x:
                j = st.pop()
                ans[j] = i - j
            st.append(i)
        return ans`,
  },
  {
    n: 84, title: 'Largest Rectangle in Histogram', slug: 'largest-rectangle-in-histogram', diff: 'Hard', tier: 'maang', pattern: 'Monotonic stack, boundaries',
    train: 'A bar stays in the carrier while it can still extend. A shorter bar arriving ends it, and its width is now known.',
    insight: 'When a bar is popped, the current index is its right boundary and the new top is its left boundary.',
    walk: ['Keep increasing heights.', 'Append a sentinel height 0.', 'On pop, width = i - newTop - 1.', 'Track the best area.'],
    hints: ['For one bar, how far can it stretch?', 'What ends a bar\'s extension?', 'How do you flush the stack at the end?'],
    edges: ['Increasing heights', 'All equal', 'Empty stack on pop gives width i'],
    probe: 'Deriving the width formula under pressure.',
    time: 'O(n)', space: 'O(n)',
    cpp: `class Solution {
public:
    int largestRectangleArea(vector<int>& h) {
        h.push_back(0);
        vector<int> st;
        int best = 0;
        for (int i = 0; i < (int)h.size(); i++) {
            while (!st.empty() && h[st.back()] >= h[i]) {
                int height = h[st.back()];
                st.pop_back();
                int width = st.empty() ? i : i - st.back() - 1;
                best = max(best, height * width);
            }
            st.push_back(i);
        }
        return best;
    }
};`,
    py: `class Solution:
    def largestRectangleArea(self, h):
        st, best = [], 0
        for i, x in enumerate(h + [0]):
            while st and h[st[-1]] >= x:
                height = h[st.pop()]
                width = i if not st else i - st[-1] - 1
                best = max(best, height * width)
            st.append(i)
        return best`,
  },
  {
    n: 394, title: 'Decode String', slug: 'decode-string', diff: 'Medium', tier: 'maang', pattern: 'Stack of contexts',
    train: 'Opening a bracket packs your unfinished work into a tin. Closing it brings that work back.',
    insight: 'Nesting means an inner expression must finish before the outer one continues.',
    walk: ['Build digits into k.', 'On [, push (current, k) and reset.', 'On ], pop and combine.'],
    hints: ['What do you have to remember when entering a bracket?', 'What about numbers with several digits?'],
    edges: ['Nested brackets', 'Multi-digit counts', 'Letters after a bracket'],
    probe: 'Using an explicit stack in place of recursion, and clean state handling.',
    time: 'O(output)', space: 'O(output)',
    cpp: `class Solution {
public:
    string decodeString(string s) {
        vector<pair<string, int>> st;
        string cur;
        int k = 0;
        for (char c : s) {
            if (isdigit(c)) k = k * 10 + (c - '0');
            else if (c == '[') { st.push_back({cur, k}); cur = ""; k = 0; }
            else if (c == ']') {
                auto [prev, times] = st.back();
                st.pop_back();
                string out = prev;
                for (int i = 0; i < times; i++) out += cur;
                cur = out;
            } else cur += c;
        }
        return cur;
    }
};`,
    py: `class Solution:
    def decodeString(self, s):
        st, cur, k = [], '', 0
        for c in s:
            if c.isdigit():
                k = k * 10 + int(c)
            elif c == '[':
                st.append((cur, k))
                cur, k = '', 0
            elif c == ']':
                prev, times = st.pop()
                cur = prev + cur * times
            else:
                cur += c
        return cur`,
  },
  {
    n: 735, title: 'Asteroid Collision', slug: 'asteroid-collision', diff: 'Medium', tier: 'maang', pattern: 'Simulation with a stack',
    train: 'Survivors wait in the carrier. Only a left-moving newcomer against a right-moving top can collide.',
    insight: 'A collision only ever involves the newest survivor, so the top of the stack is all that matters.',
    walk: ['For each asteroid, resolve while top > 0 and x < 0.', 'Pop smaller tops.', 'Equal sizes destroy both.', 'Push if still alive.'],
    hints: ['Which pair of directions actually collides?', 'Can one newcomer destroy several?'],
    edges: ['Equal sizes', 'All moving the same way', 'Left-mover with an empty stack'],
    probe: 'Getting the loop and alive flag right.',
    time: 'O(n)', space: 'O(n)',
    cpp: `class Solution {
public:
    vector<int> asteroidCollision(vector<int>& a) {
        vector<int> st;
        for (int x : a) {
            bool alive = true;
            while (alive && x < 0 && !st.empty() && st.back() > 0) {
                if (st.back() < -x) st.pop_back();
                else {
                    if (st.back() == -x) st.pop_back();
                    alive = false;
                }
            }
            if (alive) st.push_back(x);
        }
        return st;
    }
};`,
    py: `class Solution:
    def asteroidCollision(self, a):
        st = []
        for x in a:
            alive = True
            while alive and x < 0 and st and st[-1] > 0:
                if st[-1] < -x:
                    st.pop()
                else:
                    if st[-1] == -x:
                        st.pop()
                    alive = False
            if alive:
                st.append(x)
        return st`,
  },
  {
    n: 224, title: 'Basic Calculator', slug: 'basic-calculator', diff: 'Hard', tier: 'maang', pattern: 'Sign stack',
    train: 'On an opening bracket, pack the running total and sign into a tin. On closing, unpack and combine.',
    insight: 'Everything is a sum of signed terms, and brackets only change the sign context.',
    walk: ['Keep result and sign.', 'On (, push both and reset.', 'On ), multiply by the saved sign and add the saved result.'],
    hints: ['Can subtraction be treated as adding a negative?', 'What must a bracket remember?'],
    edges: ['Unary minus', 'Spaces', 'Multi-digit numbers', 'Nested brackets'],
    probe: 'Parsing discipline, without eval.',
    time: 'O(n)', space: 'O(n)',
    cpp: `class Solution {
public:
    int calculate(string s) {
        vector<long long> st;
        long long res = 0, num = 0;
        int sign = 1;
        for (char c : s) {
            if (isdigit(c)) num = num * 10 + (c - '0');
            else if (c == '+' || c == '-') {
                res += sign * num;
                num = 0;
                sign = c == '+' ? 1 : -1;
            } else if (c == '(') {
                st.push_back(res);
                st.push_back(sign);
                res = 0;
                sign = 1;
            } else if (c == ')') {
                res += sign * num;
                num = 0;
                res *= st.back(); st.pop_back();
                res += st.back(); st.pop_back();
            }
        }
        return res + sign * num;
    }
};`,
    py: `class Solution:
    def calculate(self, s):
        st, res, num, sign = [], 0, 0, 1
        for c in s:
            if c.isdigit():
                num = num * 10 + int(c)
            elif c in '+-':
                res += sign * num
                num = 0
                sign = 1 if c == '+' else -1
            elif c == '(':
                st += [res, sign]
                res, sign = 0, 1
            elif c == ')':
                res += sign * num
                num = 0
                res *= st.pop()
                res += st.pop()
        return res + sign * num`,
  },
]

export const QUEUE_PROBLEMS: Problem[] = [
  {
    n: 933, title: 'Number of Recent Calls', slug: 'number-of-recent-calls', diff: 'Easy', tier: 'standard', pattern: 'Time-window queue',
    train: 'Tokens are stamped with arrival time. Before counting, send away anyone older than the window.',
    insight: 'Timestamps arrive in order, so all expired entries are at the front.',
    walk: ['Enqueue t.', 'Dequeue while front < t - 3000.', 'Return the size.'],
    hints: ['Where are the oldest timestamps?', 'Does an expired entry ever become useful again?'],
    edges: ['Exactly t - 3000 counts as inside', 'Single call'],
    probe: 'Why each element costs amortized O(1).',
    time: 'Amortized O(1)', space: 'O(window)',
    cpp: `class RecentCounter {
    queue<int> q;
public:
    int ping(int t) {
        q.push(t);
        while (q.front() < t - 3000) q.pop();
        return q.size();
    }
};`,
    py: `from collections import deque

class RecentCounter:
    def __init__(self):
        self.q = deque()

    def ping(self, t):
        self.q.append(t)
        while self.q[0] < t - 3000:
            self.q.popleft()
        return len(self.q)`,
  },
  {
    n: 622, title: 'Design Circular Queue', slug: 'design-circular-queue', diff: 'Medium', tier: 'standard', pattern: 'Ring buffer',
    train: 'Compartments form a ring. The markers move forward and wrap around, reusing freed compartments.',
    insight: 'Store front and count, and rear can be derived. That avoids the full-versus-empty ambiguity.',
    walk: ['Array, front, count.', 'enQueue writes at (front + count) % cap.', 'deQueue advances front.'],
    hints: ['How do you tell full from empty when front == rear?', 'How do you wrap an index?'],
    edges: ['Capacity 1', 'Rear on an empty queue returns -1', 'Wrap-around'],
    probe: 'Getting the modular arithmetic exactly right.',
    time: 'O(1) per operation', space: 'O(k)',
    cpp: `class MyCircularQueue {
    vector<int> a;
    int front = 0, count = 0;
public:
    MyCircularQueue(int k) : a(k) {}
    bool enQueue(int v) {
        if (isFull()) return false;
        a[(front + count++) % a.size()] = v;
        return true;
    }
    bool deQueue() {
        if (isEmpty()) return false;
        front = (front + 1) % a.size();
        count--;
        return true;
    }
    int Front() { return isEmpty() ? -1 : a[front]; }
    int Rear() { return isEmpty() ? -1 : a[(front + count - 1) % a.size()]; }
    bool isEmpty() { return count == 0; }
    bool isFull() { return count == (int)a.size(); }
};`,
    py: `class MyCircularQueue:
    def __init__(self, k):
        self.a, self.front, self.count = [0] * k, 0, 0

    def enQueue(self, v):
        if self.isFull():
            return False
        self.a[(self.front + self.count) % len(self.a)] = v
        self.count += 1
        return True

    def deQueue(self):
        if self.isEmpty():
            return False
        self.front = (self.front + 1) % len(self.a)
        self.count -= 1
        return True

    def Front(self):
        return -1 if self.isEmpty() else self.a[self.front]

    def Rear(self):
        return -1 if self.isEmpty() else self.a[(self.front + self.count - 1) % len(self.a)]

    def isEmpty(self):
        return self.count == 0

    def isFull(self):
        return self.count == len(self.a)`,
  },
  {
    n: 225, title: 'Implement Stack using Queues', slug: 'implement-stack-using-queues', diff: 'Easy', tier: 'standard', pattern: 'Rotation',
    train: 'After someone joins, everyone ahead of them walks round to the back, so the newcomer stands at the gate.',
    insight: 'Rotating n - 1 elements after each push puts the newest element at the front.',
    walk: ['Push to the queue.', 'Rotate size - 1 times.', 'pop and top use the front.'],
    hints: ['How can the newest element reach the front?', 'Which operation should pay the cost?'],
    edges: ['Empty checks', 'Single element needs no rotation'],
    probe: 'Choosing which operation carries the O(n) cost.',
    time: 'push O(n), others O(1)', space: 'O(n)',
    cpp: `class MyStack {
    queue<int> q;
public:
    void push(int x) {
        q.push(x);
        for (int i = 0; i + 1 < (int)q.size(); i++) { q.push(q.front()); q.pop(); }
    }
    int pop() { int v = q.front(); q.pop(); return v; }
    int top() { return q.front(); }
    bool empty() { return q.empty(); }
};`,
    py: `from collections import deque

class MyStack:
    def __init__(self):
        self.q = deque()

    def push(self, x):
        self.q.append(x)
        for _ in range(len(self.q) - 1):
            self.q.append(self.q.popleft())

    def pop(self):
        return self.q.popleft()

    def top(self):
        return self.q[0]

    def empty(self):
        return not self.q`,
  },
  {
    n: 387, title: 'First Unique Character in a String', slug: 'first-unique-character-in-a-string', diff: 'Easy', tier: 'standard', pattern: 'Queue + frequency',
    train: 'Keep characters in arrival order, and send away anyone at the front who has turned out to be a duplicate.',
    insight: 'A queue keeps arrival order, and a count table says whether the front is still unique.',
    walk: ['Count characters.', 'Enqueue each index.', 'Pop the front while its count > 1.', 'Front is the answer.'],
    hints: ['What do you need beyond counts to know "first"?', 'When can the front be discarded forever?'],
    edges: ['No unique character returns -1', 'Single character'],
    probe: 'Recognising the stream version of this problem, where a queue is essential.',
    time: 'O(n)', space: 'O(1) for a fixed alphabet',
    cpp: `class Solution {
public:
    int firstUniqChar(string s) {
        int cnt[26] = {0};
        queue<int> q;
        for (int i = 0; i < (int)s.size(); i++) {
            cnt[s[i] - 'a']++;
            q.push(i);
        }
        while (!q.empty() && cnt[s[q.front()] - 'a'] > 1) q.pop();
        return q.empty() ? -1 : q.front();
    }
};`,
    py: `from collections import Counter, deque

class Solution:
    def firstUniqChar(self, s):
        cnt = Counter(s)
        q = deque(range(len(s)))
        while q and cnt[s[q[0]]] > 1:
            q.popleft()
        return q[0] if q else -1`,
  },
  {
    n: 1700, title: 'Number of Students Unable to Eat Lunch', slug: 'number-of-students-unable-to-eat-lunch', diff: 'Easy', tier: 'standard', pattern: 'Simulation shortcut',
    train: 'A line of students keeps rotating. It only gets stuck when nobody left wants the item on top.',
    insight: 'Their exact order does not matter, only how many want each type.',
    walk: ['Count preferences.', 'Serve sandwiches in order.', 'Stop when no one wants the current one.'],
    hints: ['Simulate first. When does the simulation get stuck?', 'Do you need the order of students?'],
    edges: ['Everybody eats', 'Nobody eats'],
    probe: 'Seeing the invariant that replaces the simulation.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    int countStudents(vector<int>& students, vector<int>& sandwiches) {
        int cnt[2] = {0, 0};
        for (int s : students) cnt[s]++;
        int left = students.size();
        for (int s : sandwiches) {
            if (cnt[s] == 0) break;
            cnt[s]--;
            left--;
        }
        return left;
    }
};`,
    py: `class Solution:
    def countStudents(self, students, sandwiches):
        cnt = [students.count(0), students.count(1)]
        left = len(students)
        for s in sandwiches:
            if cnt[s] == 0:
                break
            cnt[s] -= 1
            left -= 1
        return left`,
  },
  {
    n: 239, title: 'Sliding Window Maximum', slug: 'sliding-window-maximum', diff: 'Hard', tier: 'maang', pattern: 'Monotonic deque',
    train: 'A taller newcomer sends away shorter people behind whom they stand, as those people can never be the tallest again.',
    insight: 'A deque of indexes with decreasing values always has the maximum at the front.',
    walk: ['Pop front if out of the window.', 'Pop back while smaller than x.', 'Push x.', 'Record the front.'],
    hints: ['When can an element never be the maximum?', 'Which structure removes from both ends?'],
    edges: ['k = 1', 'k = n', 'Equal values'],
    probe: 'Why a heap is O(n log n), and why the deque is O(n).',
    time: 'O(n)', space: 'O(k)',
    cpp: `class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& a, int k) {
        deque<int> d;
        vector<int> out;
        for (int i = 0; i < (int)a.size(); i++) {
            if (!d.empty() && d.front() <= i - k) d.pop_front();
            while (!d.empty() && a[d.back()] < a[i]) d.pop_back();
            d.push_back(i);
            if (i >= k - 1) out.push_back(a[d.front()]);
        }
        return out;
    }
};`,
    py: `from collections import deque

class Solution:
    def maxSlidingWindow(self, a, k):
        d, out = deque(), []
        for i, x in enumerate(a):
            if d and d[0] <= i - k:
                d.popleft()
            while d and a[d[-1]] < x:
                d.pop()
            d.append(i)
            if i >= k - 1:
                out.append(a[d[0]])
        return out`,
  },
  {
    n: 641, title: 'Design Circular Deque', slug: 'design-circular-deque', diff: 'Medium', tier: 'maang', pattern: 'Ring buffer, two ends',
    train: 'Ring compartments again, but now people can join or leave at either end.',
    insight: 'Moving front backward needs (front - 1 + cap) % cap, so the index cannot go negative.',
    walk: ['Array, front, count.', 'insertFront steps front back.', 'insertLast writes at front + count.', 'Deletes adjust front or count.'],
    hints: ['What does -1 % cap give in C++?', 'Which single variable can be derived?'],
    edges: ['Capacity 1', 'Reads on an empty deque', 'Wrap both ways'],
    probe: 'Language differences in negative modulo.',
    time: 'O(1) per operation', space: 'O(k)',
    cpp: `class MyCircularDeque {
    vector<int> a;
    int front = 0, count = 0;
    int cap() { return a.size(); }
public:
    MyCircularDeque(int k) : a(k) {}
    bool insertFront(int v) {
        if (isFull()) return false;
        front = (front - 1 + cap()) % cap();
        a[front] = v;
        count++;
        return true;
    }
    bool insertLast(int v) {
        if (isFull()) return false;
        a[(front + count++) % cap()] = v;
        return true;
    }
    bool deleteFront() {
        if (isEmpty()) return false;
        front = (front + 1) % cap();
        count--;
        return true;
    }
    bool deleteLast() {
        if (isEmpty()) return false;
        count--;
        return true;
    }
    int getFront() { return isEmpty() ? -1 : a[front]; }
    int getRear() { return isEmpty() ? -1 : a[(front + count - 1) % cap()]; }
    bool isEmpty() { return count == 0; }
    bool isFull() { return count == cap(); }
};`,
    py: `class MyCircularDeque:
    def __init__(self, k):
        self.a, self.front, self.count = [0] * k, 0, 0

    def insertFront(self, v):
        if self.isFull():
            return False
        self.front = (self.front - 1) % len(self.a)
        self.a[self.front] = v
        self.count += 1
        return True

    def insertLast(self, v):
        if self.isFull():
            return False
        self.a[(self.front + self.count) % len(self.a)] = v
        self.count += 1
        return True

    def deleteFront(self):
        if self.isEmpty():
            return False
        self.front = (self.front + 1) % len(self.a)
        self.count -= 1
        return True

    def deleteLast(self):
        if self.isEmpty():
            return False
        self.count -= 1
        return True

    def getFront(self):
        return -1 if self.isEmpty() else self.a[self.front]

    def getRear(self):
        return -1 if self.isEmpty() else self.a[(self.front + self.count - 1) % len(self.a)]

    def isEmpty(self):
        return self.count == 0

    def isFull(self):
        return self.count == len(self.a)`,
  },
  {
    n: 994, title: 'Rotting Oranges', slug: 'rotting-oranges', diff: 'Medium', tier: 'maang', pattern: 'Multi-source BFS',
    train: 'Every rotten orange joins the queue at time 0. Each round, the whole line spreads to its neighbours.',
    insight: 'Starting BFS from all sources at once gives each cell its earliest time.',
    walk: ['Enqueue all rotten cells and count fresh.', 'Process level by level.', 'Each level is one minute.', 'If fresh remain, return -1.'],
    hints: ['Why would starting from one orange be wrong?', 'What does a BFS level represent?'],
    edges: ['No fresh at the start returns 0', 'Isolated fresh orange returns -1'],
    probe: 'Recognising multi-source BFS and counting levels correctly.',
    time: 'O(rows × cols)', space: 'O(rows × cols)',
    cpp: `class Solution {
public:
    int orangesRotting(vector<vector<int>>& g) {
        int m = g.size(), n = g[0].size(), fresh = 0, mins = 0;
        queue<pair<int, int>> q;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                if (g[i][j] == 2) q.push({i, j});
                if (g[i][j] == 1) fresh++;
            }
        int dx[] = {1, -1, 0, 0}, dy[] = {0, 0, 1, -1};
        while (!q.empty() && fresh) {
            mins++;
            for (int s = q.size(); s > 0; s--) {
                auto [x, y] = q.front();
                q.pop();
                for (int d = 0; d < 4; d++) {
                    int a = x + dx[d], b = y + dy[d];
                    if (a < 0 || b < 0 || a >= m || b >= n || g[a][b] != 1) continue;
                    g[a][b] = 2;
                    fresh--;
                    q.push({a, b});
                }
            }
        }
        return fresh ? -1 : mins;
    }
};`,
    py: `from collections import deque

class Solution:
    def orangesRotting(self, g):
        m, n = len(g), len(g[0])
        q = deque((i, j) for i in range(m) for j in range(n) if g[i][j] == 2)
        fresh = sum(row.count(1) for row in g)
        mins = 0
        while q and fresh:
            mins += 1
            for _ in range(len(q)):
                x, y = q.popleft()
                for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= a < m and 0 <= b < n and g[a][b] == 1:
                        g[a][b] = 2
                        fresh -= 1
                        q.append((a, b))
        return -1 if fresh else mins`,
  },
  {
    n: 102, title: 'Binary Tree Level Order Traversal', slug: 'binary-tree-level-order-traversal', diff: 'Medium', tier: 'maang', pattern: 'BFS with level size',
    train: 'One batch of pilgrims is let into the hall at a time. Each batch brings in the next.',
    insight: 'The queue size at the start of a round is exactly that level\'s width.',
    walk: ['Enqueue the root.', 'Take size = queue length.', 'Process that many, enqueueing children.', 'Append the level.'],
    hints: ['Which structure visits nearest nodes first?', 'How do you know where a level ends?'],
    edges: ['Empty tree', 'Skewed tree'],
    probe: 'The level-size trick, used across many BFS problems.',
    time: 'O(n)', space: 'O(width)',
    cpp: `class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> out;
        if (!root) return out;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            vector<int> level;
            for (int s = q.size(); s > 0; s--) {
                TreeNode* n = q.front();
                q.pop();
                level.push_back(n->val);
                if (n->left) q.push(n->left);
                if (n->right) q.push(n->right);
            }
            out.push_back(level);
        }
        return out;
    }
};`,
    py: `from collections import deque

class Solution:
    def levelOrder(self, root):
        out = []
        q = deque([root] if root else [])
        while q:
            level = []
            for _ in range(len(q)):
                n = q.popleft()
                level.append(n.val)
                if n.left:
                    q.append(n.left)
                if n.right:
                    q.append(n.right)
            out.append(level)
        return out`,
  },
  {
    n: 621, title: 'Task Scheduler', slug: 'task-scheduler', diff: 'Medium', tier: 'maang', pattern: 'Greedy + cooldown',
    train: 'The most common group must keep gaps between its members, and those gaps decide the minimum time.',
    insight: 'The most frequent task forms a frame of (maxCount - 1) blocks of n + 1, and other tasks fill the gaps.',
    walk: ['Count the frequencies.', 'frame = (maxCount - 1) × (n + 1) + tasks tied at the maximum.', 'Answer = max(frame, total tasks).'],
    hints: ['Which task constrains the schedule most?', 'What if there are more tasks than gaps?'],
    edges: ['n = 0', 'Several tasks tied for the maximum'],
    probe: 'Knowing both the formula and the heap plus cooldown queue simulation.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    int leastInterval(vector<char>& tasks, int n) {
        int cnt[26] = {0};
        for (char c : tasks) cnt[c - 'A']++;
        int mx = *max_element(cnt, cnt + 26);
        int ties = count(cnt, cnt + 26, mx);
        return max((int)tasks.size(), (mx - 1) * (n + 1) + ties);
    }
};`,
    py: `from collections import Counter

class Solution:
    def leastInterval(self, tasks, n):
        cnt = Counter(tasks)
        mx = max(cnt.values())
        ties = sum(1 for v in cnt.values() if v == mx)
        return max(len(tasks), (mx - 1) * (n + 1) + ties)`,
  },
]
