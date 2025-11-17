---
title: "罪恶的红黑树"
page: true
aside: true
---

# Rust version Impl
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
添加节点场景，在调整树的颜色时，关注的是新加入的节点node, node父节点parent，祖父节点gparent，叔叔节点psibling，并根据parent和psibling的颜色进行分类讨论，处理颜色。

插入的新节点是红色，之后分以下情况处理：
1. parent是黑色。不需要做任何调整，插入结束。
2. parent是红色，psibling是红色。parent和psibling设置为黑色，gparent设置为红色，然后把gparent看成是新的node, 继续分类处理。
> 只有这种情形，会导致O(h)的复杂度，h为树的高度。其余情形都是O(1)调整，就完成了。
3. parent是红色，psibling是黑色，node是parent的近端子节点，将parent旋转，让node跑到parent的位置，然后将node设置为parent，原本的parent设置为node, 按照情形4继续处理
4. parent是红色，psibling是黑色，node是parent的远端子节点，将parent和gparent互换颜色，旋转gparent，让parent跑到gparent的位置，插入结束。

解释下node是parent的近端子节点是什么意思，如下图所示，node就是parent的近端子节点：
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
删除节点场景，在调整树的颜色时，关注的是替换被删除节点的节点node, node兄弟节点sibling。根据node和sibling的颜色进行分类讨论，处理颜色。

删除节点场景的AI helper:
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
把 S 染成红（(*sibling).color = Red），这等价于把兄弟路径“贡献”的一个黑从那边拿掉（使其路径黑数减少 1），从而把“缺黑”向上移动到 parent（如果 parent 原来是黑，则现在 parent 路径也缺黑，需要继续向上处理；如果 parent 原来是红，把 parent 染黑就可以抵消，修复完成）。
在代码中如果 parent 是黑，则把 node = parent; parent = parent.parent; continue（继续循环向上）；否则把 parent 染黑并结束。
为什么：当兄弟本身不能借红子给你（两子黑），你通过把 S 变红“把黑从兄弟路径上拿掉”使两边黑高度相等（因为 N 的一侧也缺黑），但这操作可能让 parent 侧的路径产生缺黑，所以需要把问题推进到上层。

总结下：
node节点顶替被删除节点的那个节点，parent是node的父节点，sibling是node的兄弟节点
1. node是红色，设置成黑色就可以了，删除结束
2. node是黑色，sibling是红色。parent旋转，让sibling来到parent的位置，设置sibling为黑色，parent设置为红色，接着按照后边的情形继续处理。
3. node是黑色，sibling是黑色，sibling拥有近端红色子节点。交换sibling和近端红色子节点的颜色，旋转sibling，让近端红色子节点跑到sibling的位置，此时转化为情形4继续处理。
4. node是黑色，sibling是黑色，sibling拥有远端红色子节点。旋转parent，让sibling跑到parent的位置，sibling远端红色子节点设置为parent的颜色，删除结束。
5. node是黑色，sibling是黑色，sibling没有子节点，或者子节点都是黑色的。sibling设置为红色，此时parent左右子树黑高一样。如果parent是红色，设置为黑色，删除结束；如果parent是黑色，parent左右子树虽然黑高平衡，但是自身的黑高减少1，处于失衡状态，应该把parent当作新的node，从1开始继续分类判断处理。
> 只有这个情形中，parent是黑色的情况，为恢复黑高平衡，会带来O(h)的操作，其余情形都是O(1)操作后，删除就结束了。

## 与跳表、B树的比较
RB树适用于单线程内存操作，跳表适用于多线程内存操作。前者因为有颜色调整的操作，无法分段加锁，必须给整个树加锁；后者不涉及这种调整，而且是链表结构，可以分段加锁。B树使用于IO磁盘操作，不适合内存操作，因为它用了树节点和数组，缓存命中不如RB树好。