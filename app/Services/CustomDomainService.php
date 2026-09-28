<?php

namespace App\Services;

use App\Models\CustomDomain;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CustomDomainService
{
    /**
     * Clean and normalize a domain string from user input.
     */
    public function normalizeDomain(string $rawDomain): string
    {
        $domain = trim($rawDomain);
        $domain = preg_replace('#^https?://#i', '', $domain);
        $domain = preg_replace('#/.*$#', '', $domain);
        $domain = strtolower($domain);
        return idn_to_ascii($domain, IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46) ?: $domain;
    }

    /**
     * Perform live DNS verification for a CustomDomain model.
     * Uses PHP dns_get_record and falls back to Cloudflare/Google DoH for instant edge check.
     */
    public function verifyDomain(CustomDomain $customDomain): array
    {
        $domain = $customDomain->domain;
        $expectedCname = $customDomain->getExpectedCnameTarget();
        $expectedIp = $customDomain->getExpectedIpTarget();

        $cnameRecords = [];
        $aRecords = [];
        $resolved = false;
        $detectedType = null;
        $detectedTarget = null;

        // 1. Try PHP native DNS query
        try {
            $records = @dns_get_record($domain, DNS_CNAME | DNS_A);
            if (is_array($records)) {
                foreach ($records as $rec) {
                    if ($rec['type'] === 'CNAME' && !empty($rec['target'])) {
                        $cnameRecords[] = rtrim(strtolower($rec['target']), '.');
                    }
                    if ($rec['type'] === 'A' && !empty($rec['ip'])) {
                        $aRecords[] = $rec['ip'];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Native DNS query failed for {$domain}: " . $e->getMessage());
        }

        // 2. Fallback / supplementary check via Cloudflare DNS over HTTPS for live edge accuracy
        if (empty($cnameRecords) && empty($aRecords)) {
            try {
                $dohResponse = Http::timeout(4)
                    ->withHeaders(['Accept' => 'application/dns-json'])
                    ->get("https://cloudflare-dns.com/dns-query", [
                        'name' => $domain,
                        'type' => 'CNAME',
                    ]);

                if ($dohResponse->successful() && !empty($dohResponse->json('Answer'))) {
                    foreach ($dohResponse->json('Answer') as $ans) {
                        if ($ans['type'] === 5 && !empty($ans['data'])) { // Type 5 = CNAME
                            $cnameRecords[] = rtrim(strtolower($ans['data']), '.');
                        }
                    }
                }

                // Check A record DoH
                $dohAResponse = Http::timeout(4)
                    ->withHeaders(['Accept' => 'application/dns-json'])
                    ->get("https://cloudflare-dns.com/dns-query", [
                        'name' => $domain,
                        'type' => 'A',
                    ]);

                if ($dohAResponse->successful() && !empty($dohAResponse->json('Answer'))) {
                    foreach ($dohAResponse->json('Answer') as $ans) {
                        if ($ans['type'] === 1 && !empty($ans['data'])) { // Type 1 = A
                            $aRecords[] = $ans['data'];
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("DoH query failed for {$domain}: " . $e->getMessage());
            }
        }

        // Normalize expected targets
        $normalizedExpectedCname = rtrim(strtolower($expectedCname), '.');
        $isSubdomain = $customDomain->isSubdomain();

        // 3. Evaluate matching
        if (!empty($cnameRecords)) {
            foreach ($cnameRecords as $target) {
                if ($target === $normalizedExpectedCname || str_contains($target, 'whatsmine') || str_contains($target, 'techworldproduct')) {
                    $resolved = true;
                    $detectedType = 'CNAME';
                    $detectedTarget = $target;
                    break;
                }
            }
        }

        if (!$resolved && !empty($aRecords)) {
            foreach ($aRecords as $ip) {
                if ($ip === $expectedIp || $this->isServerIp($ip)) {
                    $resolved = true;
                    $detectedType = 'A';
                    $detectedTarget = $ip;
                    break;
                }
            }
        }

        // Update database record
        $dnsStatus = $resolved ? 'verified' : 'failed';
        $sslStatus = $resolved ? 'active' : 'pending';

        $customDomain->update([
            'is_verified'     => $resolved,
            'dns_status'      => $dnsStatus,
            'ssl_status'      => $sslStatus,
            'dns_records'     => [
                'detected_cname'  => $cnameRecords,
                'detected_a'      => $aRecords,
                'expected_cname'  => $normalizedExpectedCname,
                'expected_a'      => $expectedIp,
                'detected_type'   => $detectedType,
                'detected_target' => $detectedTarget,
            ],
            'last_checked_at' => now(),
        ]);

        // Bust domain cache
        Cache::forget("custom_domain:host:{$domain}");

        return [
            'success'         => $resolved,
            'dns_status'      => $dnsStatus,
            'ssl_status'      => $sslStatus,
            'detected_type'   => $detectedType,
            'detected_target' => $detectedTarget,
            'detected_cnames' => $cnameRecords,
            'detected_a'      => $aRecords,
            'expected_cname'  => $normalizedExpectedCname,
            'expected_a'      => $expectedIp,
        ];
    }

    /**
     * Resolve a CustomDomain model by host header, with caching.
     */
    public function resolveByHost(string $host): ?CustomDomain
    {
        $cleanedHost = $this->normalizeDomain($host);

        return Cache::remember("custom_domain:host:{$cleanedHost}", 300, function () use ($cleanedHost) {
            return CustomDomain::where('domain', $cleanedHost)
                ->where('is_verified', true)
                ->with(['workspace', 'client'])
                ->first();
        });
    }

    private function isServerIp(string $ip): bool
    {
        $serverIp = $_SERVER['SERVER_ADDR'] ?? gethostbyname(gethostname());
        return $ip === $serverIp || $ip === '127.0.0.1';
    }
}
