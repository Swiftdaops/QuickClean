"use client"; import React, { useState } from 'react';
import { FiClock, FiChevronRight } from 'react-icons/fi';
import OrderProgressPanel from './OrderProgressPanel'; export default function OrderFloter() { const [open, setOpen] = useState(false); return ( <> <div className="order-floter"> <button aria-label="Watch Order" className="order-floter-btn" onClick={() => setOpen(true)} > <FiClock className="w-5 h-5" /> <span className="floter-label">Watch Order</span> <FiChevronRight className="w-4 h-4 chevron" /> </button> </div> <OrderProgressPanel open={open} onClose={() => setOpen(false)} /> </> );
}
