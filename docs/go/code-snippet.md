---
title: "Go Code Snippet"
page: true
aside: true
---

# Go Code Snippet
Record some useful code snippet, help you get familiar with Go.

Although Go supports functional programming, unlike javascript, it doesn't offer bultin functions, e.g. `Array.prototype.map`, `Array.prototype.filter`. Therefor, you should define these functions based Go standard library.

## How to Resolve Path 
In javascript, you can get relative path or absolute path through `node:path` module. In Go, you can use `path/filepath`.

```go 
import "path/filepath"

func main() {
    // a/b
    filepath.Join("a", "b")

    // d.txt
    filepath.Base("/ab/c/d.txt")

    // ../d/e
    filepath.Rel("/a/c", "/a/d/e")

    // {cwd}/hello
    filepath.Abs("./hello")

    // true
    filepath.isAbs("/a/c/d")

    // txt
    filepath.Ext("./d/c.txt")

    // ./d
    filepath.Dir("./d/c.txt")

    // ./c/d
    filepath.Clean("./a/b/../../c/d")
}
```

## How to Work with String 
In javascript, you can work with String through its native function, e.g. `String.prototype.startsWith`, `String.prototype.find`. In Go, you can use `strings`.

```go 
import "strings"

func main() {
    strings.Compare("hello", "hel")
    strings.HasSuffix("hello.txt", ".txt")
    strings.Split("why,not,use,this", ",")
    strings.Join([]string{"hello", "right", "now"}, "-")
    strings.Contains("hello", "lo")
}
```

## Template String 
```go 
import "fmt"

func main() {
    name := "Merry"
    s := fmt.Sprintf("hello %s", name)
}
```

## How to Get Random Value 
In javascript, you can get random value through `Math.random()`. In Go, you can use `math/rand`.

```go 
import (
    "math/rand"
    "time"
)

func main() {
    random := rand.New(rand.NewSource(time.Now().UnixNano()))
    // v is a random value which is in [0, 10)
    v := random.Intn(10)
}
```

## How to Get Time 
In javascript, you can access time with `Date`. In Go, you can use `time`.

```go 
import "time"

func main() {
    time.Sleep(10 * time.Second)

    now := time.Now()

    // in javascript, we use dayjs and "YYYYMMDDHHmmss" format expression
    str := now.Format("20060102150405")
}
```

## How to Use Regexp
```go 
import "regexp"

func main() {
    url := "http://www.aa.com/12/g1233fff?v=2"
    reg, err := regexp.Compile(`g*?$`)
    if err == nil {
        origin := reg.ReplaceAllString(url, "")
    }
}
```

## How to Create Child Process 
```go 
import (
    "os"
    "os/exec"
)

func main() {
    cmd := exec.Command("sh", "hello.sh")
    cmd.Stdout = os.Stdout
    cmd.Run()
}
```

## How to Log 
```go 
import "log"

func main() {
    // this message is going with time stamp
    log.Printf("hello world")
}
```

## Create File 
```go 
import "os"

func main() {
    file, err := os.Create("hello.txt")
}
```

## Create Temp Directory 
```go 
import (
    "time"
    "os"
)

func MkdirTemp() (string, error) {
	mark := time.Now().Format("20060102150405")
	return os.MkdirTemp(".", mark+"_*")
}
```

## Remove File 
```go 
import "os"

func main() {
    os.Remove("hello.txt")
}
```

## Remove Directory 
```go 
import "os"

func main() {
    os.RemoveAll("/a/b/cache")
}
```

## Write File with Buffer
```go 
import (
    "os"
    "bufio"
)

func main() {
    file, err := os.Open("hello.txt")
    if err == nil {
        defer file.Close()
        writer := bufio.NewWriter(file)
        writer.WriteString("hello world")
        writer.Flush()
    }
}
```

You can use io helpers to simplify your io operation and these helpers are offered by package `io`. For example, you make a http get request and want to write response body to a file. You have to prepare a buffer, and read response body data patch by patch in a loop statement, when it comes to EOF, you finish writing file. Instead, you can use helpers from package `io`, in this way, you don't need to care about above details.

## Read File Content as String
```go 
import (
    "os"
    "io"
)

func main() {
    file, err := os.Open("hello.txt")
    if err != nil {
        return
    }
    defer file.Close()

    content, err := io.ReadAll(file)
}
```

## Async Read File 
```go 
import (
    "os"
    "io"
)

func main() {
    ch := make(chan string)
    file, err := os.Open("hello.txt")
    if err != nil {
        return
    }
    
    go func(){
        defer file.Close()
        content, err := io.ReadAll(file)
        ch<-content
    }()
   
   content := <- ch
}

```

## File Exists
```go 
import "os"

func main() {
    _, err := os.Stat("hello.txt")
    if err == nil {
        return true
    }
    return false
}
```


## Http(s) Request
```go 
import (
    "net/http"
    "io"
)

func main() {
    req, err := http.NewRequest("GET", "http://aaa.com/c", nil)
    if err == nil {
        req.Header.Set("Referer", "https://bb.com/aa",)
        client := &http.Client{
            Timeout: 8 * time.Second,
        }
        res, err := client.Do(req)
        if err == nil && res.StatusCode == 200 {
            defer res.Body.Close()
            file, err := os.Create("data.txt")
            if err == nil {
                defer file.Close()
                _, err := io.Copy(file, res.Body)
            }

        }
    }
}
```
