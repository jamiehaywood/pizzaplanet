# Steps

Assumes you are using VSCode.

## Mono-repo setup

Create mono folder, initialise git & lerna, and open with VSCode
```sh
mkdir mono && cd $_ && git init && lerna init && code .
````

Add the following snippet to the root `package.json`. The reason jest is in the `nohoist` section is due to possible jest dependency collisions with Create React App. You may / may not need this.

```json
"workspaces": {
    "packages": [
      "packages/*",
      "api/",
      "frontend/"
    ]
  }
```

Replace the contents of your `lerna.json` file with this

```json
{
  "packages": ["packages/*", "api/", "frontend/"],
  "version": "0.0.0",
  "npmClient": "yarn",
  "useWorkspaces": true
}
```


## Scaffolding a CRA web app

1. Run CRA `create-react-app frontend --template=typescript`.
2. Move the CRA gitignore to root `mv frontend/.gitignore .`. You will need to change `/node_modules` to `node_modules/`.
3. Now lets fire up our CRA with lerna. `lerna run start --scope=frontend --stream`. Breaking this command down... Now if you noticed, we've executed all these commands from the root

## Scaffolding an Express server

1. `mkdir api && cd $_ && yarn init && tsc --init && mkdir src && touch $_/index.ts` don't forget to make `index.ts` your entry point!
2. `yarn add -D typescript @types/node @types/express ts-node express nodemon`. Add some basic deps

3. Paste the following into `api/index.ts`. This is our basic server boilerplate:

```ts
import express from "express";

const app = express();
const port = 3001;

app.get("/api/ping", (req, res) => {
  res.json({ data: "pong from mono-api 👋🏓" });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
```

13. Add `"start": "nodemon src/index.ts"` to the `scripts` property in `api/package.json`

14. Let's fire up the API in watch mode - `lerna run start --scope=api --stream`

15. And check it's running with `curl localhost:3001/api/ping; echo`. It should return the JSON object defined in our `index.ts`:

```json
{ "data": "hello from mono-api 👋" }
```

So at this point you're probably thinking to yourself

> Ok Jamie, this is great and all, but I could do this in two separate repos, why do I need a monorepo for this?

Well I'm glad you asked! We've laid the foundations, and the fun is only just beginnning!

## Sharing code

_Suppose we want to give an interface to our `api` response from `/api/ping`, but even better, we want to share that interface with our `frontend` so that our Axios response is strongly typed._ This is where monorepos come into their own.

1.  Let's make a new **`interfaces`** _"package"_ - `mkdir packages/interfaces && cd $_ && yarn init`. There's not really a convention to naming monorepo packages, but I tend to make it look "cool" by scoping (using an `@` symbol, you may have seen it in some more recent packages) - `@mono/interfaces`. This time your `entrypoint` is going to be `index.d.ts`.

(I say package in quotes because it **_technically_** is a package in it's own right (package.json and all that!) but it's not publicly available on NPM, which is generally the first thing that springs to mind when somebody says "package".)

17. Next let's create the `index.d.ts` file - `touch index.d.ts`

18. `mkdir api && cd $_ && touch index.d.ts && touch GetPingResponse.d.ts`

19. Inside `GetPingResponse.d.ts` we're going to declare a response interface for our `/api/ping` route:

```ts
export interface GetPingResponse {
  data: string;
}
```

Overkill having 3 lines in 1 file? Probably. But I like things neatly organised, and from experience this structure scales well to hundreds of endpoints.

⚠️ Word of warning ⚠️ - if you do go down this route, make sure you pick very descriptive names for your interfaces. I've been in situations with multiple types, interfaces and classes all called `Report` and I've often sat, scratching my head, wondering how I got into this mess...

20. I'm a fan of [barrelling my exports](https://basarat.gitbook.io/typescript/main-1/barrel), so to that end - lets export our `GetPingResponse` from the `interfaces/api/index.d.ts` file:

```ts
export * from "./GetPingResponse";
```

and then don't forget to export all modules from the `interfaces/index.d.ts`:

```ts
export * from "./api";
```

Ok, phew! We've got this far... We now want to use the interface inside our `api` and `frontend` applications.

A good way to get intellisense for internal packages is to add a path resolution. It means that instead of having:
`import { GetPingResponse } from '../../../../packages/interfaces'` , you have `import { GetPingResponse } from '@mono/interfaces'`.
In this case we want to add the following to the `compilerOptions` inside the `api` and the `frontend` `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@mono/interfaces": "../packages/interfaces"
    }
  }
}
```

Let's `cd` into our `api` and add a type to our `res` on the `/api/ping` route:

```ts
app.get("/api/ping", (req, res) => {
  const response: GetPingResponse = {
    data: "pong from mono-api 🏓👋",
  };
  res.json(response);
});
```
Now, if we `cd` into our `frontend` and add axios - `yarn add axios`. To get round any irritating CORS issues we need to add a KVP of `"proxy": "http://localhost:3001",` to the `frontend/package.json`. This proxies all requests from the frontend running on `localhost:3000` to `localhost:3001`. You can read more about proxying [here]() ADD ARTICLE HERE

Now in the `App.tsx` we're gonna replace the boilerplate with the following:

```tsx
import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { GetPingResponse } from "@mono/interfaces";

function App() {
  const [apiResponse, setApiResponse] = useState<string>();
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get<GetPingResponse>("/api/ping");
        setApiResponse(response.data.data);
      } catch {
        setApiResponse("There was an error... :(");
      }
    })();
  });
  return (
    <div className="App">
      <h2>Call to API:</h2>
      <code>/api/ping</code>

      <h2>Response from API:</h2>
      <code>{apiResponse}</code>
    </div>
  );
}

export default App;
```

What we're doing here making an async IIFE to make a call to our `api` after the `App.tsx` page has mounted. We then await that call and put it into state to render in our page. The useful thing about giving our axios call our type (consumed from our `@mono/interfaces` library) is that we get intellisense about what our response is going to be from the API.