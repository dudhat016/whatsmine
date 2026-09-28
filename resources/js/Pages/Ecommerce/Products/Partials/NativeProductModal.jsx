import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal, Input, Select, Button } from '@/Components/ui';
import MediaUpload from '@/Components/MediaUpload';
import { Tag, RefreshCw, CreditCard, Gift, Image, Package, FileText, Check } from 'lucide-react';

export default function NativeProductModal({ isOpen, onClose, product = null, calendars = [] }) {
    const isEdit = !!product;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        sku: '',
        product_type: 'digital',
        pricing_type: 'one_time',
        price: '29.00',
        billing_interval: 'month',
        billing_interval_count: 1,
        trial_days: 0,
        installment_count: 3,
        inventory_quantity: 10,
        status: 'active',
        image_url: '',
        digital_fulfillment_type: 'file',
        digital_file_url: '',
        digital_external_url: '',
        digital_license_key: '',
        digital_download_limit: 5,
        calendar_id: '',
    });

    useEffect(() => {
        if (product) {
            setData({
                name: product.name || '',
                description: product.description || '',
                sku: product.sku || '',
                product_type: product.product_type || 'digital',
                pricing_type: product.pricing_type || 'one_time',
                price: product.price ? String(product.price) : '0.00',
                billing_interval: product.billing_interval || 'month',
                billing_interval_count: product.billing_interval_count || 1,
                trial_days: product.trial_days || 0,
                installment_count: product.installment_count || 3,
                inventory_quantity: product.inventory_quantity ?? 10,
                status: product.status || 'active',
                image_url: product.image_url || '',
                digital_fulfillment_type: product.digital_fulfillment_type || 'file',
                digital_file_url: product.digital_file_url || '',
                digital_external_url: product.digital_external_url || '',
                digital_license_key: product.digital_license_key || '',
                digital_download_limit: product.digital_download_limit || 5,
                calendar_id: product.calendar_id || '',
            });
        } else {
            reset();
        }
    }, [product, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('client.ecommerce.products.update', product.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('client.ecommerce.products.store'), {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <Modal.Header title={isEdit ? 'Edit Native Product' : 'Create Native Product'} onClose={onClose} />
            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-5 max-h-[75vh] overflow-y-auto">
                    {/* Basic Info */}
                <div className="space-y-4">
                    <Input
                        label="Product Name"
                        required
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="e.g. Premium Masterclass Pass"
                        error={errors.name}
                    />

                    <Input
                        label="SKU / Identifier (Optional)"
                        value={data.sku}
                        onChange={(e) => setData('sku', e.target.value)}
                        placeholder="DIGITAL-001"
                    />

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Detailed product features or notes..."
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                        />
                    </div>
                </div>

                {/* Pricing Selector Tabs */}
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        Pricing Model Mode <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-4 gap-2">
                        <button
                            type="button"
                            onClick={() => setData('pricing_type', 'one_time')}
                            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                                data.pricing_type === 'one_time'
                                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            }`}
                        >
                            <Tag className="h-4 w-4" />
                            <span className="text-xs">One-Time</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setData('pricing_type', 'recurring')}
                            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                                data.pricing_type === 'recurring'
                                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            }`}
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span className="text-xs">Recurring</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setData('pricing_type', 'installments')}
                            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                                data.pricing_type === 'installments'
                                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            }`}
                        >
                            <CreditCard className="h-4 w-4" />
                            <span className="text-xs">Installments</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setData('pricing_type', 'free')}
                            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                                data.pricing_type === 'free'
                                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            }`}
                        >
                            <Gift className="h-4 w-4" />
                            <span className="text-xs">FREE</span>
                        </button>
                    </div>

                    {/* Pricing Inputs according to mode */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
                        {data.pricing_type !== 'free' && (
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                label={data.pricing_type === 'installments' ? 'Price Per Installment ($)' : 'Price ($)'}
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                            />
                        )}

                        {data.pricing_type === 'recurring' && (
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                    Billing Frequency
                                </label>
                                <Select
                                    value={
                                        data.billing_interval === 'day' && Number(data.billing_interval_count) === 7 ? '7days' :
                                        data.billing_interval === 'month' && Number(data.billing_interval_count) === 3 ? '3months' :
                                        data.billing_interval === 'month' && Number(data.billing_interval_count) === 6 ? '6months' :
                                        data.billing_interval === 'year' && Number(data.billing_interval_count) === 1 ? '1year' :
                                        'custom'
                                    }
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '7days')   setData({ ...data, billing_interval: 'day',   billing_interval_count: 7 });
                                        if (v === '3months') setData({ ...data, billing_interval: 'month', billing_interval_count: 3 });
                                        if (v === '6months') setData({ ...data, billing_interval: 'month', billing_interval_count: 6 });
                                        if (v === '1year')   setData({ ...data, billing_interval: 'year',  billing_interval_count: 1 });
                                        if (v === 'custom')  setData({ ...data, billing_interval: 'day',   billing_interval_count: '' });
                                    }}
                                >
                                    <option value="7days">Every 7 Days</option>
                                    <option value="3months">Every 3 Months (Quarterly)</option>
                                    <option value="6months">Every 6 Months (Bi-Annually)</option>
                                    <option value="1year">Every 1 Year (Annually)</option>
                                    <option value="custom">Custom (days)</option>
                                </Select>
                                {/* Custom days input */}
                                {data.billing_interval === 'day' && Number(data.billing_interval_count) !== 7 && (
                                    <div>
                                        <Input
                                            type="number"
                                            min="1"
                                            label="Custom Interval (in days)"
                                            value={data.billing_interval_count || ''}
                                            onChange={(e) => setData('billing_interval_count', parseInt(e.target.value) || '')}
                                            placeholder="e.g. 210"
                                        />
                                        <p className="text-[10px] text-neutral-400 mt-1">Charge every <strong>{data.billing_interval_count || '?'}</strong> days</p>
                                    </div>
                                )}
                                {/* Free trial */}
                                <Input
                                    type="number"
                                    min="0"
                                    label="Free Trial Days (0 = no trial)"
                                    value={data.trial_days}
                                    onChange={(e) => setData('trial_days', e.target.value)}
                                />
                            </div>
                        )}



                        {data.pricing_type === 'installments' && (
                            <div>
                                <Input
                                    type="number"
                                    min="2"
                                    max="24"
                                    label="Number of Installments"
                                    value={data.installment_count}
                                    onChange={(e) => setData('installment_count', e.target.value)}
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    Total Price: ${(parseFloat(data.price || '0') * parseInt(data.installment_count || '1')).toFixed(2)}
                                </p>
                            </div>
                        )}

                        {data.pricing_type === 'free' && (
                            <p className="text-xs text-neutral-500">
                                This product is 100% free ($0.00). Ideal for lead magnets, free trials, or open resources.
                            </p>
                        )}
                    </div>
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-3 gap-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                    {data.product_type === 'physical' && (
                        <Input
                            type="number"
                            min="0"
                            label="Stock Quantity"
                            value={data.inventory_quantity}
                            onChange={(e) => setData('inventory_quantity', e.target.value)}
                        />
                    )}

                    <div className={data.product_type === 'digital' ? 'col-span-2' : ''}>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                            Status
                        </label>
                        <Select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                        >
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </Select>
                    </div>

                    <div>
                        <MediaUpload
                            label="Product Cover Image"
                            value={data.image_url}
                            onChange={(url) => setData('image_url', url)}
                            accept="image/*"
                            collection="product_covers"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                {/* Digital Fulfillment & Content Access Section */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-brand-600" /> Digital Product Content & Delivery Rules
                    </h4>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                            Fulfillment Access Type
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setData('digital_fulfillment_type', 'file')}
                                className={`p-2 rounded-lg border text-xs font-medium text-center transition ${
                                    data.digital_fulfillment_type === 'file'
                                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold'
                                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                                }`}
                            >
                                📄 File Upload
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('digital_fulfillment_type', 'external_link')}
                                className={`p-2 rounded-lg border text-xs font-medium text-center transition ${
                                    data.digital_fulfillment_type === 'external_link'
                                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold'
                                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                                }`}
                            >
                                🔗 External Link
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('digital_fulfillment_type', 'license_key')}
                                className={`p-2 rounded-lg border text-xs font-medium text-center transition ${
                                    data.digital_fulfillment_type === 'license_key'
                                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold'
                                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                                }`}
                            >
                                🔑 License Key
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('digital_fulfillment_type', 'booking')}
                                className={`p-2 rounded-lg border text-xs font-medium text-center transition ${
                                    data.digital_fulfillment_type === 'booking'
                                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold'
                                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                                }`}
                            >
                                📅 Booking / Webinar
                            </button>
                        </div>
                    </div>

                    {data.digital_fulfillment_type === 'booking' && (
                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                Link to Workspace Booking Calendar / Webinar <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={data.calendar_id || ''}
                                onChange={(e) => setData('calendar_id', e.target.value)}
                            >
                                <option value="">-- Select Calendar (1:1 Session / Webinar) --</option>
                                {calendars.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.type} • {c.duration_minutes}m)
                                    </option>
                                ))}
                            </Select>
                        </div>
                    )}

                    {data.digital_fulfillment_type === 'file' && (
                        <div>
                            <MediaUpload
                                label="Downloadable File (PDF, ZIP, MP3, MP4, Software, Docs)"
                                value={data.digital_file_url || ''}
                                onChange={(url) => setData('digital_file_url', url)}
                                accept=".pdf,.zip,.rar,.mp3,.mp4,.doc,.docx,.epub"
                                collection="digital_product_files"
                                maxSizeMb={100}
                                placeholder="Drag & drop file or enter URL..."
                            />
                        </div>
                    )}

                    {data.digital_fulfillment_type === 'external_link' && (
                        <Input
                            label="Private External Link (Notion, Google Drive, Telegram, Discord)"
                            value={data.digital_external_url || ''}
                            onChange={(e) => setData('digital_external_url', e.target.value)}
                            placeholder="https://notion.so/..."
                        />
                    )}

                    {data.digital_fulfillment_type === 'license_key' && (
                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                License Keys / Access Codes
                            </label>
                            <textarea
                                rows={2}
                                value={data.digital_license_key || ''}
                                onChange={(e) => setData('digital_license_key', e.target.value)}
                                placeholder="Enter static license key or serial code..."
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono"
                            />
                        </div>
                    )}
                </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        variant="primary"
                        className="gap-1.5"
                    >
                        <Check className="h-4 w-4" />
                        {isEdit ? 'Update Product' : 'Create Product'}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
