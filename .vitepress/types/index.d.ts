// when we import this package, for example:
// `const addon = require("line-noise")`
// the type of addon corresponds to the type
// exported by `export default` in this file.

/**
 * show prompt on terminal, wait for your input,
 * after you press Enter key, this function return
 * your input.
 * @param tip prompt
 * 
 * @example
 * ```ts
 * let myInput = prompt("Jack> ");
 * 
 * // when prompt is invoked, your terminal looks like:
 * // Jack>
 * //
 * // then, you input something, such as "echo", your
 * // terminal looks like:
 * // Jack> echo
 * //
 * // finally, you press Enter key, then prompt will return,
 * // and variable myInput is "echo"
 * ```
 */
export function prompt(tip: string): string;

/**
 * load the completion.config.json, then
 * when you input and press Tab, your input
 * will be completed automatically.
 * 
 * @returns if load the config file successfully, return true; if fail
 * to load the config file, e.g. config file not found, return false
 * 
 * please make sure the position of `completion.config.json`.
 * 
 * assume that you're in /home/jack/project, and you write 
 * main.js (which imports `line-noise` package) under 
 * /home/jack/project/example.
 * 
 * you decide to execute `node example/main.js`, so you
 * have to locate `completion.config.json` under /home/jack/project,
 * not /home/jack/project/example.
 * 
 * in a word, make sure `completion.config.json` under your work
 * directory which is same as `process.cwd()`
 * 
 * the content of `completion.config.json` is very simple, 
 * there is only one example showing you all about it:
 * 
 * ```json
 * [
 *           {
 *             "pattern": "h",
 *             "tips": ["help", "hello", "hide"]
 *           },
 *           {
 *             "pattern": "q",
 *             "tips": ["quit", "qemu"]
 *           }
 * ]
 * ```
 * when you input "h", press Tab key, "h" will become "help",
 * then you continue to press Tab key, "help" will become
 * "hello"、"hide" one by one.
 * 
 * similarly, when you input "q", press Tab key, "q" will become
 * "quit", then you press Tab key again, "quit" will become "qemu"
 * 
 * in the future, we might adopt regular expression on "pattern"
 */
export function loadCompletionConfig(): boolean;

/**
 * load the `hint.config.json`, then when you input,
 * there will be hint after your input.
 * 
 * @returns if load the config file successfully, return true;otherwise,
 * e.g. config file not found, return false.
 * 
 * make sure the position of `hint.config.json`.
 * 
 * assume that you're in /home/jack/project, and you write 
 * main.js (which imports `line-noise` package) under 
 * /home/jack/project/example.
 * 
 * you decide to execute `node example/main.js`, so you
 * have to locate `hint.config.json` under /home/jack/project,
 * not /home/jack/project/example.
 * 
 * in a word, make sure `hint.config.json` under your work
 * directory which is same as `process.cwd()`
 * 
 * the content of `hint.config.json` is very simple, 
 * there is only one example showing you all about it:
 * ```json
 * [
 *           {
 *             "pattern": "go",
 *             "color": 35,
 *             "bold": 0,
 *             "hint": " fmt|run|get|test|help"
 *           },
 *           {
 *             "pattern": "git",
 *             "color": 30,
 *             "bold": 0,
 *             "hint": " clone|branch|remote|pull|push|merge"
 *           }
 * ]
 * ```
 * 
 * when you input "go", you will see the hint " fmt|run|get|test|help"
 * after "go", "color" field configures the color of hint, "bold" field
 * configures the font-wight of hint.
 */
export function loadHintConfig(): boolean;

/**
 * cancel hint when you input
 * 
 * @returns if this function is successful, returns true
 * 
 * assume you have load hint config, when you input "git",
 * you will see hint " branch|remote|merge" after "git".
 * 
 * at this point, you invoke this function, do the same thing,
 * you cannot see hint " branch|remote|merge" any more.
 */
export function cancelHint(): boolean;

/**
 * mask your input with "*".
 * 
 * @returns mask your input successfully, returns true
 * 
 * when you input "hello" with prompt "Jack> ", terminal looks like:
 * 
 * `Jack> hello`
 * 
 * after you invoke this function, do the same thing, terminal looks:
 * 
 * `Jack> *****`
 */
export function maskYourInput(): boolean;

/**
 * unmask your input, from "*" to original status.
 * 
 * @returns unmask your input successfully, returns true
 * 
 * when you invoke maskYourInput function, you input "hello",
 * terminal looks like:
 * 
 * `Jack> *****`
 * 
 * after you invoke unmaskYourInput function, you input "hello",
 * terminal looks like:
 * 
 * `Jack> hello`
 */
export function unmaskYourInput(): boolean;

/**
 * open or close multiline mode of your terminal
 * @param arg 0, means close multiline mode; 1, means open this mode
 * @returns if this function is successful, returns true
 * 
 * if your terminal under singleline mode, when your input is longer
 * than the available width of your terminal, your terminal will take
 * x-scroll action.
 * 
 * do same thing in multiline mode, the part of your input overflow
 * the available width of your terminal will start from the next line. 
 */
export function openMultilineMode(arg: 0 | 1): boolean;

/**
 * clear your terminal screen.
 * 
 * @returns if this function successful, returns true
 * 
 * assume your terminal looks like:
 * 
 * ```txt
 * Jack> help
 * this is default help, welcome to our playground.
 * is this your first try?
 * Jack> yes
 * wonderful!
 * enjoy your time from now on!
 * Jack> ok, I do my best.
 * ha ha ha ha, come on! Let's start!
 * Jack>
 * ```
 * 
 * when you invoke this function, your terminal becomes:
 * ```txt
 * Jack> 
 * ```
 */
export function clearTerminalScreen(): boolean;

/**
 * enter into an interactive playground from your terminal,
 * when you press any key, terminal will show you the 
 * corresponding key code.
 * 
 * @returns if this function is successful, returns true
 * 
 * remember that this is just a separated tool function, 
 * don't use it with `prompt` function.
 */
export function enterKeycodesPlayground(): boolean;

/**
 * save your command history into a file.
 * @param filePath the file path which command history will be saved
 * 
 * @returns if this function is successful, returns true;
 */
export function saveCommandHistoryIntoFile(filePath: string): boolean;

/**
 * load your command history from a file
 * @param filePath the file path which save your command history
 * 
 * @returns if this function is successful, returns true;
 */
export function loadCommandHistoryFromFile(filePath: string): boolean;

/**
 * allow you to save howManyCommands command in your history at most.
 * @param howManyCommands
 * 
 * @returns if this function is successful, returns true
 * 
 * if howManyCommands=4, you're only allowed to save 4 commands in your
 * history at most.
 */
export function setHistoryCapacity(howManyCommands: number): boolean;

/**
 * add command to your command history in memory
 * @param command 
 * @returns if this function is successful, returns true
 */
export function rememberCommand(command: string): boolean;