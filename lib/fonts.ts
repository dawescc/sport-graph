import { Noto_Sans, Noto_Serif, Geist_Mono, Noto_Sans_Display } from "next/font/google";

const fontSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans-custom" });
const fontSerif = Noto_Serif({ subsets: ["latin"], variable: "--font-serif-custom" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono-custom" });
const fontDisplay = Noto_Sans_Display({ subsets: ["latin"], variable: "--font-display-custom" });

const font = {
	sans: fontSans,
	serif: fontSerif,
	mono: fontMono,
	display: fontDisplay,
};

export default font;
