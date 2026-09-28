<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function __construct(private MediaService $mediaService) {}

    public function index(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        $usedBytes = $this->mediaService->usedBytes($user);
        $quotaBytes = $this->mediaService->quotaBytes($user);

        $query = Media::where('mediable_type', get_class($user))
            ->where('mediable_id', $user->id);

        if ($search = $request->input('search')) {
            $query->where('filename', 'like', "%{$search}%");
        }

        if ($type = $request->input('type')) {
            if ($type === 'images') {
                $query->where('mime_type', 'like', 'image/%');
            } elseif ($type === 'documents') {
                $query->where(function ($q) {
                    $q->where('mime_type', 'like', '%pdf%')
                      ->orWhere('mime_type', 'like', '%document%')
                      ->orWhere('mime_type', 'like', '%word%')
                      ->orWhere('mime_type', 'like', '%sheet%')
                      ->orWhere('mime_type', 'like', '%excel%')
                      ->orWhere('mime_type', 'like', '%text%')
                      ->orWhere('mime_type', 'like', '%zip%');
                });
            } elseif ($type === 'audio_video') {
                $query->where(function ($q) {
                    $q->where('mime_type', 'like', 'audio/%')
                      ->orWhere('mime_type', 'like', 'video/%');
                });
            }
        }

        $files = $query->latest()
            ->paginate(24)
            ->through(fn ($m) => [
                'id' => $m->id,
                'filename' => $m->filename,
                'mime_type' => $m->mime_type,
                'size_bytes' => $m->size_bytes,
                'url' => $m->url(),
                'collection' => $m->collection,
                'created_at' => $m->created_at->toIso8601String(),
                'usages' => $this->getMediaUsages($m, $user),
            ]);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'files' => $files,
                'usedBytes' => $usedBytes,
                'quotaBytes' => $quotaBytes,
            ]);
        }

        return Inertia::render('client/Media/Index', [
            'files' => $files,
            'usedBytes' => $usedBytes,
            'quotaBytes' => $quotaBytes,
        ]);
    }

    private function getMediaUsages(Media $media, $user): array
    {
        $usages = [];
        $url = $media->url();
        $path = $media->path;
        $filename = basename($path);

        try {
            // 1. Check Ecommerce Products
            if (class_exists(\App\Modules\Ecommerce\Models\EcommerceProduct::class)) {
                $products = \App\Modules\Ecommerce\Models\EcommerceProduct::where(function ($q) use ($url, $path, $filename) {
                    $q->where('image_url', $url)
                      ->orWhere('image_url', 'like', "%{$filename}%")
                      ->orWhere('digital_file_url', $url)
                      ->orWhere('digital_file_url', 'like', "%{$filename}%")
                      ->orWhere('raw', 'like', "%{$filename}%");
                })->limit(5)->get(['id', 'name']);

                foreach ($products as $p) {
                    $usages[] = [
                        'type' => 'Product',
                        'title' => $p->name,
                        'context' => 'Product Cover / Asset',
                    ];
                }
            }

            // 2. Check Social Posts
            if (class_exists(\App\Modules\Social\Models\SocialPost::class)) {
                $posts = \App\Modules\Social\Models\SocialPost::where('user_id', $user->id)
                    ->where('media', 'like', "%{$filename}%")
                    ->limit(3)
                    ->get(['id', 'content']);

                foreach ($posts as $post) {
                    $usages[] = [
                        'type' => 'Social Post',
                        'title' => \Illuminate\Support\Str::limit($post->content ?: 'Social Campaign Post', 28),
                        'context' => 'Post Attachment',
                    ];
                }
            }

            // 3. Check Funnels or Direct Relations
            if ($media->mediable_type && $media->mediable_type !== get_class($user)) {
                $usages[] = [
                    'type' => class_basename($media->mediable_type),
                    'title' => 'Linked Item #' . $media->mediable_id,
                    'context' => 'Direct Attachment',
                ];
            }
        } catch (\Throwable $e) {
            // Gracefully ignore query issues if table missing
        }

        return $usages;
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            // Allow-list of safe media types only. HTML/SVG/scripts are excluded
            // to prevent stored-XSS via files served from the app origin.
            'file' => [
                'required', 'file', 'max:51200', // 50 MB max per file
                'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,csv,txt,mp3,wav,ogg,m4a,mp4,webm,mov',
            ],
            'collection' => ['nullable', 'string', 'max:64'],
        ]);

        $user = $request->user();
        $usedBytes = $this->mediaService->usedBytes($user);
        $quotaBytes = $this->mediaService->quotaBytes($user);

        if ($usedBytes + $validated['file']->getSize() > $quotaBytes) {
            return response()->json(['error' => __('Storage quota exceeded.')], 422);
        }

        $media = $this->mediaService->store($validated['file'], $user, $validated['collection'] ?? 'default');

        return response()->json([
            'id' => $media->id,
            'filename' => $media->filename,
            'url' => $media->url(),
            'size_bytes' => $media->size_bytes,
        ], 201);
    }

    public function destroy(Request $request, Media $medium): JsonResponse
    {
        abort_unless($medium->mediable_type === get_class($request->user()) && $medium->mediable_id === $request->user()->id, 403);

        $medium->delete();

        return response()->json(['ok' => true]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer'],
        ]);

        $user = $request->user();
        $mediaItems = Media::where('mediable_type', get_class($user))
            ->where('mediable_id', $user->id)
            ->whereIn('id', $validated['ids'])
            ->get();

        $deletedCount = 0;
        foreach ($mediaItems as $media) {
            $media->delete();
            $deletedCount++;
        }

        return response()->json([
            'ok' => true,
            'deleted_count' => $deletedCount,
        ]);
    }
}
