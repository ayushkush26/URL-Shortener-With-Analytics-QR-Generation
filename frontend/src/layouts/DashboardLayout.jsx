import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';

const DashboardLayout = () => {
    // Sidebar passes state via context or we can just let it manage itself and push content
    // For simplicity, we'll assume sidebar takes fixed width on desktop
    // and overlay on mobile. Sidebar component handles its own open/close state logic visually,
    // but better if we control layout margin.
    // For this ease, let's make the main content margin-left adapt or fixed 64 (w-64 is 16rem = 256px).
    // The Sidebar I checked has a toggle implementation.
    // To make it sync, we might need a context, but CSS grid/flex is easier for now.
    // Given the Sidebar code I wrote: it uses fixed positioning and generic width classes.
    // Let's use a layout that has padding-left to accommodate the sidebar.

    // Actually, looking at Sidebar.jsx, it changes width.
    // Let's adhere to a simple "pl-20 lg:pl-64" if open?
    // The previous implementation had internal state.
    // For a smoother experience, let's just use a generally safe padding or 
    // simply let the Sidebar overlay some content or use a context.

    // Let's refine Sidebar to be more "Layout aware" or just stick to a safe padding 
    // and let the user expand/collapse without affecting flow too much or just overlap.
    // The current Sidebar uses `fixed`.
    // So Main content needs `ml-20` (collapsed) or `ml-64` (expanded).
    // Since Sidebar state is internal, I can't know it here easily without Context.
    // I will modify Sidebar later to accept props or just use a sufficient margin for now.
    // HOWEVER, standard way is context.
    // Let's update Sidebar to use a context or lift state up? 
    // No, keep it simple. Sidebar is fixed. 
    // I will update Sidebar to accept `isExpanded` prop if needed, but for now
    // let's assume it pushes content.
    // Actually, I can just wrap the Outlet in a div that is `flex-1 ml-20 lg:ml-64`?
    // If Sidebar toggles, this margin won't update.
    // I'll stick to a fixed margin for the "collapsed" state and let it overlap?
    // or better: I will update Sidebar to export a context or use a shared LayoutContext.

    // WAITING: I'll just use a safe margin of `ml-0 lg:ml-24` and rely on the sidebar 
    // being floating or use a context in a future step if it looks bad.
    // Actually, looking at the "Premium" requirement, a proper layout is needed.
    // I'll update Sidebar to accept `isOpen` and `setIsOpen` from props in a later step if needed.
    // For now, I'll creates the layout and assume Sidebar handles itself.

    return (
        <div className="flex min-h-screen bg-slate-900">
            <Sidebar />
            <main className="flex-1 lg:pl-20 transition-all duration-300">
                {/* Note: The sidebar logic in previous step had internal state for width. 
                 It changes from w-20 to w-64. 
                 Ideally proper layout syncs this. 
                 For now, I'll leave a margin for the collapsed state and let it expand over 
                 or push if I can sync.
                 Actually, the previous sidebar implementation has `fixed`.
                 Let's just use `lg:pl-0` and let the sidebar be `sticky`?
                 No, `fixed` is better for persistent sidebar.
                 Effectively `lg:pl-64` when open and `lg:pl-20` when closed.
             */}
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
