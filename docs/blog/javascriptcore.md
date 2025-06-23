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

## Use JavascriptCore on macOS
JavascriptCore is developed by Apple, the simplest way is using it out of box on macOS, you don't need to install any other libraries or source code.

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
Let's talk about basice concept behind javascriptcore cpp api.

If you want to execute a script, you have to ready js machine. `JSGlobalContext` stands for it. Of course, you can execute code in a range of function, so javascriptcore gives us `JSContext`.

In js script, you can easily create a object, string, boolean, number, array. To help us do the same thing on cpp side, javascriptcore gives us `JSValue`. Because cpp is compiled type language, javascriptcore uses `JSValue` to bridge gap among different type such as `JSObject`, `JSString`.

Keep in mind that you can't transfer `JSValue` to specific type using `static_cast`, `dynamic_cast` and etc. You have to use APIs like `JSValueToXXX`.

As you can see, there's `console.log` in our script, but `console.log` is not a part of javascript lanugage, so it doesn't work and causes error. In example code, we assign `JSEvaluateScript` last param to `nullptr`, which means ignore any error.

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

        // get line number where error is
        auto line_value = JSObjectGetProperty(global, error_obj, line, nullptr);
        // get column number where error is
        auto column_value = JSObjectGetProperty(global, error_obj, column, nullptr);
        // get file name where error is
        auto file_value = JSObjectGetProperty(global, error_obj, file, nullptr);

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