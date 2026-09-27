import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal, Input, Select } from '@/Components/ui';
import { Truck, Check, X } from 'lucide-react';

export default function FulfillOrderModal({ isOpen, onClose, order = null }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        fulfillment_status: 'fulfilled',
        tracking_number: '',
        tracking_url: '',
    });

    useEffect(() => {
        if (order) {
            setData({
                fulfillment_status: order.fulfillment_status || 'fulfilled',
                tracking_number: order.tracking_number || '',
                tracking_url: order.tracking_url || '',
            });
        }
    }, [order, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!order) return;

        post(route('client.ecommerce.orders.fulfill', order.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <Modal.Header title={`Update Fulfillment — Order #${order?.number || ''}`} onClose={onClose} />
            <Modal.Body>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                            Fulfillment Status <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={data.fulfillment_status}
                            onChange={(e) => setData('fulfillment_status', e.target.value)}
                        >
                            <option value="processing">Processing / In Preparation</option>
                            <option value="shipped">Shipped / In Transit</option>
                            <option value="fulfilled">Fulfilled / Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </Select>
                    </div>

                    <Input
                        label="Tracking Number (Optional)"
                        value={data.tracking_number}
                        onChange={(e) => setData('tracking_number', e.target.value)}
                        placeholder="e.g. TRACK981274"
                    />

                    <Input
                        label="Tracking URL (Optional)"
                        value={data.tracking_url}
                        onChange={(e) => setData('tracking_url', e.target.value)}
                        placeholder="https://courier.com/track/..."
                    />

                    <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <Truck className="h-4 w-4" /> Save Status
                        </button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    );
}
