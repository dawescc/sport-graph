"use client";

import { ThemeProvider, useTheme } from "next-themes";

function Theme({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute='data-theme'
			defaultTheme='system'
			enableSystem
			disableTransitionOnChange>
			{children}
		</ThemeProvider>
	);
}

export { Theme, useTheme };
