export interface Problem {
  n: number
  title: string
  slug: string
  diff: 'Easy' | 'Medium' | 'Hard'
  tier: 'standard' | 'maang'
  pattern: string
  train: string
  insight: string
  walk: string[]
  hints: string[]
  edges: string[]
  probe: string
  time: string
  space: string
  cpp: string
  py: string
}

export const PROBLEMS: Problem[] = [
  // ---------------- Standard ----------------
  {
    n: 206, title: 'Reverse Linked List', slug: 'reverse-linked-list', diff: 'Easy', tier: 'standard', pattern: 'Pointer reversal',
    train: 'Walk down the train turning each coupling around, while holding a note of where the rest of the train is.',
    insight: 'Three pointers are enough: what is already reversed, what you are flipping, and what comes next.',
    walk: ['Start with prev = NULL and curr = head.', 'Save nxt = curr.next before you destroy it.', 'Flip: curr.next = prev.', 'Advance both: prev = curr, curr = nxt.', 'When curr is NULL, prev is the new head.'],
    hints: ['What do you lose the moment you overwrite curr.next?', 'Keep a third pointer to save it.', 'At the end, which pointer stands on the old last node?'],
    edges: ['Empty list', 'Single node', 'Returning curr instead of prev'],
    probe: 'Clean pointer handling under pressure. Expect a follow-up asking for the recursive version and its O(n) stack cost.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};`,
    py: `class Solution:
    def reverseList(self, head):
        prev, curr = None, head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev`,
  },
  {
    n: 876, title: 'Middle of the Linked List', slug: 'middle-of-the-linked-list', diff: 'Easy', tier: 'standard', pattern: 'Fast and slow pointers',
    train: 'Two inspectors board together. One walks one wagon at a time, the other two. When the fast one runs out of train, the slow one is at the middle.',
    insight: 'Fast covers twice the distance, so slow has covered exactly half when fast finishes.',
    walk: ['slow = fast = head.', 'While fast and fast.next exist, move slow by 1 and fast by 2.', 'Return slow.'],
    hints: ['Could you do it without counting the length first?', 'What if one pointer moved twice as fast as another?'],
    edges: ['Even length returns the second middle', 'Single node'],
    probe: 'Do you know the fast and slow template, and can you state exactly which middle it returns?',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* middleNode(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        return slow;
    }
};`,
    py: `class Solution:
    def middleNode(self, head):
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        return slow`,
  },
  {
    n: 21, title: 'Merge Two Sorted Lists', slug: 'merge-two-sorted-lists', diff: 'Easy', tier: 'standard', pattern: 'Dummy node, two pointers',
    train: 'Two sorted trains wait on either side. Keep taking whichever front wagon is smaller and couple it to the train forming in the middle.',
    insight: 'A dummy node gives the result a place to start, so the first pick needs no special case.',
    walk: ['Create dummy and set tail = dummy.', 'While both lists have nodes, attach the smaller and advance.', 'Attach whatever remains in one coupling.', 'Return dummy.next.'],
    hints: ['Which node would you pick first, and why is that awkward to code?', 'What if a fake node sat before the answer?', 'When one list runs out, do you still need a loop?'],
    edges: ['One or both lists empty', 'Equal values', 'Different lengths'],
    probe: 'Whether you reach for a dummy node, and whether you can relink instead of allocating new nodes.',
    time: 'O(m + n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* a, ListNode* b) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (a && b) {
            if (a->val <= b->val) { tail->next = a; a = a->next; }
            else { tail->next = b; b = b->next; }
            tail = tail->next;
        }
        tail->next = a ? a : b;
        return dummy.next;
    }
};`,
    py: `class Solution:
    def mergeTwoLists(self, a, b):
        dummy = tail = ListNode(0)
        while a and b:
            if a.val <= b.val:
                tail.next, a = a, a.next
            else:
                tail.next, b = b, b.next
            tail = tail.next
        tail.next = a or b
        return dummy.next`,
  },
  {
    n: 83, title: 'Remove Duplicates from Sorted List', slug: 'remove-duplicates-from-sorted-list', diff: 'Easy', tier: 'standard', pattern: 'In-place bypass',
    train: 'The train is sorted, so matching cargo is always side by side. Bypass the copy and stay where you are.',
    insight: 'Advance only when the next node is different. After a bypass the new neighbour may also be a duplicate.',
    walk: ['cur = head.', 'If cur.next has the same value, set cur.next = cur.next.next.', 'Otherwise move cur forward.'],
    hints: ['Where do duplicates sit in a sorted list?', 'After removing one, should you move forward straight away?'],
    edges: ['Empty list', 'All values identical', 'Advancing after a bypass misses runs of 3 or more'],
    probe: 'The small detail of not advancing after deletion.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        ListNode* cur = head;
        while (cur && cur->next) {
            if (cur->val == cur->next->val) cur->next = cur->next->next;
            else cur = cur->next;
        }
        return head;
    }
};`,
    py: `class Solution:
    def deleteDuplicates(self, head):
        cur = head
        while cur and cur.next:
            if cur.val == cur.next.val:
                cur.next = cur.next.next
            else:
                cur = cur.next
        return head`,
  },
  {
    n: 141, title: 'Linked List Cycle', slug: 'linked-list-cycle', diff: 'Easy', tier: 'standard', pattern: "Floyd's cycle detection",
    train: 'A walker and a runner enter the track. If the track loops, the runner eventually comes up behind the walker.',
    insight: 'Inside a cycle the gap shrinks by exactly 1 each turn, so fast cannot jump over slow.',
    walk: ['slow = fast = head.', 'Move slow by 1 and fast by 2.', 'If they meet there is a cycle.', 'If fast reaches NULL there is none.'],
    hints: ['A hash set solves it. What does it cost?', 'What happens to two runners of different speeds on a circular track?'],
    edges: ['Empty list', 'Single node pointing to itself', 'Comparing values instead of node identity'],
    probe: 'Can you prove fast never skips slow? Say that the gap decreases by one per step.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    bool hasCycle(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};`,
    py: `class Solution:
    def hasCycle(self, head):
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                return True
        return False`,
  },
  {
    n: 203, title: 'Remove Linked List Elements', slug: 'remove-linked-list-elements', diff: 'Easy', tier: 'standard', pattern: 'Dummy node',
    train: 'Scrap every wagon with a given cargo, including possibly the first few.',
    insight: 'Deleting a node needs its predecessor. A dummy guarantees even the head has one.',
    walk: ['dummy.next = head and cur = dummy.', 'If cur.next matches, bypass it.', 'Otherwise advance.', 'Return dummy.next.'],
    hints: ['What is special about deleting the first node?', 'How could every node have a predecessor?'],
    edges: ['All nodes match', 'Head matches repeatedly', 'Empty list'],
    probe: 'Using a dummy rather than a tangle of head-only special cases.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* removeElements(ListNode* head, int val) {
        ListNode dummy(0, head);
        ListNode* cur = &dummy;
        while (cur->next) {
            if (cur->next->val == val) cur->next = cur->next->next;
            else cur = cur->next;
        }
        return dummy.next;
    }
};`,
    py: `class Solution:
    def removeElements(self, head, val):
        dummy = ListNode(0, head)
        cur = dummy
        while cur.next:
            if cur.next.val == val:
                cur.next = cur.next.next
            else:
                cur = cur.next
        return dummy.next`,
  },
  {
    n: 19, title: 'Remove Nth Node From End', slug: 'remove-nth-node-from-end-of-list', diff: 'Medium', tier: 'standard', pattern: 'Two pointers with a gap',
    train: 'Two inspectors are tied by a rope n + 1 wagons long. When the front one steps off the train, the back one stands just before the target.',
    insight: 'A fixed gap turns "from the end" into "from the start", in a single pass.',
    walk: ['dummy.next = head; slow = fast = dummy.', 'Move fast n + 1 steps.', 'Move both until fast is NULL.', 'slow.next = slow.next.next.'],
    hints: ['Counting takes two passes. Can you do one?', 'What if two pointers stayed a fixed distance apart?', 'Which node do you need to stand on to delete?'],
    edges: ['Removing the head (n equals length)', 'Single node list', 'Off-by-one in the gap'],
    probe: 'Getting the gap exactly right, and the head removal case.',
    time: 'O(L)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode dummy(0, head);
        ListNode* fast = &dummy;
        ListNode* slow = &dummy;
        for (int i = 0; i <= n; i++) fast = fast->next;
        while (fast) {
            fast = fast->next;
            slow = slow->next;
        }
        ListNode* victim = slow->next;
        slow->next = victim->next;
        delete victim;
        return dummy.next;
    }
};`,
    py: `class Solution:
    def removeNthFromEnd(self, head, n):
        dummy = ListNode(0, head)
        fast = slow = dummy
        for _ in range(n + 1):
            fast = fast.next
        while fast:
            fast = fast.next
            slow = slow.next
        slow.next = slow.next.next
        return dummy.next`,
  },
  {
    n: 160, title: 'Intersection of Two Linked Lists', slug: 'intersection-of-two-linked-lists', diff: 'Easy', tier: 'standard', pattern: 'Two-pointer path equalisation',
    train: 'Two inspectors start on different branch lines that join. Each, on finishing, restarts on the other line. They arrive at the junction at the same moment.',
    insight: 'Both walk a + b + c steps in total, so the different lengths cancel out.',
    walk: ['p = headA, q = headB.', 'Advance each. On NULL, jump to the other list head.', 'Stop when p == q: the junction, or NULL if none.'],
    hints: ['If both lists were the same length, how would you solve it?', 'How can both pointers walk the same total distance?'],
    edges: ['No intersection returns NULL', 'Intersection at the first node', 'Comparing values rather than node identity'],
    probe: 'The elegant O(1) space answer, after you state the hash set baseline.',
    time: 'O(m + n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* getIntersectionNode(ListNode* headA, ListNode* headB) {
        ListNode* p = headA;
        ListNode* q = headB;
        while (p != q) {
            p = p ? p->next : headB;
            q = q ? q->next : headA;
        }
        return p;
    }
};`,
    py: `class Solution:
    def getIntersectionNode(self, headA, headB):
        p, q = headA, headB
        while p is not q:
            p = p.next if p else headB
            q = q.next if q else headA
        return p`,
  },
  {
    n: 234, title: 'Palindrome Linked List', slug: 'palindrome-linked-list', diff: 'Easy', tier: 'standard', pattern: 'Middle + reverse',
    train: 'Find the middle wagon, turn the back half around, then two inspectors walk toward the middle comparing cargo.',
    insight: 'Combines two templates: fast and slow to find the middle, then reversal to enable comparison.',
    walk: ['Find the middle with fast and slow.', 'Reverse the second half.', 'Compare from both ends.', 'Mention restoring the list if mutation is not allowed.'],
    hints: ['Copying to an array is O(n) space. How else can you walk backward?', 'Which two templates combine here?'],
    edges: ['Odd and even lengths', 'Single node', 'Leaving the input mutated'],
    probe: 'Composing patterns, and stating that O(1) space mutates the input.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    bool isPalindrome(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        ListNode* prev = nullptr;
        while (slow) {
            ListNode* nxt = slow->next;
            slow->next = prev;
            prev = slow;
            slow = nxt;
        }
        for (ListNode* a = head, *b = prev; b; a = a->next, b = b->next)
            if (a->val != b->val) return false;
        return true;
    }
};`,
    py: `class Solution:
    def isPalindrome(self, head):
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        prev = None
        while slow:
            slow.next, prev, slow = prev, slow, slow.next
        a, b = head, prev
        while b:
            if a.val != b.val:
                return False
            a, b = a.next, b.next
        return True`,
  },
  {
    n: 2, title: 'Add Two Numbers', slug: 'add-two-numbers', diff: 'Medium', tier: 'standard', pattern: 'Digit simulation, carry',
    train: 'Two trains each carry a number, one digit per wagon, smallest digit first. Build a third train digit by digit, passing the carry along.',
    insight: 'The loop must also continue while a carry remains, or 5 + 5 loses its leading digit.',
    walk: ['dummy and carry = 0.', 'Loop while either list or the carry remains.', 'digit = sum % 10, carry = sum / 10.', 'Return dummy.next.'],
    hints: ['Digits are already reversed. How does that help?', 'What happens if the final addition carries?'],
    edges: ['Different lengths', 'Final carry creates a new node', 'Both numbers zero'],
    probe: 'Complete loop conditions. Common follow-up: digits stored most significant first (LeetCode 445).',
    time: 'O(max(m, n))', space: 'O(max(m, n))',
    cpp: `class Solution {
public:
    ListNode* addTwoNumbers(ListNode* a, ListNode* b) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        int carry = 0;
        while (a || b || carry) {
            int sum = carry;
            if (a) { sum += a->val; a = a->next; }
            if (b) { sum += b->val; b = b->next; }
            carry = sum / 10;
            tail->next = new ListNode(sum % 10);
            tail = tail->next;
        }
        return dummy.next;
    }
};`,
    py: `class Solution:
    def addTwoNumbers(self, a, b):
        dummy = tail = ListNode(0)
        carry = 0
        while a or b or carry:
            total = carry
            if a:
                total += a.val
                a = a.next
            if b:
                total += b.val
                b = b.next
            carry, digit = divmod(total, 10)
            tail.next = ListNode(digit)
            tail = tail.next
        return dummy.next`,
  },

  // ---------------- MAANG ----------------
  {
    n: 146, title: 'LRU Cache', slug: 'lru-cache', diff: 'Medium', tier: 'maang', pattern: 'Hash map + doubly linked list',
    train: 'A depot keeps its wagons in order of last use. A ledger finds any wagon instantly, and double couplings let you pull it out and put it at the front.',
    insight: 'Hash map gives O(1) find. Doubly linked list gives O(1) move and evict. Neither can do both alone.',
    walk: ['Keep sentinel head and tail nodes.', 'get: look up, move to front, return.', 'put: update or insert at front.', 'Over capacity: remove tail.prev and erase its key from the map.'],
    hints: ['What data structure finds in O(1)?', 'What structure reorders in O(1) when you already hold the node?', 'How do you know which map key to erase on eviction?'],
    edges: ['put on an existing key must refresh recency', 'Capacity 1', 'Node must store its key for eviction'],
    probe: 'Design reasoning for why doubly linked, not singly. Likely follow-ups: thread safety and TTL.',
    time: 'O(1) per operation', space: 'O(capacity)',
    cpp: `class LRUCache {
    int cap;
    list<pair<int,int>> order;
    unordered_map<int, list<pair<int,int>>::iterator> pos;
public:
    LRUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        auto it = pos.find(key);
        if (it == pos.end()) return -1;
        order.splice(order.begin(), order, it->second);
        return it->second->second;
    }

    void put(int key, int value) {
        auto it = pos.find(key);
        if (it != pos.end()) {
            it->second->second = value;
            order.splice(order.begin(), order, it->second);
            return;
        }
        if ((int)order.size() == cap) {
            pos.erase(order.back().first);
            order.pop_back();
        }
        order.emplace_front(key, value);
        pos[key] = order.begin();
    }
};`,
    py: `class DNode:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}
        self.head, self.tail = DNode(), DNode()
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, n):
        n.prev.next, n.next.prev = n.next, n.prev

    def _front(self, n):
        n.prev, n.next = self.head, self.head.next
        self.head.next.prev = n
        self.head.next = n

    def get(self, key):
        if key not in self.map:
            return -1
        n = self.map[key]
        self._remove(n)
        self._front(n)
        return n.val

    def put(self, key, value):
        if key in self.map:
            self._remove(self.map[key])
        elif len(self.map) == self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.map[lru.key]
        n = DNode(key, value)
        self.map[key] = n
        self._front(n)`,
  },
  {
    n: 23, title: 'Merge k Sorted Lists', slug: 'merge-k-sorted-lists', diff: 'Hard', tier: 'maang', pattern: 'Min-heap, k-way merge',
    train: 'k sorted trains wait on k tracks. A signal board always shows the smallest front wagon. Take it, then show the next wagon from that same track.',
    insight: 'The heap only ever holds k fronts, so each of the N nodes costs log k.',
    walk: ['Push the head of each non-empty list.', 'Pop the smallest and attach it to the result.', 'Push its next node if there is one.', 'Mention the divide-and-conquer alternative.'],
    hints: ['Merging one at a time costs O(kN). Why?', 'How many candidates can be the next smallest?', 'Which structure gives the min of k items quickly?'],
    edges: ['Empty array', 'Lists that are NULL', 'Ties in Python heaps need a tie-breaker'],
    probe: 'Trade-offs: heap O(N log k) against pairwise merging, also O(N log k) but with O(1) extra space.',
    time: 'O(N log k)', space: 'O(k)',
    cpp: `class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
        priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);
        for (ListNode* l : lists) if (l) pq.push(l);
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (!pq.empty()) {
            ListNode* n = pq.top();
            pq.pop();
            tail->next = n;
            tail = n;
            if (n->next) pq.push(n->next);
        }
        return dummy.next;
    }
};`,
    py: `import heapq

class Solution:
    def mergeKLists(self, lists):
        heap = [(l.val, i, l) for i, l in enumerate(lists) if l]
        heapq.heapify(heap)
        dummy = tail = ListNode(0)
        while heap:
            _, i, node = heapq.heappop(heap)
            tail.next = node
            tail = node
            if node.next:
                heapq.heappush(heap, (node.next.val, i, node.next))
        return dummy.next`,
  },
  {
    n: 25, title: 'Reverse Nodes in k-Group', slug: 'reverse-nodes-in-k-group', diff: 'Hard', tier: 'maang', pattern: 'Segment reversal',
    train: 'Cut the train into blocks of k wagons, turn each block around, and re-couple it. A short final block stays as it is.',
    insight: 'Before each block, stand on the wagon before it. After reversing, the block\'s old first wagon is the next "before".',
    walk: ['dummy and groupPrev = dummy.', 'Find the kth node ahead. If absent, stop.', 'Reverse the block, using the node after it as prev.', 'Reconnect, then groupPrev = old first of the block.'],
    hints: ['Can you reverse exactly k nodes?', 'What must each block connect to on either side?', 'How do you detect a short last block before touching it?'],
    edges: ['k = 1', 'Fewer than k nodes left', 'Reconnecting both ends of the block'],
    probe: 'Staying in control of many pointers. Name your variables and draw a block first.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        ListNode dummy(0, head);
        ListNode* groupPrev = &dummy;
        while (true) {
            ListNode* kth = groupPrev;
            for (int i = 0; i < k && kth; i++) kth = kth->next;
            if (!kth) break;
            ListNode* groupNext = kth->next;
            ListNode* prev = groupNext;
            ListNode* curr = groupPrev->next;
            while (curr != groupNext) {
                ListNode* nxt = curr->next;
                curr->next = prev;
                prev = curr;
                curr = nxt;
            }
            ListNode* oldFirst = groupPrev->next;
            groupPrev->next = kth;
            groupPrev = oldFirst;
        }
        return dummy.next;
    }
};`,
    py: `class Solution:
    def reverseKGroup(self, head, k):
        dummy = ListNode(0, head)
        group_prev = dummy
        while True:
            kth = group_prev
            for _ in range(k):
                kth = kth.next
                if not kth:
                    return dummy.next
            group_next = kth.next
            prev, curr = group_next, group_prev.next
            while curr is not group_next:
                nxt = curr.next
                curr.next = prev
                prev = curr
                curr = nxt
            old_first = group_prev.next
            group_prev.next = kth
            group_prev = old_first`,
  },
  {
    n: 138, title: 'Copy List with Random Pointer', slug: 'copy-list-with-random-pointer', diff: 'Medium', tier: 'maang', pattern: 'Interleaving or hash map',
    train: 'Each wagon also has a wire to any other wagon. Park each copy right behind its original, so every wire can be duplicated by looking one wagon over.',
    insight: 'Placing each copy after its original makes the old-to-new mapping implicit, so no hash map is needed.',
    walk: ['Insert a copy after each node.', 'copy.random = original.random.next.', 'Unweave the two lists, restoring the original.'],
    hints: ['With a hash map it is easy. Say that first.', 'How can a node\'s position tell you where its copy is?', 'Why does the original need restoring?'],
    edges: ['random is NULL', 'random points to itself', 'Original list must end up unchanged'],
    probe: 'Starting with the O(n) space map, then improving to O(1) extra space.',
    time: 'O(n)', space: 'O(1) extra',
    cpp: `class Solution {
public:
    Node* copyRandomList(Node* head) {
        for (Node* c = head; c; c = c->next->next) {
            Node* copy = new Node(c->val);
            copy->next = c->next;
            c->next = copy;
        }
        for (Node* c = head; c; c = c->next->next)
            if (c->random) c->next->random = c->random->next;
        Node dummy(0);
        Node* tail = &dummy;
        for (Node* c = head; c; c = c->next) {
            tail->next = c->next;
            tail = tail->next;
            c->next = tail->next;
        }
        return dummy.next;
    }
};`,
    py: `class Solution:
    def copyRandomList(self, head):
        c = head
        while c:
            copy = Node(c.val)
            copy.next = c.next
            c.next = copy
            c = copy.next
        c = head
        while c:
            if c.random:
                c.next.random = c.random.next
            c = c.next.next
        dummy = tail = Node(0)
        c = head
        while c:
            tail.next = c.next
            tail = tail.next
            c.next = tail.next
            c = c.next
        return dummy.next`,
  },
  {
    n: 142, title: 'Linked List Cycle II', slug: 'linked-list-cycle-ii', diff: 'Medium', tier: 'maang', pattern: "Floyd's, part two",
    train: 'After the runner catches the walker, send one back to the entrance. Now both walk at the same pace and meet exactly at the start of the loop.',
    insight: 'If a is the distance to the loop and b the distance into it at the meeting point, then a = (loop length) × m − b. Walking a more steps from the meeting point lands on the loop start.',
    walk: ['Run fast and slow until they meet.', 'Reset one pointer to head.', 'Advance both by 1 until they meet.', 'That node is the loop start.'],
    hints: ['Write the distances slow and fast have each travelled.', 'Fast travelled exactly twice as far. What equation follows?'],
    edges: ['No cycle', 'Cycle begins at head', 'Whole list is one cycle'],
    probe: 'Being able to derive the distance argument, rather than quoting it.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* detectCycle(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) {
                slow = head;
                while (slow != fast) {
                    slow = slow->next;
                    fast = fast->next;
                }
                return slow;
            }
        }
        return nullptr;
    }
};`,
    py: `class Solution:
    def detectCycle(self, head):
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                slow = head
                while slow is not fast:
                    slow = slow.next
                    fast = fast.next
                return slow
        return None`,
  },
  {
    n: 143, title: 'Reorder List', slug: 'reorder-list', diff: 'Medium', tier: 'maang', pattern: 'Middle + reverse + merge',
    train: 'Split the train in half, turn the back half around, then zip the halves together, one wagon from each.',
    insight: 'Three templates in sequence. Split them cleanly and each is easy.',
    walk: ['Find the middle and cut there.', 'Reverse the second half.', 'Alternate nodes from each half.'],
    hints: ['You need the last node right after the first. How can you walk backward cheaply?', 'Which three small operations make up this problem?'],
    edges: ['Forgetting to cut the first half creates a cycle', 'Length 1 or 2'],
    probe: 'Decomposing a problem into named helper functions.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    void reorderList(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head->next;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        ListNode* curr = slow->next;
        slow->next = nullptr;
        ListNode* prev = nullptr;
        while (curr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        ListNode* a = head;
        ListNode* b = prev;
        while (b) {
            ListNode* an = a->next;
            ListNode* bn = b->next;
            a->next = b;
            b->next = an;
            a = an;
            b = bn;
        }
    }
};`,
    py: `class Solution:
    def reorderList(self, head):
        slow, fast = head, head.next
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        curr, slow.next = slow.next, None
        prev = None
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        a, b = head, prev
        while b:
            an, bn = a.next, b.next
            a.next = b
            b.next = an
            a, b = an, bn`,
  },
  {
    n: 148, title: 'Sort List', slug: 'sort-list', diff: 'Medium', tier: 'maang', pattern: 'Merge sort on a list',
    train: 'Split the train in half again and again until every wagon stands alone, then merge sorted pieces back together.',
    insight: 'Merge sort suits lists: splitting needs no random access, and merging needs no extra array.',
    walk: ['Find the middle and cut.', 'Sort each half recursively.', 'Merge the two sorted halves.', 'Mention bottom-up merge sort for true O(1) space.'],
    hints: ['Quicksort and heapsort rely on what lists lack. What is it?', 'Which sort only needs sequential access?', 'Start fast at head.next. Why?'],
    edges: ['Splitting two nodes must make progress', 'Recursion uses O(log n) stack', 'Already sorted input'],
    probe: 'Why merge sort, and knowing the recursive version is not truly O(1) space.',
    time: 'O(n log n)', space: 'O(log n) stack',
    cpp: `class Solution {
    ListNode* merge(ListNode* a, ListNode* b) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (a && b) {
            if (a->val <= b->val) { tail->next = a; a = a->next; }
            else { tail->next = b; b = b->next; }
            tail = tail->next;
        }
        tail->next = a ? a : b;
        return dummy.next;
    }
public:
    ListNode* sortList(ListNode* head) {
        if (!head || !head->next) return head;
        ListNode* slow = head;
        ListNode* fast = head->next;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        ListNode* right = slow->next;
        slow->next = nullptr;
        return merge(sortList(head), sortList(right));
    }
};`,
    py: `class Solution:
    def sortList(self, head):
        if not head or not head.next:
            return head
        slow, fast = head, head.next
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        right, slow.next = slow.next, None
        a, b = self.sortList(head), self.sortList(right)
        dummy = tail = ListNode(0)
        while a and b:
            if a.val <= b.val:
                tail.next, a = a, a.next
            else:
                tail.next, b = b, b.next
            tail = tail.next
        tail.next = a or b
        return dummy.next`,
  },
  {
    n: 92, title: 'Reverse Linked List II', slug: 'reverse-linked-list-ii', diff: 'Medium', tier: 'maang', pattern: 'Head insertion within a segment',
    train: 'Stand just before the block. Repeatedly pull the wagon after the block\'s first wagon and put it at the front of the block.',
    insight: 'The first wagon of the block keeps sliding back while the others jump ahead of it, and nothing outside the block is touched.',
    walk: ['dummy; walk prev to position left - 1.', 'curr = prev.next.', 'Repeat right - left times: move curr.next to just after prev.'],
    hints: ['Where should you stand so the block\'s front can change?', 'Can you reverse by moving one node at a time to the front?'],
    edges: ['left = 1 changes the head', 'left = right is a no-op', 'Block reaches the end of the list'],
    probe: 'A tidy in-place solution without a separate reconnect phase.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* reverseBetween(ListNode* head, int left, int right) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;
        for (int i = 1; i < left; i++) prev = prev->next;
        ListNode* curr = prev->next;
        for (int i = 0; i < right - left; i++) {
            ListNode* moved = curr->next;
            curr->next = moved->next;
            moved->next = prev->next;
            prev->next = moved;
        }
        return dummy.next;
    }
};`,
    py: `class Solution:
    def reverseBetween(self, head, left, right):
        dummy = ListNode(0, head)
        prev = dummy
        for _ in range(left - 1):
            prev = prev.next
        curr = prev.next
        for _ in range(right - left):
            moved = curr.next
            curr.next = moved.next
            moved.next = prev.next
            prev.next = moved
        return dummy.next`,
  },
  {
    n: 24, title: 'Swap Nodes in Pairs', slug: 'swap-nodes-in-pairs', diff: 'Medium', tier: 'maang', pattern: 'Dummy node, local rewiring',
    train: 'Stand before each pair of wagons and exchange them by changing couplings, without touching the cargo.',
    insight: 'Every swap is exactly three writes. Save the far side first.',
    walk: ['dummy; prev = dummy.', 'a = prev.next, b = a.next.', 'a.next = b.next, b.next = a, prev.next = b.', 'prev = a.'],
    hints: ['How many pointers change per swap?', 'Which node must you stand on?', 'Which pointer do you save first?'],
    edges: ['Odd length leaves the last node', 'Empty or single node', 'Swapping values is not allowed'],
    probe: 'Rewiring in the correct order. A direct test of the order trap.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;
        while (prev->next && prev->next->next) {
            ListNode* a = prev->next;
            ListNode* b = a->next;
            a->next = b->next;
            b->next = a;
            prev->next = b;
            prev = a;
        }
        return dummy.next;
    }
};`,
    py: `class Solution:
    def swapPairs(self, head):
        dummy = ListNode(0, head)
        prev = dummy
        while prev.next and prev.next.next:
            a = prev.next
            b = a.next
            a.next = b.next
            b.next = a
            prev.next = b
            prev = a
        return dummy.next`,
  },
  {
    n: 61, title: 'Rotate List', slug: 'rotate-list', diff: 'Medium', tier: 'maang', pattern: 'Make a ring, then cut',
    train: 'Bend the train into a ring, then uncouple it at a different place.',
    insight: 'Rotation is just choosing a new cut point. k can be huge, so reduce it modulo the length.',
    walk: ['Find length and tail.', 'k %= length; if 0 return.', 'tail.next = head.', 'Walk length - k - 1 steps to the new tail and cut.'],
    hints: ['What if k is much larger than the length?', 'What if the list were temporarily circular?'],
    edges: ['k = 0 or a multiple of length', 'Empty list', 'Single node'],
    probe: 'Spotting the modulo immediately, and linking this back to circular lists.',
    time: 'O(n)', space: 'O(1)',
    cpp: `class Solution {
public:
    ListNode* rotateRight(ListNode* head, int k) {
        if (!head || !head->next) return head;
        int n = 1;
        ListNode* tail = head;
        while (tail->next) { tail = tail->next; n++; }
        k %= n;
        if (k == 0) return head;
        tail->next = head;
        ListNode* newTail = head;
        for (int i = 0; i < n - k - 1; i++) newTail = newTail->next;
        ListNode* newHead = newTail->next;
        newTail->next = nullptr;
        return newHead;
    }
};`,
    py: `class Solution:
    def rotateRight(self, head, k):
        if not head or not head.next:
            return head
        n, tail = 1, head
        while tail.next:
            tail = tail.next
            n += 1
        k %= n
        if k == 0:
            return head
        tail.next = head
        new_tail = head
        for _ in range(n - k - 1):
            new_tail = new_tail.next
        new_head = new_tail.next
        new_tail.next = None
        return new_head`,
  },
]
