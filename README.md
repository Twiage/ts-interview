# eta-calculator

Estimate ETA for Twiage Cases

## Getting started

### Requirements

1. Install [nvm](https://github.com/creationix/nvm):

macOS or Ubuntu using bash

```shell script
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

and then run

```shell script
source ~/.bash_profile
```

or

```shell script
source ~/.zshrc
```

and check if nvm is installed (v0.39.3)

```shell script
nvm --version
```

In case you get a `nvm command not found` message, add the following lines in the end of your `~/.bash_profile` or `~/.zshrc`:

```shell script
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

2. Install Node 16:

```shell script
nvm install 16 && nvm use 16
```

install yarn

with brew:

```shell script
brew install yarn
```

with npm

```shell script
npm install -g yarn
```

## Testing

We are using [Jest](https://facebook.github.io/jest/) as a testing framework.

We put out tests at the same directory with testing code.

#### Naming conventions

`__system-tests__` - directory name for system tests

`__unit-tests__` - directory name for unit tests

### Unit testing

WebStorm users can use run configuration.

#### Run unit tests

```bash
yarn test:unit
```

**For mac users**

You need to install [watchman](https://facebook.github.io/watchman/docs/install.html#installing-on-os-x-via-homebrew) using brew

```bash
brew update && brew install watchman
```

### System testing

WebStorm users can use run configuration

```bash
yarn test:system
```

## Task

Make this lambda function handle individual location update.

1. We have red unit test for _getLocation_ function under _MongoManager_. Implement code so test is no longer red.

2. _distanceMatrixRequest_ method under _distanceMatrixService_ is designed to use a special data structure. Refactor it so instead it takes 2 arguments: point A and point B

3. Add all necessary tests and implement code to handle individual location update

## Dependencies

To add prod dependency

```bash
yarn add {DEPENDENCY}
```

To add dev dependency (testing framework, build tool, assertion library linters etc)

```bash
yarn add -D {DEPENDENCY}
```

To remove dependency

```bash
yarn remove {DEPENDENCY}
```
