---
title: "使用vue遇到的一些坑"
page: true
aside: true
---

## 数组增减和UI更新
```vue
<template>
  <div>
     <form>
        <form-item
          v-for="scope in scopes"
        >
          <select 
            multiple
            v-model="scope.model1"
          >
            <select-option :value="0" />
            <select-option :value="1" />
          </select>

          <select 
            multiple
            v-model="scope.model2"
          >
            <select-option :value="0" />
            <select-option :value="1" />
          </select>
        </form-item>
     </form>

     <button @click="deleteSecond">deleteSecond</button>
  </div>
</template>
<script>
export default {
    data() {
        return {
            scopes: [
                { 
                    model1: [0,1], 
                    model2: [1] 
                },
                { 
                    model1: [1], 
                    model2: [1] 
                },
                { 
                    model1: [0], 
                    model2: [0] 
                },
            ]
        }
    },
    methods: {
        deleteSecond() {
            this.scopes.splice(1, 1)
        }
    }
}
</script>
```
点击删除按钮后，你会发现第二行select选中的的数据虽然变成了0，但是会触发一次第二个select组件的v-model更新。

意思就是说，删除第二个select，并不是直接复用第三个select，而是在第二个select的基础上，拿着第三个select的结果，更新了第二个select，没错，你本来以为是删除第二个select的操作，实际上却变成了删除第三个select，更新第二个select。

更新操作带来了副作用，你想啊，select内部可能使用watch监听了value的变动，那么就会执行一次watch effect。

解决方法就是，给每一个select绑定key。删除第二个select后，第三个select来到第二个位置，但是它的key已经和以前的第二个select不同了，这样在更新的时候，vue就会知道，不应该在第二个select的基础上做更新，而是直接删除掉。

## v-model的设置
使用v-model的时候，往往只关心子组件把v-model更新成了什么值，但是有时候也有必须要设置v-model的值，让子组件遵循这个值：
```vue
<script>
export default {
    props: {
        value: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            internalValue: this.value
        }
    },
    watch: {
        value(v) {
            this.internalValue = v
        },
        internalValue(v) {
            this.$emit('input', v)
        }
    }
}
</script>
```
如果这么写，你没准儿就发现一个奇怪的现象：父组件更改了v-model的值，但是子组件内部的watch value effect没有执行，导致 internalValue 没有变化，最终使得子组件的UI没有如期更新。

解决方案：
```vue
<script>
export default {
    props: {
        value: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            internalValue: this.value
        }
    },
    watch: {
        value: {
            handler(v) {
                this.internalValue = v
            },
            immediate: true // [!code highlight]
            
        },
        internalValue(v) {
            this.$emit('input', v)
        }
    }
}
</script>
```

默认情况下，不会立即调用 watch value effect，这就意味着，当 value 第一次变化的时候，我们只是给 value 绑定了 effect, 在第二次变化的时候，effect才会执行。