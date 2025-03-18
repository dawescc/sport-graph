# make-biscuits

A custom `create-next-app` utility that scaffolds a Next.js application with custom templates, components, and configurations.

## Features

-   Scaffolds a Next.js application with optimal settings:
    -   TypeScript (default)
    -   TailwindCSS (default)
    -   ESLint configured
    -   App Router
    -   No src directory
    -   Turbopack for development
-   Adds custom components and utilities:
    -   Theme provider with dark mode support (via `next-themes`)
    -   Standardized layout and error handling
    -   Useful React hooks (useCopyToClipboard, useLockBody, useMediaQuery)
    -   Utility functions for component styling (using `clsx` & `tailwind-merge`)
    -   Google Fonts configuration
-   Provides a cohesive styling system
-   Includes analytics and speed monitoring (via `Vercel`)

## Get Started

```bash
# Create a new project folder
cd /project

# Go
pnpx make-biscuits .
pnpm dev

```
