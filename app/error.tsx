"use client";

import Link from "next/link";
import { HiOutlineArrowCircleLeft } from "react-icons/hi";

export default function ErrorPage() {
	return (
		<div className='grid grid-cols-1 gap-10'>
			<div className='py-20 max-w-lg mx-auto grid grid-cols-1 gap-6 sm:gap-8 text-pretty'>
				<p className='text-5xl sm:text-4xl font-display'>Error</p>
				<p className='text-3xl sm:text-4xl'>An error occured</p>
				<Link
					className='text-2xl sm:text-3xl'
					href='/'>
					<HiOutlineArrowCircleLeft className='inline mb-0.5 mr-1' /> Go back home
				</Link>
			</div>
		</div>
	);
}
