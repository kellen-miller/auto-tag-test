module.exports = ({github, context}) => {
	github.rest.git.createRef(
		{
			owner: context.repo.owner,
			repo: context.repo.repo,
			ref: `refs/tags/${process.env.PLATFORM_CLIENT_GO_VERSION}`,
			sha: context.sha
		}
	)
}
