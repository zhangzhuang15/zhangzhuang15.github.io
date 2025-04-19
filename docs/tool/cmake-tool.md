---
title: "CMake"
page: true
aside: true
---

# CMake 
## What is CMake 
CMake is a tool generating makefile or other building files. To use CMake, you have to install `cmake` binary from homebrew or other tools, then write your own CMakefile, such as `CMakeLists.txt`, `*.cmake`.

CMake is popular in C/C++ projects or projects that depend on C/C++ libraries. For example, bunjs, it is mainly writen in Zig, but it also depends on javascriptCore library which is implemented in C++, as a result, bunjs uses CMake to resolve how to link javascriptCore.

## CMakeLists 
You have to master CMake grammar if write CMakeLists. Here is a list.

### `CMAKE_MODULE_PATH`
Internal variable of CMake, defines where to find out `*.cmake` file. You can modify it to change the way CMake looks for `*.cmake` file.

### `CMAKE_SOURCE_DIR`
Internal variable of CMake, refers to the path of `CMakeLists.txt`'s parent directory. 

### `CMAKE_HOST_WIN32`
Internal variable of CMake, if cmake runs on windows, its value is true.

### `CMAKE_HOST_APPLE`
Internal variable of CMake, if cmake runs on macOS, its value is true.

### `CMAKE_SYSTEM_NAME`
Internal variable of CMake, the name of the operating system for which CMake is to build

### `APPLE`
Internal variable of CMake, if cmake runs on apple platform, its value is true.

### `WIN32`
Internal variable of CMake, if cmake runs on windows(including windows64), its value is true.

### `LINUX`
Internal variable of CMake, if cmake runs on linux, its value is true.

### `UNIX`
Internal variable of CMake, if cmake runs on unix/unix-like operating system, its value is true.

### `CMAKE_SYSTEM_PROCESSOR`
Internal variable of CMake, refers to cpu type, such as aarch64, arm64, arm, amd64, x86_64, x64, AMD64 and etc.

### `cmake_minimum_required`
```txt
cmake_minimum_required(VERSION 3.24)
```

It defines which version of cmake is allowed. In this example, if your native cmake is 3.10, you cannot run cmake successfully.

### `message`
```txt 
message(STATUS "Hello world")
```
It prints "Hello world" into terminal. 

### `list`
It provides a way controling list-type variable.

```txt 
list(APPEND fruits apple watermelon)
```
Assume `fruits` is a list-type variable, this example will append "apple" and "watermelon" to `fruits`.

APPEND is one of list operators, there're other operators:
- FIND 
- GET
- JOIN
- FILTER 
- INSERT
- POP_BACK
- POP_FRONT
- ...

### `set`
Defines a variable.

```txt 
set(age 10)
```

### `include`
It includes `*.cmake` file like including header file in C/C++.

```txt 
include(HELLO)
```
CMake walks around `CMAKE_MODULE_PATH`, finds and includes `HELLO.cmake`.


### `project`
Set project name and version.

```txt 
project(Play VERSION 1.0.0)
```
Project name is "Play", and its version is "1.0.0".

### `if`
```txt 
if (condition)
  ...
endif()


if (condition)
  ...
elseif(condition)
  ...
else()
  ...
endif()
```

### `foreach`
```txt 
set(fruits apple watermelon banana)
foreach(fruit ${fruits})
  message(STATUS ${fruit})
endforeach()
```

### `EXISTS`
Make sure if a file path is existed.

```txt 
if (EXISTS "/a/b/c.txt")
 ...
endif()
```

### `STREQUAL`
Make sure a string-type variable is equal to another string-type value.

```txt 
if (a STREQUAL "hello")
  ...
endif()
```

### `DEFINED`
Make sure if a variable is defined.

```txt 
if (DEFINED hello)
  ...
endif()
```

### `execute_process`
Spawn a child process to run a command.

```txt 
set(log "")
execute_process(
    COMMAND echo "hello"
    OUTPUT_VARIABLE log
    OUTPUT_STRIP_TRAILING_WHITESPACE
    ERROR_QUIET
)
```


### `add_executable`
Define executable name and source files, building file that cmake generates, will build this executable file.

```txt 
add_executable(hello hello.c world.c func.o)
```

### `target_link_libraries`
Link libraries to the target.

```txt 
target_link_libraries(hello libw.o)
```
`libw.o` will be linked into `hello` when build `hello`.

### `add_library`
Define library name and source files. Building file that cmake generates, will build this library.You can use it to generate static or dynamic library.

```txt 
add_library(tool SHARED tool.c helper.c)
```
Generate dynamic library `tool`.

### `target_include_directories`
Define where to search header files.

```txt 
target_include_directories(hello PRIVATE
  ${CWD}/includes
)
```

PRIVATE: The include directories are only used by the target itself.

PUBLIC: The include directories are used by the target and propagated to other targets that link against it.

INTERFACE: The include directories are not used by the target itself but are propagated to other targets that link against it.

### `include_directories`
Define where to search header files for all targets.

### `target_compile_definitions`
Define C/C++ macro for compiling target.

```txt 
target_compile_definitions(hello PRIVATE WELL=0)
```

Define a macro `WELL=1` when compile source code and build target `hello`.

### `target_compile_options`
Define compiling-stage flags of compiler such as `gcc` `g++` `clang`.

```txt 
target_compile_options(hello PRIVATE
 -fno-pie
 -Werror=move
 -fsanitize=null
)
```

### `target_link_options`
Define linking-stage flags of compiler.

```txt 
target_link_options(hello PRIVATE
  -dead_strip
  -dead_strip_dylibs
  -Wl,-ld_new
)
```

### `ENV`
Access environment variable.

```txt 
set(path $ENV{PATH})
```
Set path the value of `PATH` environment variable.

### `configure_file`
```txt 
configure_file(hello.txt yes.txt COPYONLY)
```
Copy file `hello.txt` to file `yes.txt`