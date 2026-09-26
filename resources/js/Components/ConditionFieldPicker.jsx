import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronRight, ChevronLeft, ChevronDown, X, Check } from 'lucide-react';

export default function ConditionFieldPicker({
    value = '',
    customKey = '',
    onChange,
    categories = [],
    customFields = [],
    customFieldFolders = [],
    placeholder = 'Type to search',
    style = {},
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategoryKey, setActiveCategoryKey] = useState(null);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Format custom field names nicely
    const formatCustomFieldName = (cf) => {
        if (!cf) return '';
        let name = cf.name || cf.key || '';
        if (cf.key === 'consent_marketing') return 'Consent: Marketing & Promotional Messages';
        if (cf.key === 'consent_transactional') return 'Consent: Transactional Messages';
        return name;
    };

    // Build folder map
    const folderMap = useMemo(() => {
        const map = {};
        (customFieldFolders || []).forEach(f => {
            map[f.key] = f.name;
        });
        return map;
    }, [customFieldFolders]);

    // Build all grouped categories with their fields
    const allGroups = useMemo(() => {
        const groups = [];

        // 1. Standard categories
        (categories || []).forEach(cat => {
            groups.push({
                key: `standard_${cat.category}`,
                name: cat.category,
                fields: (cat.fields || []).map(f => ({
                    value: f.value,
                    customKey: null,
                    label: f.labelKey,
                    categoryName: cat.category,
                })),
            });
        });

        // 2. Custom fields grouped by folder
        const cfByFolder = {};
        (customFields || []).forEach(cf => {
            const groupKey = cf.field_group || 'other';
            const groupTitle = folderMap[groupKey] || (groupKey === 'contact' ? 'Contact' : groupKey === 'general_info' ? 'General Info' : (groupKey.startsWith('form_') ? 'Form | Landing Page Form' : 'Custom Fields'));
            const fullTitle = `Custom Fields (${groupTitle})`;
            if (!cfByFolder[fullTitle]) {
                cfByFolder[fullTitle] = [];
            }
            cfByFolder[fullTitle].push({
                value: `custom.${cf.key}`,
                customKey: cf.key,
                label: formatCustomFieldName(cf),
                categoryName: fullTitle,
                originalField: cf,
            });
        });

        Object.entries(cfByFolder).forEach(([folderTitle, fields]) => {
            groups.push({
                key: `folder_${folderTitle}`,
                name: folderTitle,
                fields,
            });
        });

        return groups;
    }, [categories, customFields, folderMap]);

    // Flatten all fields for instant search
    const allFlatFields = useMemo(() => {
        return allGroups.flatMap(g => g.fields);
    }, [allGroups]);

    // Find current label for selected value
    const currentLabel = useMemo(() => {
        if (!value) return '';
        if (value === 'custom.field' && customKey) {
            const cf = (customFields || []).find(f => f.key === customKey);
            return cf ? formatCustomFieldName(cf) : `Custom: ${customKey}`;
        }
        const match = allFlatFields.find(f => f.value === value || (f.customKey && f.customKey === customKey));
        return match ? match.label : value;
    }, [value, customKey, allFlatFields, customFields]);

    // Search matches across all fields
    const searchMatches = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return allFlatFields.filter(f =>
            f.label.toLowerCase().includes(term) ||
            f.categoryName.toLowerCase().includes(term) ||
            f.value.toLowerCase().includes(term)
        );
    }, [searchTerm, allFlatFields]);

    // Active category for drill-down
    const activeCategory = useMemo(() => {
        if (!activeCategoryKey) return null;
        return allGroups.find(g => g.key === activeCategoryKey) || null;
    }, [activeCategoryKey, allGroups]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setActiveCategoryKey(null);
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, []);

    const handleSelectField = (fieldObj) => {
        onChange?.({
            field: fieldObj.value,
            customKey: fieldObj.customKey || '',
            label: fieldObj.label,
        });
        setIsOpen(false);
        setSearchTerm('');
        setActiveCategoryKey(null);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange?.({ field: '', customKey: '', label: '' });
        setSearchTerm('');
    };

    return (
        <div ref={containerRef} className={`relative ${className}`} style={{ position: 'relative', ...style }}>
            {/* Input / Trigger Control */}
            <div
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 9px',
                    borderRadius: 7,
                    border: isOpen ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                    background: '#fff',
                    boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                    cursor: 'text',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    minWidth: 170,
                }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={isOpen ? searchTerm : (currentLabel || '')}
                    placeholder={currentLabel ? currentLabel : placeholder}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                    }}
                    style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        padding: 0,
                        margin: 0,
                        fontSize: 11.5,
                        color: currentLabel && !isOpen ? '#1e293b' : '#334155',
                        fontWeight: currentLabel && !isOpen ? 600 : 400,
                        background: 'transparent',
                    }}
                />

                {currentLabel && !isOpen ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        title="Clear field"
                        style={{
                            border: 'none',
                            background: 'transparent',
                            padding: 1,
                            cursor: 'pointer',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <X size={12} />
                    </button>
                ) : (
                    <ChevronDown size={13} color="#64748b" style={{ flexShrink: 0, pointerEvents: 'none' }} />
                )}
            </div>

            {/* Dropdown Flyout Menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        zIndex: 9999,
                        minWidth: 260,
                        width: 'max-content',
                        maxWidth: 320,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Mode 1: Search Active */}
                    {searchTerm.trim() ? (
                        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                            <div style={{ padding: '7px 12px 5px', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>
                                Matching fields ({searchMatches.length})
                            </div>
                            {searchMatches.length > 0 ? (
                                searchMatches.map((f, fIdx) => (
                                    <button
                                        key={fIdx}
                                        type="button"
                                        onClick={() => handleSelectField(f)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: 'none',
                                            background: (f.value === value || (f.customKey && f.customKey === customKey)) ? '#eff6ff' : 'transparent',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = (f.value === value || (f.customKey && f.customKey === customKey)) ? '#eff6ff' : 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                                            <span style={{ fontSize: 12, fontWeight: 500, color: '#1e293b' }}>{f.label}</span>
                                            <span style={{ fontSize: 9.5, color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>
                                                {f.categoryName.replace('Custom Fields ', '')}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 11.5, color: '#94a3b8' }}>
                                    No fields match "{searchTerm}"
                                </div>
                            )}
                        </div>
                    ) : activeCategory ? (
                        /* Mode 2: Category Drill-Down */
                        <div>
                            {/* Back Header */}
                            <button
                                type="button"
                                onClick={() => setActiveCategoryKey(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: 'none',
                                    borderBottom: '1px solid #f1f5f9',
                                    background: '#f8fafc',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: '#3b82f6',
                                }}
                            >
                                <ChevronLeft size={14} />
                                <span>Back</span>
                                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 2 }}>/ {activeCategory.name}</span>
                            </button>

                            {/* Sub-Items List */}
                            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                                {activeCategory.fields.map((f, fIdx) => {
                                    const isSelected = f.value === value || (f.customKey && f.customKey === customKey);
                                    return (
                                        <button
                                            key={fIdx}
                                            type="button"
                                            onClick={() => handleSelectField(f)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: 'none',
                                                background: isSelected ? '#eff6ff' : 'transparent',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'background 0.1s',
                                            }}
                                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#2563eb' : '#334155' }}>
                                                {f.label}
                                            </span>
                                            {isSelected && <Check size={13} color="#2563eb" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Mode 3: Root "All fields" Categories Menu (Matches Screenshot!) */
                        <div>
                            <div style={{ padding: '8px 12px 6px', fontSize: 12, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>
                                All fields
                            </div>
                            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                {allGroups.map((g) => (
                                    <button
                                        key={g.key}
                                        type="button"
                                        onClick={() => setActiveCategoryKey(g.key)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>
                                            {g.name}
                                        </span>
                                        <ChevronRight size={14} color="#94a3b8" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
