"use client";

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { playProductAddedSound } from '@/lib/sound';

const Toaster = ({ ...props }) => {
	return (
		<Sonner
			theme="light"
			className="toaster group"
			toastOptions={{
				className: 'bg-cyan-100 text-stone-950 border border-current',
			}}
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			{...props}
		/>
	);
};

// Wrap sonner's toast so we play a short sound on every toast invocation.
function makeToastWithSound(base) {
	function t(...args) {
		try {
			playProductAddedSound();
		} catch (e) {
			/* ignore */
		}
		return base(...args);
	}

	// copy properties (methods) from base to wrapper, preserving behavior
	Object.keys(base).forEach((k) => {
		const val = base[k];
		if (typeof val === 'function') {
			t[k] = (...args) => {
				try {
					playProductAddedSound();
				} catch (e) {
					/* ignore */
				}
				return val.apply(base, args);
			};
		} else {
			t[k] = val;
		}
	});

	return t;
}

export const toast = makeToastWithSound(sonnerToast);
export { Toaster };
export default Toaster;
