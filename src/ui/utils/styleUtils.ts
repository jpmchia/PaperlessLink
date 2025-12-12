import React from 'react';

/**
 * Parses a CSS string into a React.CSSProperties object.
 * Example: "color: red; font-weight: bold;" -> { color: "red", fontWeight: "bold" }
 */
export function parseCssString(css: string): React.CSSProperties {
    if (!css || typeof css !== 'string') return {};

    const style: Record<string, string> = {};
    const rules = css.split(';');

    rules.forEach(rule => {
        // Handle base64 data URIs which contain semicolons, or just split by first colon
        const firstColonIndex = rule.indexOf(':');
        if (firstColonIndex > -1) {
            const prop = rule.slice(0, firstColonIndex);
            const value = rule.slice(firstColonIndex + 1);

            if (prop && value) {
                const cleanProp = prop.trim();
                const cleanValue = value.trim();

                if (cleanProp && cleanValue) {
                    // Convert kebab-case to camelCase
                    const camelProp = cleanProp.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                    style[camelProp] = cleanValue;
                }
            }
        }
    });

    return style as React.CSSProperties;
}
