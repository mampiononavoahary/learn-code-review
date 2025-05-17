import * as core from '@actions/core'
import * as github from '@actions/github'
import { readFileSync } from 'fs'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Get the PR number from the event payload
    const prNumber = github.context.payload.pull_request?.number
    if (!prNumber) {
      // Fail the workflow run if the PR number is not found
      core.setFailed('PR number not found')
      return
    }
    // Find the required reviewers
    const reviewers = readFileSync('REVIEWERS', 'utf-8').trim()
    if (!reviewers) {
      // Fail the workflow run if the reviewers are not found
      core.setFailed('Reviewers not found in REVIEWERS file')
      return
    }
    // Get all reviewers for the PR
    const githubToken = core.getInput('github_token')
    const octokit = github.getOctokit(githubToken)
    const reviewersResponse = await octokit.rest.pulls.listReviews({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber
    })
    // Check if all required reviewers have reviewed the PR
    let approved = false
    reviewersResponse.data.forEach((review) => {
      if (
        review?.user &&
        review.user.login === reviewers &&
        review.state === 'APPROVED'
      ) {
        approved = true
      }
    })

    if (!approved) {
      core.setFailed('Not all required reviewers have approved the PR')
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
