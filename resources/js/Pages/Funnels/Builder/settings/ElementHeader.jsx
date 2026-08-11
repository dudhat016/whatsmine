import React from 'react';
import { Settings, Trash2 } from 'lucide-react';

/** Element name + delete button row at the top of the panel. */
export default function ElementHeader({ element, handleDeleteSelectedElement }) {
    return (
        <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-brand-600" />
                <h3 className="font-bold text-sm text-neutral-900 capitalize">
                    {element.name || element.type} Settings
                </h3>
            </div>
            <button
                type="button"
                onClick={() => handleDeleteSelectedElement(element.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
                title="Delete Element"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}
