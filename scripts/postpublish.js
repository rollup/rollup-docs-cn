import GitHub from 'github-api';
import { readFile } from 'node:fs/promises';
import { env } from 'node:process';
import semverPreRelease from 'semver/functions/prerelease.js';
import { cyan } from './colors.js';
import { runWithEcho } from './helpers.js';
import { CHANGELOG, DOCUMENTATION_BRANCH } from './release-constants.js';
import {
	getCurrentCommitMessage,
	getFirstChangelogEntry,
	getGitTag,
	getIncludedPRs
} from './release-helpers.js';

console.log(
	`-------------------------------------------------------------------------------
This script will create the release in GitHub and post comments to all released
PRs and resolved issues. It is only run from CI.
-------------------------------------------------------------------------------`
);

if (!(env.CI && env.ROLLUP_RELEASE && env.GITHUB_TOKEN)) {
	throw new Error('This script is only intended to be run from CI.');
}

const gh = new GitHub({ token: env.GITHUB_TOKEN });
const [newVersion, changelog, repo, issues] = await Promise.all([
	getCurrentCommitMessage(),
	readFile(CHANGELOG, 'utf8'),
	gh.getRepo('rollup', 'rollup'),
	gh.getIssues('rollup', 'rollup')
]);

const matched = /^\d+\.\d+\.\d+(-\d+)?$/.exec(newVersion);
if (!matched) {
	throw new Error(`The last commit message "${newVersion}" does not contain a version.`);
}

const isPreRelease = !!matched[1];

const firstEntry = getFirstChangelogEntry(changelog);
const [previousVersion, changelogEntry] =
	firstEntry.currentVersion === newVersion
		? [firstEntry.previousVersion, firstEntry.text]
		: [firstEntry.currentVersion, null];
const includedPRs = await getIncludedPRs(
	`v${previousVersion}`,
	`v${newVersion}`,
	repo,
	null,
	isPreRelease
);

const gitTag = getGitTag(newVersion);
if (changelogEntry) {
	await createReleaseNotes(changelogEntry, gitTag);
}
await postReleaseComments(includedPRs, issues, newVersion);

if (!isPreRelease) {
	await runWithEcho('git', ['branch', DOCUMENTATION_BRANCH, '--force', gitTag]);
	await runWithEcho('git', ['push', '--force', 'origin', DOCUMENTATION_BRANCH]);
}

/**
 * @param {string} changelog
 * @param {string} tag
 * @return {Promise<void>}
 */
function createReleaseNotes(changelog, tag) {
	return repo.createRelease({
		body: changelog,
		name: tag,
		tag_name: tag
	});
}

/**
 * @param {import('./release-helpers.js').IncludedPR[]} includedPRs
 * @param {import('github-api').Issues} issues
 * @param {string} version
 * @return {Promise<void>}
 */
async function postReleaseComments(includedPRs, issues, version) {
	const installNote = semverPreRelease(version)
		? `Note that this is a pre-release, so to test it, you need to install Rollup via \`npm install rollup@${version}\` or \`npm install rollup@beta\`. It will likely become part of a regular release later.`
		: 'You can test it via `npm install rollup`.';

	let caughtError = null;

	/**
	 * @param {number} issueNumber
	 * @param {string} comment
	 * @return {Promise<unknown>}
	 */
	const addComment = (issueNumber, comment) =>
		// Add a small timeout to avoid rate limiting issues
		new Promise(resolve => setTimeout(resolve, 500)).then(() =>
			issues
				.createIssueComment(issueNumber, `${comment} as part of rollup@${version}. ${installNote}`)
				.catch(error => {
					console.error(error);
					caughtError ||= error;
				})
		);

	for (const { pr, closed } of includedPRs) {
		await addComment(pr, 'This PR has been released');
		console.log(cyan(`Added release comment to #${pr}.`));

		for (const closedIssue of closed) {
			await addComment(closedIssue, `This issue has been resolved via #${pr}`);
			console.log(cyan(`Added fix comment to #${closedIssue} via #${pr}.`));
		}
	}
	if (caughtError) {
		throw caughtError;
	}
}
