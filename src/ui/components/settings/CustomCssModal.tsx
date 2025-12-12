import React, { useState, useEffect } from 'react';

interface CustomCssModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (css: string) => void;
    initialCss: string;
    fieldName: string;
}

export const CustomCssModal: React.FC<CustomCssModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialCss,
    fieldName,
}) => {
    const [css, setCss] = useState(initialCss);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setCss(initialCss);
        setError(null);
    }, [initialCss, isOpen]);

    const handleSave = () => {
        // Basic validation: check for balanced braces
        const openBraces = (css.match(/{/g) || []).length;
        const closeBraces = (css.match(/}/g) || []).length;

        if (openBraces !== closeBraces) {
            setError(`Braces mismatch: ${openBraces} opening vs ${closeBraces} closing.`);
            return;
        }

        onSave(css);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[500px] max-w-full flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Custom CSS for <span className="font-mono text-paperless-green-600 dark:text-paperless-green-400">{fieldName}</span>
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Enter valid CSS properties to style the cell (e.g., <code>color: red; font-weight: bold;</code>).
                        These styles will be applied inline to the cell container.
                    </div>
                    <textarea
                        value={css}
                        onChange={(e) => {
                            setCss(e.target.value);
                            setError(null);
                        }}
                        className="w-full h-64 p-3 font-mono text-sm border rounded-md dark:bg-gray-950 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-paperless-green-500 outline-none resize-none"
                        placeholder="color: red;&#10;background-color: #f0f0f0;&#10;font-weight: bold;"
                        spellCheck={false}
                    />
                    {error && (
                        <div className="text-red-500 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-paperless-green-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-paperless-green-600 rounded-md hover:bg-paperless-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-paperless-green-500 shadow-sm"
                    >
                        Save Styles
                    </button>
                </div>
            </div>
        </div>
    );
};
