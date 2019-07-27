# Meeba Farm

An evolving life simulation written entirely in vanilla JavaScript with no
runtime dependencies. Watch as simple creatures called _meebas_ live, die,
feed, and reproduce. Each meeba has its own unique DNA which it will pass on
to its children after some slight (or not so slight) mutations. As the
simulation runs, natural selection will drive the population of meebas to
evolve into new and different species better suited to their environment.

## Contents

- [Setup](#setup)
- [Reporting Issues](#reporting-issues)
- [Usage](#usage)
    * [Core Settings](#core-settings)
    * [Debug Settings](#debug-settings)
    * [Sharing Your Settings](#sharing-your-settings)
- [Development](#development)
    * [Philosophy](#philosophy)
    * [Tools](#tools)
        - [Linter](#linter)
        - [Type Checker](#type-checker)
        - [Unit Tests](#unit-tests)
        - [Headless Simulation](#headless-simulation)
- [Contributing](#contributing)
- [License](#license)
- [Attribution](#attribution)

## Setup

Meeba Farm is hosted on GitHub pages, so if all you want to do is run the
simulation just head to
[meeba-farm.github.io](http://meeba-farm.github.io/meeba-farm/). Note that only
recent versions of Firefox, Chrome, and Safari are supported. Anything released
since May 2018 should be fine.

If you want to download the code and run it locally, you will need
[Git](https://git-scm.com/) and [Node](https://nodejs.org/). Once those are
installed, run the following from your (bash) console:

```bash
git clone https://github.com/meeba-farm/meeba-farm.git
cd meeba-farm/
npm install
```

## Reporting Issues

Meeba Farm is still under active development and there are plenty of balance
issues, bugs, and missing features to work out. If you know of something that
needs to be addressed please
[add a new GitHub Issue](https://github.com/meeba-farm/meeba-farm/issues/new),
with as much detail as possible.

## Usage

The UI provides access to a number of settings which affect the environment
meebas must survive in. Update them and reset the simulation to see how the
population responds.

### Core Settings

- **Seed**: A seed for the random number generator
- **Tank Size**: The width and height of the "tank" the meebas are able to move
    around in
- **Initial Meeba Count**: The number of meebas the simulation starts with
- **Mote Spawn Rate**: The number of "motes" (green food pellets) that spawn
    each second
- **Kinetic Energy**: The kinetic energy of each body in the tank, more means
  faster movement
- **Tank Temperature**: Scales meeba metabolism, the hotter it is the more
    calories they need and the faster they will feed
- **Gene Volatility**: The frequency with which mutations occur during
    reproduction

### Debug Settings

Warning! These settings are pare of the core functionality of the simulation,
and are not really intended to be modified by users. They would normally be
hard-coded, and messing with them too much can pretty easily wreck the
simulation. However, tweaking the balance to be just right is a tough task, so
while Meeba Farm is still in "beta", these settings are exposed for users to
mess with live.

### Sharing Your Settings

If you want to run the same simulation as a friend or save them for reuse, you
can use the "Load Settings" text field. Simply copy the string written there
and save it or send it to a friend. Later when you want to load saved settings,
paste the string back into that same text field and click "Load".

## Development

### Philosophy

This project is not just a cool life simulation, but also an opportunity to
experiment with how I write modern JavaScript. In this repo you will find:

- Modern ES6 syntax
- ES6 based modules
- No runtime dependencies
- No build step
- A preference for functional patterns over object-oriented
- A preference for interfaces (via JSDoc types) over classes

For the most part these approaches have been positive and will continue, though
at some point I may introduce webpack and proper TypeScript interfaces. As cool
as it is to just be able to boot up my source directly without transpiling, you
really do give up a lot of utility.

### Tools

Since Meeba Farm is written in vanilla JS with no build step, you only need to
serve the static files to run the simulation locally. This can be done by
using the following command in your console:

```bash
npm start
```

You should now be able to see your local Meeba Farm by opening a browser and
navigating to [http://localhost:3384](http://localhost:3384).

Additionally there are a number of dev tools you may wish to use, specifically
a linter, a [TypeScript](https://www.typescriptlang.org/) and
[JSDoc](http://usejsdoc.org/) based type checker, and unit tests. In order to
run all of these together use:

```bash
npm test
```

#### Linter

The linter is [ESLint](https://eslint.org/) with a very slightly modified
version of [AirBnB's Style Guide ](https://github.com/airbnb/javascript)
installed. The biggest addition is a
[spell checker](https://github.com/aotaduy/eslint-plugin-spellcheck). Feel free
to add new "skipWords" to `.eslintrc.json` as needed. The default dictionary is
missing quite a few technical words, but I find having a spell checker
eliminates a whole class of silly typos.

To run _just_ the linter use:

```bash
npm run lint
```

#### Type Checker

Throughout the code, types are meticulously documented with JSDoc comments and
then checked in "strict" mode using the CLI for TypeScript. This is honestly
kind of a pain, and if I ever refactor the code to use a build step, I will
probably convert everything to proper TypeScript. But hey, static type checks
are nice.

To run _just_ the type checker use:

```bash
npm run type-check
```

#### Unit Tests

The unit tests are written with
[Mocha](https://mochajs.org/)/[Chai](https://www.chaijs.com/) and can be found
in [tests/app/](./tests/app) in files suffixed with `.test.js`. The tests run
in Node not the browser. I solve ES6 module vs CommonJS issue by running the
source files through a custom script to convert them to CommonJS. A bit hacky,
but it works. These generated files are suffixed with `.common.js` and should
not be modified directly.

To run _just_ the unit tests use:

```bash
npm run unit-tests
```

#### Headless Simulation

To better evaluate the health of the simulation under default settings, it is
possible to run Meeba Farm in "headless" mode. This will run the simulation
with a Node CLI and generate logs and CSV files with information about the
meeba population. To run the default headless simulation, use:

```bash
npm run headless
```

This will run five tests at a variety of tank sizes, framerates, and duration
of simulated time. You can also use command line arguments to run one test with
specific parameters:

```bash
npm run headless -- duration [width=1000] [height=1000] [framerate=60]
```

Replace one or more of the above parameters with a specific number. Note that
the duration must be specified in _hours_ not milliseconds. For example:

```bash
npm run headless -- 24 1920 1080
```

The above would run for 24 hours of simulated time in a tank that was
1920x1080, running at the default of 60fps.

_Note: All CSV reports are stored in the [tests/reports/](./tests/reports)
directory._

## Contributing

I always welcome contributions, and I love well formed PRs even more. A
detailed contributing guide is on the to do list. In the meantime, fork the
repo, make your changes, make sure `npm test` passes, and try to follow
[Chris Beams's Guide](https://chris.beams.io/posts/git-commit/) for your
commit messages.

## License

Meeba Farm is open-source and licensed under [MIT](./LICENSE).

## Attribution

Meeba Farm was originally inspired by David Bau's
[Genetic Cars](https://rednuht.org/genetic_cars_2/). It's pretty sweet
simulation, check it out!
