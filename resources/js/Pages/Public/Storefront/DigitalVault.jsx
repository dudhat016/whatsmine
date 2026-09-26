import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Download, ExternalLink, Key, Check, ShieldCheck, FileText, Package, Clock, Copy } from 'lucide-react';

export default function DigitalVault({ order, product }) {
    const [copied, setCopied] = useState(false);

    const handleCopyKey = () => {
        if (product?.digital_license_key) {
            navigator.clipboard.writeText(product.digital_license_key);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const remainingDownloads = Math.max(0, (product?.digital_download_limit || 5) - (order.download_count || 0));

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4 font-sans">
            <Head title={`Digital Vault — Order #${order.number}`} />

            <div className="w-full max-w-xl bg-neutral-900 rounded-3xl border border-neutral-800 p-6 md:p-8 space-y-6 shadow-2xl">
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2 text-green-400 font-semibold text-xs uppercase tracking-wider">
                        <ShieldCheck className="h-4 w-4" /> Verified Purchase Vault
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">Order #{order.number}</span>
                </div>

                {/* Product Title & Info */}
                {product ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            {product.image_url ? (
                                <img src={product.image_url} alt="" className="h-16 w-16 rounded-2xl object-cover border border-neutral-800" />
                            ) : (
                                <div className="h-16 w-16 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 border border-neutral-700">
                                    <FileText className="h-8 w-8" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-white leading-tight">{product.name}</h1>
                                <p className="text-xs text-neutral-400 mt-0.5">Purchased on {order.created_at || 'Today'}</p>
                            </div>
                        </div>
                        {product.description && (
                            <p className="text-xs text-neutral-300 bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 leading-relaxed whitespace-pre-line">
                                {product.description}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-6 text-neutral-400 text-sm">
                        Digital content details are loading...
                    </div>
                )}

                {/* Content Delivery Cards */}
                {product && (
                    <div className="space-y-4 pt-2">
                        {/* 📄 Download File Fulfillment */}
                        {product.digital_fulfillment_type === 'file' && (
                            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 text-center">
                                <FileText className="h-10 w-10 text-brand-400 mx-auto" />
                                <div>
                                    <h3 className="font-bold text-base text-white">Your Download File is Ready</h3>
                                    <p className="text-xs text-neutral-400 mt-1">
                                        {remainingDownloads} of {product.digital_download_limit || 5} downloads remaining.
                                    </p>
                                </div>

                                {remainingDownloads > 0 ? (
                                    <a
                                        href={route('public.storefront.download', order.access_token)}
                                        className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
                                    >
                                        <Download className="h-5 w-5" /> Download File Now
                                    </a>
                                ) : (
                                    <p className="text-xs text-red-400 font-semibold pt-2">Maximum download attempt limit reached.</p>
                                )}
                            </div>
                        )}

                        {/* 🔗 External Link Access */}
                        {product.digital_fulfillment_type === 'external_link' && (
                            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 text-center">
                                <ExternalLink className="h-10 w-10 text-blue-400 mx-auto" />
                                <div>
                                    <h3 className="font-bold text-base text-white">Private Resource Access Link</h3>
                                    <p className="text-xs text-neutral-400 mt-1">Access your Notion template, Google Drive, or Community.</p>
                                </div>

                                <a
                                    href={route('public.storefront.download', order.access_token)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    <ExternalLink className="h-5 w-5" /> Open Access Link
                                </a>
                            </div>
                        )}

                        {/* 🔑 License Key Delivery */}
                        {product.digital_fulfillment_type === 'license_key' && product.digital_license_key && (
                            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                    <Key className="h-4 w-4" /> Your Product License Key
                                </div>
                                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 font-mono text-sm text-green-400 flex items-center justify-between break-all">
                                    <span>{product.digital_license_key}</span>
                                    <button
                                        onClick={handleCopyKey}
                                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition ml-2"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                                {copied && <p className="text-xs text-green-400">Copied to clipboard!</p>}
                            </div>
                        )}

                        {/* 📅 Calendar Booking / Webinar Delivery */}
                        {product.digital_fulfillment_type === 'booking' && (
                            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 text-center">
                                <Clock className="h-10 w-10 text-purple-400 mx-auto" />
                                <div>
                                    <h3 className="font-bold text-base text-white">Book Your 1:1 Session / Webinar Seat</h3>
                                    <p className="text-xs text-neutral-400 mt-1">Your purchase is verified! Pick your preferred date & time slot below.</p>
                                </div>

                                {product.calendar_slug ? (
                                    <a
                                        href={`/c/${product.calendar_slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                                    >
                                        <Calendar className="h-5 w-5" /> Select Time Slot on Calendar
                                    </a>
                                ) : (
                                    <p className="text-xs text-neutral-500">Booking calendar details sent to your email & WhatsApp.</p>
                                )}
                            </div>
                        )}

                        {/* Bonus Order Bump Fulfillment Card */}
                        {order.order_bump_data && (
                            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                    <Sparkles className="h-4 w-4" /> Bonus Purchased: {order.order_bump_data.title || 'Order Bump Upsell'}
                                </div>
                                {order.order_bump_data.file_url && (
                                    <a
                                        href={order.order_bump_data.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition flex items-center justify-center gap-2"
                                    >
                                        <Download className="h-4 w-4" /> Download Bonus Upsell Asset
                                    </a>
                                )}
                                {order.order_bump_data.external_url && (
                                    <a
                                        href={order.order_bump_data.external_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="h-4 w-4" /> Open Bonus Resource Link
                                    </a>
                                )}
                                {order.order_bump_data.license_key && (
                                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 font-mono text-xs text-amber-300 break-all">
                                        Bonus License Key: {order.order_bump_data.license_key}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Support */}
                <div className="border-t border-neutral-800/80 pt-4 text-center">
                    <p className="text-xs text-neutral-500">Need support with your order? Reply directly to your WhatsApp purchase receipt.</p>
                </div>
            </div>
        </div>
    );
}
