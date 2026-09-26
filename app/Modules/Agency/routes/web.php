<?php

use App\Modules\Agency\Http\Controllers\AgencyInvoiceController;
use App\Modules\Agency\Http\Controllers\ContractController;
use App\Modules\Agency\Http\Controllers\OnboardingFormController;
use App\Modules\Agency\Http\Controllers\ProposalController;
use Illuminate\Support\Facades\Route;

// Private Client App Routes (/app/agency/...)
Route::middleware(['web', 'client-app'])->prefix('app/agency')->name('client.agency.')->group(function () {
    // Proposals & Estimates
    Route::get('/proposals', [ProposalController::class, 'index'])->name('proposals.index');
    Route::get('/proposals/create', [ProposalController::class, 'create'])->name('proposals.create');
    Route::post('/proposals', [ProposalController::class, 'store'])->name('proposals.store');
    Route::get('/proposals/{proposal}/edit', [ProposalController::class, 'edit'])->name('proposals.edit');
    Route::put('/proposals/{proposal}', [ProposalController::class, 'update'])->name('proposals.update');

    // Invoices & Billing
    Route::get('/invoices', [AgencyInvoiceController::class, 'index'])->name('invoices.index');
    Route::post('/invoices', [AgencyInvoiceController::class, 'store'])->name('invoices.store');
});

// Public Web Viewer Routes (unauthenticated / client web view)
Route::middleware(['web'])->prefix('agency')->name('agency.')->group(function () {
    // Public Proposal & Contract Viewer
    Route::get('/proposals/{uuid}', [ProposalController::class, 'showPublic'])->name('proposals.show');
    Route::get('/proposals/{uuid}/pdf', [ProposalController::class, 'downloadPdf'])->name('proposals.pdf');
    Route::post('/proposals/{uuid}/accept', [ProposalController::class, 'accept'])->name('proposals.accept');
    Route::post('/proposals/{uuid}/revision', [ProposalController::class, 'requestRevision'])->name('proposals.revision');
    Route::post('/contracts/{uuid}/sign', [ContractController::class, 'sign'])->name('contracts.sign');
    Route::get('/contracts/{uuid}/pdf', [ContractController::class, 'downloadPdf'])->name('contracts.pdf');

    // Public 1-Click Invoice Checkout Page
    Route::get('/invoices/{uuid}/checkout', [AgencyInvoiceController::class, 'showPublicCheckout'])->name('invoices.checkout');
    Route::post('/invoices/{uuid}/pay', [AgencyInvoiceController::class, 'pay'])->name('invoices.pay');
    Route::get('/invoices/{uuid}/pdf', [AgencyInvoiceController::class, 'downloadPdf'])->name('invoices.pdf');

    // Public Onboarding Form
    Route::get('/onboarding/{uuid}', [OnboardingFormController::class, 'showPublic'])->name('onboarding.show');
    Route::post('/onboarding/{uuid}', [OnboardingFormController::class, 'submit'])->name('onboarding.submit');
});
