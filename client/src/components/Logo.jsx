import React from 'react';

/**
 * Linksphere. logo — clean text mark with iconic red dot
 * Props:
 *   size: font size in px (default 24)
 *   light: if true, uses white text (for dark backgrounds)
 */
export default function Logo({ size = 24, light = false }) {
    return (
        <span
            style={{
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                fontWeight: 800,
                fontSize: size,
                color: light ? '#e4e6eb' : '#f7f3f3ff',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'baseline',
            }}
        >
            Linksphere
            <span style={{ color: '#ef4444', fontSize: size * 1.1 }}>.</span>
        </span>
    );
}
