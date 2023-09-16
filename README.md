# ez-changelog

For some old versioned projects, I needed to create a CHANGELOG.md file according to the [conventional-commits](https://www.conventionalcommits.org/) specification, but since I did not have a package manager like npm, I had to create it on my own. Obviously, this script is useful for small projects.

## How it works

Before running it, you need to take the script file and move it to the git directory where you want to generate the changelog and to be executed, it needs one thing:

- The url of your GitHub project

After execution, this script will create a `CHANGELOG.md` file containing the changes of your project.

The `_CHANGELOG.md` file in this repository is an example (without links) of what the script generates.

## How to execute it

It is necessary to run the command:

```
node generate-changelog.js https://github.com/rstanziale/ez-changelog
```

## Customization

This script currently works on the following types: _feat_, _refactor_, _fix_, and _style_. Each has a specific label for the changelog section. If you want to handle a different type of commit, you will need to override the `parseCommits` function.

## Constraints

Currently, the script works for managed repositories on GitHub to use the compare-between-commits or compare-between-tags view.
