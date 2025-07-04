---
title: "JavascriptCore"
page: true
aside: true
---

# JavascriptCore

## Great Article
[深入剖析javascriptcore | 简书](https://www.jianshu.com/p/e220e1f34a0b)

[javascriptcore全面解析 | 博客园](https://www.cnblogs.com/qcloud1001/p/10305293.html)

[JavaScriptCore](https://nshipster.com/javascriptcore/)

[How to use the JavaScriptCore's C API](https://karhm.com/javascriptcore_c_api/)

[JavaScriptCore C API | apple developer](https://developer.apple.com/documentation/javascriptcore/c-javascriptcore-api?language=objc)

## Use JavaScriptCore on macOS
JavaScriptCore is developed by Apple, the simplest way is using it out of box on macOS, you don't need to install any other libraries or source code.

You can follow these steps and run the example on your own.

Here is cpp example code:
```cpp 
#include <JavascriptCore/JavaScript.h>
#include <iostream>
#include <string>

int main() {
    auto global = JSGlobalContextCreate(nullptr);

    // get global object
    auto global_obj = JSContextGetGlobalObject(global);

    // create console object
    auto console = JSObjectMake(global, nullptr, nullptr);
    auto log_name_ref = JSStringCreateWithUTF8CString("log");
    auto log_value_ref = JSObjectMakeFunctionWithCallback(
        global, 
        log_name_ref, 
        [](JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception) {
            for (auto i = 0; i < argumentCount; i++) {
                auto val = arguments[i];

                if (JSValueIsNumber(ctx, val)) {
                    std::cout << JSValueToNumber(ctx, val, nullptr);
                }

                if (JSValueIsString(ctx, val)) {
                    auto str = JSValueToStringCopy(ctx, val, nullptr);
                    auto size = JSStringGetLength(str);
                    std::string cpp_str(size, 0);
                    JSStringGetUTF8CString(str, cpp_str.data(), size);
                    std::cout << cpp_str;
                    JSStringRelease(str);
                }
            }
            std::cout << std::endl;
            return JSValueMakeUndefined(ctx);
        }
    );
    JSObjectSetProperty(global, console, log_name_ref, log_value_ref, kJSPropertyAttributeNone, nullptr);

    // mount console on global object
    auto console_name_ref = JSStringCreateWithUTF8CString("console");
    JSObjectSetProperty(global, global_obj, console_name_ref, console, kJSPropertyAttributeNone, nullptr);


    auto source_code = JSStringCreateWithUTF8CString(
        "function hello() { \n"
        "  console.log('hello world ', 2025) \n"
        "  return 10\n"
        "}\n"
        "const result = hello()\n"
        "result"
    );
    
    auto result = JSEvaluateScript(global, source_code, nullptr, nullptr, 1, nullptr);

    if (JSValueIsNumber(global, result)) {
        std::cout << "result is number, it's " << JSValueToNumber(global, result, nullptr) << std::endl;
    }

    JSGlobalContextRelease(global);
    JSStringRelease(source_code);
    JSStringRelease(console_name_ref);
    return 0;
}
```

compile and run:
```shell 
g++ -std=c++20 -Wall -Werror -framework JavaScriptCore  main.cpp -o main 
./main
```
> `-framework JavaScriptCore` is key.

Let me give your a short introduction about example code, we just do these things:
1. create a context;
2. get global object of context;
3. create javascript object named `console`;
4. create javascript function and mount it on `log` property of `console`;
5. mount `console` on `console` property of global object
6. run a script
7. get the return value of this script and print it.

That's all, not difficult, is it ?


## Basic Concept
Let's talk about basic concept behind javascriptcore cpp api.

If you want to execute a script, you have to ready js machine. `JSGlobalContext` stands for it. Of course, you can execute code in a range of function, so javascriptcore gives us `JSContext`.

Using javascript, you can easily create a object, string, boolean, number, array. To help us do the same thing on cpp side, javascriptcore gives us `JSValue`. Because cpp is compiled-type language, javascriptcore uses `JSValue` to bridge gap among specific types such as `JSObject`, `JSString`.

Keep in mind that you can't transfer `JSValue` to specific type using `static_cast`, `dynamic_cast` and etc. You have to use APIs like `JSValueToXXX`.

As you can see, we have `console.log` in our script, but `console.log` is not a part of javascript lanugage, so it doesn't work and causes error. In example code, we assign `JSEvaluateScript` last param to `nullptr`, which means ignore any error. We will talk about how to catch this error later.

## Runtime
JavaScriptCore is not perfect right now, because we cannot use `setTimeout` or other native calls like `fs.readFile`. If you wrap these capacities and bind to `JSValue`, JavaScriptCore will be benifited. If you make a progress, provide event loop, congratulations！You have brought your own runtime implement. Cool.

Let's add `require` function, here is example code:
```cpp 
#include <JavascriptCore/JavaScript.h>
#include <iostream>
#include <string>

int main() {
    auto global = JSGlobalContextCreate(nullptr);

    // get global object
    auto global_obj = JSContextGetGlobalObject(global);

    // create require function and mount it on global_obj
    auto require_name = JSStringCreateWithUTF8CString("require");
    auto require_impl = JSObjectMakeFunctionWithCallback(
        global, 
        require_name, 
        [](
            JSContextRef ctx, 
            JSObjectRef function, 
            JSObjectRef thisObject, 
            size_t argumentCount, 
            const JSValueRef arguments[], 
            JSValueRef* exception
        ) {
            auto module_name = arguments[0];
            auto module_name_jsstring = JSValueToStringCopy(ctx, module_name, nullptr);
            if (module_name_jsstring) {
                auto module_name_string = to_string(module_name_jsstring);
                // to make everything simple, we just cover `build-in`
                // module
                if (module_name_string.compare("build-in") == 0) {
                    // create object, standing for build-in module
                    auto build_in = JSObjectMake(ctx, nullptr, nullptr);
                    // to make it simple, we only provide `readFile` implement
                    auto read_file_name = JSStringCreateWithUTF8CString("readFile");
                    // readFile implement
                    auto func = JSObjectMakeFunctionWithCallback(
                        ctx, 
                        read_file_name, 
                        [](
                            JSContextRef _ctx, 
                            JSObjectRef _function, 
                            JSObjectRef _thisObject, 
                            size_t _argumentCount, 
                            const JSValueRef _arguments[], 
                            JSValueRef* _exception
                        ) {
                            auto file_name = _arguments[0];
                            auto file_name_stirng = JSValueToStringCopy(_ctx, file_name, nullptr);
                            auto file_path = to_string(file_name_stirng);
                            JSStringRelease(file_name_stirng);
                            auto result = read_file(file_path);
                            auto val = JSStringCreateWithUTF8CString(result.c_str());
                            auto result_value = JSValueMakeString(_ctx, val);
                            JSStringRelease(val);
                            return result_value;
                        }
                    );

                    JSObjectSetProperty(
                        ctx, build_in, read_file_name, 
                        func, kJSPropertyAttributeNone, 
                        nullptr
                    );
                    JSStringRelease(read_file_name);
                    
                    // build_in is JSObjectRef, but it's safe to 
                    // cast it into JSValueRef.
                    return static_cast<JSValueRef>(build_in);
                }
                return JSValueMakeUndefined(ctx);
            }
            return JSValueMakeUndefined(ctx);
        });
    JSObjectSetProperty(
        global, 
        global_obj, 
        require_name, 
        require_impl, 
        kJSPropertyAttributeDontDelete | kJSPropertyAttributeDontEnum, 
        nullptr
    );
    JSStringRelease(require_name);


    // create console object, mount it on global object
    auto console = JSObjectMake(global, nullptr, nullptr);
    auto log_name_ref = JSStringCreateWithUTF8CString("log");
    auto log_value_ref = JSObjectMakeFunctionWithCallback(
        global, 
        log_name_ref, 
        [](JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception) {
            for (auto i = 0; i < argumentCount; i++) {
                auto val = arguments[i];

                if (JSValueIsNumber(ctx, val)) {
                    std::cout << JSValueToNumber(ctx, val, nullptr);
                }

                if (JSValueIsString(ctx, val)) {
                    auto str = JSValueToStringCopy(ctx, val, nullptr);
                    auto size = JSStringGetLength(str);
                    std::string cpp_str(size, 0);
                    JSStringGetUTF8CString(str, cpp_str.data(), size);
                    std::cout << cpp_str;
                    JSStringRelease(str);
                }
            }
            std::cout << std::endl;
            return JSValueMakeUndefined(ctx);
        }
    );
    JSObjectSetProperty(
        global, console, log_name_ref, 
        log_value_ref, kJSPropertyAttributeNone, 
        nullptr
    );
    auto console_name_ref = JSStringCreateWithUTF8CString("console");
    JSObjectSetProperty(
        global, global_obj, console_name_ref, 
        console, kJSPropertyAttributeNone, 
        nullptr
    );
    JSStringRelease(console_name_ref);


    auto source_code = JSStringCreateWithUTF8CString(
        "const buildin = require('build-in')\n"
        "const content = buildin.readFile('env.d.ts')\n"
        "console.log('content: ', content)"
    );

    auto result = JSEvaluateScript(global, source_code, nullptr, nullptr, 1, nullptr);

    JSGlobalContextRelease(global);
    JSStringRelease(source_code);

    return 0;
}
```

But, what about `import A from "./a.js"` ? How to tell javaScriptCore where `./a.js` is ? Is there a way that javaScriptCore informs us when it starts to parse `import` statement ?

Unfortunately, Apple doesn't provide this way. Apply only opens parts of javaScriptCore APIs through native javaScriptCore framework. It doesn't allow you to evaluate module script. If you try to run code below, you will get an error.
```cpp 
#include <JavascriptCore/JavaScript.h>
#include <iostream>

int main() {
    auto global = JSGlobalContextCreate(nullptr);

    auto source_code = JSStringCreateWithUTF8CString(
        "import A from ''./a.js'"
    );
    
    JSValueRef error_holder = nullptr;
    auto result = JSEvaluateScript(global, source_code, nullptr, nullptr, 1, &error_holder);
    if (error_holder) {
        std::cout << "something is wrong" << std::endl;
    }

    JSGlobalContextRelease(global);
    JSStringRelease(source_code);

    return 0;
}
```

Don't cry, you can download javaScriptCore source code and work around. JavaScriptCore source code provides us all of APIs. When javaScriptCore trys to parse `import` statement and find the module, it will use `globalThis[Symbol.moduleLoader].resolve` and `globalThis[Symbol.moduleLoader].fetch` to load module. By default, javaScriptCore doesn't implement them. It's responsibility of host environment to implement. In other words, Bunjs uses javaScriptCore, Bunjs has to implement them.

So, what can we do ? There are 2 methods.

Method 1. You don't need to modify javaScriptCore source code, instead, define at js side, which might look like:
```js 
globalThis[Symbol.moduleLoader] = {
  // make sure where is module
  resolve(specifier, parentURL) {
    return 'file:///your/path/' + specifier;
  },
  // get module content, in other words, module source code
  fetch(url) {
    return fetch(url).then(r => r.text());
  }
};
```

Method 2. Define at cpp side, which looks like:
```cpp 
#include "runtime/ModuleLoader.h"
#include "runtime/JSGlobalObject.h"
#include "runtime/JSString.h"
#include "runtime/JSValue.h"
#include "runtime/VM.h"

using namespace JSC;

// Define your own module loader
class MyModuleLoader : public ModuleLoader {
public:
    MyModuleLoader(VM& vm, Structure* structure)
        : ModuleLoader(vm, structure) {}

    // where is module
    JSValue resolve(JSGlobalObject* globalObject, JSValue specifier, JSValue parentModule) override {
        return specifier;
    }

    // get module source code
    JSValue fetch(JSGlobalObject* globalObject, JSValue moduleKey) override {
        return jsString(globalObject->vm(), "export default 42;");
    }
};

// regist your own module loader into global object(i.e globalThis)
void registerMyModuleLoader(JSGlobalObject* globalObject) {
    VM& vm = globalObject->vm();
    auto* structure = ModuleLoader::createStructure(vm, globalObject, globalObject->moduleLoaderPrototype());
    MyModuleLoader* loader = new MyModuleLoader(vm, structure);

    globalObject->setModuleLoader(vm, loader);
}
```

Bunjs uses neither of methods. It has own js parser. 
1. it parses js source code firstly, and collects module. 
2. it finds and gets module source code.
3. it invokes javaScriptCore APIs like `JSModuleRecordCreate` and `JSParseModuleSource`, transforming module source code to `JSModuleRecordRef` and caching it. 
4. it invokes `JSModuleRecordProvide` to register `JSModuleRecordRef` into javaScriptCore virtual machine. 
Finish these works, Bunjs tells javaScriptCore to evaluate js code. When javaScriptCore meets import statement, imported module has been generated before, so it fetchs module directly with no need to invoke module loader (if it invokes, there's an error cause host environment doesn't implement module loader!)
 

## Catch Error
We improve our example code to support catch the error.

```cpp 
#include <JavascriptCore/JavaScript.h>
#include <iostream>
#include <string>

int main() {
    auto global = JSGlobalContextCreate(nullptr);

    // get global object
    auto global_obj = JSContextGetGlobalObject(global);

    // create console object
    auto console = JSObjectMake(global, nullptr, nullptr);
    auto log_name_ref = JSStringCreateWithUTF8CString("log");
    auto log_value_ref = JSObjectMakeFunctionWithCallback(
        global, 
        log_name_ref, 
        [](JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception) {
            for (auto i = 0; i < argumentCount; i++) {
                auto val = arguments[i];

                if (JSValueIsNumber(ctx, val)) {
                    std::cout << JSValueToNumber(ctx, val, nullptr);
                }

                if (JSValueIsString(ctx, val)) {
                    auto str = JSValueToStringCopy(ctx, val, nullptr);
                    auto size = JSStringGetLength(str);
                    std::string cpp_str(size, 0);
                    JSStringGetUTF8CString(str, cpp_str.data(), size);
                    std::cout << cpp_str;
                    JSStringRelease(str);
                }
            }
            std::cout << std::endl;
            return JSValueMakeUndefined(ctx);
        }
    );
    JSObjectSetProperty(global, console, log_name_ref, log_value_ref, kJSPropertyAttributeNone, nullptr);

    // mount console on global object
    auto console_name_ref = JSStringCreateWithUTF8CString("console");
    JSObjectSetProperty(global, global_obj, console_name_ref, console, kJSPropertyAttributeNone, nullptr);


    auto source_code = JSStringCreateWithUTF8CString(
        "function hello() { \n"
        "  console.log('hello world ', 2025) \n"
        "  console.error('hello') \n"
        "  return 10\n"
        "}\n"
        "const result = hello()\n"
        "result"
    );
    
    JSValueRef error_holder = nullptr;
    auto result = JSEvaluateScript(global, source_code, nullptr, nullptr, 1, &error_holder);

    // there is an error, deal with it!
    if (error_holder) {
        auto error_obj = JSValueToObject(global, error_holder, nullptr);

        // Unfortunately, there's no apple official introduction about properties of error object,
        // I get it from other open source code, like https://github.com/elie222/react-native/blob/1835dbea7bcf43e0c30deb6d9d8988e3b7a523f0/ReactCommon/jschelpers/JSCHelpers.cpp#L139
        auto line = JSStringCreateWithUTF8CString("line");
        auto column = JSStringCreateWithUTF8CString("column");
        auto file = JSStringCreateWithUTF8CString("sourceURL");
        auto message = JSStringCreateWithUTF8CString("message");

        // get line number where error is
        auto line_value = JSObjectGetProperty(global, error_obj, line, nullptr);
        // get column number where error is
        auto column_value = JSObjectGetProperty(global, error_obj, column, nullptr);
        // get file name where error is
        auto file_value = JSObjectGetProperty(global, error_obj, file, nullptr);
        // get error message which represents what is wrong
        auto message_value = JSObjectGetProperty(global, error_obj, message, nullptr);

        // transform JSValue to primitive value of c plus plus and print them
        if (JSValueIsNumber(global, line_value)) {
            std::cout << "at line " << JSValueToNumber(global, line_value, nullptr);
        }

        if (JSValueIsNumber(global, column_value)) {
            std::cout << "at column " << JSValueToNumber(global, column_value, nullptr);
        }

        if (JSValueIsString(global, file_value)) {
            auto file_str = JSValueToStringCopy(global, file_value, nullptr);
            auto file_size = JSStringGetLength(file_str);
            std::string buf(file_size, 0);
            JSStringGetUTF8CString(file_str, buf.data(), file_size);
            std::cout << "at filename: " << buf << std::endl;
            JSStringRelease(file_str);
        }

        if (JSValueIsString(global, message_value)) {
            auto message_str = JSValueToStringCopy(global, message_value, nullptr);
            auto message_size = JSStringGetLength(message_str);
            std::string buf(message_size, 0);
            JSStringGetUTF8CString(message_str, buf.data(), message_size);
            std::cout << "error message: " << buf << std::endl;
            JSStringRelease(message_str);
        }
    }

    if (JSValueIsNumber(global, result)) {
        std::cout << "result is number, it's " << JSValueToNumber(global, result, nullptr) << std::endl;
    }

    JSGlobalContextRelease(global);
    JSStringRelease(source_code);
    JSStringRelease(console_name_ref);
    return 0;
}
```


## Get Promise Value
JavaScriptCore supports `Promise` out of box, you don't need to give your own implement with its APIs and don't worry about micro-task-queue. Same as javascript side, you cannot get Promise value with cpp APIs directly.

You can follow example code below and explore how to get Promise value.
```cpp 
#include <JavascriptCore/JavaScript.h>
#include <iostream>
#include <string>

int main() {
    auto global = JSGlobalContextCreate(nullptr);

    auto source_code = JSStringCreateWithUTF8CString(
        "async function hello() { \n"
        "  return 10\n"
        "}\n"
        "hello()"
    );
    
    auto result = JSEvaluateScript(global, source_code, nullptr, nullptr, 1, nullptr);

    if (JSValueIsObject(global, result)) {
        // transform result to JSObject
        auto promise_obj = JSValueToObject(global, result, nullptr);

        // get `then` method of promise
        auto promise_obj_then_method_name = JSStringCreateWithUTF8CString("then");
        auto promise_obj_then_method = JSObjectGetProperty(
            global, promise_obj, 
            promise_obj_then_method_name, nullptr
        );
        JSStringRelease(promise_obj_then_method_name);
        auto promise_obj_then_method_obj = JSValueToObject(
            global, promise_obj_then_method, nullptr
        );

        // make a function
        auto resolve = JSObjectMakeFunctionWithCallback(
            global, 
            nullptr,
            [](JSContextRef ctx, JSObjectRef function, 
            JSObjectRef thisObject, size_t argumentCount, 
            const JSValueRef arguments[], JSValueRef* exception) {
                // get promise result,
                // same as `promise.then(val => console.log("result is ", val))`
                auto val = arguments[0];
                if (JSValueIsNumber(ctx, val)) {
                    std::cout << "result is " << JSValueToNumber(ctx, val, nullptr);
                }
                return JSValueMakeUndefined(ctx);
            }
        );
        
        JSValueRef err = nullptr;

        // invoke `then` method.
        // important: you have to pass promise_obj as thisObject instead of nullptr
        JSObjectCallAsFunction(
            global, promise_obj_then_method_obj, promise_obj, 
            1, &resolve, &err
        );

        // deal with err
        if (err) {
            auto s = JSValueToStringCopy(global, err, nullptr);
            auto size= JSStringGetLength(s);
            std::string buf(size, 0);
            JSStringGetUTF8CString(s, buf.data(), size);
            std::cout << "error: " << buf << std::endl;
            JSStringRelease(s);
        }
    }

    JSGlobalContextRelease(global);
    JSStringRelease(source_code);
    return 0;
}
```

## `setTimemout`
Last chapter, we talk about `Promise`. `Promise` is part of javascript language. JavaScriptCore provides micro-task-queue which binds with `Promise`, we don't need to implement.

What about `setTimeout` ? JavaScriptCore doesn't implement. Let's try to give a simple example that implements `setTimeout` and its macro-task-queue.

```cpp 
#include <string>
#include <iostream>
#include <vector>
#include <thread>
#include <JavaScriptCore/JavaScript.h>

// Macro-task
struct FunctionCallContext {
    JSContextRef ctx;
    JSValueRef function;
    JSObjectRef thisObject;
    size_t timeout;
};

// Macro-task-queue. To make it simple, we don't
// consider wrapping with mutex lock.
auto task_queue = std::vector<FunctionCallContext>();

std::string to_string(JSStringRef source) {
    auto size = JSStringGetLength(source);
    std::string buf(size, 0);
    JSStringGetUTF8CString(source, buf.data(), size);
    return buf;
}

int main() {
    auto global_context = JSGlobalContextCreate(nullptr);
    auto global_object = JSContextGetGlobalObject(global_context);

    task_queue.reserve(8);

    // implement setTimeout and mount it on globalThis
    {
        auto set_timeout_name = JSStringCreateWithUTF8CString("setTimeout");
        auto set_timeout_impl = JSObjectMakeFunctionWithCallback(
            global_context, 
            set_timeout_name,
            [](
                JSContextRef ctx, 
                JSObjectRef function, 
                JSObjectRef thisObject, 
                size_t argumentCount, 
                const JSValueRef arguments[], 
                JSValueRef* exception
            ) {
                auto func = arguments[0];
                auto timeout = arguments[1];
                auto native_timeout = JSValueToNumber(ctx, timeout, nullptr);

                struct FunctionCallContext context;
                context.ctx = ctx;
                context.function = func;
                context.thisObject = thisObject;
                context.timeout = (ssize_t)native_timeout;

                // just push it into macro-task-queue
                task_queue.push_back(context);

                return JSValueMakeUndefined(ctx);
            }
        );
        JSObjectSetProperty(
            global_context, 
            global_object, 
            set_timeout_name, 
            set_timeout_impl, 
            kJSPropertyAttributeNone,
            nullptr
        );
        JSStringRelease(set_timeout_name);
    }

    // implement log function and mount it on globalThis,
    // so that we could print something and see executing
    // macro task.
    {
        auto log_name = JSStringCreateWithUTF8CString("log");
        auto log_impl = JSObjectMakeFunctionWithCallback(
            global_context,
            log_name,
            [](
                JSContextRef ctx, 
                JSObjectRef function, 
                JSObjectRef thisObject, 
                size_t argumentCount, 
                const JSValueRef arguments[], 
                JSValueRef* exception
            ) {
                for (ssize_t i = 0; i < argumentCount; i++) {
                    auto val = arguments[i];

                    if (JSValueIsNumber(ctx, val)) {
                        auto value = JSValueToNumber(ctx, val, nullptr);
                        std::cout << value;
                    } else if (JSValueIsString(ctx, val)) {
                        auto value = to_string(
                            JSValueToStringCopy(ctx, val, nullptr)
                        );
                        std::cout << value;
                    } else {
                        std::cout << "";
                    }
                }
                std::cout << std::endl;
                return JSValueMakeUndefined(ctx);
            }
        );
        JSObjectSetProperty(
            global_context,
            global_object,
            log_name,
            log_impl,
            kJSPropertyAttributeNone,
            nullptr
        );
        JSStringRelease(log_name);
    }

    auto source_code = JSStringCreateWithUTF8CString(
        "setTimeout(() => { log('hello world')}, 200)\n"
        "log('happy today', false, 2025)"
    );
    JSEvaluateScript(
        global_context, 
        source_code, 
        nullptr, 
        nullptr, 
        1, 
        nullptr
    );
    
    // imitate one circle of event loop
    std::this_thread::sleep_for(std::chrono::milliseconds(1300));

    // traverse task queue and execute task
    for (auto func_context : task_queue) {
        JSObjectCallAsFunction(
            func_context.ctx,
            JSValueToObject(func_context.ctx, func_context.function, nullptr),
            func_context.thisObject,
            0,
            nullptr,
            nullptr
        );
    }

    JSGlobalContextRelease(global_context);

    return 0;
}
```

run: `g++ -std=c++20 main.cpp -o main -framework JavaScriptCore && ./main`

We can also try more complex javascript code:
```cpp 
auto source_code = JSStringCreateWithUTF8CString(
        "const p = {\n"
        "  message: 'hello world',\n"
        "  say() {\n"
        "    log(this.message)\n"
        "  },\n"
        "  run() {\n"
        "    setTimeout(() => this.say(), 200)\n"
        "  }\n"
        "}\n"
        "p.run()\n"
        "log('happy today', false, 2025)"
    );
```

## Rust version
Here is Rust version of our example code.

:::code-group
```rs [src/main.rs]
use rusty_jsc_sys::{
    JSEvaluateScript, JSGlobalContextCreate, JSGlobalContextRelease, 
    JSStringCreateWithUTF8CString, JSStringRelease, JSValueToNumber,
    OpaqueJSClass, JSValueRef
};
use std::ffi::CString;

fn main() {
    unsafe {
        let global_context = JSGlobalContextCreate(std::ptr::null_mut::<u8>() as *mut OpaqueJSClass);

        // this is very important, transform &str to *mut c_char with CString.
        // if you try `&str.as_ptr() as *mut c_char`, you will get into trouble 
        // with JSEvaluateScript
        let source_code = JSStringCreateWithUTF8CString(
            CString::new("var a = 10;\na += 4;\na;").unwrap().into_raw()
        );

        let mut except: JSValueRef = std::ptr::null_mut();
        if except.is_null() {
            println!("before evaluate, it's null");
        }
        let result = JSEvaluateScript(
            global_context, 
            source_code, 
            // in c/c++ version, we can assign NULL or nullptr,
            // in Rust, std::ptr::null_mut() is the choice
            std::ptr::null_mut(), 
            std::ptr::null_mut(), 
            1, 
            (&mut except) as *mut JSValueRef
        );
        if !except.is_null() {
            println!("something is wrong");
        }
        let result = JSValueToNumber(global_context, result, std::ptr::null_mut());
        println!("result is : {result}");

        JSStringRelease(source_code);
        JSGlobalContextRelease(global_context);
   };
    
}
```

```rs [build.rs]
fn main() {
    // rusty_jsc_sys only provides bindings, and we have to
    // link framework ourselves. this is feature of cargo 
    // build.rs, visit https://doc.rust-lang.org/cargo/reference/build-scripts.html
    // and learn more.
    println!("cargo::rustc-link-lib=framework=JavaScriptCore");
}
```

```toml [Cargo.toml]
[package]
name = "rust-jsc-demo"
version = "0.1.0"
edition = "2021"

[dependencies]
rusty_jsc_sys = "0.1.0"
```
:::

build: `cargo build`

run: `./target/debug/rust-jsc-demo`

Result is 14. Nice !

## Lexer, Parser, Bytecode, Interpreter and JIT
JavaScriptCore consists of many components.

`Lexer` transforms js source code to tokens.

`Parser` transforms tokens to AST.

There's a component, but I don't know its name, transforming AST to `Bytecode`.

`LLInt`, low level interpreter, executes bytecode.
> bytecode is still dynamic data type, not static data type.

JavaScriptCore finds out which function(consists of bytecodes) is hot, then `JIT` transforms bytecodes of this function to machine code. Next time, JavaScriptCore can execute machine code for speeding up.

Where does JavaScriptCore save machine code ? Very simple, it uses `mmap` system call to alloc memory which is `PROT_EXEC`, and save machine code into the memory. It also save the start address of the memory into a pointer, we assume its name is `ptr`. JavaScriptCore can execute machine code through `(*ptr)()`. If you have keen eye, `ptr` is just function pointer of C language.

If you want to dive into JIT, LLIT deeply, you can take a look at these source code:
1. [quickjs](https://github.com/bellard/quickjs), written with C
2. [boa](https://github.com/boa-dev/boa), written with Rust
3. [escargot](https://github.com/Samsung/escargot), written with C++