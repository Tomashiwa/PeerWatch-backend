import { styled as mStyled } from "@mui/material/styles";
import { TextField, Button } from "@mui/material";
import { theme } from "../../styles/theme";

export const TextFieldWrapper = mStyled(TextField)({
	width: "100%",
	".MuiInputBase-root": {
		background: theme.white,
		borderRadius: "5px",
		color: `${theme.darkGray}`,
	},
});

export const ButtonWrapper = mStyled(Button)({
	width: "50%",
	background: theme.orange,
	color: theme.darkGray,
	":hover": {
		background: theme.darkOrange,
	},
});
