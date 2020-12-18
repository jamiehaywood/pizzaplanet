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