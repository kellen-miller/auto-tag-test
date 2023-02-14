const fs = require('fs')

// format = "v{major}.{minor}.{patch}"
// major = "src/Grpc/Services/Mercari/Platform/Apius' major version
// minor = "increment from last tag"
// patch = "platform-proto minor version"
// if platform-proto has a patch version, add -{patch} to end of tag
module.exports = async function ({github, context}) {
	const before = context.payload.before
	const sha = context.sha
	const filesChanged = getDiffFileNames(before, sha)
	if (filesChanged.length === 0) {
		return
	}
	
	const goModVersion = getGoModVer()
	if (!goModVersion) {
		return
	}
	
	const clientsGoVersion = getClientsGoVer()
	if (goModVersion !== clientsGoVersion) {
		console.error(
			'Version mismatch between go.mod and clients.go\n',
			'go.mod: ' + goModVersion + '\n',
			'clients.go: ' + clientsGoVersion + '\n',
			"Hint: Run 'make grpc/regen-clients' to sync the " +
				"platform-client-go versions between go.mod and clients.go\n\n",
			'Skipping tag creation'
		)
		return
	}
	
	const tags = execGitCmd('git tag -l --sort=-v:refname')
	for (const tag of tags) {
		if (goModVersion === tag.name) {
			console.log(
				'Tag ' + goModVersion + ' already exists on repo\n',
				`Hint: Existing tags = [${tags.join(", ")}]\n\n`,
				'Skipping tag creation'
			)
			return
		}
	}
	
	github.rest.git.createRef(
			{
				owner: context.repo.owner,
				repo: context.repo.repo,
				ref: `refs/tags/${goModVersion}`,
				sha: sha
			})
		.then(() => console.log("Created Tag: " + goModVersion))
		.catch((error) => {
			if (error.message === 'Reference already exists') {
				console.warn(`Tag ${goModVersion} already exists`)
			} else {
				console.error(`Error creating tag ${goModVersion}`, error)
			}
			
			console.log("\nSkipping tag creation")
		})
}

function execGitCmd(gitCmd) {
	try {
		return require('child_process')
			.execSync(gitCmd)
			.toString()
			.split('\n')
			.filter(line => line !== '')
	} catch (error) {
		return []
	}
}

function getDiffFileNames(before, sha) {
	execGitCmd(`git fetch origin ${before} --depth=1`)
	const output = execGitCmd(`git diff --name-only ${before} ${sha}`)
	if (output.length === 0) {
		console.log('No file changes detected')
		return []
	}
	
	return output[0]
}

function getVersionFromFile(filePath, regex, delimiter, indexAfterSplit) {
	try {
		return fs
			.readFileSync(filePath, 'utf8')
			.match(regex)[0]
			.split(delimiter)[indexAfterSplit]
	} catch (error) {
		return ""
	}
}

function getGoModVer() {
	const goModRegex = 'github.com/kouzoh/platform-client-go v\\d+\\.\\d+\.\\d+'
	const goModVersion = getVersionFromFile(
		'go.mod',
		goModRegex,
		' ',
		1)
	
	if (!goModVersion) {
		console.log(
			'No version for Go platform client found in clients.go\n',
			'Looked for pattern: ' + goModRegex + '\n',
			"Hint: The github.com/kouzoh/platform-client-go dependency is" +
				" expected to be declared in the go.mod file. The semver" +
				" version (i.e. v1.2.3) is used to create a release tag." +
				" The GrpcClientsGenerator updates the Go platform-client based on" +
				" the PHP platform-client in mercari-api's composer.json" +
				" dependencies\n\n",
			'Skipping tag creation'
		)
		return ""
	}
	
	console.log('go.mod platform-client-go version: ' + goModVersion)
	return goModVersion
}

function getClientsGoVer() {
	const clientsGoVersion = getVersionFromFile(
		'clients.go',
		'const Version = "v\\d+\\.\\d+\.\\d+"',
		'"',
		1)
	
	if (!clientsGoVersion) {
		console.warn(
			'No version for Go platform client found in clients.go\n',
			'Looked for pattern: ' + clientsGoVersion + '\n',
			"Hint: The clients.go file should contain the current platform-client-go" +
				" version in the form of 'const Version = \"v1.2.3\"'\n\n",
			'Skipping tag creation'
		)
		return ""
	}
	
	console.log('clients.go platform-client-go version: ' + clientsGoVersion)
	return clientsGoVersion
}
