'use client';
import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types'; export default function Splash({ x, y, onComplete }) { const droplets = [ { dx: -14, dy: 6, scale: 1 }, { dx: 0, dy: 0, scale: 1.1 }, { dx: 12, dy: 4, scale: 0.9 }, ]; return ( <div style={{ position: 'fixed', left: x, top: y, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 9999, }} aria-hidden > {droplets.map((d, i) => ( <motion.svg key={i} width="18" height="24" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', left: d.dx, top: d.dy, overflow: 'visible', }} initial={{ opacity: 1, y: 0, x: 0, scale: d.scale }} animate={{ opacity: 0, y: -18 - i * 6, x: (i - 1) * 6, scale: d.scale * 1.08 }} transition={{ duration: 0.9, delay: 0.12 * i, ease: [0.2, 0.8, 0.2, 1] }} onAnimationComplete={i === droplets.length - 1 ? onComplete : undefined} > <path d="M12 0C12 0 20 8 20 15C20 22 14 28 12 32C10 28 4 22 4 15C4 8 12 0 12 0Z" fill="rgba(37,99,235,0.9)" /> </motion.svg> ))} </div> );
} Splash.propTypes = { x: PropTypes.number.isRequired, y: PropTypes.number.isRequired, onComplete: PropTypes.func,
}; Splash.defaultProps = { onComplete: () => {},
};
