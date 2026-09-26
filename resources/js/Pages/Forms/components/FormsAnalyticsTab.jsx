import { Eye, Users, Percent, ShieldCheck, TrendingUp, Globe, Monitor, Smartphone } from 'lucide-react';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';

export default function FormsAnalyticsTab({ analytics }) {
    if (!analytics) {
        return (
            <Card padding={true} className="text-center py-12 text-neutral-400 text-sm">
                No analytics data available yet.
            </Card>
        );
    }

    const {
        total_views = 0,
        total_submissions = 0,
        verified_submissions = 0,
        conversion_rate = 0,
        otp_verified_rate = 0,
        daily_series = [],
        traffic_sources = [],
        device_breakdown = { desktop: 0, mobile: 0 },
    } = analytics;

    const maxViewsInSeries = Math.max(...daily_series.map((d) => Math.max(d.views, d.submissions)), 1);
    const totalDeviceCount = (device_breakdown.desktop + device_breakdown.mobile) || 1;
    const desktopPct = Math.round((device_breakdown.desktop / totalDeviceCount) * 100);
    const mobilePct = 100 - desktopPct;

    return (
        <div className="space-y-6">
            {/* 4 Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Views */}
                <Card padding={true} className="flex items-center gap-4">
                    <div className="p-3 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-soft-lg">
                        <Eye className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block">
                            Total Form Views
                        </span>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {total_views.toLocaleString()}
                        </div>
                    </div>
                </Card>

                {/* Total Submissions */}
                <Card padding={true} className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-soft-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block">
                            Total Submissions
                        </span>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {total_submissions.toLocaleString()}
                        </div>
                    </div>
                </Card>

                {/* Conversion Rate */}
                <Card padding={true} className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-soft-lg">
                        <Percent className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block">
                            Conversion Rate
                        </span>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {conversion_rate}%
                        </div>
                    </div>
                </Card>

                {/* OTP Verification Rate */}
                <Card padding={true} className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-soft-lg">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block">
                            Verified OTP Rate
                        </span>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {otp_verified_rate}%
                        </div>
                    </div>
                </Card>
            </div>

            {/* Performance Trend (Views vs Submissions) */}
            <Card padding={true} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-brand-600" />
                            30-Day Conversion & Traffic Trend
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Daily breakdown of form views compared to successful submissions.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                            <span className="w-3 h-3 rounded bg-brand-200 dark:bg-brand-900/60 inline-block" />
                            Form Views
                        </span>
                        <span className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100">
                            <span className="w-3 h-3 rounded bg-brand-600 inline-block" />
                            Submissions
                        </span>
                    </div>
                </div>

                {/* Visual Bar Graph */}
                <div className="h-44 flex items-end gap-1 pt-4 pb-2">
                    {daily_series.map((day, idx) => {
                        const viewHeight = Math.max((day.views / maxViewsInSeries) * 100, 4);
                        const subHeight = Math.max((day.submissions / maxViewsInSeries) * 100, day.submissions > 0 ? 4 : 0);

                        return (
                            <div
                                key={idx}
                                className="flex-1 flex flex-col items-center justify-end h-full group relative"
                            >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 bg-neutral-900 text-white text-[11px] rounded-soft px-2 py-1 shadow-lg pointer-events-none whitespace-nowrap">
                                    <span className="font-bold">{day.label}</span>
                                    <span>Views: {day.views}</span>
                                    <span>Submissions: {day.submissions}</span>
                                </div>

                                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                                    {/* Views Bar */}
                                    <div
                                        style={{ height: `${viewHeight}%` }}
                                        className="w-1/2 bg-brand-200 dark:bg-brand-900/40 rounded-t-xs transition hover:bg-brand-300"
                                    />
                                    {/* Submissions Bar */}
                                    <div
                                        style={{ height: `${subHeight}%` }}
                                        className="w-1/2 bg-brand-600 rounded-t-xs transition hover:bg-brand-700"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* X Axis Dates */}
                <div className="flex justify-between text-[10px] text-neutral-400 font-medium px-1 border-t border-neutral-100 dark:border-neutral-800 pt-2">
                    <span>{daily_series[0]?.label}</span>
                    <span>{daily_series[Math.floor(daily_series.length / 2)]?.label}</span>
                    <span>{daily_series[daily_series.length - 1]?.label}</span>
                </div>
            </Card>

            {/* Bottom Row: Traffic Attribution & Devices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic Attribution & UTMs */}
                <Card padding={true} className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-brand-600" />
                            UTM Sources & Campaigns
                        </h3>
                        <span className="text-xs text-neutral-400">Top Inbound Channels</span>
                    </div>

                    {traffic_sources.length === 0 ? (
                        <p className="text-xs text-neutral-400 py-6 text-center">
                            No UTM traffic parameters recorded yet. Include <code>?utm_source=facebook</code> in your links to track attribution.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                                <thead>
                                    <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-semibold">
                                        <th className="pb-2">UTM Source</th>
                                        <th className="pb-2">Medium</th>
                                        <th className="pb-2">Campaign</th>
                                        <th className="pb-2 text-right">Views</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {traffic_sources.map((src, i) => (
                                        <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                                            <td className="py-2.5 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {src.utm_source || 'Direct'}
                                            </td>
                                            <td className="py-2.5">{src.utm_medium || '—'}</td>
                                            <td className="py-2.5">{src.utm_campaign || '—'}</td>
                                            <td className="py-2.5 text-right font-bold text-brand-600 dark:text-brand-400">
                                                {src.views_count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Device Breakdown */}
                <Card padding={true} className="space-y-4">
                    <div className="pb-2 border-b border-neutral-100 dark:border-neutral-800">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            Device Distribution
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">Desktop vs Mobile Traffic</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                                <Monitor className="w-4 h-4 text-blue-500" />
                                Desktop
                            </span>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                {desktopPct}% ({device_breakdown.desktop})
                            </span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                            <div
                                style={{ width: `${desktopPct}%` }}
                                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2">
                            <span className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                                <Smartphone className="w-4 h-4 text-emerald-500" />
                                Mobile
                            </span>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                {mobilePct}% ({device_breakdown.mobile})
                            </span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                            <div
                                style={{ width: `${mobilePct}%` }}
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
