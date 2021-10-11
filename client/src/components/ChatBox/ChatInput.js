import React, { useRef } from "react";
import { ButtonWrapper, ChatInputWrapper, TextFieldWrapper } from "./ChatInput.styled";

function ChatInput({ onSubmit }) {
	const inputRef = useRef(null);

	const submitMsg = (e) => {
		e.preventDefault();
		onSubmit(inputRef.current.value);
		inputRef.current.value = "";
	};

	return (
		<form onSubmit={submitMsg}>
			<ChatInputWrapper>
				<TextFieldWrapper
					className="chatinput-textfield"
					inputRef={inputRef}
					placeholder="Chat here..."
					size="small"
				/>
				<ButtonWrapper className="chatinput-btn" variant="contained" onClick={submitMsg}>
					Submit
				</ButtonWrapper>
			</ChatInputWrapper>
		</form>
	);
}

export default ChatInput;
