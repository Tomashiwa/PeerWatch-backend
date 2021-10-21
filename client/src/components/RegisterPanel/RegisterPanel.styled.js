import { styled as mStyled } from "@mui/material/styles";
import { TextField, Button } from "@mui/material";
import { theme } from "../../styles/theme";
import styled from "styled-components";

export const TextFieldWrapper = mStyled(TextField)({
	width: "80%",
	".MuiFilledInput-input, .MuiFilledInput-input:hover": {
		background: theme.white,
		borderRadius: "2px",
		color: `${theme.darkGray}`,
	},
	"& .MuiFormHelperText-root": {
		color: theme.white,
	},
	"& .MuiInputLabel-root.Mui-focused": {
		color: theme.orange,
	},
	"& .MuiFilledInput-underline:after": {
		borderBottom: `2px solid ${theme.orange}`,
	},
});

export const ButtonContainerWrapper = styled.div`
	width: 100%;

	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-column-gap: 1em;
`;

export const ButtonWrapper = mStyled(Button)({
	width: "100%",
	background: theme.orange,
	color: theme.darkGray,
	":hover": {
		background: theme.darkOrange,
	},
});
