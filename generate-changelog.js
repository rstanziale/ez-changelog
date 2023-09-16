const { argv, exit } = require("node:process");
const { execSync } = require("node:child_process");
const { writeFileSync } = require("fs");

/**
 * -------------------
 * CONST DECALARATIONS
 * -------------------
 */

const DELIMITER = "-DELIMITER-";
const FEAT = "Added";
const REFACTOR = "Changed";
const FIX = "Fixed";
const STYLE = "Style";

/**
 * -----------------------
 * FUNCTIONS DECALARATIONS
 * -----------------------
 */

/**
 * Utility to log message with timestamp and level
 * @param {string} message
 * @param {string} level
 */
function logger(message = "", level = "INFO") {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

/**
 * Execute a git query
 * @param {string} query to execute
 * @returns result statement as string
 */
function execGitQuery(query) {
  return execSync(query).toString("utf-8");
}
/**
 * From string, generate a list of commits
 * @param {string} commits
 * @returns a list of commits
 */
function generateCommits(commits) {
  return commits
    .split(`${DELIMITER}\n`)
    .map((commit) => {
      const [message, sha] = commit.split("\n");
      return { sha, message };
    })
    .filter((commit) => Boolean(commit.sha));
}

/**
 * Parse list of commits
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 * @param {Array} commitsArray to parse
 * @returns changelog as string
 */
function parseCommits(commitsArray) {
  let changelog = "";
  const features = [];
  const refactors = [];
  const fixes = [];
  const styles = [];

  commitsArray.forEach((commit) => {
    let type = commit.message.substr(0, commit.message.indexOf(":"));
    // Remove special chars from scope (e.g. ! for breaking change)
    const regex = /([a-zA-Z\s]+)!/;
    if (regex.test(type)) {
      logger(`Removed special character from type ${type}`, "WARN");
      type = type.replace(regex, "$1");
    }

    switch (type) {
      case "feat":
        formatCommit(features, commit);
        break;
      case "refactor":
        formatCommit(refactors, commit);
        break;
      case "fix":
        formatCommit(fixes, commit);
        break;
      case "style":
        formatCommit(styles, commit);
        break;
    }
  });

  if (features.length) {
    changelog += addCommit(features, FEAT);
  }

  if (refactors.length) {
    changelog += addCommit(refactors, REFACTOR);
  }

  if (fixes.length) {
    changelog += addCommit(fixes, FIX);
  }

  if (styles.length) {
    changelog += addCommit(styles, STYLE);
  }

  return changelog;
}

/**
 * Format commit according conventional commit specifications and add it to list
 * @param {Array} list where persist parsered commit
 * @param {object} commit contains message and sha
 */
function formatCommit(list, commit) {
  const command = [];

  const scope = commit.message.substring(
    commit.message.indexOf("(") + 1,
    commit.message.lastIndexOf(")")
  );
  if (scope) {
    command.push(`**${scope}**:`);
  }

  const message = commit.message
    .substring(commit.message.indexOf(":") + 1)
    .trim();
  command.push(`${message}`);

  const shortSHA = commit.sha.substring(0, 6);
  command.push(`([${shortSHA}](${baseUrl}/commit/${commit.sha}))\n`);

  list.push(`${command.join(" ")}`);
}

/**
 * Add a title in changelog with every element of the list pass as argument
 * @param {Array} list to parse
 * @param {string} title to add in changelog
 * @returns changelog as string
 */
function addCommit(list, title) {
  let changelog = "";

  changelog += `## ${title}\n`;
  list.forEach((elem) => {
    changelog += elem;
  });
  changelog += "\n";

  return changelog;
}

/**
 * ----
 * MAIN
 * ----
 */

// Check GitHub url
const baseUrl = argv[2];
if (!baseUrl) {
  logger("No GitHub url specified", "ERROR");
  exit();
}

// Perform generation
logger("Starting process...");

const tags = execGitQuery(`git tag --sort=-creatordate`).trim();
let previous_tag = 0;
let changelog = "";

tags.split("\n").forEach((current_tag) => {
  if (previous_tag != 0) {
    let date = execGitQuery(
      `git log -1 --format=%ad --date=short ${previous_tag}`
    ).trim();

    changelog += `# [${previous_tag}](${baseUrl}/compare/${previous_tag}..${current_tag}) (${date})\n\n`;

    const commits = execGitQuery(
      `git log ${current_tag}...${previous_tag} --format=%B%H${DELIMITER}`
    );
    const commitsArray = generateCommits(commits);

    changelog += parseCommits(commitsArray);
  }

  previous_tag = current_tag;
});

// Take last tag
let current_tag = previous_tag;
let date = execGitQuery(
  `git log -1 --format=%ad --date=short ${current_tag}`
).trim();
changelog += `# [${current_tag}](${baseUrl}/commit/tree/${current_tag}) (${date})\n\n`;

const commits = execGitQuery(
  `git log ${current_tag} --format=%B%H${DELIMITER}`
);

const commitsArray = generateCommits(commits);

changelog += parseCommits(commitsArray);

// Prepend the new changelog to the current one
writeFileSync("./CHANGELOG.md", `${changelog}`);
logger("End process!");
