jQuery-week-calendar
====================
[yeoman]: http://yeoman.io
[grunt]: http://gruntjs.com
[bower]: http://bower.io

Welcome to jQuery-week-calendar development docs. This plugin is under heavy development and will be integrated with Twitter Bootstrap and AngularJS.
At the moment, our workflow is comprised of three tools for improving development quality: [yo][yeoman] (the scaffolding tool), [grunt][grunt] (the build tool) and [bower][bower] (for package management).

Prerequisite
------------
[node]: https://github.com/creationix/nvm

* Install [Node version manager][node] (nvm)
* Install node 0.10.x as follows:

```
nvm install 0.10
nvm alias default 0.10
```

* Configure Yeoman, Bower and Grunt:

```
npm install -g yo grunt-cli bower phantomjs
```

Getting started
---------------

* Fork this repository 
* Run the following command from the project root to install al tools and required libraries:

```
npm install
bower install
```

Development Guidelines
----------------------

### Testing

QUnit is used as test Framework with Karma tests runner. To run tests use:
```
grunt test
```

### jsHint

To check and test code quality, run:
```
grunt jshint
```

### Development server

Run a development server with:
```
grunt server
```

### Notes on how to update this project version

To update this project version you should change these files:

* `package.json`
* `bower.json`

**NOTE**: always create a new commit: `Bumped to version x.x.x` and then add a **new tag**.

Tools an Techs
--------------

### Markdown

We use Markdown to write documentation. To have a fast overview of the syntax read the [official documentation][markdown]

[markdown]: http://daringfireball.net/projects/markdown/syntax
