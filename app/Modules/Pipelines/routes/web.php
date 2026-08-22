<?php

use App\Modules\Pipelines\Http\Controllers\PipelineController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'client-app'])->prefix('app/opportunities')->name('client.opportunities.')->group(function () {
    Route::get('/', [PipelineController::class, 'index'])->name('index');
    Route::get('/board-data', [PipelineController::class, 'getBoardData'])->name('board-data');
    
    // Pipelines CRUD
    Route::post('/pipelines', [PipelineController::class, 'storePipeline'])->name('pipelines.store');
    Route::put('/pipelines/{pipeline}', [PipelineController::class, 'updatePipeline'])->name('pipelines.update');
    Route::delete('/pipelines/{pipeline}', [PipelineController::class, 'destroyPipeline'])->name('pipelines.destroy');

    // Stages Reorder & Safe Delete
    Route::post('/pipeline-stages/reorder', [PipelineController::class, 'reorderStages'])->name('stages.reorder');
    Route::post('/pipeline-stages/{stage}/safe-delete', [PipelineController::class, 'safeDeleteStage'])->name('stages.safe-delete');

    // Deals CRUD & Drag Drop
    Route::post('/deals', [PipelineController::class, 'storeDeal'])->name('deals.store');
    Route::put('/deals/{deal}', [PipelineController::class, 'updateDeal'])->name('deals.update');
    Route::delete('/deals/{deal}', [PipelineController::class, 'destroyDeal'])->name('deals.destroy');
    Route::post('/deals/update-stage-and-priority', [PipelineController::class, 'updateStageAndPriority'])->name('deals.update-stage-and-priority');
});
