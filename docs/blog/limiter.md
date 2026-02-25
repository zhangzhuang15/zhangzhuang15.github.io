---
title: "限流算法"
page: true
aside: true
---

# 限流算法

前端发送请求的时候，会采取一些措施，限制请求短时间密集发送，比如在固定的时间间隔里只允许固定的请求数量，或者每个请求之间必须满足固定的时间间隔，等等，也就是 throttle 和 debounce 两种模式。

同样，服务端接收请求和发送请求的时候，也需要限流，防止自身服务处理过多的请求崩溃，防止自身向其他服务发送请求导致对方服务崩溃。本文会简单地介绍一些算法，基于 AI 的回答。

## 漏桶算法

```txt
         请求1  请求2  请求3
           ↓     ↓     ↓
         ┌─────────────┐
         │ 💧💧💧💧💧 │  ← 漏桶（请求堆积）
         │ 💧💧💧     │
         │ 💧💧       │
         └──────↓──────┘
              💧💧  ← 固定速率流出（如：10个/秒）
                ↓
           处理请求
```

```java
class LeakyBucket {
    int capacity;        // 桶容量（最多积压多少请求）
    int water;           // 当前积压的请求数
    double leakRate;     // 漏出速率（个/秒）
    long lastLeakTime;   // 上次漏出的时间
}
```

具体步骤：

```txt
1. 初始化
   桶容量: 100
   漏出速率: 10个/秒
   当前水量: 0

2. 请求到来时:
   ① 先漏水（处理之前积压的请求）
      计算距离上次的时间差
      漏出的请求数 = 时间差(秒) × 速率
      当前水量 = max(0, 当前水量 - 漏出数)

   ② 尝试加入新请求
      if (当前水量 + 1 <= 容量):
          当前水量 += 1
          return 加入队列 ✅
      else:
          return 溢出拒绝 ❌

   ③ 按固定速率处理请求
      每 1/速率 秒处理一个请求
```

具体示例：

```txt
时间轴:     0s      1s      2s      3s      4s
漏出速率: 10个/秒，容量: 100

t=0s:  水量=0, 来50个请求 → 水量=50 ✅
       开始漏水: 每0.1秒处理1个

t=1s:  漏出10个 → 水量=40, 来20个请求 → 水量=60 ✅
       继续漏水: 每0.1秒处理1个

t=2s:  漏出10个 → 水量=50, 来80个请求 → 水量=130 ❌
       只能接受50个(达到容量100)，拒绝30个

t=3s:  漏出10个 → 水量=90
t=4s:  漏出10个 → 水量=80
```

这种算法可以实现**流量整形**。流量整形（Traffic Shaping） = 将不规则的突发流量"削峰填谷"，变成平滑的恒定输出。

```txt
输入流量（不规则）:
时间: 0s   1s   2s   3s   4s
请求: 100  0    200  50   0
      ↓    ↓    ↓    ↓    ↓
   ┌─────────────────────────┐
   │      漏桶缓冲区          │
   └─────────────────────────┘
      ↓    ↓    ↓    ↓    ↓
输出: 10   10   10   10   10  ← 恒定速率
```

```txt
原始流量:
  │
  │    ┌──┐
  │    │  │
  │┌──┐│  │┌─┐
  ││  ││  ││ │
  └┴──┴┴──┴┴─┴──► 时间

整形后:
  │
  │┌──┬──┬──┬──┐
  ││  │  │  │  │
  ││  │  │  │  │
  └┴──┴──┴──┴──┴──► 时间
```

应用建议

选择漏桶的场景

✅ 适合使用漏桶：

- 需要严格控制下游处理速率
- 可以接受请求排队延迟
- 需要流量整形（削峰填谷）

例如：

- 数据库写入限流
- 第三方 API 调用限速
- 视频流推送

❌ 不适合漏桶：

- 需要低延迟响应
- 允许突发流量
- 用户体验敏感的场景
- 此时应选择令牌桶

## 令牌桶算法

```txt
          [令牌生成器]
               ↓  固定速率生成令牌
          ┌─────────┐
          │ 🪙 🪙 🪙 │  ← 令牌桶（容量有限）
          │ 🪙 🪙   │
          └─────────┘
               ↓  请求消耗令牌
          [API 请求]
```

```java
class TokenBucket {
    int capacity;        // 桶容量（最多存多少令牌）
    int tokens;          // 当前令牌数
    double rate;         // 令牌生成速率（个/秒）
    long lastRefillTime; // 上次补充令牌的时间
}
```

具体步骤：

```txt
1. 初始化
   桶容量: 100
   生成速率: 10个/秒
   当前令牌: 100

2. 请求到来时:
   ① 先补充令牌
      计算距离上次的时间差
      生成的令牌数 = 时间差(秒) × 速率
      当前令牌 = min(当前令牌 + 生成数, 容量)

   ② 尝试消耗令牌
      if (当前令牌 >= 需要的令牌数):
          当前令牌 -= 需要的令牌数
          return 允许通过 ✅
      else:
          return 拒绝 ❌
```

具体示例:

```txt
时间轴:     0s      1s      2s      3s      4s
速率: 10个/秒，容量: 100

t=0s:  令牌=100, 请求消耗50个 → 剩余50个 ✅
t=1s:  补充10个 → 60个, 请求消耗20个 → 剩余40个 ✅
t=2s:  补充10个 → 50个, 请求消耗80个 → 不足，拒绝 ❌
t=3s:  补充10个 → 60个, 请求消耗30个 → 剩余30个 ✅
t=4s:  补充10个 → 40个
```

因为桶内有累积的令牌，一旦遇到短时间的请求，这些请求也是可以获取到令牌，然后被处理或者发送出去的。

✅ 优点

允许突发流量

```txt
场景: 桶容量100, 速率10个/秒
平时: 每秒10个请求稳定通过
突发: 短时间可以处理100个请求（消耗积累的令牌）
```

流量平滑

```txt
长期平均速率 = 令牌生成速率
不会像固定窗口那样产生"脉冲"
```

⚠️ 注意事项

冷启动问题

```txt
系统刚启动时，桶是满的
如果长时间没有请求，桶也会满
→ 可能导致第一波请求全部通过
```

时间精度

```java
// 使用纳秒级时间戳，避免精度损失
System.nanoTime()  // ✅
System.currentTimeMillis()  // ⚠️ 毫秒精度可能不够
```

## 固定窗口算法

将时间划分为固定大小的窗口（如 1 分钟），每个窗口内独立计数：

```txt
时间轴:  |---窗口1---|---窗口2---|---窗口3---|
         0:00      1:00      2:00      3:00

窗口1: 100次请求 ✅ (限额100)
窗口2: 150次请求 ❌ (超过限额)
窗口3: 计数重置为0
```

实现示例:

```java
public class FixedWindowRateLimiter {
    private final RedisTemplate<String, String> redis;
    private final int limit;      // 限流阈值
    private final int windowSize; // 窗口大小(秒)

    public boolean tryAcquire(String key) {
        // 1. 计算当前窗口的起始时间
        long now = System.currentTimeMillis() / 1000;
        long windowStart = now / windowSize * windowSize;

        // 2. Redis key 包含窗口时间
        String redisKey = key + ":" + windowStart;

        // 3. 原子递增计数
        Long count = redis.opsForValue().increment(redisKey);

        // 4. 首次创建时设置过期时间
        if (count == 1) {
            redis.expire(redisKey, windowSize, TimeUnit.SECONDS);
        }

        // 5. 判断是否超过限额
        return count <= limit;
    }
}
```

这种算法存在临界问题：

```txt
时间:    0:59        1:00        1:01
窗口:  |--窗口1--|--窗口2--|
请求:     90次      90次
         ✅         ✅

实际1分钟内(0:59-1:01): 180次 ❌
但算法认为合法，因为每个窗口都没超
```

这个问题可以采用滑动窗口方法解决。

## 滑动窗口算法

用多个小窗口组成一个大窗口，随时间滑动：

```txt
固定窗口问题:
时间:  |----60s----|----60s----|
       0:59  90次   1:00  90次
       实际1分钟: 180次 ❌

滑动窗口解决:
时间:  [------------------60s滑动窗口---------------]
       0:30  0:40  0:50  1:00  1:10  1:20  1:30
       每次都统计过去60秒内的总请求数
```

```java
@Component
public class SlidingWindowLimiter {
    @Autowired
    private StringRedisTemplate redis;

    public boolean isAllowed(String key, int limit, int windowSeconds) {
        long now = System.currentTimeMillis();
        long windowStart = now - windowSeconds * 1000L;

        String luaScript =
            // 1. 删除窗口外的旧数据
            "redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1]) " +
            // 2. 统计当前窗口内的请求数
            "local count = redis.call('ZCARD', KEYS[1]) " +
            // 3. 如果未超限，添加当前请求
            "if count < tonumber(ARGV[3]) then " +
            "    redis.call('ZADD', KEYS[1], ARGV[2], ARGV[2]) " +
            "    redis.call('EXPIRE', KEYS[1], ARGV[4]) " +
            "    return 1 " +
            "else " +
            "    return 0 " +
            "end";

        Long result = redis.execute(
            RedisScript.of(luaScript, Long.class),
            Collections.singletonList("limiter:" + key),
            String.valueOf(windowStart),  // ARGV[1]: 窗口起始时间
            String.valueOf(now),          // ARGV[2]: 当前时间
            String.valueOf(limit),        // ARGV[3]: 限流阈值
            String.valueOf(windowSeconds + 1) // ARGV[4]: 过期时间
        );

        return result != null && result == 1;
    }
}
```

原理不变，实现做一些调整，用计数器数组代替完整时间戳，就得到了滑动日志算法：

```java
@Component
public class SlidingLogLimiter {
    @Autowired
    private StringRedisTemplate redis;

    /**
     * 将窗口分成N个小格子，每个格子统计请求数
     * 例如：60秒窗口分成6个10秒格子
     */
    public boolean isAllowed(String key, int limit, int windowSeconds, int slotCount) {
        long now = System.currentTimeMillis() / 1000;
        int slotSize = windowSeconds / slotCount;
        long currentSlot = now / slotSize;

        String luaScript =
            // 1. 计算需要统计的槽位范围
            "local slots = {} " +
            "local total = 0 " +
            "for i = 0, tonumber(ARGV[2]) - 1 do " +
            "    local slot = tonumber(ARGV[1]) - i " +
            "    local count = tonumber(redis.call('HGET', KEYS[1], slot) or '0') " +
            "    total = total + count " +
            "end " +
            // 2. 如果未超限，当前槽位+1
            "if total < tonumber(ARGV[3]) then " +
            "    redis.call('HINCRBY', KEYS[1], ARGV[1], 1) " +
            "    redis.call('EXPIRE', KEYS[1], ARGV[4]) " +
            "    return 1 " +
            "else " +
            "    return 0 " +
            "end";

        Long result = redis.execute(
            RedisScript.of(luaScript, Long.class),
            Collections.singletonList("limiter:slot:" + key),
            String.valueOf(currentSlot),     // ARGV[1]: 当前槽位
            String.valueOf(slotCount),       // ARGV[2]: 槽位数量
            String.valueOf(limit),           // ARGV[3]: 限流阈值
            String.valueOf(windowSeconds + slotSize) // ARGV[4]: 过期时间
        );

        return result != null && result == 1;
    }
}

// 60秒限制100次，分成6个10秒的槽位
limiter.isAllowed("user:123", 100, 60, 6);
```

还有一种方式，不需要把窗口划分成若干的小窗口，而是同时检查当前窗口和上一个窗口，按时间比例分配配额：

```java
@Component
public class SmoothFixedWindowLimiter {
    @Autowired
    private StringRedisTemplate redis;

    public boolean isAllowed(String key, int limit, int windowSeconds) {
        long now = System.currentTimeMillis() / 1000;
        long currentWindow = now / windowSeconds;
        long previousWindow = currentWindow - 1;

        // 计算当前窗口已过时间的比例
        double currentProgress = (double)(now % windowSeconds) / windowSeconds;

        String luaScript =
            "local current = tonumber(redis.call('GET', KEYS[1]) or '0') " +
            "local previous = tonumber(redis.call('GET', KEYS[2]) or '0') " +
            // 加权计算：previous * (1-进度) + current
            "local weighted = previous * tonumber(ARGV[3]) + current " +
            "if weighted < tonumber(ARGV[2]) then " +
            "    redis.call('INCR', KEYS[1]) " +
            "    redis.call('EXPIRE', KEYS[1], ARGV[1]) " +
            "    return 1 " +
            "else " +
            "    return 0 " +
            "end";

        Long result = redis.execute(
            RedisScript.of(luaScript, Long.class),
            Arrays.asList(
                "limiter:" + key + ":" + currentWindow,
                "limiter:" + key + ":" + previousWindow
            ),
            String.valueOf(windowSeconds),
            String.valueOf(limit),
            String.valueOf(1 - currentProgress) // 上个窗口的权重
        );

        return result != null && result == 1;
    }
}
```

示例计算：

```txt
时间: 0:59 (窗口进度 59/60 = 98.3%)
上个窗口(0:00): 90次
当前窗口(1:00): 80次

加权计算: 90 * (1 - 0.983) + 80 = 90 * 0.017 + 80 = 81.53
如果限额100，则允许 ✅
```
