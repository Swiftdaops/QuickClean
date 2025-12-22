import React from 'react';

export function Button({ children, className = '', variant, ...props }) {
	const base = 'inline-flex items-center justify-center px-3 py-2 rounded';
	const variants = { default: ' ', outline: 'border ', secondary: ' ' };
	const v = variants[variant] || variants.default;
	return (
		<button className={`${base} ${v} ${className}`} {...props}>
			{children}
		</button>
	);
}

export function Card({ children, className = '', ...props }) {
	return (
		<div className={` rounded shadow p-4 ${className}`} {...props}>
			{children}
		</div>
	);
}

export function CardHeader({ children, className = '' }) {
	return <div className={`mb-2 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
	return <div className={`font-semibold ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
	return <div className={`${className}`}>{children}</div>;
}

export function Input(props) {
	return <input className="rounded border px-3 py-2" {...props} />;
}

export function Textarea(props) {
	return <textarea className="rounded border px-3 py-2" {...props} />;
}

export function Modal({ open, onOpenChange, children }) {
	if (!open) return null;
	return (
		<div
			className="fixed inset-0 flex items-center justify-center p-4"
			onClick={() => onOpenChange && onOpenChange(false)}
		>
			<div
				className=" rounded shadow max-w-lg w-full p-4"
				onClick={(e) => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	);
}

export default {
	Button,
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	Input,
	Textarea,
	Modal,
};
