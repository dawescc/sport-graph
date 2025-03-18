import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { BsArrowRight } from "react-icons/bs";

export default function Home() {
	return (
		<div className='grow @container flex flex-col p-2 md:p-0 max-w-full'>
			<div className='flex-1 w-full max-w-lg mx-auto flex flex-col py-20'>
				<Section className='pt-0 flex items-center gap-4 mb-8'>
					<Image
						src={"/eleanes.svg"}
						alt={"Eleanes Logo"}
						width={500}
						height={500}
						className='size-18 dark:invert'
					/>
					<h1 className='font-bold font-display w-fit text-title-large cursor-default tracking-tight hover:tracking-wide transition-[letter-spacing] timing-spring'>
						biscuits
					</h1>
				</Section>
				<Section className='flex w-full max-w-lg mx-auto p-2 text-body'>
					<div className='flex-1 w-full bg-gray-3 p-6 py-10 rounded flex flex-col gap-4'>
						<div className='flex font-medium font-display text-title-1'>Hello, World!</div>
						<div className='flex items-baseline'>
							<span>Sport Graph inspired by</span>&nbsp;<Link href='https://github.com'>Github</Link>&nbsp;<span>Contribution Graph.</span>
						</div>
					</div>
				</Section>
				<Section className='px-2 flex items-center justify-center mb-8 text-body'>
					<Link
						className='button text-callout flex items-center gap-1.5'
						href={"/graph"}>
						See the graph <BsArrowRight className='size-[1em] inline mt-0.5' />
					</Link>
				</Section>
				<Section className='p-0 border-t pt-5 mt-auto grid pl grid-cols-1 place-items-center text-body'>
					<Image
						src={"/eleanes.svg"}
						alt={"Eleanes Logo"}
						width={500}
						height={500}
						className='size-8 dark:invert opacity-40'
					/>
					<span className='text-xs text-gray-9 mt-4'>2025</span>
				</Section>
			</div>
		</div>
	);
}

const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => {
	return <div className={cn("py-5", className)}>{children}</div>;
};
