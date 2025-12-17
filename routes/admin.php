<?php

use App\Domain\Dictionary\Http\Controllers\Admin\DictionaryController;
use App\Domain\Dashboard\Http\Controllers\Admin\AnnouncementController;
use App\Domain\Settings\Http\Controllers\Admin\ConfigurationController;
use Illuminate\Support\Facades\Route;

Route::get('dictionary', [DictionaryController::class, 'index'])->name('dictionary.index');
Route::get('dictionary/create', [DictionaryController::class, 'create'])->name('dictionary.create');
Route::post('dictionary', [DictionaryController::class, 'store'])->name('dictionary.store');
Route::get('dictionary/{dictionaryEntry}/edit', [DictionaryController::class, 'edit'])->name('dictionary.edit');
Route::put('dictionary/{dictionaryEntry}', [DictionaryController::class, 'update'])->name('dictionary.update');
Route::delete('dictionary/{dictionaryEntry}', [DictionaryController::class, 'destroy'])->name('dictionary.destroy');

Route::get('dictionary/export', [DictionaryController::class, 'export'])->name('dictionary.export');
Route::post('dictionary/import', [DictionaryController::class, 'import'])->name('dictionary.import');

Route::resource('announcements', AnnouncementController::class)->except(['show']);

Route::get('configuration', [ConfigurationController::class, 'edit'])->name('configuration.edit');
Route::post('configuration', [ConfigurationController::class, 'update'])->name('configuration.update');
