import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { EMAIL_BLOCKS, FORM_BLOCKS, FUNNEL_BLOCKS } from './types';

export default function BlockLibrary({ mode = 'email', onAddBlock }) {
    const { t } = useTranslation();

    const blocks = mode === 'form' ? FORM_BLOCKS : mode === 'funnel' ? FUNNEL_BLOCKS : EMAIL_BLOCKS;

    return (
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex flex-wrap items-center gap-2">
                {blocks.map(({ type, label, icon: Icon }) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onAddBlock(type)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-sm hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-300 transition-all cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5 text-neutral-400" />
                        <Icon className="h-3.5 w-3.5 text-neutral-500" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
