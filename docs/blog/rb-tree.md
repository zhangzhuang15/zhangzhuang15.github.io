---
title: "罪恶的红黑树"
page: true
aside: true
---

# Rust version Impl

我们首先讨论一下红黑树的 Rust 版本实现，之后简单介绍一些别的数据结构。

```rust
use std::boxed::Box;
use std::cmp::{Ord, Ordering};
use std::iter::Iterator;
use std::ptr::null_mut;

#[derive(Copy, Clone)]
enum Color {
    Red,
    Black,
}

pub struct RBNode<K: Ord, V> {
    key: K,
    value: V,
    color: Color,
    parent: *mut RBNode<K, V>,
    left: *mut RBNode<K, V>,
    right: *mut RBNode<K, V>,
}

impl<K: Ord, V> RBNode<K, V> {
    fn new(key: K, value: V) -> RBNode<K, V> {
        RBNode {
            key,
            value,
            color: Color::Red,
            parent: null_mut(),
            left: null_mut(),
            right: null_mut(),
        }
    }
}

pub struct RBTree<K: Ord, V> {
    root: *mut RBNode<K, V>,
}

impl<K: Ord, V> Default for RBTree<K, V> {
    fn default() -> Self {
        Self::new()
    }
}

impl<K: Ord, V> RBTree<K, V> {
    pub fn new() -> RBTree<K, V> {
        RBTree::<K, V> { root: null_mut() }
    }

    pub fn find(&self, key: &K) -> Option<&V> {
        unsafe {
            let mut node = self.root;
            while !node.is_null() {
                node = match (*node).key.cmp(key) {
                    Ordering::Less => (*node).right,
                    Ordering::Equal => return Some(&(*node).value),
                    Ordering::Greater => (*node).left,
                }
            }
        }
        None
    }

    pub fn insert(&mut self, key: K, value: V) {
        unsafe {
            let mut parent = null_mut();
            let mut node = self.root;
            while !node.is_null() {
                parent = node;
                node = match (*node).key.cmp(&key) {
                    Ordering::Less => (*node).right,
                    Ordering::Equal => {
                        (*node).value = value;
                        return;
                    }
                    Ordering::Greater => (*node).left,
                }
            }
            node = Box::into_raw(Box::new(RBNode::new(key, value)));
            if parent.is_null() {
                self.root = node;
            } else if (*node).key < (*parent).key {
                (*parent).left = node;
            } else {
                (*parent).right = node;
            }
            (*node).parent = parent;
            insert_fixup(self, node);
        }
    }

    pub fn delete(&mut self, key: &K) {
        unsafe {
            let mut parent = null_mut();
            let mut node = self.root;
            while !node.is_null() {
                node = match (*node).key.cmp(key) {
                    Ordering::Less => {
                        parent = node;
                        (*node).right
                    }
                    Ordering::Equal => break,
                    Ordering::Greater => {
                        parent = node;
                        (*node).left
                    }
                };
            }

            if node.is_null() {
                return;
            }

            /* cl and cr denote left and right child of node, respectively. */
            let cl = (*node).left;
            let cr = (*node).right;
            let mut deleted_color;

            if cl.is_null() {
                replace_node(self, parent, node, cr);
                if cr.is_null() {
                    /*
                     * Case 1 - cl and cr are both NULL
                     * (n could be either color here)
                     *
                     *     (n)             NULL
                     *    /   \    -->
                     *  NULL  NULL
                     */

                    deleted_color = (*node).color;
                } else {
                    /*
                     * Case 2 - cl is NULL and cr is not NULL
                     *
                     *     N             Cr
                     *    / \    -->    /  \
                     *  NULL cr       NULL NULL
                     */

                    (*cr).parent = parent;
                    (*cr).color = Color::Black;
                    deleted_color = Color::Red;
                }
            } else if cr.is_null() {
                /*
                 * Case 3 - cl is not NULL and cr is NULL
                 *
                 *     N             Cl
                 *    / \    -->    /  \
                 *  cl  NULL      NULL NULL
                 */

                replace_node(self, parent, node, cl);
                (*cl).parent = parent;
                (*cl).color = Color::Black;
                deleted_color = Color::Red;
            } else {
                let mut victim = (*node).right;
                while !(*victim).left.is_null() {
                    victim = (*victim).left;
                }
                if victim == (*node).right {
                    /* Case 4 - victim is the right child of node
                     *
                     *     N         N         n
                     *    / \       / \       / \
                     *  (cl) cr   (cl) Cr    Cl  Cr
                     *
                     *     N         n
                     *    / \       / \
                     *  (cl) Cr    Cl  Cr
                     *         \         \
                     *         crr       crr
                     */

                    replace_node(self, parent, node, victim);
                    (*victim).parent = parent;
                    deleted_color = (*victim).color;
                    (*victim).color = (*node).color;
                    (*victim).left = cl;
                    (*cl).parent = victim;
                    if (*victim).right.is_null() {
                        parent = victim;
                    } else {
                        deleted_color = Color::Red;
                        (*(*victim).right).color = Color::Black;
                    }
                } else {
                    /*
                     * Case 5 - victim is not the right child of node
                     */

                    /* vp and vr denote parent and right child of victim, respectively. */
                    let vp = (*victim).parent;
                    let vr = (*victim).right;
                    (*vp).left = vr;
                    if vr.is_null() {
                        deleted_color = (*victim).color;
                    } else {
                        deleted_color = Color::Red;
                        (*vr).parent = vp;
                        (*vr).color = Color::Black;
                    }
                    replace_node(self, parent, node, victim);
                    (*victim).parent = parent;
                    (*victim).color = (*node).color;
                    (*victim).left = cl;
                    (*victim).right = cr;
                    (*cl).parent = victim;
                    (*cr).parent = victim;
                    parent = vp;
                }
            }

            /* release resource */
            drop(Box::from_raw(node));
            if matches!(deleted_color, Color::Black) {
                delete_fixup(self, parent);
            }
        }
    }

    pub fn iter<'a>(&self) -> RBTreeIterator<'a, K, V> {
        let mut iterator = RBTreeIterator { stack: Vec::new() };
        let mut node = self.root;
        unsafe {
            while !node.is_null() {
                iterator.stack.push(&*node);
                node = (*node).left;
            }
        }
        iterator
    }
}

#[inline]
unsafe fn insert_fixup<K: Ord, V>(tree: &mut RBTree<K, V>, mut node: *mut RBNode<K, V>) {
    let mut parent: *mut RBNode<K, V> = (*node).parent;
    let mut gparent: *mut RBNode<K, V>;
    let mut tmp: *mut RBNode<K, V>;

    loop {
        /*
         * Loop invariant:
         * - node is red
         */

        if parent.is_null() {
            (*node).color = Color::Black;
            break;
        }

        if matches!((*parent).color, Color::Black) {
            break;
        }

        gparent = (*parent).parent;
        tmp = (*gparent).right;
        if parent == tmp {
            /* parent = (*gparent).right */
            tmp = (*gparent).left;
            if !tmp.is_null() && matches!((*tmp).color, Color::Red) {
                /*
                 * Case 1 - color flips and recurse at g
                 *    G               g
                 *   / \             / \
                 *  u   p    -->    U   P
                 *       \               \
                 *        n               n
                 */

                (*parent).color = Color::Black;
                (*tmp).color = Color::Black;
                (*gparent).color = Color::Red;
                node = gparent;
                parent = (*node).parent;
                continue;
            }
            tmp = (*parent).left;
            if node == tmp {
                /*
                 * Case 2 - right rotate at p (then Case 3)
                 *
                 *       G             G
                 *      / \           / \
                 *     U   p   -->   U   n
                 *        /               \
                 *       n                 p
                 */

                right_rotate(tree, parent);
                parent = node;
            }
            /*
             * Case 3 - left rotate at g
             *
             *       G             P
             *      / \           / \
             *     U   p   -->   g   n
             *          \       /
             *           n     U
             */

            (*parent).color = Color::Black;
            (*gparent).color = Color::Red;
            left_rotate(tree, gparent);
        } else {
            /* parent = (*gparent).left */
            if !tmp.is_null() && matches!((*tmp).color, Color::Red) {
                /*
                 * Case 1 - color flips and recurse at g
                 *
                 *      G               g
                 *     / \             / \
                 *    p   u    -->    P   U
                 *   /               /
                 *  n               n
                 */

                (*parent).color = Color::Black;
                (*tmp).color = Color::Black;
                (*gparent).color = Color::Red;
                node = gparent;
                parent = (*node).parent;
                continue;
            }
            tmp = (*parent).right;
            if node == tmp {
                /* node = (*parent).right */
                /*
                 * Case 2 - left rotate at p (then Case 3)
                 *
                 *    G               G
                 *   / \             / \
                 *  p   U    -->    n   U
                 *   \             /
                 *    n           p
                 */

                left_rotate(tree, parent);
                parent = node;
            }
            /*
             * Case 3 - right rotate at g
             *
             *      G               P
             *     / \             / \
             *    p   U    -->    n   g
             *   /                     \
             *  n                       U
             */

            (*parent).color = Color::Black;
            (*gparent).color = Color::Red;
            right_rotate(tree, gparent);
        }
        break;
    }
}

#[inline]
unsafe fn delete_fixup<K: Ord, V>(tree: &mut RBTree<K, V>, mut parent: *mut RBNode<K, V>) {
    let mut node: *mut RBNode<K, V> = null_mut();
    let mut sibling: *mut RBNode<K, V>;
    /* sl and sr denote left and right child of sibling, respectively. */
    let mut sl: *mut RBNode<K, V>;
    let mut sr: *mut RBNode<K, V>;

    loop {
        /*
         * Loop invariants:
         * - node is black (or null on first iteration)
         * - node is not the root (so parent is not null)
         * - All leaf paths going through parent and node have a
         *   black node count that is 1 lower than other leaf paths.
         */
        sibling = (*parent).right;
        if node == sibling {
            /* node = (*parent).right */
            sibling = (*parent).left;
            if matches!((*sibling).color, Color::Red) {
                /*
                 * Case 1 - right rotate at parent
                 */

                right_rotate(tree, parent);
                (*parent).color = Color::Red;
                (*sibling).color = Color::Black;
                sibling = (*parent).right;
            }
            sl = (*sibling).left;
            sr = (*sibling).right;

            if !sr.is_null() && matches!((*sr).color, Color::Red) {
                /*
                 * Case 2 - left rotate at sibling and then right rotate at parent
                 */

                (*sr).color = (*parent).color;
                (*parent).color = Color::Black;
                left_rotate(tree, sibling);
                right_rotate(tree, parent);
            } else if !sl.is_null() && matches!((*sl).color, Color::Red) {
                /*
                 * Case 3 - right rotate at parent
                 */

                (*sl).color = (*parent).color;
                right_rotate(tree, parent);
            } else {
                /*
                 * Case 4 - color flip
                 */

                (*sibling).color = Color::Red;
                if matches!((*parent).color, Color::Black) {
                    node = parent;
                    parent = (*node).parent;
                    continue;
                }
                (*parent).color = Color::Black;
            }
        } else {
            /* node = (*parent).left */
            if matches!((*sibling).color, Color::Red) {
                /*
                 * Case 1 - left rotate at parent
                 *
                 *    P               S
                 *   / \             / \
                 *  N   s    -->    p   Sr
                 *     / \         / \
                 *    Sl  Sr      N  Sl
                 */

                left_rotate(tree, parent);
                (*parent).color = Color::Red;
                (*sibling).color = Color::Black;
                sibling = (*parent).right;
            }
            sl = (*sibling).left;
            sr = (*sibling).right;

            if !sl.is_null() && matches!((*sl).color, Color::Red) {
                /*
                 * Case 2 - right rotate at sibling and then left rotate at parent
                 * (p and sr could be either color here)
                 *
                 *   (p)             (p)              (sl)
                 *   / \             / \              / \
                 *  N   S    -->    N   sl    -->    P   S
                 *     / \                \         /     \
                 *    sl (sr)              S       N      (sr)
                 *                          \
                 *                          (sr)
                 */

                (*sl).color = (*parent).color;
                (*parent).color = Color::Black;
                right_rotate(tree, sibling);
                left_rotate(tree, parent);
            } else if !sr.is_null() && matches!((*sr).color, Color::Red) {
                /*
                 * Case 3 - left rotate at parent
                 * (p could be either color here)
                 *
                 *   (p)               S
                 *   / \              / \
                 *  N   S    -->    (p) (sr)
                 *     / \          / \
                 *    Sl  sr       N   Sl
                 */

                (*sr).color = (*parent).color;
                left_rotate(tree, parent);
            } else {
                /*
                 * Case 4 - color clip
                 * (p could be either color here)
                 *
                 *   (p)             (p)
                 *   / \             / \
                 *  N   S    -->    N   s
                 *     / \             / \
                 *    Sl  Sr          Sl  Sr
                 */

                (*sibling).color = Color::Red;
                if matches!((*parent).color, Color::Black) {
                    node = parent;
                    parent = (*node).parent;
                    continue;
                }
                (*parent).color = Color::Black;
            }
        }
        break;
    }
}

#[inline]
unsafe fn left_rotate<K: Ord, V>(tree: &mut RBTree<K, V>, x: *mut RBNode<K, V>) {
    /*
     * Left rotate at x
     * (x could also be the left child of p)
     *
     *  p           p
     *   \           \
     *    x    -->    y
     *   / \         / \
     *      y       x
     *     / \     / \
     *    c           c
     */

    let p = (*x).parent;
    let y = (*x).right;
    let c = (*y).left;

    (*y).left = x;
    (*x).parent = y;
    (*x).right = c;
    if !c.is_null() {
        (*c).parent = x;
    }
    if p.is_null() {
        tree.root = y;
    } else if (*p).left == x {
        (*p).left = y;
    } else {
        (*p).right = y;
    }
    (*y).parent = p;
}

#[inline]
unsafe fn right_rotate<K: Ord, V>(tree: &mut RBTree<K, V>, x: *mut RBNode<K, V>) {
    /*
     * Right rotate at x
     * (x could also be the left child of p)
     *
     *  p           p
     *   \           \
     *    x    -->    y
     *   / \         / \
     *  y               x
     * / \             / \
     *    c           c
     */

    let p = (*x).parent;
    let y = (*x).left;
    let c = (*y).right;

    (*y).right = x;
    (*x).parent = y;
    (*x).left = c;
    if !c.is_null() {
        (*c).parent = x;
    }
    if p.is_null() {
        tree.root = y;
    } else if (*p).left == x {
        (*p).left = y;
    } else {
        (*p).right = y;
    }
    (*y).parent = p;
}

#[inline]
unsafe fn replace_node<K: Ord, V>(
    tree: &mut RBTree<K, V>,
    parent: *mut RBNode<K, V>,
    node: *mut RBNode<K, V>,
    new: *mut RBNode<K, V>,
) {
    if parent.is_null() {
        tree.root = new;
    } else if (*parent).left == node {
        (*parent).left = new;
    } else {
        (*parent).right = new;
    }
}

pub struct RBTreeIterator<'a, K: Ord, V> {
    stack: Vec<&'a RBNode<K, V>>,
}

impl<'a, K: Ord, V> Iterator for RBTreeIterator<'a, K, V> {
    type Item = &'a RBNode<K, V>;
    fn next(&mut self) -> Option<Self::Item> {
        match self.stack.pop() {
            Some(node) => {
                let mut next = node.right;
                unsafe {
                    while !next.is_null() {
                        self.stack.push(&*next);
                        next = (*next).left;
                    }
                }
                Some(node)
            }
            None => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::RBTree;

    #[test]
    fn find() {
        let mut tree = RBTree::<usize, char>::new();
        for (k, v) in "hello, world!".chars().enumerate() {
            tree.insert(k, v);
        }
        assert_eq!(*tree.find(&3).unwrap_or(&'*'), 'l');
        assert_eq!(*tree.find(&6).unwrap_or(&'*'), ' ');
        assert_eq!(*tree.find(&8).unwrap_or(&'*'), 'o');
        assert_eq!(*tree.find(&12).unwrap_or(&'*'), '!');
    }

    #[test]
    fn insert() {
        let mut tree = RBTree::<usize, char>::new();
        for (k, v) in "hello, world!".chars().enumerate() {
            tree.insert(k, v);
        }
        let s: String = tree.iter().map(|x| x.value).collect();
        assert_eq!(s, "hello, world!");
    }

    #[test]
    fn delete() {
        let mut tree = RBTree::<usize, char>::new();
        for (k, v) in "hello, world!".chars().enumerate() {
            tree.insert(k, v);
        }
        tree.delete(&1);
        tree.delete(&3);
        tree.delete(&5);
        tree.delete(&7);
        tree.delete(&11);
        let s: String = tree.iter().map(|x| x.value).collect();
        assert_eq!(s, "hlo orl!");
    }
}
```

## 插入节点

添加节点场景，在调整树的颜色时，关注的是新加入的节点 node, node 父节点 parent，祖父节点 gparent，叔叔节点 psibling，并根据 parent 和 psibling 的颜色进行分类讨论，处理颜色。

插入的新节点是红色，之后分以下情况处理：

1. parent 是黑色。不需要做任何调整，插入结束。
2. parent 是红色，psibling 是红色。parent 和 psibling 设置为黑色，gparent 设置为红色，然后把 gparent 看成是新的 node, 继续分类处理。
   > 只有这种情形，会导致 O(h)的复杂度，h 为树的高度。其余情形都是 O(1)调整，就完成了。
3. parent 是红色，psibling 是黑色，node 是 parent 的近端子节点，将 parent 旋转，让 node 跑到 parent 的位置，然后将 node 设置为 parent，原本的 parent 设置为 node, 按照情形 4 继续处理
4. parent 是红色，psibling 是黑色，node 是 parent 的远端子节点，将 parent 和 gparent 互换颜色，旋转 gparent，让 parent 跑到 gparent 的位置，插入结束。

解释下 node 是 parent 的近端子节点是什么意思，如下图所示，node 就是 parent 的近端子节点：

```txt
      gparent
       /
      /
   parent
      \
       \
       node


    gparent
       \
        \
        parent
         /
        /
      node
```

## 删除节点

删除节点场景，在调整树的颜色时，关注的是替换被删除节点的节点 node, node 兄弟节点 sibling。根据 node 和 sibling 的颜色进行分类讨论，处理颜色。

删除节点场景的 AI helper:
四类典型情况（按 CLRS/代码结构）——每一类为什么需要“染色”或“旋转+染色” （下面的 G = grandparent/parent 之类我用 P = parent, S = sibling, N = 被删除/替换后导致黑幅缺失的子树/位置）

Case A: 兄弟 S 是红色（代码：if matches!(sibling.color, Red) branch）

情形：P 黑/红不定，S 为红，说明 P 一定为黑（否则会违反红规则）。S 红意味着 S 的子都是黑（至少满足颜色关系）。
处理：把 S 和 P 颜色互换并对 P 做一次旋转（在代码里是 left_rotate 或 right_rotate 对 parent），这把原来红 S 提升为父的位置，变成了“兄弟为黑”的情况（把问题转换为后续的 case）。
为什么：这一步并不是最终解决黑高度问题，而是把形状/颜色变成“左/右均匀”的黑兄弟情形，使后面能用单次旋转或染色来修复。
Case B: S 是黑，且 S 的“远端”子是红（对称地有远端：如果 N 在左，则远端是 S.right）

情形：S 黑，但 S 的靠外（relative to parent）子为红。
处理：把 S 的远端子染成 P 的颜色，把 P 染黑，然后对 P 做一次旋转（代码里是把 sr.color = parent.color; parent.color = Black; left_rotate(parent) 等）。
为什么：这样旋转后，原来的“黑缺失”被吸收（或中和）——远端红子提供了一个可“贡献”黑高度的位置，旋转后整棵局部子树的黑高度一致。染色确保旋转后所有路径黑数正确。
Case C: S 是黑，但 S 的“近端”子是红（近端即靠近 N 的那个）

处理：先对 S 做一次旋转，把近端红子变为远端红子（并调整颜色），然后退回到 Case B 再处理（代码中先 right_rotate(tree, sibling) 或 left_rotate(tree, sibling) 并调整颜色，之后接 Case B 的处理）。
为什么：目的是把不对称的“近端红”变成“远端红”，因为远端红在旋转时能被用来修复黑高度，而近端红直接旋转父节点不能达到目的。
Case D: S 是黑且其两个子都是黑（或 S 为 NULL）

情形：兄弟和兄弟的两个孩子都黑，说明兄弟路径本身没有“额外的可用红”可以借来抵消 N 的缺黑。
处理（代码里最典型的重新染色位置）：
把 S 染成红（(\*sibling).color = Red），这等价于把兄弟路径“贡献”的一个黑从那边拿掉（使其路径黑数减少 1），从而把“缺黑”向上移动到 parent（如果 parent 原来是黑，则现在 parent 路径也缺黑，需要继续向上处理；如果 parent 原来是红，把 parent 染黑就可以抵消，修复完成）。
在代码中如果 parent 是黑，则把 node = parent; parent = parent.parent; continue（继续循环向上）；否则把 parent 染黑并结束。
为什么：当兄弟本身不能借红子给你（两子黑），你通过把 S 变红“把黑从兄弟路径上拿掉”使两边黑高度相等（因为 N 的一侧也缺黑），但这操作可能让 parent 侧的路径产生缺黑，所以需要把问题推进到上层。

总结下：
node 节点顶替被删除节点的那个节点，parent 是 node 的父节点，sibling 是 node 的兄弟节点

1. node 是红色，设置成黑色就可以了，删除结束
2. node 是黑色，sibling 是红色。parent 旋转，让 sibling 来到 parent 的位置，设置 sibling 为黑色，parent 设置为红色，接着按照后边的情形继续处理。
3. node 是黑色，sibling 是黑色，sibling 拥有近端红色子节点。交换 sibling 和近端红色子节点的颜色，旋转 sibling，让近端红色子节点跑到 sibling 的位置，此时转化为情形 4 继续处理。
4. node 是黑色，sibling 是黑色，sibling 拥有远端红色子节点。旋转 parent，让 sibling 跑到 parent 的位置，sibling 远端红色子节点设置为 parent 的颜色，删除结束。
5. node 是黑色，sibling 是黑色，sibling 没有子节点，或者子节点都是黑色的。sibling 设置为红色，此时 parent 左右子树黑高一样。如果 parent 是红色，设置为黑色，删除结束；如果 parent 是黑色，parent 左右子树虽然黑高平衡，但是自身的黑高减少 1，处于失衡状态，应该把 parent 当作新的 node，从 1 开始继续分类判断处理。
   > 只有这个情形中，parent 是黑色的情况，为恢复黑高平衡，会带来 O(h)的操作，其余情形都是 O(1)操作后，删除就结束了。

## 与跳表、B 树的比较

RB 树适用于单线程内存操作，跳表适用于多线程内存操作。前者因为有颜色调整的操作，无法分段加锁，必须给整个树加锁；后者不涉及这种调整，而且是链表结构，可以分段加锁。B 树使用于 IO 磁盘操作，不适合内存操作，因为它用了树节点和数组，缓存命中不如 RB 树好。

## Treap

Treap 是一种二叉搜索树的变体，对于树的每一个节点，它引入了一个叫做权重的概念，这个权重就是一个随机数，每个节点除了保证二叉搜索树的特性之外，还要保证 parent 节点权重大于 left child 和 right child，而 left child 和 right child 之间，没有必然的权重大小要求。

rebalance(node): 在 node, node.left_child, node.right_child, 找到权重最大的那个 node，计作 target_node， 然后通过旋转，将 target_node 转到 node 的位置。

插入操作。和二叉搜索树一样，插入 new_node，之后 rebalance(new_node.parent)。

删除操作:

1. 如果 deleted node 没有 child node，直接删除 deleted node
2. 如果 deleted node 只有 left child，将 deleted node 删除后，left node 来到 deleted node 的位置, rebalance(left_node)
3. 如果 deleted node 只有 right node, 将 deleted node 删除后，right node 来到 deleted node 的位置, rebalance(right_node)
4. 如果 deleted node 有两个 child，选中权重较大的 child node，通过旋转，让这个 child node 来到 deleted node 的位置，然后删除 deleted node, rebalance(child_node)。

搜索操作。和二叉搜索树完全一样。

## Trie

前缀树，用于前缀匹配。假设在前缀树中存入`{"abc": 11 }` 和 `{"apc": 12}`, 将会得到这样的结果：

```txt
       root
       /
      a
    /   \
   b     p
  /       \
 c         c
 |         |
 11        12
```

前缀树并不是一个二叉树，它是多叉树，因此它的 tree node 可以定义为：

```rust
struct Node<K, V> {
  value: Option<V>,
  children: HashMap<K, Node<K, V>>,
}
```

树根节点的 value 是 None, 也就是说，我们把它当作哨兵节点处理，不存储任何数据。而叶子节点的 HashMap 是空的。

## Fenwick Tree

这个数据结构用于前 n 项和的计算，它不能算作是一个树，而是一个数组。为了更加方便的表述前 N 项和，我们不使用 0-based 的数组，而是 1-based 的数组，即数组下标从 1 开始。

如果有这样是的序列 s1,s2,s3...,`arr[i]`表示的就是 `s[i-lowbit(i) + 1] + s[i-lowbit(i) + 1 + 1] + ... + s[i]`。

它最核心的地方，采用了`lowbit`计算:

```rust
fn lowbit(n: usize) -> usize {
  n & (!n + 1)
}

#[cfg(test)]
mod tests {
  #[test]
  fn count() {
    // 6: 00110
    // 2: 00010
    // lowbit计算的结果就是保留原来数据最右侧的1，其余bit位变成0
    let val = lowbit(6);
    assert_eq!(val, 2);
  }
}
```

引入这种运算，会发生特别神奇的效果：

|  i  | lowbit(i) | 表示哪个区间的和 |
| :-: | :-------: | :--------------: |
|  1  |     1     |      [1, 1]      |
|  2  |     2     |      [1,2]       |
|  3  |     1     |      [3,3]       |
|  4  |     4     |      [1, 4]      |
|  5  |     1     |      [5, 5]      |

假设有这样的序列 s = { 1, 2, 1, 9, 10 }, `arr[2]` 表示的就是 `s[1] + s[2]`，`s[1]`表示的就是序列 s 的第一个数。

如果你想计算 `s[1]+s[2]+s[3]+s[4]+s[5]`, 只需要计算`arr[5] + arr[5-lowbit(5)]`.

如果你想计算 `s[3]`, 只需要计算像上边的计算方式，先计算`s[1]+s[2]+s[3]`,再计算`s[1]+s[2]`，然后前者减去后者即可。

如果你想让第 2 项增加 10，你要让`arr[2] = arr[2] + 10`, `arr[2 + lowbit(2)] += 10`。

了解完这些，实现起来就不难了，麻烦的地方在于 arr 申请空间的时候，要多申请一个，因为索引是从 1 开始的，索引为 0 的位置我们用不到。

最后说一下，求前 n 项和的时间复杂度是 O(logN),空间复杂度是 O(N)。之所以是 log(N)，因为我们在求和的时候，每次都要把索引减去 lowbit(i)，那么经过多少次减法运算后，索引就变成 0 了呢？要看 i 的二进制表达式中有多少个 1，有 4 个 1，那么经过 4 次减法运算，就会变成 0，而一个数字 N 有多少个 1，恰好就是 logN。这不难理解，如果 N 的二进制 bit 位全是 1，每次除以 2，相当于往右移动 1 位，就少了一个 1，移动多少次呢？数字是 2^a 的话，就移动 a 次，对于 N 来说，可以写成 2^(logN)，那么自然是移动 logN 次了。

## segment tree

区间树，维护区间的运算，运算可以是区间求和，区间最大值，区间最小值，或者自定义的区间运算。区间树其实也不是一个树，而是一个数组。前缀和 Fenwick tree 可以做到，segment tree 也可以。

假设你需要按照区间管理 n 个数，你需要申请 2n 大小的数组 arr，将这 n 个数存储到`arr[n..2n-1]`。对于 1 <= i <= n - 1 来说，`arr[2*i]`就是`arr[i]`的 left child，`arr[2*i+1]`就是`arr[i]`的 right child。对`arr[2*i]`和`arr[2*i+1]`做区间计算的结果，就是`arr[i]`的值。这样初始化后，arr 虽然是数组，但的确可以当作一个二叉树处理。

如果你想更新索引号为 i 的数，你需要更新`arr[i+n]`的数据，然后沿着父节点往上，更新每个祖先节点的区间计算结果。

如果你想查询索引范围是 a..b（不包含 b） 的区间计算结果，稍微麻烦一下。直接看下代码：

```rust
pub fn query(&self, range: Range<usize>) -> Result<Option<T>, SegmentTreeError> {
      if range.start >= self.size || range.end > self.size {
          return Err(SegmentTreeError::InvalidRange);
      }

      let mut left = range.start + self.size;
      let mut right = range.end + self.size;
      let mut result = None;

      while left < right {
          // arr[left] 是右节点
          //        grandparent
          //          /    \
          //    parent       uncle
          //     /  \        /
          //        left  left + 1
          if left % 2 == 1 {
              result = Some(match result {
                  None => self.nodes[left],
                  Some(old) => (self.merge_fn)(old, self.nodes[left]),
              });
              left += 1;
          }
          // arr[right] 是右节点
          //        grandparent
          //         /      \
          //     parent      uncle
          //      /  \      /      \
          //     a   b   right - 1  right
          if right % 2 == 1 {
            // 因为区间右边界right是开区间，因此 [right-1, right)
            // 的区间计算结果就是 right - 1
              right -= 1;
              result = Some(match result {
                  None => self.nodes[right],
                  Some(old) => (self.merge_fn)(old, self.nodes[right]),
              });
          }
          // 回到left的父节点
          left /= 2;
          // 来到 right 的父节点
          right /= 2;
      }

      Ok(result)
}
```

## heap

堆，分为最大堆、最小堆，到底是最大还是最小，取决使用怎样的权重算法，权重最大的节点会出现在树根节点的位置，因此它最适合寻找权重最大的一项或者几项。

从逻辑上看，堆是一种二叉树，但是从实现上来看，更习惯用数组的方式实现，就和上边提到的 segment tree 一样。但不同之处在于，你不需要开辟 2n 的空间，只需要开辟 n 个空间。

堆的初始化比较好理解。数组的第一个数就是树根节点，第二个数就是其 left child， 第三个数是其 right child，后边的数就以此类推。如下图所示。你会发现索引号为 i 的节点，它的父节点索引号是 `((i+1)/2) - 1`，而最后一个节点的父节点索引号是 `(n/2) - 1`, n 代表的是总共有 n 个数.

```txt
数字表示索引号
       0
     /  \
    1    2
   / \
  3  4
```

而初始化的过程，就是从最后一个节点的父节点开始遍历，直到遍历根节点。每次遍历的时候，比较节点和子节点中，哪个节点的权重最大，将节点与权重最大的节点做交换，然后继续向下判断权重并交换。比如上图，遍历到 0 的时候，发现 1 的权重最大，就将 0 和 1 的值交换，然后继续看 1、3、4，发现 3 的权重最大，将 3 和 1 的值交换，而 3 没有子节点，于是结束。这种向下比较、交换的操作，就是 `heapify_down`。

插入数据。将新的数据加入到数组的末尾，如果新的数据比父节点权重大，交换二者，然后从父节点开始，继续往上比较、交换，这个行为就是 `heapify_up`。比如加入一个新的节点，索引号是 5。比较索引号 5 和索引号 2 的权重，发现 5 的权重大，就将 5 和 2 的数据交换，接着，看 2 和 0 的数据，谁的权重大，发现 2 的权重更大，就将 0 和 2 的数据交换。

```txt
       0
     /  \
    1    2
   / \   /
  3  4  5
```

删除数据。这里的删除指的是删除根节点。将索引号 0 的数据直接删除，然后把数组最后一个数据移动到索引号为 0 的位置，接下来，从这个根节点开始往下执行`heapify_down`。

## veb tree

全称是 Van Emde Boas tree，对于给定的整数范围`[0, N-1]`, 它可以迅速实现插入、删除、搜索这个范围的整数，还可以查看已经加入的某个整数，它的前序整数和后序整数。这个数据结构非常麻烦，展开说它的实现非常吃力，只好介绍一下它的基本思想，就是把`[0, N-1]`拆成若干个子范围，每个子范围再去拆分，直到最后范围内只管理一个整数位置，这样就形成了树形结构（当然，不是二叉树，是多叉树）。
