export const siteConfig = {
	name: "sports-graph",
	title: "sports-graph",
	url: process.env.NODE_ENV === "production" ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
	ogImage: "/og.png",
	description: "A design and engineering organization.",
	author: {
		name: "dawescc",
		website: "https://dawes.cc",
	},
	links: [
		{
			name: "github",
			text: "github",
			url: "https://github.com/dawescc/sports-graph",
		},
		{
			name: "website",
			text: "website",
			url: process.env.NODE_ENV === "production" ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
		},
	],
	projects: null,
};

export type SiteConfig = typeof siteConfig;
