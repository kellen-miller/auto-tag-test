module.exports = ({github, context}) => {
	console.log("hello from js script")
	return context.payload.client_payload.value
}
