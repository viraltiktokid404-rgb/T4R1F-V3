const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {

	const handlerEvents = require(process.env.NODE_ENV == 'development'
		? "./handlerEvents.dev.js"
		: "./handlerEvents.js"
	)(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

	return async function (event) {

		// Anti inbox
		if (
			global.GoatBot.config.antiInbox == true &&
			(event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
			(event.senderID || event.userID || event.isGroup == false)
		)
			return;

		// ---------- WITHOUT PREFIX SYSTEM ----------
		const prefix = global.GoatBot.config.prefix || "";
		let body = event.body || "";
		let bodyTrim = body.trim();

		if (bodyTrim) {
			const args = bodyTrim.split(/ +/);
			const cmdName = args[0].toLowerCase();

			const command = global.GoatBot.commands.get(cmdName);

			if (command && command.config && command.config.noPrefix === true) {
				event.body = prefix + bodyTrim;
				event.args = args.slice(1);
			}
		}
		// -------------------------------------------

		const message = createFuncMessage(api, event);

		await handlerCheckDB(usersData, threadsData, event);

		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat)
			return;

		const {
			onAnyEvent, onFirstChat, onStart, onChat,
			onReply, onEvent, handlerEvent, onReaction,
			typ, presence, read_receipt
		} = handlerChat;

		onAnyEvent();

		switch (event.type) {

			case "message":
			case "message_reply":
			case "message_unsend":
				onFirstChat();
				onChat();
				onStart();
				onReply();
				break;

			case "event":
				handlerEvent();
				onEvent();
				break;

			case "message_reaction":
				onReaction();
				break;

			case "typ":
				typ();
				break;

			case "presence":
				presence();
				break;

			case "read_receipt":
				read_receipt();
				break;

			default:
				break;
		}
	};
};
