# ARGipelago
Server to run an ARG during an archipelago game. Received items will unlock small puzzles that can be solved. Solving a puzzle will unlock items for other games. Each puzzle is located at a secret url that is only revealed once the puzzle is unlocked.

## Dependencies
- Node >14.0.0

## Build
```
> npm install
```

## Run
```
> npm install
```

## API

### GET: api/puzzles
Return a list of all puzzles. If the puzzle has been found in the archipelago, it will have an associated url to naviate to the puzzle. If the puzzle hasn't been found the url will be undefined.
```ts
// Response schema
{
    name: string;
    url: string | undefined;
    isFound: boolean;
    isSolved: boolean;
}[];
```

### POST: api/puzzles
Use this to complete puzzles. If the provided password matches any found puzzle, solve the puzzle and redirect to `/`. Otherwise, redirect to `/dead-end`.

```html
<!-- Example form -->
<form method="post">
  <input type="text" name="password">
  <button type="submit">Submit</button>
</form>
```

### GET: /
Main landing page. Hardcoded to `/pages/message-in-a-bottle/index.html`

### GET: /*
To help keep url's clean and simple, there are a few different ways to access `.html` files. Files will be used by the server in the following order.
1. If the url has a trailing `/`, use the `index.html` file in the corresponding directory.
   - ex. `/banana` to `/pages/banana/index.html`

2. Use the resource at the exact path if it exists.
   - ex. `banana/background.jpg` to `/pages/banana/backround.jpg`
   - ex. `banana/styles.css` to `/pages/banana/styles.css`

3. Use the corresponding `.html` file with the same name if it exists.
   - ex. `/banana/cherry` to `/pages/banana/cherry.html`

4. Use `index.html` in the directory corresponding to the url if it exists.
   - ex. `/banana` to `/pages/banana/index.html`

5. Use the 404 (dead end) page if none of the above are met.
   - ex. `/apple` to `/pages/dead-end/index.html`